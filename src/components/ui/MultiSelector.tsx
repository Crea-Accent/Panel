/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';

import Button from './Button';
import { ChevronDown } from 'lucide-react';

type Option = {
	label: string;
	value: string;
	color?: string;
};

type Props = {
	label?: string;
	value: string[];
	options: Option[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	className?: string;
};

export default function MultiSelector({ value, options, onChange, placeholder = 'Select', className, label }: Props) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (!ref.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	function toggle(option: string) {
		if (value.includes(option)) {
			onChange(value.filter((x) => x !== option));
			return;
		}

		onChange([...value, option]);
	}

	function displayValue() {
		if (value.length === 0) {
			return placeholder;
		}

		if (value.length === 1) {
			const selected = options.find((x) => x.value === value[0]);
			return selected?.label ?? placeholder;
		}

		if (value.length === 2) {
			return value
				.map((v) => options.find((x) => x.value === v)?.label)
				.filter(Boolean)
				.join(', ');
		}

		return `${value.length} labels`;
	}

	return (
		<div ref={ref} className={`relative min-w-[220px] ${className ?? ''}`}>
			{label && <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>{label}</label>}

			<Button type='button' onClick={() => setOpen((v) => !v)} className='w-full justify-start'>
				<div className='flex items-center gap-2 overflow-hidden'>
					{value.length > 0 && (
						<div className='flex -space-x-1'>
							{value.slice(0, 3).map((selectedValue) => {
								const option = options.find((x) => x.value === selectedValue);

								return (
									<div
										key={selectedValue}
										style={{
											width: 12,
											height: 12,
											border: '2px solid rgb(255 255 255 / 0.75)',
											borderRadius: 999,
											background: option?.color ?? 'var(--accent)',
										}}
									/>
								);
							})}
						</div>
					)}

					<span className='truncate'>{displayValue()}</span>
				</div>

				<ChevronDown
					size={16}
					className='ml-auto shrink-0'
					style={{
						transform: open ? 'rotate(180deg)' : undefined,
						transition: 'transform 0.15s',
					}}
				/>
			</Button>

			{open && (
				<div
					className='absolute z-50 mt-2 w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
					style={{
						border: '1px solid var(--border)',
						boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
					}}>
					<div
						style={{
							maxHeight: 280,
							overflowY: 'auto',
						}}>
						{options.map((option) => {
							const selected = value.includes(option.value);

							return (
								<Button
									key={option.value}
									type='button'
									variant={selected ? 'primary' : 'secondary'}
									onClick={() => toggle(option.value)}
									className='w-full px-3 py-2.5 text-left text-sm flex items-center justify-start transition '>
									<div className='flex items-center gap-3 '>
										<div
											style={{
												width: 10,
												height: 10,
												borderRadius: 999,
												background: option.color ?? 'var(--accent)',
											}}
										/>

										<span>{option.label}</span>
									</div>
								</Button>
							);
						})}

						{options.length === 0 && (
							<div
								className='px-3 py-3 text-sm'
								style={{
									color: 'var(--text-muted)',
								}}>
								No options
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
