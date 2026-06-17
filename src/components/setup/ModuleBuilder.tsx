/** @format */
'use client';

import { Cable, Plus, Trash2 } from 'lucide-react';
import dt00_24 from '@/../public/modules/DT00-24/module.json' with { type: 'json' };
import dt00_24sw from '@/../public/modules/DT00-24SW/module.json' with { type: 'json' };
import dt18_gt from '@/../public/modules/DT18-GT/module.json' with { type: 'json' };
import dt18_hs from '@/../public/modules/DT18-HS/module.json' with { type: 'json' };

import ModulePalette from './ModulePalette';
import { Reorder } from 'framer-motion';
import { useState } from 'react';
import { ModuleUnit } from '../projects/Setup';

export type ModuleDefinition = {
	id: string;

	name: string;
	description?: string;

	signature?: {
		type: number;
		profile: number;
	};

	inputs: {
		name: string;
		description?: string;
	}[];

	outputs: {
		name: string;
		description?: string;
	}[];

	preview?: string;
};

export type ModuleInstance = {
	instanceId: string;

	moduleId: string;

	name: string;
	description?: string;

	label?: string;

	address?: number;

	family?: number;

	profile?: number;

	location?: string;

	x?: number;
	y?: number;

	settings: {
		type?: number;
		room?: string;

		[key: string]: any;
	};

	units: Array<ModuleUnit>;

	logic?: string[];

	rawStrings?: string[];

	preview?: string;
};

type Props = {
	foundModules: ModuleInstance[];

	topology: ModuleInstance[];
	setTopology: React.Dispatch<React.SetStateAction<ModuleInstance[]>>;
};

export default function ModuleBuilder({ foundModules, topology, setTopology }: Props) {
	const [expanded, setExpanded] = useState<string[]>([]);

	function toggleExpanded(instanceId: string) {
		setExpanded((prev) => (prev.includes(instanceId) ? prev.filter((x) => x !== instanceId) : [...prev, instanceId]));
	}

	function addModule(module: ModuleInstance) {
		setTopology((prev) => [
			...prev,
			{
				...structuredClone(module),
				instanceId: crypto.randomUUID(),
			},
		]);
	}

	function removeModule(instanceId: string) {
		setTopology((prev) => prev.filter((module) => module.instanceId !== instanceId));
	}

	const foundAvailableModules = foundModules.filter((found) => !topology.some((placed) => placed.address === found.address));

	const infrastructureModules: ModuleInstance[] = [dt00_24, dt00_24sw, dt18_gt, dt18_hs].map((module) => ({
		instanceId: crypto.randomUUID(),

		moduleId: module.id,

		name: module.name,
		description: module.description,

		family: 0,
		profile: 0,

		address: undefined,

		settings: {},

		units: [],
	}));

	if (foundModules.length <= 0) return <div></div>;

	return (
		<div className={`grid gap-6 ${foundAvailableModules.length > 0 || infrastructureModules.length > 0 ? 'grid-cols-[320px_1fr]' : 'grid-cols-1'}`}>
			<div className='space-y-6'>
				{foundAvailableModules.length > 0 && <ModulePalette title='Discovered Modules' modules={foundAvailableModules} onAdd={addModule} />}

				{infrastructureModules.length > 0 && <ModulePalette title='Infrastructure' modules={infrastructureModules} onAdd={addModule} />}
			</div>

			<div
				className='rounded-3xl p-6'
				style={{
					background: 'var(--container)',
					border: '1px solid var(--border)',
				}}>
				<div className='flex items-center gap-3 mb-8'>
					<Cable size={22} />

					<div>
						<div className='font-semibold'>CAN Bus Topology</div>

						<div className='text-sm text-zinc-500'>Drag modules into order</div>
					</div>
				</div>

				<div className='flex flex-col items-center'>
					<div className='h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold'>IN</div>

					<Reorder.Group axis='y' values={topology} onReorder={setTopology} className='w-full mt-6 space-y-6'>
						{topology.map((module, i) => (
							<Reorder.Item key={module.instanceId + i} value={module}>
								<div className='flex flex-col items-center'>
									<div className='w-1 h-10 bg-zinc-300 dark:bg-zinc-700' />

									<div className='w-full max-w-5xl'>
										<div
											onClick={() => toggleExpanded(module.instanceId)}
											className='rounded-3xl overflow-hidden cursor-pointer'
											style={{
												background: 'var(--container)',
												border: '1px solid var(--border)',
											}}>
											<div className='p-5'>
												<div className='flex items-start justify-between'>
													<div className='flex-1'>
														<div className='flex justify-center mb-4'>
															<img
																draggable={false}
																src={`/modules/${module.moduleId}/drawing.svg`}
																alt={module.name}
																className='max-h-48 object-contain'
																onError={(e) => {
																	const placeholder = document.createElement('div');

																	placeholder.className = 'w-full h-40 rounded-xl border border-dashed flex items-center justify-center text-sm text-zinc-500';

																	placeholder.innerText = 'No image available';

																	e.currentTarget.parentElement?.replaceChild(placeholder, e.currentTarget);
																}}
															/>
														</div>

														<div className='text-center'>
															<div className='font-semibold text-lg'>{module.name}</div>

															{module.label && <div className='text-sm text-zinc-500'>{module.label}</div>}

															<div className='text-xs text-zinc-500 mt-1'>
																Address {module.address ?? '-'}
																{' • '}
																Family {module.family ?? '-'}
																{' • '}
																Profile {module.profile ?? '-'}
															</div>
														</div>
													</div>

													<button onClick={() => removeModule(module.instanceId)} className='h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center'>
														<Trash2 size={14} />
													</button>
												</div>

												{expanded.includes(module.instanceId) && module.units.length > 0 && (
													<div className='mt-5 border-t pt-4'>
														{expanded.includes(module.instanceId) && (
															<div className='grid md:grid-cols-2 gap-2 mt-4'>
																{module.units.map((unit, i) => (
																	<div key={`${unit.type}-${unit.id}-${unit.channel}-${i}`} className='rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3'>
																		<div className='font-medium text-sm'>
																			#{unit.id} - {unit.name}
																		</div>

																		<div className='text-xs text-zinc-500 mt-1'></div>

																		<div className='text-xs text-zinc-500 capitalize'>
																			{unit.channel} - {unit.type}
																		</div>
																	</div>
																))}
															</div>
														)}
													</div>
												)}
											</div>
										</div>
									</div>

									<div className='w-1 h-10 bg-zinc-300 dark:bg-zinc-700' />
								</div>
							</Reorder.Item>
						))}
					</Reorder.Group>

					<div className='h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold mt-4'>OUT</div>

					{topology.length === 0 && (
						<div className='mt-16 text-center text-zinc-500'>
							<Plus className='mx-auto mb-2' />

							<div>Add modules from the left</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
