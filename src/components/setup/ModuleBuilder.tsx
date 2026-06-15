/** @format */
'use client';

import { Cable, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import ModuleCard from './ModuleCard';
import ModulePalette from './ModulePalette';
import { Reorder } from 'framer-motion';

export type ModuleDefinition = {
	id: string;
	name: string;
	description?: string;

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
	location?: string;
	address?: number;

	x?: number;
	y?: number;

	settings: Record<string, any>;

	inputs: {
		name: string;
		description?: string;
	}[];

	outputs: {
		name: string;
		description?: string;
	}[];

	logic?: string[];
	rawStrings?: string[];

	preview?: string;
};

type Props = {
	modules: ModuleInstance[];
	setModules: React.Dispatch<React.SetStateAction<ModuleInstance[]>>;
};

export default function ModuleBuilder({ modules, setModules }: Props) {
	const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);

	useEffect(() => {
		loadModules();
	}, []);

	async function loadModules() {
		try {
			const res = await fetch('/api/projects/modules');
			const data = await res.json();

			setAvailableModules(data.modules ?? []);
		} catch (error) {
			console.error(error);
		}
	}

	function addModule(module: ModuleDefinition) {
		setModules((prev) => [
			...prev,
			{
				instanceId: crypto.randomUUID(),
				moduleId: module.id,

				name: module.name,
				description: module.description,

				label: '',
				location: '',
				address: undefined,

				x: 0,
				y: 0,

				settings: {},

				inputs: structuredClone(module.inputs),
				outputs: structuredClone(module.outputs),

				preview: module.preview,
			},
		]);
	}

	return (
		<div className='grid grid-cols-[320px_1fr] gap-6'>
			<ModulePalette modules={availableModules} onAdd={addModule} />

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

					<Reorder.Group axis='y' values={modules} onReorder={setModules} className='w-full mt-6 space-y-6'>
						{modules.map((module) => (
							<Reorder.Item key={module.instanceId} value={module}>
								<div className='flex flex-col items-center'>
									<div className='w-1 h-10 bg-zinc-300 dark:bg-zinc-700' />

									<ModuleCard
										module={module}
										onDelete={() => setModules((prev) => prev.filter((x) => x.instanceId !== module.instanceId))}
										onChange={(updated) => setModules((prev) => prev.map((x) => (x.instanceId === updated.instanceId ? updated : x)))}
									/>

									<div className='w-1 h-10 bg-zinc-300 dark:bg-zinc-700' />
								</div>
							</Reorder.Item>
						))}
					</Reorder.Group>

					<div className='h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold mt-4'>OUT</div>

					{modules.length === 0 && (
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
