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

export default function Setup({ client, basePath }: Props) {
	const [modules, setModules] = useState<ModuleInstance[]>([]);
	const [loading, setLoading] = useState(true);

	function dumpBytes(data: Uint8Array, offset: number, before = 16, after = 32) {
		const start = Math.max(0, offset - before);
		const end = Math.min(data.length, offset + after);

		const slice = data.slice(start, end);

		console.log(
			offset,
			Array.from(slice)
				.map((x) => x.toString(16).padStart(2, '0'))
				.join(' ')
		);
	}

	function getSignature(bytes: Uint8Array, offset: number, name: string) {
		const length = bytes[offset - 1];

		const start = offset + length;

		return Array.from(bytes.slice(start, start + 24))
			.map((x) => x.toString(16).padStart(2, '0'))
			.join(' ');
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

	function buildModules(strings: DuoString[]): ModuleInstance[] {
		const modules: ModuleInstance[] = [];

		const isModuleHeader = (value: string) => value.startsWith('TB ') || value.startsWith('R ') || value.startsWith('FC ') || value.startsWith('DIM ') || value.startsWith('SB');

		const moduleIndexes: number[] = [];

		for (let i = 0; i < strings.length; i++) {
			if (isModuleHeader(strings[i].value)) {
				moduleIndexes.push(i);
			}
		}

		for (let i = 0; i < moduleIndexes.length; i++) {
			const start = moduleIndexes[i];

			const end = i === moduleIndexes.length - 1 ? strings.length : moduleIndexes[i + 1];

			const block = strings.slice(start, end);

			if (!block.length) {
				continue;
			}

			const header = block[0].value;

			const typeMatch = header.match(/^(TB|R|FC|DIM|SB)/);

			const moduleType = typeMatch?.[1] ?? 'Unknown';

			const moduleName = header
				.replace(/^(TB|R|FC|DIM|SB)\s*/, '')
				.replace(/[A-Za-z0-9]{2}$/, '')
				.trim();

			const children = block
				.slice(1)
				.map((x) => x.value.replace(/^,/, '').trim())
				.filter(Boolean);

			let inputs: {
				name: string;
				description?: string;
			}[] = [];

			let outputs: {
				name: string;
				description?: string;
			}[] = [];

			const settings: Record<string, any> = {
				type: moduleType,
			};

			if (moduleType === 'TB') {
				inputs = children.slice(0, 4).map((name, index) => ({
					name: `Input ${index + 1}`,
					description: name,
				}));

				if (children[4]) {
					settings.room = children[4];
				}
			} else if (moduleType === 'R') {
				outputs = children.map((name, index) => ({
					name: `Output ${index + 1}`,
					description: name,
				}));
			} else {
				outputs = children.map((name, index) => ({
					name: `${moduleType} ${index + 1}`,
					description: name,
				}));
			}

			modules.push({
				instanceId: crypto.randomUUID(),

				moduleId: moduleType,

				name: moduleName,

				label: moduleName,

				description: `${moduleType} discovered from DUO`,

				settings,

				inputs,

				outputs,

				logic: [],

				rawStrings: block.map((x) => x.value),
			});
		}

		return modules;
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
				setModules([]);
				return;
			}

			const latest = duoFiles[0];

			const res = await fetch(`/api/files/download?path=${encodeURIComponent(latest.path)}`);

			const buffer = await res.arrayBuffer();

			const bytes = new Uint8Array(buffer);

			const strings = extractStrings(bytes);

			console.table(strings);

			console.log('====================================');
			console.log('MODULE SIGNATURES');
			console.log('====================================');

			const moduleStrings = strings.filter((x) => x.value.startsWith('TB ') || x.value.startsWith('R ') || x.value.startsWith('FC ') || x.value.startsWith('DIM ') || x.value.startsWith('SB'));

			console.table(
				moduleStrings.map((module) => ({
					name: module.value,
					offset: module.offset,
					signature: getSignature(bytes, module.offset, module.value),
				}))
			);

			console.log('====================================');
			console.log('FULL MODULE RECORDS');
			console.log('====================================');

			moduleStrings.forEach((module) => {
				console.group(module.value);

				dumpBytes(bytes, module.offset, 32, 64);

				console.log('SIGNATURE:', getSignature(bytes, module.offset, module.value));

				console.groupEnd();
			});

			strings
				.filter((x) => x.value.startsWith('TB ') || x.value.startsWith('R ') || x.value.startsWith('FC ') || x.value.startsWith('DIM ') || x.value.startsWith('SB'))
				.forEach((x) => {
					console.group(x.value);

					dumpBytes(bytes, x.offset);

					console.groupEnd();
				});

			const inferredModules = buildModules(strings);

			console.table(
				inferredModules.map((module) => ({
					type: module.settings?.type,
					name: module.name,
					inputs: module.inputs.length,
					outputs: module.outputs.length,
					room: module.settings?.room,
				}))
			);

			console.log('INFERRED MODULES', inferredModules);

			setModules(inferredModules);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadSetup();
	}, [client, basePath]);

	if (loading) {
		return null;
	}

	return <ModuleBuilder modules={modules} setModules={setModules} />;
}
