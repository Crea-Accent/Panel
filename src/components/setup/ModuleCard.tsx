/** @format */
'use client';

import { ArrowLeft, ArrowRight, ChevronDown, Trash2 } from 'lucide-react';

import { ModuleInstance } from './ModuleBuilder';
import { useState } from 'react';

type Props = {
	module: ModuleInstance;
	onDelete?: () => void;
	onChange?: (module: ModuleInstance) => void;
};

export default function ModuleCard({ module, onDelete, onChange }: Props) {
	const [showLogic, setShowLogic] = useState(false);
	const [showRaw, setShowRaw] = useState(false);

	function update(patch: Partial<ModuleInstance>) {
		onChange?.({
			...module,
			...patch,
		});
	}

	return (
		<div
			className='w-full max-w-5xl rounded-3xl overflow-hidden'
			style={{
				background: 'var(--container)',
				border: '1px solid var(--border)',
			}}>
			<div className='p-6'>
				<div className='flex gap-6'>
					<div className='w-72 shrink-0'>
						<div className='rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 aspect-[4/3]'>
							<img
								src={`/modules/${module.moduleId}/drawing.svg`}
								alt={module.name}
								className='w-full h-full object-contain p-2'
								onError={(e) => {
									e.currentTarget.style.display = 'none';
								}}
							/>
						</div>

						<div className='mt-3 text-xs text-zinc-500'>
							<div>Module ID: {module.moduleId}</div>

							<div>Instance: {module.instanceId}</div>
						</div>
					</div>

					<div className='flex-1 min-w-0'>
						<div className='flex items-start justify-between gap-4'>
							<div>
								<div className='font-semibold text-xl'>{module.name}</div>

								{module.description && <div className='text-sm text-zinc-500 mt-1'>{module.description}</div>}
							</div>

							{onDelete && (
								<button onClick={onDelete} className='h-10 w-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500/10 transition'>
									<Trash2 size={16} />
								</button>
							)}
						</div>

						<div className='grid md:grid-cols-3 gap-4 mt-6'>
							<div>
								<div className='text-xs text-zinc-500 mb-1'>Label</div>

								<input
									value={module.label ?? ''}
									onChange={(e) =>
										update({
											label: e.target.value,
										})
									}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-transparent'
								/>
							</div>

							<div>
								<div className='text-xs text-zinc-500 mb-1'>Address</div>

								<input
									type='number'
									value={module.address ?? ''}
									onChange={(e) =>
										update({
											address: Number(e.target.value),
										})
									}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-transparent'
								/>
							</div>

							<div>
								<div className='text-xs text-zinc-500 mb-1'>Location</div>

								<input
									value={module.location ?? ''}
									onChange={(e) =>
										update({
											location: e.target.value,
										})
									}
									className='w-full rounded-xl border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-transparent'
								/>
							</div>
						</div>

						<div className='grid md:grid-cols-2 gap-8 mt-8'>
							<div>
								<div className='font-medium mb-3 flex items-center gap-2'>
									<ArrowLeft size={16} />
									Inputs
								</div>

								<div className='space-y-2'>
									{module.inputs.map((input) => (
										<div key={input.name} className='rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3'>
											<div className='text-sm font-medium'>{input.name}</div>

											{input.description && <div className='text-xs text-zinc-500 mt-1'>{input.description}</div>}
										</div>
									))}
								</div>
							</div>

							<div>
								<div className='font-medium mb-3 flex items-center gap-2'>
									<ArrowRight size={16} />
									Outputs
								</div>

								<div className='space-y-2'>
									{module.outputs.map((output) => (
										<div key={output.name} className='rounded-xl bg-zinc-50 dark:bg-zinc-800 p-3'>
											<div className='text-sm font-medium'>{output.name}</div>

											{output.description && <div className='text-xs text-zinc-500 mt-1'>{output.description}</div>}
										</div>
									))}
								</div>
							</div>
						</div>

						{!!module.logic?.length && (
							<div className='mt-8'>
								<button onClick={() => setShowLogic((v) => !v)} className='flex items-center gap-2 font-medium'>
									<ChevronDown size={16} />
									DUO Logic ({module.logic.length})
								</button>

								{showLogic && (
									<div className='mt-3 space-y-2'>
										{module.logic.map((line) => (
											<div key={line} className='font-mono text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800 p-2'>
												{line}
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{!!module.rawStrings?.length && (
							<div className='mt-6'>
								<button onClick={() => setShowRaw((v) => !v)} className='flex items-center gap-2 font-medium'>
									<ChevronDown size={16} />
									Raw DUO Strings ({module.rawStrings.length})
								</button>

								{showRaw && (
									<div className='mt-3 max-h-72 overflow-auto rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3'>
										<pre className='text-xs whitespace-pre-wrap'>{module.rawStrings.join('\n')}</pre>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
