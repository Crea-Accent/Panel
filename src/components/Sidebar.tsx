/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FolderKanban, Home, LogIn, LogOut, Settings } from 'lucide-react';
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/layout';
import { signIn, signOut, useSession } from 'next-auth/react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useSidebar } from '../providers/SidebarProvider';

export default function Sidebar() {
	const pathname = usePathname();
	const { open } = useSidebar();
	const { data: session } = useSession();
	const { has, loading } = usePermissions();

	// Wait for permission state
	if (loading) return null;

	const navItems = [
		{
			href: '/',
			label: 'Home',
			icon: <Home size={18} />,
			permission: null, // always visible
		},
		{
			href: '/projects',
			label: 'Projects',
			icon: <FolderKanban size={18} />,
			permission: 'projects.read',
		},
		{
			href: '/settings',
			label: 'Settings',
			icon: <Settings size={18} />,
			permission: 'admin.read',
		},
	];

	const visibleItems = navItems.filter((item) => {
		if (!item.permission) return true;
		return has(item.permission);
	});

	return (
		<AnimatePresence>
			{open && (
				<motion.aside
					initial={{ x: -SIDEBAR_WIDTH }}
					animate={{ x: 0 }}
					exit={{ x: -SIDEBAR_WIDTH }}
					transition={{ type: 'tween', duration: 0.25 }}
					style={{
						width: SIDEBAR_WIDTH,
						position: 'fixed',
						left: 0,
						top: HEADER_HEIGHT,
						height: `calc(100vh - ${HEADER_HEIGHT}px)`,
					}}
					className='bg-white border-r border-zinc-200 p-4 flex flex-col z-40'>
					{/* Top navigation */}
					<nav>
						<ul className='space-y-2'>
							{visibleItems.map((item) => (
								<NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} currentPath={pathname} />
							))}
						</ul>
					</nav>

					<div className='flex-1' />

					{/* Bottom auth section */}
					<div className='border-t border-zinc-200 pt-3 space-y-2'>
						{session ? (
							<>
								<div className='text-xs text-zinc-500 break-all'>{session.user?.email}</div>

								<button onClick={() => signOut()} className='w-full flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg text-sm hover:bg-zinc-50 transition'>
									<LogOut size={16} />
									Logout
								</button>
							</>
						) : (
							<button onClick={() => signIn()} className='w-full flex items-center gap-2 px-3 py-2 border border-zinc-200 rounded-lg text-sm hover:bg-zinc-50 transition'>
								<LogIn size={16} />
								Login
							</button>
						)}
					</div>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}

function NavItem({ href, icon, label, currentPath }: { href: string; icon: React.ReactNode; label: string; currentPath: string }) {
	const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href);

	return (
		<li>
			<Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-zinc-900 hover:bg-zinc-100'}`}>
				<span className={isActive ? 'text-blue-600' : 'text-zinc-600'}>{icon}</span>
				{label}
			</Link>
		</li>
	);
}
