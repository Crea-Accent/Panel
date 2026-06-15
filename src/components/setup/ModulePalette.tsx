/** @format */
'use client';

import { ModuleInstance } from './ModuleBuilder';
import { Plus } from 'lucide-react';

type Props = {
	modules: ModuleInstance[];
	onAdd: (module: ModuleInstance) => void;
};

export default function ModulePalette({ modules, onAdd }: Props) {
	return (
		<div
			className='rounded-3xl p-4'
			style={{
				background: 'var(--container)',
				border: '1px solid var(--border)',
			}}>
			<div className='font-semibold mb-4'>Discovered Modules</div>

			<div className='space-y-3'>
				{modules.map((module) => (
					<button
						key={module.instanceId}
						onClick={() => onAdd(module)}
						className='w-full text-left p-4 rounded-2xl border hover:scale-[1.01] transition'
						style={{
							borderColor: 'var(--border)',
						}}>
						<div className='flex justify-between items-center gap-3'>
							<div className='min-w-0'>
								<div className='font-medium'>{module.name}</div>

								<div className='text-xs text-zinc-500 truncate'>{module.label}</div>

								<div className='text-xs text-zinc-500'>
									Address {module.address} • Family {module.family} • Profile {module.profile}
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
