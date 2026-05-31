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
				inline-flex items-center gap-1.5
				px-2 py-0.5
				text-xs font-medium
				text-white
				rounded-md
				whitespace-nowrap
			'
			style={{
				backgroundColor: color,
			}}>
			{dot && <span className='w-1.5 h-1.5 rounded-full bg-white/80' />}

			{children}
		</span>
	);
}
