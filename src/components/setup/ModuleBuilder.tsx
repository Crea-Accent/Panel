/** @format */
'use client';

import { Cable, Plus, Trash2 } from 'lucide-react';
import powersupply from '@/../public/modules/PowerSupply/module.json' with { type: 'json' };

import ModuleCard from './ModuleCard';
import ModulePalette from './ModulePalette';
import { Reorder } from 'framer-motion';

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

	units: {
		id: number;
		channel: number;
		name: string;
		type: 'temperature' | 'virtual' | 'input' | 'relay' | 'dimmer';
	}[];

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

	const availableModules = [
		...foundModules.filter((found) => !topology.some((placed) => placed.address === found.address)),

		{
			instanceId: crypto.randomUUID(),
			moduleId: powersupply.id,

			name: powersupply.name,
			description: powersupply.description,

			family: 0,
			profile: 0,

			address: undefined,

			settings: {},

			units: [],
		},
	];

	return (
		<div className={`grid gap-6 ${availableModules.length > 0 ? 'grid-cols-[320px_1fr]' : 'grid-cols-1'}`}>
			{availableModules.length > 0 && <ModulePalette modules={availableModules} onAdd={addModule} />}

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
											className='rounded-3xl overflow-hidden'
											style={{
												background: 'var(--container)',
												border: '1px solid var(--border)',
											}}>
											<div className='p-5'>
												<div className='flex items-start justify-between'>
													<div>
														<div className='font-semibold text-lg'>{module.name}</div>

														<div className='text-sm text-zinc-500'>{module.label}</div>

														<div className='text-xs text-zinc-500 mt-1'>
															Family: {module.family ?? '-'} | Address: {module.address ?? '-'} | Profile: {module.profile ?? '-'}
														</div>
													</div>

													<div className='flex items-center gap-2'>
														<div className='text-xs px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800'>{module.settings?.type ?? 'Unknown'}</div>

														<button onClick={() => removeModule(module.instanceId)} className='h-8 w-8 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center justify-center'>
															<Trash2 size={14} />
														</button>
													</div>
												</div>

												{module.units.length > 0 && (
													<div className='mt-5'>
														<div className='font-medium mb-3'>Units</div>

														<div className='grid md:grid-cols-2 gap-2'>
															{module.units.map((unit, i) => (
																<div key={`${unit.type}-${unit.id}-${unit.channel}-${i}`} className='rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3'>
																	<div className='font-medium text-sm'>{unit.name}</div>

																	<div className='text-xs text-zinc-500 mt-1'>Address #{unit.id}</div>

																	<div className='text-xs text-zinc-500'>Channel {unit.channel}</div>

																	<div className='text-xs text-zinc-500 capitalize'>{unit.type}</div>
																</div>
															))}
														</div>
													</div>
												)}

												{module.settings?.room && (
													<div className='mt-4 text-sm'>
														<span className='font-medium'>Room:</span> {module.settings.room}
													</div>
												)}

												{module.rawStrings?.length ? (
													<details className='mt-4'>
														<summary className='cursor-pointer text-sm text-zinc-500'>Raw DUO Data</summary>

														<div className='mt-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 text-xs font-mono overflow-auto'>
															{module.rawStrings.map((x, index) => (
																<div key={index}>{x}</div>
															))}
														</div>
													</details>
												) : null}
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
