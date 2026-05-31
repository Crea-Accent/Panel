/** @format */
'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
	error?: string;
	icon?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, Props>(({ label, error, icon, className = '', ...props }, ref) => {
	return (
		<div className='space-y-1.5'>
			{label && <label className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>{label}</label>}

			<div className='relative'>
				{icon && <div className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none'>{icon}</div>}

				<input
					ref={ref}
					{...props}
					className={`
							w-full h-10
							${icon ? 'pl-10' : 'pl-4'}
							pr-4
							rounded-xl
							bg-white dark:bg-zinc-900
							border
							text-sm
							text-zinc-900 dark:text-zinc-100
							placeholder:text-zinc-400 dark:placeholder:text-zinc-500
							focus:outline-none
							focus:ring-2
							transition

							${
								error
									? `
										border-red-500
										focus:ring-red-500/20
									  `
									: `
										border-zinc-200 dark:border-zinc-800
										focus:ring-(--accent)/30
									  `
							}

							${className}
						`}
				/>
			</div>

			{error && <p className='text-xs text-red-500'>{error}</p>}
		</div>
	);
});

Input.displayName = 'Input';

export default Input;
