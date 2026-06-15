/** @format */
'use client';

import ModuleBuilder, { ModuleInstance } from '@/components/setup/ModuleBuilder';
import { useEffect, useState } from 'react';

type Props = {
	client: string;
	basePath: string;
};

type DuoString = {
	offset: number;
	value: string;
};

type ModuleDefinition = {
	id: string;
	name: string;
	description?: string;
	preview?: string;

	signature?: {
		type: number;
		profile: number;
	};

	inputs?: {
		name: string;
		description?: string;
	}[];

	outputs?: {
		name: string;
		description?: string;
	}[];
};

type ModuleUnit = {
	id: number;
	channel: number;
	name: string;
	type: 'temperature' | 'virtual' | 'input' | 'relay' | 'dimmer';
};

export default function Setup({ client, basePath }: Props) {
	const [foundModules, setFoundModules] = useState<ModuleInstance[]>([]);
	const [topology, setTopology] = useState<ModuleInstance[]>([]);
	const [loading, setLoading] = useState(true);
	const [loaded, setLoaded] = useState(false);

	function parseModuleSignature(bytes: Uint8Array, offset: number) {
		const length = bytes[offset - 1];
		const start = offset + length;

		return {
			family1: bytes[start + 2],
			family2: bytes[start + 3],

			instance: bytes[start + 4],

			profile1: bytes[start + 8],
			profile2: bytes[start + 9],
		};
	}

	function extractStrings(data: Uint8Array): DuoString[] {
		const result: DuoString[] = [];

		let current = '';
		let startOffset = 0;

		for (let i = 0; i < data.length; i++) {
			const byte = data[i];

			if (byte >= 32 && byte <= 126) {
				if (!current.length) {
					startOffset = i;
				}

				current += String.fromCharCode(byte);
			} else {
				if (current.length >= 3) {
					result.push({
						offset: startOffset,
						value: current,
					});
				}

				current = '';
			}
		}

		return result;
	}

	function buildModules(strings: DuoString[], bytes: Uint8Array, moduleDefinitions: ModuleDefinition[]): ModuleInstance[] {
		const modulesByAddress = new Map<number, ModuleInstance>();

		// PASS 1: discover modules

		for (const item of strings) {
			const signature = parseModuleSignature(bytes, item.offset);

			// console.log({ ...item, ...signature }); // family1 + profile1

			const definition = moduleDefinitions.find((module) => module.signature?.type === signature.family1 && module.signature?.profile === signature.profile1);

			if (!definition) continue;

			modulesByAddress.set(signature.instance, {
				instanceId: crypto.randomUUID(),

				moduleId: definition.id,

				family: signature.family1,
				profile: signature.profile1,

				name: definition.name,
				label: item.value,

				address: signature.instance,

				settings: {
					type: signature.family1,
					profile: signature.profile1,
					profile2: signature.profile2,
					instance: signature.instance,
				},

				units: [],

				description: definition.description,
				preview: definition.preview,
			});
		}

		// PASS 2: attach units

		for (const item of strings) {
			const unit = parseUnit(bytes, item);

			if (!unit) {
				continue;
			}

			const ownerModule = modulesByAddress.get(unit.id);

			if (!ownerModule) {
				console.warn('NO OWNER', unit);
				continue;
			}

			ownerModule.units.push(unit);
		}

		return [...modulesByAddress.values()];
	}

	function parseUnit(bytes: Uint8Array, item: DuoString): ModuleUnit | null {
		const length = bytes[item.offset - 1];
		const start = item.offset + length;

		const owner = bytes[start];
		const channel = bytes[start + 1];

		const type1 = bytes[start + 2];
		const type2 = bytes[start + 3];

		let type: ModuleUnit['type'] | null = null;

		if (type1 === 4 && type2 === 1) type = 'temperature';
		else if (type1 === 7 && type2 === 1) type = 'virtual';
		else if (type1 === 3 && type2 === 1) type = 'input';
		else if (type1 === 1 && type2 === 1) type = 'dimmer';
		else if (type1 === 2 && type2 === 1) type = 'relay';

		if (!type) {
			return null;
		}

		return {
			id: owner,
			channel,
			type,
			name: item.value,
		};
	}

	async function loadSetup() {
		try {
			setLoading(true);

			const programmationPath = `${basePath}/${client}/programmation`;

			const files = await fetch(`/api/files?view=${encodeURIComponent(programmationPath)}&recursive=1`).then((r) => r.json());

			const duoFiles = files
				.filter((file: any) => file.type === 'file' && file.name.toLowerCase().endsWith('.duo'))
				.sort((a: any, b: any) => {
					return new Date(b.modified).getTime() - new Date(a.modified).getTime();
				});

			if (!duoFiles.length) {
				setFoundModules([]);
				setTopology([]);
				return;
			}

			const latest = duoFiles[0];

			const res = await fetch(`/api/files/download?path=${encodeURIComponent(latest.path)}`);

			const buffer = await res.arrayBuffer();

			const bytes = new Uint8Array(buffer);

			const strings = extractStrings(bytes);

			const modulesRes = await fetch('/api/projects/modules');

			const modulesData = await modulesRes.json();

			const inferredModules = buildModules(strings, bytes, modulesData.modules ?? []);

			const metadataRes = await fetch(`/api/projects/metadata?client=${encodeURIComponent(client)}`);
			const metadata = await metadataRes.json();

			const savedSetup = metadata.setup ?? [];

			const modulesByAddress = new Map(inferredModules.map((module) => [module.address, module]));

			const restoredTopology: ModuleInstance[] = [];

			for (const entry of savedSetup) {
				if (entry.moduleId === 'DT00-24') {
					restoredTopology.push({
						instanceId: entry.instanceId ?? crypto.randomUUID(),

						moduleId: 'powersupply',

						name: 'Power Supply',

						family: 0,
						profile: 0,

						address: undefined,

						settings: {},

						units: [],
					});

					continue;
				}

				const found = modulesByAddress.get(entry.address);

				if (found) {
					restoredTopology.push(found);
				}
			}

			setFoundModules(inferredModules);

			setTopology(restoredTopology);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
			setLoaded(true);
		}
	}

	async function saveTopology() {
		try {
			await fetch('/api/projects/metadata', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					client,
					data: {
						setup: topology.map((module) => ({
							instanceId: module.instanceId,
							moduleId: module.moduleId,
							address: module.address ?? null,
						})),
					},
				}),
			});
		} catch (error) {
			console.error(error);
		}
	}

	useEffect(() => {
		loadSetup();
	}, [client, basePath]);

	useEffect(() => {
		if (!loaded) {
			return;
		}

		saveTopology();
	}, [topology, loaded]);

	if (loading) {
		return null;
	}

	return <ModuleBuilder foundModules={foundModules} topology={topology} setTopology={setTopology} />;
}
