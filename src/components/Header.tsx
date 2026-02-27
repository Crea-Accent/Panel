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
			style={{
				height: HEADER_HEIGHT,
				borderBottom: '1px solid #ddd',
				position: 'sticky',
				top: 0,
				background: '#fff',
			}}
			className='flex items-center px-4'>
			{/* Left side: menu + logo container */}
			<div className='flex items-center gap-4 w-full md:w-auto'>
				<button onClick={toggle} className='bg-transparent border-none p-1 text-zinc-800'>
					<Menu size={20} />
				</button>

				<div className='flex-1 md:flex-none flex justify-center md:justify-start'>
					<Image src='/Crea-Accent-Logo.png' alt='Crea Accent Logo' width={100} height={40} className='object-contain' priority />
				</div>
			</div>

			{/* Desktop spacer so logo stays left */}
			<div className='hidden md:block flex-1' />
		</header>
	);
}
