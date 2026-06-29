/** @format */
'use client';

import { Plus } from 'lucide-react';

type Props = {
	title: string;
	modules: any[];
	onAdd: (module: any) => void;
};

export default function ModulePalette({ modules, onAdd, title }: Props) {
	return (
		<div className='rounded-3xl bg-(--foreground) p-4'>
			<div className='font-semibold mb-4 px-1'>{title}</div>

			<div className='space-y-3'>
				{modules.map((module) => (
					<button
						key={module.instanceId}
						onClick={() => onAdd(module)}
						className='w-full text-left p-4 rounded-3xl	bg-(--background) border border-black/5 dark:border-white/5	hover:scale-[1.01] transition'>
						<div className='flex justify-between items-center gap-3'>
							<div className='min-w-0'>
								<div className='font-medium'>{module.name}</div>

								{module.label && <div className='text-xs text-(--text-muted) truncate'>{module.label}</div>}

								<div className='text-xs text-(--text-muted)'>
									Address {module.address ?? '-'}
									{' • '}
									Family {module.family ?? '-'}
									{' • '}
									Profile {module.profile ?? '-'}
								</div>
							</div>

							<div className='h-10 w-10 rounded-2xl bg-(--accent)/10 flex items-center justify-center shrink-0'>
								<Plus size={16} />
							</div>
						</div>
					</button>
				))}
			</div>
		</div>
	);
}
