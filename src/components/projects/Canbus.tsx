/** @format */
'use client';

import {
	BookIcon,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ChevronsUpDown,
	CircuitBoard,
	Lightbulb,
	ListTree,
	Music,
	Pencil,
	Plus,
	Power,
	Thermometer,
	ToggleLeft,
	Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import Button from '../ui/Button';
import Card from '../ui/Card';
import Image from 'next/image';
import Input from '../ui/Input';
import Loading from '../ui/Loading';
import Modal from '../ui/Modal';

const units = {
	Sens: <Thermometer size={30} />, // or FaTemperatureHigh
	Virtual: <CircuitBoard size={30} />,
	Control: <ToggleLeft size={30} />,
	Motor: <ChevronsUpDown size={30} />,
	Dimmer: <Lightbulb size={30} />,
	Relais: <Power size={30} />,
	Audio: <Music size={30} />,
};

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

type ModuleSelection =
	| {
			mode: 'add';
			node: DetectedNode;
	  }
	| {
			mode: 'edit';
			topology: TopologyModule;
	  };

export default function Canbus({ client, basePath }: Props) {
	const [loading, setLoading] = useState(true);

	const [metadata, setMetadata] = useState<Metadata | null>(null);

	const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);

	const [foundModules, setFoundModules] = useState<DetectedNode[]>([]);
	const [topology, setTopology] = useState<TopologyModule[]>([]);

	const [search, setSearch] = useState('');
	const [mobileBranch, setMobileBranch] = useState<1 | 2>(1);

	const [addModalOpen, setAddModalOpen] = useState(false);
	const [unitModal, setUnitModal] = useState<DetectedNode | null>(null);

	const [moduleSelection, setModuleSelection] = useState<ModuleSelection | null>(null);

	const [branchParent, setBranchParent] = useState<{
		instanceId: string;
		branch: 1 | 2;
	} | null>(null);

	const unplacedModules = foundModules.filter((node) => !containsPhysicalAddress(topology, node.physicalAddress));

	const detectableModules = availableModules.filter((m) => m.detectable);

	const manualModules = availableModules.filter((m) => !m.detectable);

	function containsPhysicalAddress(tree: TopologyModule[], address: string): boolean {
		for (const module of tree) {
			if (module.physicalAddress === address) {
				return true;
			}

			if (module.nodes?.[1] && containsPhysicalAddress(module.nodes[1]!, address)) {
				return true;
			}

			if (module.nodes?.[2] && containsPhysicalAddress(module.nodes[2]!, address)) {
				return true;
			}
		}

		return false;
	}

	function insertIntoBranch(tree: TopologyModule[], parentId: string, branch: 1 | 2, module: TopologyModule): boolean {
		for (const node of tree) {
			if (node.instanceId === parentId) {
				node.nodes ??= {};

				node.nodes[branch] ??= [];

				node.nodes[branch]!.unshift(module);

				return true;
			}

			if (node.nodes?.[1] && insertIntoBranch(node.nodes[1]!, parentId, branch, module)) return true;

			if (node.nodes?.[2] && insertIntoBranch(node.nodes[2]!, parentId, branch, module)) return true;
		}

		return false;
	}

	function addManualModule(definition: ModuleDefinition) {
		const manual: TopologyModule = {
			instanceId: crypto.randomUUID(),
			moduleId: definition.id,
		};

		if (!branchParent) {
			saveTopology([...topology, manual]);
		} else {
			const next = structuredClone(topology);

			insertIntoBranch(next, branchParent.instanceId, branchParent.branch, manual);

			saveTopology(next);

			setBranchParent(null);
		}

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

		const detected: TopologyModule = {
			instanceId: crypto.randomUUID(),
			moduleId: module.id,
			physicalAddress: moduleSelection.node.physicalAddress,
		};

		if (!branchParent) {
			await saveTopology([...topology, detected]);
		} else {
			const next = structuredClone(topology);

			insertIntoBranch(next, branchParent.instanceId, branchParent.branch, detected);

			await saveTopology(next);

			setBranchParent(null);
		}

		setModuleSelection(null);
	}

	function removeRecursive(tree: TopologyModule[], id: string): TopologyModule[] {
		return tree
			.filter((module) => module.instanceId !== id)
			.map((module) => ({
				...module,
				nodes: module.nodes
					? {
							1: module.nodes[1] ? removeRecursive(module.nodes[1]!, id) : undefined,
							2: module.nodes[2] ? removeRecursive(module.nodes[2]!, id) : undefined,
						}
					: undefined,
			}));
	}

	function removeModule(instanceId: string) {
		saveTopology(removeRecursive(topology, instanceId));
	}

	function editModule(topology: TopologyModule) {
		setModuleSelection({
			mode: 'edit',
			topology,
		});
	}

	function updateRecursive(tree: TopologyModule[], id: string, moduleId: string): TopologyModule[] {
		return tree.map((module) => ({
			...module,
			moduleId: module.instanceId === id ? moduleId : module.moduleId,

			nodes: module.nodes
				? {
						1: module.nodes[1] ? updateRecursive(module.nodes[1]!, id, moduleId) : undefined,

						2: module.nodes[2] ? updateRecursive(module.nodes[2]!, id, moduleId) : undefined,
					}
				: undefined,
		}));
	}

	function moveRecursive(tree: TopologyModule[], instanceId: string, direction: 'up' | 'down'): boolean {
		for (let i = 0; i < tree.length; i++) {
			const module = tree[i];

			if (module.instanceId === instanceId) {
				if (direction === 'up') {
					if (i > 0) {
						[tree[i - 1], tree[i]] = [tree[i], tree[i - 1]];
					}
				} else {
					if (i < tree.length - 1) {
						[tree[i + 1], tree[i]] = [tree[i], tree[i + 1]];
					}
				}

				return true;
			}

			if (module.nodes?.[1]) {
				const branch = module.nodes[1]!;

				const index = branch.findIndex((x) => x.instanceId === instanceId);

				if (index === 0 && direction === 'up') {
					const moving = branch.shift()!;

					tree.splice(i, 0, moving);

					return true;
				}

				if (moveRecursive(branch, instanceId, direction)) return true;
			}

			if (module.nodes?.[2]) {
				const branch = module.nodes[2]!;

				const index = branch.findIndex((x) => x.instanceId === instanceId);

				if (index === 0 && direction === 'up') {
					const moving = branch.shift()!;

					tree.splice(i, 0, moving);

					return true;
				}

				if (moveRecursive(branch, instanceId, direction)) return true;
			}
		}

		return false;
	}

	async function moveModule(instanceId: string, direction: 'up' | 'down') {
		const next = structuredClone(topology);

		moveRecursive(next, instanceId, direction);

		await saveTopology(next);
	}

	async function changeModuleType(module: ModuleDefinition) {
		if (!moduleSelection || moduleSelection.mode !== 'edit') return;

		const next = updateRecursive(topology, moduleSelection.topology.instanceId, module.id);

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

	async function load() {
		try {
			setLoading(true);

			const metadata = await fetch(`/api/projects/metadata?client=${client}`).then((r) => r.json());

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

	function beginBranch(parent: TopologyModule, branch: 1 | 2) {
		setBranchParent({
			instanceId: parent.instanceId,
			branch,
		});

		setAddModalOpen(true);
	}

	function isFirstInBranch(tree: TopologyModule[], id: string): boolean {
		for (const module of tree) {
			if (module.nodes?.[1]?.[0]?.instanceId === id) return true;

			if (module.nodes?.[2]?.[0]?.instanceId === id) return true;

			if (module.nodes?.[1] && isFirstInBranch(module.nodes[1]!, id)) return true;

			if (module.nodes?.[2] && isFirstInBranch(module.nodes[2]!, id)) return true;
		}

		return false;
	}

	function isBeforeSwitch(tree: TopologyModule[], id: string): boolean {
		for (let i = 0; i < tree.length - 1; i++) {
			if (tree[i].instanceId === id && tree[i + 1].moduleId === 'DT00-24SW') {
				return true;
			}

			if (tree[i].nodes?.[1] && isBeforeSwitch(tree[i].nodes![1]!, id)) return true;

			if (tree[i].nodes?.[2] && isBeforeSwitch(tree[i].nodes![2]!, id)) return true;
		}

		return false;
	}

	function extractModule(tree: TopologyModule[], instanceId: string): TopologyModule | null {
		for (let i = 0; i < tree.length; i++) {
			if (tree[i].instanceId === instanceId) {
				return tree.splice(i, 1)[0];
			}

			if (tree[i].nodes?.[1]) {
				const found = extractModule(tree[i].nodes![1]!, instanceId);

				if (found) return found;
			}

			if (tree[i].nodes?.[2]) {
				const found = extractModule(tree[i].nodes![2]!, instanceId);

				if (found) return found;
			}
		}

		return null;
	}

	async function moveModuleToBranch(instanceId: string, branch: 1 | 2) {
		const next = structuredClone(topology);

		const moving = extractModule(next, instanceId);

		if (!moving) return;

		for (let i = 0; i < next.length - 1; i++) {
			if (next[i + 1].moduleId === 'DT00-24SW') {
				next[i + 1].nodes ??= {};
				next[i + 1].nodes![branch] ??= [];

				next[i + 1].nodes![branch]!.unshift(moving);

				await saveTopology(next);

				return;
			}
		}

		const info = getBranchOfModule(topology, instanceId);

		if (!info) return;

		insertIntoBranch(next, info.parentId, branch, moving);

		await saveTopology(next);
	}

	function getBranchOfModule(
		tree: TopologyModule[],
		id: string
	): {
		parentId: string;
		branch: 1 | 2;
	} | null {
		for (const module of tree) {
			if (module.nodes?.[1]?.some((x) => x.instanceId === id))
				return {
					parentId: module.instanceId,
					branch: 1,
				};

			if (module.nodes?.[2]?.some((x) => x.instanceId === id))
				return {
					parentId: module.instanceId,
					branch: 2,
				};

			const left = module.nodes?.[1] && getBranchOfModule(module.nodes[1]!, id);

			if (left) return left;

			const right = module.nodes?.[2] && getBranchOfModule(module.nodes[2]!, id);

			if (right) return right;
		}

		return null;
	}

	function renderModule(entry: TopologyModule) {
		const firstInBranch = isFirstInBranch(topology, entry.instanceId);

		const beforeSwitch = isBeforeSwitch(topology, entry.instanceId);

		const module = availableModules.find((m) => m.id === entry.moduleId);

		const node = foundModules.find((n) => n.physicalAddress === entry.physicalAddress);

		if (!module) return null;

		return (
			<Card key={entry.instanceId}>
				<div className='flex flex-col gap-4'>
					<div className='aspect-video rounded-lg p-1 overflow-hidden max-h-70'>
						<Image src={`/modules/${module.id}/drawing.svg`} alt={module.name} width={100} height={100} className='w-150 h-full object-contain' unoptimized />
					</div>

					<div className='px-3'>
						<h3 className='font-semibold'>{module.name}</h3>

						{node ? (
							<>
								<p className='text-sm opacity-70'>{node.name}</p>
								<p className='text-sm opacity-70'>
									{node.physicalAddress} - {node.nodeAddress} - {node.numberOfUnits}U
								</p>
								<p className='text-sm opacity-70'></p>
							</>
						) : (
							<p className='text-sm opacity-70'>Infrastructure module</p>
						)}
					</div>

					<div className='flex items-center justify-end gap-2 -t pt-3'>
						{!!node?.units?.length && module.detectable && <Button variant='ghost' icon={<ListTree size={14} />} onClick={() => setUnitModal(node)} />}

						<Button variant='ghost' icon={<Pencil size={14} />} onClick={() => editModule(entry)} />

						<Button variant='ghost' icon={<BookIcon size={14} />} onClick={() => window.open(`/modules/${module.id}/datasheet.pdf`, '_blank')} />

						<Button variant='danger-ghost' icon={<Trash2 size={14} />} onClick={() => removeModule(entry.instanceId)} />

						{entry.moduleId === 'DT00-24SW' ? (
							<>
								<Button variant='ghost' onClick={() => beginBranch(entry, 1)}>
									<Plus size={14} /> Bus 1
								</Button>

								<Button variant={'ghost'} onClick={() => beginBranch(entry, 2)}>
									<Plus size={14} /> Bus 2
								</Button>
							</>
						) : (
							<>
								{firstInBranch || beforeSwitch ? (
									<>
										<Button variant='ghost' icon={<ChevronUp size={14} />} onClick={() => moveModule(entry.instanceId, 'up')} />

										<Button variant='ghost' icon={<ChevronLeft size={14} />} onClick={() => moveModuleToBranch(entry.instanceId, 1)} />

										<Button variant='ghost' icon={<ChevronRight size={14} />} onClick={() => moveModuleToBranch(entry.instanceId, 2)} />
									</>
								) : (
									<>
										<Button variant='ghost' icon={<ChevronUp size={14} />} onClick={() => moveModule(entry.instanceId, 'up')} />

										<Button variant='ghost' icon={<ChevronDown size={14} />} onClick={() => moveModule(entry.instanceId, 'down')} />
									</>
								)}
							</>
						)}
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
							<div className='absolute left-1/2 top-0 h-6 w-0.75 bg-orange-500 -translate-x-1/2' />

							<div className='absolute left-[calc(50%-6px)] top-0 h-6 w-0.75 bg-orange-200' />

							<div className='absolute left-1/4 right-1/4 top-6 h-0.75 bg-orange-500' />

							<div className='absolute left-[calc(25%-6px)] right-[calc(25%-6px)] top-6 h-0.75 bg-orange-200' />

							<div className='absolute left-1/4 top-6 h-10 w-0.75 bg-orange-500' />

							<div className='absolute left-[calc(25%-6px)] top-6 h-10 w-0.75 bg-orange-200' />

							<div className='absolute right-1/4 top-6 h-10 w-0.75 bg-orange-500' />

							<div className='absolute right-[calc(25%-6px)] top-6 h-10 w-0.75 bg-orange-200' />
						</div>

						<>
							{/* Mobile selector */}

							<div className='flex md:hidden items-center justify-between mb-4'>
								<Button variant={mobileBranch === 1 ? 'primary' : 'ghost'} onClick={() => setMobileBranch(1)}>
									Bus 1
								</Button>

								<Button variant={mobileBranch === 2 ? 'primary' : 'ghost'} onClick={() => setMobileBranch(2)}>
									Bus 2
								</Button>
							</div>

							{/* Desktop */}
							<div className='hidden md:grid grid-cols-2 gap-20 w-full'>
								<div className='flex flex-col gap-6'>{entry.nodes?.[1]?.map(renderTopology)}</div>

								<div className='flex flex-col gap-6'>{entry.nodes?.[2]?.map(renderTopology)}</div>
							</div>

							{/* Mobile */}
							<div className='md:hidden'>
								<div className='flex flex-col gap-6'>{entry.nodes?.[mobileBranch]?.map(renderTopology)}</div>
							</div>
						</>
					</>
				) : (
					<div className='flex justify-center'>
						<div className='relative h-10 w-4'>
							<div className='absolute left-0 h-full w-0.75 bg-orange-500' />

							<div className='absolute left-1.5 h-full w-0.75 bg-orange-200' />
						</div>
					</div>
				)}
			</div>
		);
	}

	useEffect(() => {
		load();
	}, [client, basePath]);

	if (loading) return <Loading title='Loading Topology' />;

	return (
		<>
			<div className='flex items-center gap-2'>
				<Input placeholder='Search modules...' value={search} onChange={(e) => setSearch(e.target.value)} />

				<Button onClick={() => setAddModalOpen(true)}>Add ({unplacedModules.length})</Button>
			</div>

			<div className='mt-8 flex flex-col gap-6'>{topology.map(renderTopology)}</div>

			<Modal size={'xxl'} open={addModalOpen} onClose={() => setAddModalOpen(false)} title='Add Module'>
				<div className='space-y-8 max-h-[70vh] overflow-y-auto pr-2'>
					<div>
						<h3 className='mb-4 text-lg font-semibold'>Detected Modules ({unplacedModules.length})</h3>

						<div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
							{unplacedModules.map((node) => (
								<Card key={node.physicalAddress} onClick={() => selectDetectedModule(node)} className='cursor-pointer transition hover:scale-[1.02]'>
									<div className='flex flex-col gap-4 p-2'>
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
							{manualModules.map((module, i) => (
								<Card key={i} onClick={() => addManualModule(module)} className='cursor-pointer transition hover:scale-[1.02]'>
									<div className='flex flex-col gap-4 p-2'>
										<div className='aspect-video rounded-lg overflow-hidden'>
											<Image src={`/modules/${module.id}/drawing.svg`} alt={module.name} className='w-full h-full object-contain p-4' width={100} height={100} />
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

			<Modal open={moduleSelection !== null} size={'xxl'} onClose={() => setModuleSelection(null)} title='Select Module Type'>
				<div className='space-y-6'>
					<div>
						<h3 className='font-semibold'>{moduleSelection?.mode === 'add' ? moduleSelection.node.name : availableModules.find((x) => x.id === moduleSelection?.topology.moduleId)?.name}</h3>

						<p className='opacity-70'>{moduleSelection?.mode === 'add' ? moduleSelection.node.physicalAddress : moduleSelection?.topology.physicalAddress}</p>
					</div>

					<div className='grid grid-cols-1 gap-4 max-h-[70vh] overflow-y-auto pr-2 lg:grid-cols-3'>
						{detectableModules.map((module, i) => (
							<Card key={i} onClick={() => (moduleSelection?.mode === 'add' ? addDetectedModule(module) : changeModuleType(module))} className='cursor-pointer transition hover:scale-[1.02]'>
								<div className='flex flex-col gap-4 p-2'>
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

			<Modal size='xl' open={unitModal !== null} onClose={() => setUnitModal(null)} title={`${unitModal?.name} Units`}>
				<div className='max-h-[70vh] overflow-y-auto p-2'>
					<div className='grid gap-3 md:grid-cols-2'>
						{unitModal?.units.map((unit: any, index: number) => {
							return (
								<Card key={index}>
									<div className='flex justify-between items-center p-2' key={index}>
										<div>
											<h4 className='font-semibold'>{unit.name}</h4>

											<p className='text-sm opacity-70'>Channel {unit.unitAddress}</p>
										</div>

										<div className='text-right text-sm opacity-70'>
											<div>{units[unit.unitTypeName as keyof typeof units] || unit.unitTypeName}</div>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				</div>
			</Modal>
		</>
	);
}
