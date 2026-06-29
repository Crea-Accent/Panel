/** @format */
'use client';

import { BookIcon, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Image from 'next/image';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import Modal from '../ui/Modal';

type Props = {
	client: string;
	basePath: string;
};

export type ModuleDefinition = {
	id: string;
	name: string;
	description?: string;
	detectable: boolean;
};

export type Metadata = {
	setup?: TopologyModule[];
};

export type DetectedNode = {
	name: string;
	nodeAddress: string;
	physicalAddress: string;
	softwareVersion: string;
	numberOfUnits: number;
	nodeType: number;
	units: any[];
};

export type TopologyModule = {
	instanceId: string;

	moduleId: string;

	physicalAddress?: string;

	nodes?: {
		1?: TopologyModule[];
		2?: TopologyModule[];
	};
};

export default function Canbus({ client, basePath }: Props) {
	const [loading, setLoading] = useState(true);

	const [metadata, setMetadata] = useState<Metadata | null>(null);

	const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);

	const [foundModules, setFoundModules] = useState<DetectedNode[]>([]);
	const [topology, setTopology] = useState<TopologyModule[]>([]);

	const [search, setSearch] = useState('');

	const [addModalOpen, setAddModalOpen] = useState(false);

	type ModuleSelection =
		| {
				mode: 'add';
				node: DetectedNode;
		  }
		| {
				mode: 'edit';
				topology: TopologyModule;
		  };

	const [moduleSelection, setModuleSelection] = useState<ModuleSelection | null>(null);

	const unplacedModules = foundModules.filter((node) => !topology.some((entry) => entry.physicalAddress?.toLowerCase() === node.physicalAddress?.toLowerCase()));

	const detectableModules = availableModules.filter((m) => m.detectable);

	const manualModules = availableModules.filter((m) => !m.detectable);

	const filteredTopology = topology.filter((entry) => {
		const module = availableModules.find((m) => m.id === entry.moduleId);

		const node = foundModules.find((n) => n.physicalAddress === entry.physicalAddress);

		const q = search.toLowerCase();

		return module?.name?.toLowerCase().includes(q) || node?.name?.toLowerCase().includes(q) || node?.physicalAddress?.toLowerCase().includes(q);
	});

	function addManualModule(module: ModuleDefinition) {
		const next = [
			...topology,
			{
				instanceId: crypto.randomUUID(),
				moduleId: module.id,
			},
		];

		saveTopology(next);

		setAddModalOpen(false);
	}

	function selectDetectedModule(node: DetectedNode) {
		setAddModalOpen(false);

		setModuleSelection({
			mode: 'add',
			node,
		});
	}

	async function addDetectedModule(module: ModuleDefinition) {
		if (!moduleSelection || moduleSelection.mode !== 'add') {
			return;
		}

		const next = [
			...topology,
			{
				instanceId: crypto.randomUUID(),
				moduleId: module.id,
				physicalAddress: moduleSelection.node.physicalAddress,
			},
		];

		await saveTopology(next);

		setModuleSelection(null);
	}

	function removeModule(instanceId: string) {
		saveTopology(topology.filter((m) => m.instanceId !== instanceId));
	}

	function editModule(topology: TopologyModule) {
		setModuleSelection({
			mode: 'edit',
			topology,
		});
	}

	async function changeModuleType(module: ModuleDefinition) {
		if (!moduleSelection || moduleSelection.mode !== 'edit') {
			return;
		}

		const next = topology.map((entry) =>
			entry.instanceId === moduleSelection.topology.instanceId
				? {
						...entry,
						moduleId: module.id,
					}
				: entry
		);

		await saveTopology(next);

		setModuleSelection(null);
	}

	async function saveTopology(next: TopologyModule[]) {
		setTopology(next);

		try {
			await fetch('/api/projects/metadata', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					client,
					data: {
						setup: next,
					},
				}),
			});

			setMetadata((current) =>
				current
					? {
							...current,
							setup: next,
						}
					: current
			);
		} catch (error) {
			console.error(error);
		}
	}

	useEffect(() => {
		load();
	}, [client, basePath]);

	async function load() {
		try {
			setLoading(true);

			//
			// Metadata
			//

			const metadata = await fetch(`/api/projects/metadata?client=${client}`).then((r) => r.json());

			//
			// Find latest programmation
			//

			const programmationPath = `${basePath}/${client}/Programmation`;

			const files = await fetch(`/api/files?view=${encodeURIComponent(programmationPath)}&recursive=1`).then((r) => r.json());

			const duoFiles = files
				.filter((file: any) => file.type === 'file' && file.name.toLowerCase().endsWith('.duo'))
				.sort((a: any, b: any) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

			if (!duoFiles.length) {
				setFoundModules([]);
				setAvailableModules([]);
				setMetadata(metadata);

				return;
			}

			const latest = duoFiles[0];

			const latestFolder = latest.path.split('\\').slice(0, -1).join('/');

			//
			// Node database
			//

			const nodeDatabase = await fetch(`/api/files/download?path=${encodeURIComponent(`${latestFolder}/Config/nodedatabase.cache.json`)}`).then((r) => r.json());

			const moduleDefinitions = await fetch('/api/projects/modules').then((r) => r.json());

			setMetadata(metadata);

			setTopology(metadata.setup ?? []);

			setFoundModules(nodeDatabase.nodes ?? []);

			setAvailableModules(moduleDefinitions.modules ?? []);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}

	function renderModule(entry: TopologyModule) {
		const module = availableModules.find((m) => m.id === entry.moduleId);

		const node = foundModules.find((n) => n.physicalAddress === entry.physicalAddress);

		if (!module) return null;

		return (
			<Card key={entry.instanceId}>
				<div className='flex flex-col gap-4'>
					<div className='aspect-video rounded-lg p-1 overflow-hidden'>
						<Image src={`/modules/${module.id}/drawing.svg`} alt={module.name} width={100} height={100} className='w-full h-full object-contain' />
					</div>

					<div className='px-3'>
						<h3 className='font-semibold'>{module.name}</h3>

						{node ? (
							<>
								<p className='text-sm opacity-70'>{node.name}</p>
								<p className='text-sm opacity-70'>{node.physicalAddress}</p>
							</>
						) : (
							<p className='text-sm opacity-70'>Infrastructure module</p>
						)}
					</div>

					<div className='flex items-center justify-end gap-2 border-t pt-3'>
						<Button variant='ghost' icon={<Pencil size={14} />} onClick={() => editModule(entry)} />

						<Button variant='ghost' icon={<BookIcon size={14} />} onClick={() => window.open(`/modules/${module.id}/datasheet.pdf`, '_blank')} />

						<Button variant='danger-ghost' icon={<Trash2 size={14} />} onClick={() => removeModule(entry.instanceId)} />
					</div>
				</div>
			</Card>
		);
	}

	function renderTopology(entry: TopologyModule): React.ReactNode {
		return (
			<div key={entry.instanceId} className='flex flex-col items-center'>
				{renderModule(entry)}

				{entry.nodes ? (
					<>
						<div className='relative h-16 w-full max-w-5xl'>
							<div className='absolute left-1/2 top-0 h-6 w-[3px] bg-orange-500 -translate-x-1/2' />

							<div className='absolute left-[calc(50%-6px)] top-0 h-6 w-[3px] bg-orange-200' />

							<div className='absolute left-1/4 right-1/4 top-6 h-[3px] bg-orange-500' />

							<div className='absolute left-[calc(25%-6px)] right-[calc(25%-6px)] top-6 h-[3px] bg-orange-200' />

							<div className='absolute left-1/4 top-6 h-10 w-[3px] bg-orange-500' />

							<div className='absolute left-[calc(25%-6px)] top-6 h-10 w-[3px] bg-orange-200' />

							<div className='absolute right-1/4 top-6 h-10 w-[3px] bg-orange-500' />

							<div className='absolute right-[calc(25%-6px)] top-6 h-10 w-[3px] bg-orange-200' />
						</div>

						<div className='grid grid-cols-2 gap-20 w-full'>
							<div className='flex flex-col gap-6'>{entry.nodes[1]?.map(renderTopology)}</div>

							<div className='flex flex-col gap-6'>{entry.nodes[2]?.map(renderTopology)}</div>
						</div>
					</>
				) : (
					<div className='flex justify-center'>
						<div className='relative h-10 w-4'>
							<div className='absolute left-0 h-full w-[3px] bg-orange-500' />

							<div className='absolute left-[6px] h-full w-[3px] bg-orange-200' />
						</div>
					</div>
				)}
			</div>
		);
	}

	if (loading) return <Loading title='Loading Topology' />;

	return (
		<>
			<div className='flex items-center gap-2'>
				<Input placeholder='Search modules...' value={search} onChange={(e) => setSearch(e.target.value)} />

				<Button onClick={() => setAddModalOpen(true)}>Add ({unplacedModules.length})</Button>
			</div>

			<div className='mt-8 flex flex-col gap-6'>{topology.map(renderTopology)}</div>

			<Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title='Add Module'>
				<div className='space-y-8 max-h-[70vh] overflow-y-auto pr-2'>
					<div>
						<h3 className='mb-4 text-lg font-semibold'>Detected Modules ({unplacedModules.length})</h3>

						<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
							{unplacedModules.map((node) => (
								<Card key={node.physicalAddress} onClick={() => selectDetectedModule(node)} className='cursor-pointer transition hover:scale-[1.02]'>
									<div className='flex flex-col gap-4'>
										<div className='aspect-video rounded-lg border bg-muted flex items-center justify-center'>
											<span className='text-sm text-muted-foreground'>Unknown module</span>
										</div>

										<div>
											<h4 className='font-semibold'>{node.name}</h4>

											<p className='text-sm opacity-70'>{node.physicalAddress}</p>

											<p className='text-sm opacity-70'>{node.numberOfUnits} units</p>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>

					<div>
						<h3 className='mb-4 text-lg font-semibold'>Infrastructure</h3>

						<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
							{manualModules.map((module) => (
								<Card key={module.id} onClick={() => addManualModule(module)} className='cursor-pointer transition hover:scale-[1.02]'>
									<div className='flex flex-col gap-4'>
										<div className='aspect-video rounded-lg border overflow-hidden bg-white'>
											<img src={`/modules/${module.id}/drawing.svg`} alt={module.name} className='w-full h-full object-contain p-4' />
										</div>

										<div>
											<h4 className='font-semibold'>{module.name}</h4>

											<p className='text-sm opacity-70 line-clamp-3'>{module.description}</p>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				</div>
			</Modal>

			<Modal open={moduleSelection !== null} onClose={() => setModuleSelection(null)} title='Select Module Type'>
				<div className='space-y-6'>
					<div>
						<h3 className='font-semibold'>{moduleSelection?.mode === 'add' ? moduleSelection.node.name : availableModules.find((x) => x.id === moduleSelection?.topology.moduleId)?.name}</h3>

						<p className='opacity-70'>{moduleSelection?.mode === 'add' ? moduleSelection.node.physicalAddress : moduleSelection?.topology.physicalAddress}</p>
					</div>

					<div className='grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto pr-2 lg:grid-cols-3'>
						{detectableModules.map((module) => (
							<Card key={module.id} onClick={() => (moduleSelection?.mode === 'add' ? addDetectedModule(module) : changeModuleType(module))} className='cursor-pointer transition hover:scale-[1.02]'>
								<div className='flex flex-col gap-4'>
									<div className='aspect-video rounded-lg p-1 overflow-hidden'>
										<Image src={`/modules/${module.id}/drawing.svg`} alt={module.name} className='w-full h-full object-contain' height={100} width={100} />
									</div>

									<div>
										<h4 className='font-semibold'>{module.name}</h4>

										<p className='text-sm opacity-70 line-clamp-3'>{module.description}</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				</div>
			</Modal>
		</>
	);
}
