/** @format */

'use client';

import { HEADER_HEIGHT } from '@/lib/layout';
import Icon from '@/../public/favicon.svg';
import { Menu } from 'lucide-react';
import { useSidebar } from '../providers/SidebarProvider';

export default function Header() {
	const { toggle } = useSidebar();

	return (
		<header
			style={{ height: HEADER_HEIGHT }}
			className='
				sticky top-0 z-40
				bg-white dark:bg-zinc-950
				border-b border-zinc-200 dark:border-zinc-800
				backdrop-blur supports-[backdrop-filter]:bg-white/70
				dark:supports-[backdrop-filter]:bg-zinc-950/70
				transition-colors
			'>
			<div className='flex items-center h-full px-4 md:px-6 relative'>
				{/* Sidebar Toggle */}
				<button
					onClick={toggle}
					className='
						h-10 w-10
						flex items-center justify-center
						rounded-lg
						border border-zinc-200 dark:border-zinc-800
						bg-white dark:bg-zinc-900
						text-zinc-600 dark:text-zinc-300
						hover:bg-zinc-50 dark:hover:bg-zinc-800
						active:scale-[0.97]
						transition-all
					'>
					<Menu size={18} strokeWidth={1.8} />
				</button>

				{/* Logo */}
				<div
					className='
						pointer-events-none
						absolute inset-0
						flex items-center justify-center
						md:relative md:inset-auto md:justify-start md:ml-4
					'>
					<Icon className='h-9 w-auto fill-current text-zinc-900 dark:text-zinc-100' />
				</div>

				{/* Spacer for desktop alignment */}
				<div className='hidden md:block flex-1' />
			</div>
		</header>
	);
}
