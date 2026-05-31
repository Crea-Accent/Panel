/** @format */
'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';

type ButtonSize = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: ReactNode;
	loading?: boolean;
};

export default function Button({ children, variant = 'primary', size = 'md', icon, loading = false, className = '', disabled, ...props }: Props) {
	const variants: Record<ButtonVariant, string> = {
		'primary': `
			bg-(--accent)
			text-white
			hover:bg-(--hover-accent)
		`,
		'secondary': `
			bg-white dark:bg-zinc-900
			border border-zinc-200 dark:border-zinc-800
			text-zinc-900 dark:text-zinc-100
			hover:bg-zinc-50 dark:hover:bg-zinc-800
		`,
		'ghost': `
			text-zinc-700 dark:text-zinc-300
			hover:bg-zinc-100 dark:hover:bg-zinc-800
		`,
		'danger': `
			bg-red-600
			text-white
			hover:bg-red-700
		`,
		'danger-ghost': `text-red-600
			hover:text-white
			hover:bg-red-700`,
	};

	const sizes: Record<ButtonSize, string> = {
		sm: 'h-8 px-3 text-xs rounded-lg',
		md: 'h-10 px-4 text-sm rounded-xl',
		lg: 'h-11 px-5 text-sm rounded-xl',
	};

	return (
		<button
			disabled={disabled || loading}
			className={`
				inline-flex items-center justify-center gap-2
				font-medium
				transition-all duration-200
				active:scale-[0.98]
				disabled:opacity-50
				disabled:pointer-events-none

				${sizes[size]}
				${variants[variant]}
				${className}
			`}
			{...props}>
			{loading ? <div className='h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin' /> : icon}

			{children}
		</button>
	);
}
