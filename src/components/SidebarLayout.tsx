/** @format */
'use client';

import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/layout';

import { motion } from 'framer-motion';
import { useSidebar } from './SidebarProvider';

export function SidebarLayout({ children }: { children: React.ReactNode }) {
	const { open } = useSidebar();

	return (
		<motion.main
			animate={{
				// 👉 only push content when we're NOT on mobile
				marginLeft: open && typeof window !== 'undefined' && window.innerWidth >= 768 ? SIDEBAR_WIDTH : 0,
			}}
			transition={{ type: 'tween', duration: 0.25 }}
			style={{
				minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
			}}
			className='px-4 md:px-8 py-6'>
			{children}
		</motion.main>
	);
}
