/** @format */
'use client';

import { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
	children: ReactNode;
};

export default function Card({ children, className = '', ...props }: Props) {
	return (
		<div
			className={`
				bg-white dark:bg-zinc-900
				border border-zinc-200 dark:border-zinc-800
				rounded-xl
				shadow-sm
				${className}
			`}
			{...props}>
			{children}
		</div>
	);
}
