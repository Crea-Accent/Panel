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
import { usePermissions } from '@/providers/PermissionsProvider';

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
	channels?: number;
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

	nodes?: Record<number, TopologyModule[]>;
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
	const { has } = usePermissions();

	const [loading, setLoading] = useState(true);

	const [metadata, setMetadata] = useState<Metadata | null>(null);

	const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);

	const [foundModules, setFoundModules] = useState<DetectedNode[]>([]);
	const [topology, setTopology] = useState<TopologyModule[]>([]);

	const [search, setSearch] = useState('');
	const [mobileBranch, setMobileBranch] = useState<number>(1);

	const [addModalOpen, setAddModalOpen] = useState(false);
	const [editing, setEditing] = useState(false);
	const [unitModal, setUnitModal] = useState<DetectedNode | null>(null);

	const [moduleSelection, setModuleSelection] = useState<ModuleSelection | null>(null);

	const [branchParent, setBranchParent] = useState<{
		instanceId: string;
		branch: number;
	} | null>(null);

	const unplacedModules = foundModules.filter((node) => !containsPhysicalAddress(topology, node.physicalAddress));

	const detectableModules = availableModules.filter((m) => m.detectable);

	const manualModules = availableModules.filter((m) => !m.detectable);

	function findNextSwitch(tree: TopologyModule[], instanceId: string): TopologyModule | null {
		for (let i = 0; i < tree.length; i++) {
			if (tree[i].instanceId === instanceId) {
				for (let j = i + 1; j < tree.length; j++) {
					const def = availableModules.find((m) => m.id === tree[j].moduleId);

					if ((def?.channels ?? 0) > 0) {
						return tree[j];
					}
				}

				return null;
			}
		}

		return null;
	}

	function containsPhysicalAddress(tree: TopologyModule[], address: string): boolean {
		for (const module of tree) {
			if (module.physicalAddress === address) return true;

			for (const branch of Object.values(module.nodes ?? {})) {
				if (containsPhysicalAddress(branch, address)) {
					return true;
				}
			}
		}

		return false;
	}

	function insertIntoBranch(tree: TopologyModule[], parentId: string, branch: number, module: TopologyModule): boolean {
		for (const node of tree) {
			if (node.instanceId === parentId) {
				node.nodes ??= {};

				node.nodes[branch] ??= [];

				node.nodes[branch]!.unshift(module);

				return true;
			}

			for (const children of Object.values(node.nodes ?? {})) {
				if (insertIntoBranch(children, parentId, branch, module)) {
					return true;
				}
			}
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
				nodes: module.nodes ? Object.fromEntries(Object.entries(module.nodes).map(([branch, children]) => [branch, removeRecursive(children, id)])) : undefined,
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

			nodes: module.nodes ? Object.fromEntries(Object.entries(module.nodes).map(([branch, children]) => [branch, updateRecursive(children, id, moduleId)])) : undefined,
		}));
	}

	function moveRecursive(tree: TopologyModule[], instanceId: string, direction: 'up' | 'down'): boolean {
		for (let i = 0; i < tree.length; i++) {
			const module = tree[i];

			// Move within the current list
			if (module.instanceId === instanceId) {
				if (direction === 'up' && i > 0) {
					[tree[i - 1], tree[i]] = [tree[i], tree[i - 1]];
				}

				if (direction === 'down' && i < tree.length - 1) {
					[tree[i + 1], tree[i]] = [tree[i], tree[i + 1]];
				}

				return true;
			}

			// Search every branch
			for (const children of Object.values(module.nodes ?? {})) {
				const index = children.findIndex((x) => x.instanceId === instanceId);

				// First module of a branch -> move before switch
				if (index === 0 && direction === 'up') {
					const moving = children.shift()!;

					tree.splice(i, 0, moving);

					return true;
				}

				if (moveRecursive(children, instanceId, direction)) {
					return true;
				}
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

	function beginBranch(parent: TopologyModule, branch: number) {
		setBranchParent({
			instanceId: parent.instanceId,
			branch,
		});

		setAddModalOpen(true);
	}

	function getBranchPosition(tree: TopologyModule[], id: string): { first: boolean; last: boolean } | null {
		for (const module of tree) {
			for (const children of Object.values(module.nodes ?? {})) {
				const index = children.findIndex((x) => x.instanceId === id);

				if (index !== -1) {
					return {
						first: index === 0,
						last: index === children.length - 1,
					};
				}

				const found = getBranchPosition(children, id);

				if (found) return found;
			}
		}

		return null;
	}

	function isRootModule(id: string) {
		return topology[0]?.instanceId === id;
	}

	function isLastRootModule(id: string) {
		return topology[topology.length - 1]?.instanceId === id;
	}

	function isBeforeSwitch(tree: TopologyModule[], id: string): boolean {
		for (let i = 0; i < tree.length - 1; i++) {
			if (tree[i].instanceId === id && (tree[i + 1].moduleId === 'DT00-24SW' || tree[i + 1].moduleId === 'DT13-SW')) {
				return true;
			}

			for (const children of Object.values(tree[i].nodes ?? {})) {
				if (isBeforeSwitch(children, id)) {
					return true;
				}
			}
		}

		return false;
	}

	function extractModule(tree: TopologyModule[], instanceId: string): TopologyModule | null {
		for (let i = 0; i < tree.length; i++) {
			if (tree[i].instanceId === instanceId) return tree.splice(i, 1)[0];

			for (const children of Object.values(tree[i].nodes ?? {})) {
				const found = extractModule(children, instanceId);

				if (found) {
					return found;
				}
			}
		}

		return null;
	}

	async function moveModuleToBranch(instanceId: string, direction: -1 | 1) {
		const next = structuredClone(topology);

		const location = getBranchOfModule(next, instanceId);

		if (!location) {
			// Module is on the main line

			const moving = extractModule(next, instanceId);

			if (!moving) return;

			const targetSwitch = findNextSwitch(next, instanceId);

			if (!targetSwitch) return;

			targetSwitch.nodes ??= {};
			targetSwitch.nodes[1] ??= [];

			targetSwitch.nodes[1].unshift(moving);

			await saveTopology(next);

			return;
		}
	}

	function getBranchOfModule(
		tree: TopologyModule[],
		id: string
	): {
		parentId: string;
		branch: number;
	} | null {
		for (const module of tree) {
			for (const [branch, children] of Object.entries(module.nodes ?? {})) {
				if (children.some((x) => x.instanceId === id)) {
					return {
						parentId: module.instanceId,
						branch: Number(branch),
					};
				}

				const found = getBranchOfModule(children, id);

				if (found) {
					return found;
				}
			}
		}

		return null;
	}

	function findSwitchParent(tree: TopologyModule[], instanceId: string): TopologyModule | null {
		for (const module of tree) {
			for (const children of Object.values(module.nodes ?? {})) {
				if (children.some((x) => x.instanceId === instanceId)) {
					return module;
				}

				const found = findSwitchParent(children, instanceId);

				if (found) return found;
			}
		}

		return null;
	}

	function renderModule(entry: TopologyModule) {
		const position = getBranchPosition(topology, entry.instanceId);

		const firstInBranch = position?.first ?? false;
		const lastInBranch = position?.last ?? false;

		const rootModule = isRootModule(entry.instanceId);
		const lastRootModule = isLastRootModule(entry.instanceId);

		const beforeSwitch = isBeforeSwitch(topology, entry.instanceId);

		const inBranch = getBranchOfModule(topology, entry.instanceId) !== null;

		const canMoveUp = inBranch || lastRootModule;

		const canMoveDown = rootModule ? !beforeSwitch : !lastInBranch;

		const canMoveLeft = inBranch && (firstInBranch || lastInBranch);

		const canMoveRight = inBranch && (firstInBranch || lastInBranch);

		const module = availableModules.find((m) => m.id === entry.moduleId);

		const node = foundModules.find((n) => n.physicalAddress === entry.physicalAddress);

		if (!module) return null;

		const branchCount = module.channels ?? 0;

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

					<div className='px-3 pb-3 space-y-3'>
						{/* Actions */}
						<div className='flex flex-wrap justify-end gap-2'>
							{!!node?.units?.length && module.detectable && <Button variant='ghost' icon={<ListTree size={14} />} onClick={() => setUnitModal(node)} />}

							<Button variant='ghost' icon={<BookIcon size={14} />} onClick={() => window.open(`/modules/${module.id}/datasheet.pdf`, '_blank')} />

							{editing && <Button variant='ghost' icon={<Pencil size={14} />} onClick={() => editModule(entry)} />}

							{editing && <Button variant='danger-ghost' icon={<Trash2 size={14} />} onClick={() => removeModule(entry.instanceId)} />}
						</div>

						{/* Movement */}
						{editing && (
							<div className='flex justify-center'>
								{branchCount ? (
									<div className='flex flex-wrap justify-center gap-2'>
										{Array.from({ length: branchCount }, (_, i) => (
											<Button key={i} variant='ghost' onClick={() => beginBranch(entry, i + 1)}>
												<Plus size={14} />
												Bus {i + 1}
											</Button>
										))}
									</div>
								) : (
									<div className='grid grid-cols-3 gap-1 w-[108px]'>
										<div />

										<div className='flex justify-center'>{canMoveUp && <Button size='sm' variant='ghost' icon={<ChevronUp size={14} />} onClick={() => moveModule(entry.instanceId, 'up')} />}</div>

										<div />

										<div className='flex justify-center'>
											{canMoveLeft && <Button size='sm' variant='ghost' icon={<ChevronLeft size={14} />} onClick={() => moveModuleToBranch(entry.instanceId, -1)} />}
										</div>

										<div />

										<div className='flex justify-center'>
											{canMoveRight && <Button size='sm' variant='ghost' icon={<ChevronRight size={14} />} onClick={() => moveModuleToBranch(entry.instanceId, 1)} />}
										</div>

										<div />

										<div className='flex justify-center'>
											{canMoveDown && <Button size='sm' variant='ghost' icon={<ChevronDown size={14} />} onClick={() => moveModule(entry.instanceId, 'down')} />}
										</div>

										<div />
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</Card>
		);
	}

	function renderTopology(entry: TopologyModule): React.ReactNode {
		const module = availableModules.find((m) => m.id === entry.moduleId);

		const branchCount = module?.channels ?? 0;

		return (
			<div key={entry.instanceId} className='flex flex-col items-center'>
				{renderModule(entry)}

				{entry.nodes ? (
					<>
						{/* Mobile selector */}

						<div className='flex md:hidden items-center justify-between mb-4'>
							{Array.from({ length: branchCount }, (_, i) => (
								<Button key={i} variant={mobileBranch === i + 1 ? 'primary' : 'ghost'} onClick={() => setMobileBranch(i + 1)}>
									Bus {i + 1}
								</Button>
							))}
						</div>

						{/* Desktop */}
						<div
							className='hidden md:grid w-full gap-x-20'
							style={{
								gridTemplateColumns: `repeat(${branchCount}, minmax(0,1fr))`,
							}}>
							{/* Bus occupies the first row */}
							<div
								className='relative h-16'
								style={{
									gridColumn: `1 / ${branchCount + 1}`,
								}}>
								{/* Incoming */}
								<div
									className='absolute top-0 h-6 w-0.75 bg-orange-500'
									style={{
										left: 'calc(50% - 3px)',
									}}
								/>

								<div
									className='absolute top-0 h-7 w-0.75 bg-orange-200'
									style={{
										left: 'calc(50% + 3px)',
									}}
								/>

								{/* Horizontal */}
								<div
									className='absolute h-0.75 bg-orange-500'
									style={{
										top: 22,
										left: `${100 / branchCount / 2}%`,
										right: `${100 / branchCount / 2}%`,
									}}
								/>

								<div
									className='absolute h-0.75 bg-orange-200'
									style={{
										top: 28,
										left: `calc(${100 / branchCount / 2}% + 3px)`,
										right: `calc(${100 / branchCount / 2}% - 3px)`,
									}}
								/>

								{/* Branches */}
								<div
									className='absolute inset-x-0 top-[22px] grid'
									style={{
										gridTemplateColumns: `repeat(${branchCount}, minmax(0,1fr))`,
									}}>
									{Array.from({ length: branchCount }, (_, i) => (
										<div key={i} className='flex justify-center'>
											<div className='relative h-16 w-3'>
												<div
													className='absolute w-0.75 bg-orange-500'
													style={{
														left: 'calc(50% - 3px)',
														top: 0,
														height: 42,
													}}
												/>

												<div
													className='absolute w-0.75 bg-orange-200'
													style={{
														left: 'calc(50% + 3px)',
														top: 6,
														height: 36,
													}}
												/>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Branch columns */}
							{Array.from({ length: branchCount }, (_, i) => (
								<div key={i} className='flex flex-col gap-6'>
									{entry.nodes?.[i + 1]?.map(renderTopology)}
								</div>
							))}
						</div>

						{/* Mobile */}
						<div className='md:hidden'>
							<div className='flex flex-col gap-6'>{entry.nodes?.[mobileBranch]?.map(renderTopology)}</div>
						</div>
					</>
				) : (
					<div className='flex justify-center'>
						<div className='relative h-10 w-4'>
							<div className='absolute left-0 h-16 w-0.75 bg-orange-500' />

							<div className='absolute left-1.5 h-16 w-0.75 bg-orange-200' />
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

				{has('projects.write') && <Button onClick={() => setAddModalOpen(true)}>Add ({unplacedModules.length})</Button>}

				{has('projects.write') && <Button onClick={() => setEditing(!editing)}>{editing ? 'Save' : 'Edit'}</Button>}
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
