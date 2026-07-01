/** @format */
'use client';

import { ReactNode } from 'react';

type Props = {
	children: ReactNode;
	color?: string;
	dot?: boolean;
};

export default function Badge({ children, color = 'var(--accent)', dot = false }: Props) {
	return (
		<span
			className='
				inline-flex items-center gap-2
				h-7
				px-3
				rounded-full
				text-xs
				font-medium
				select-none
				whitespace-nowrap
				shadow-sm
				transition-colors
			'
			style={{
				backgroundColor: color,
				color: 'white',
			}}>
			{dot && <span className='size-2 rounded-full bg-white/90 shrink-0' />}

			{children}
		</span>
	);
}
