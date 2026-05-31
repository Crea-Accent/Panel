/** @format */
'use client';

import { ReactNode } from 'react';

type Props = {
	icon: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
};

export default function PageHeader({ icon, title, description, action }: Props) {
	return (
		<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
			<div className='flex items-center gap-4 min-w-0'>
				<div
					className='
						h-11 w-11
						shrink-0
						rounded-xl
						bg-(--active-accent)
						dark:bg-(--accent)/30
						flex items-center justify-center
						text-(--accent)
					'>
					{icon}
				</div>

				<div className='min-w-0'>
					<h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>{title}</h1>

					{description && <p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>}
				</div>
			</div>

			{action && <div className='shrink-0'>{action}</div>}
		</div>
	);
}
