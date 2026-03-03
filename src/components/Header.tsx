/** @format */

'use client';

import { HEADER_HEIGHT } from '@/lib/layout';
import Image from 'next/image';
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
				border-b border-gray-200 dark:border-zinc-800
				backdrop-blur supports-[backdrop-filter]:bg-white/80
				dark:supports-[backdrop-filter]:bg-zinc-950/80
			'>
			<div className='flex items-center h-full px-4 md:px-6 relative'>
				{/* Sidebar Toggle */}
				<button
					onClick={toggle}
					className='
						h-10 w-10
						flex items-center justify-center
						rounded-xl
						border border-gray-200 dark:border-zinc-700
						bg-white dark:bg-zinc-900
						text-gray-600 dark:text-zinc-300
						hover:bg-gray-50 dark:hover:bg-zinc-800
						transition-colors
					'>
					<Menu className='w-5 h-5' strokeWidth={1.8} />
				</button>

				{/* Logo */}
				<div
					className='
						absolute left-1/2 -translate-x-1/2
						md:static md:translate-x-0
						md:ml-4
					'>
					<Image src='/Crea-Accent-Logo.png' alt='Crea Accent Logo' width={110} height={40} className='object-contain p-4' priority />
				</div>

				{/* Spacer for desktop alignment */}
				<div className='hidden md:block flex-1' />
			</div>
		</header>
	);
}
