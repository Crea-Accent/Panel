/** @format */
'use client';

type ToggleProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;

	label?: string;
	description?: string;

	disabled?: boolean;
	className?: string;
};

export default function Toggle({ checked, onChange, label, description, disabled = false, className = '' }: ToggleProps) {
	return (
		<button
			type='button'
			role='switch'
			aria-checked={checked}
			disabled={disabled}
			onClick={() => !disabled && onChange(!checked)}
			className={`
				w-full flex items-center justify-between gap-4
				${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
				${className}
			`}>
			<div className='flex flex-col text-left'>
				{label && <span className='text-sm font-medium'>{label}</span>}

				{description && (
					<span
						className='text-xs'
						style={{
							color: 'var(--text-muted)',
						}}>
						{description}
					</span>
				)}
			</div>

			<div
				className='relative shrink-0 transition-all duration-200'
				style={{
					width: 44,
					height: 24,
					borderRadius: 999,
					background: checked ? 'var(--accent)' : 'var(--border)',
				}}>
				<div
					className='absolute top-0.5 transition-all duration-200 bg-white shadow-sm'
					style={{
						left: checked ? 22 : 2,
						width: 20,
						height: 20,
						borderRadius: 999,
					}}
				/>
			</div>
		</button>
	);
}
