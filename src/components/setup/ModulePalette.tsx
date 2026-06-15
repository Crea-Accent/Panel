/** @format */
'use client';

import { ModuleDefinition } from './ModuleBuilder';
import { Plus } from 'lucide-react';

type Props = {
	modules: ModuleDefinition[];
	onAdd: (module: ModuleDefinition) => void;
};

export default function ModulePalette({ modules, onAdd }: Props) {
	return (
		<div
			className='rounded-3xl p-4'
			style={{
				background: 'var(--container)',
				border: '1px solid var(--border)',
			}}>
			<div className='font-semibold mb-4'>Available Modules</div>

			<div className='space-y-3'>
				{modules.map((module) => (
					<button
						key={module.id}
						onClick={() => onAdd(module)}
						className='
							w-full
							text-left
							p-4
							rounded-2xl
							border
							hover:scale-[1.01]
							transition
						'
						style={{
							borderColor: 'var(--border)',
						}}>
						<div className='flex justify-between items-center'>
							<div>
								<div className='font-medium'>{module.name}</div>

								<div className='text-xs text-zinc-500'>
									{module.inputs.length} inputs • {module.outputs.length} outputs
								</div>
							</div>

							<Plus size={16} />
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
