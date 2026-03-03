/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Folder, FolderKanban, Home, KeyRound, LogIn, LogOut, Package, Settings, User } from 'lucide-react';
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/layout';
import { signIn, signOut, useSession } from 'next-auth/react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useSidebar } from '../providers/SidebarProvider';

export default function Sidebar() {
	const pathname = usePathname();
	const { open, toggle } = useSidebar();
	const { data: session } = useSession();
	const { has, loading } = usePermissions();

	if (loading) return null;

	const navItems = [
		{ href: '/', label: 'Home', icon: Home, permission: null },
		{ href: '/projects', label: 'Projects', icon: FolderKanban, permission: 'projects.read' },
		{ href: '/files', label: 'Files', icon: Folder, permission: 'files.read' },
		{ href: '/apps', label: 'Apps', icon: Package, permission: 'applications.read' },
		{ href: '/passwords', label: 'Passwords', icon: KeyRound, permission: 'admin.read' },
		{ href: '/settings', label: 'Settings', icon: Settings, permission: 'admin.read' },
	];

	const visibleItems = navItems.filter((item) => (!item.permission ? true : has(item.permission)));

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Mobile Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={toggle}
						style={{ top: HEADER_HEIGHT }}
						className='
							fixed left-0 right-0 bottom-0
							bg-black/20
							backdrop-blur-sm
							z-40
							md:hidden
						'
					/>

					{/* Sidebar */}
					<motion.aside
						initial={{ x: -SIDEBAR_WIDTH }}
						animate={{ x: 0 }}
						exit={{ x: -SIDEBAR_WIDTH }}
						transition={{ duration: 0.25 }}
						style={{
							width: SIDEBAR_WIDTH,
							top: HEADER_HEIGHT,
							height: `calc(100dvh - ${HEADER_HEIGHT}px)`,
						}}
						className='
							fixed left-0
							bg-white dark:bg-zinc-950
							border-r border-gray-200 dark:border-zinc-800
							p-4
							flex flex-col
							z-50
						'>
						{/* Navigation */}
						<nav>
							<ul className='space-y-1'>
								{visibleItems.map((item) => (
									<NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} currentPath={pathname} />
								))}
							</ul>
						</nav>

						<div className='flex-1' />

						{/* Account Section */}
						<div className='border-t border-gray-200 dark:border-zinc-800 pt-4 space-y-3'>
							{session ? (
								<>
									{/* User Info */}
									<div className='flex items-center gap-3 px-2'>
										<div className='w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-semibold'>
											{session.user?.name?.[0] ?? session.user?.email?.[0]}
										</div>

										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-gray-900 dark:text-zinc-100 truncate'>{session.user?.name ?? 'Account'}</p>
											<p className='text-xs text-gray-500 dark:text-zinc-400 truncate'>{session.user?.email}</p>
										</div>
									</div>

									{/* Account Button */}
									<Link
										href='/account'
										className='
											h-9 px-3 rounded-xl
											flex items-center gap-2
											text-sm
											text-gray-600 dark:text-zinc-300
											hover:bg-gray-100 dark:hover:bg-zinc-800
											transition
										'>
										<User className='w-4 h-4' strokeWidth={1.8} />
										Account
									</Link>

									{/* Logout */}
									<button
										onClick={() => signOut()}
										className='
											h-9 px-3 rounded-xl
											flex items-center gap-2
											text-sm
											text-red-600
											hover:bg-red-50 dark:hover:bg-red-900/20
											transition
										'>
										<LogOut className='w-4 h-4' strokeWidth={1.8} />
										Log out
									</button>
								</>
							) : (
								<button
									onClick={() => signIn()}
									className='
										w-full
										h-10
										flex items-center gap-2
										px-3
										rounded-xl
										bg-indigo-600 text-white
										text-sm font-medium
										hover:bg-indigo-500
										transition-colors
									'>
									<LogIn className='w-4 h-4' strokeWidth={1.8} />
									Login
								</button>
							)}
						</div>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
}

function NavItem({ href, label, Icon, currentPath }: { href: string; label: string; Icon: React.ElementType; currentPath: string }) {
	const isActive = href === '/' ? currentPath === '/' : currentPath.startsWith(href);

	return (
		<li>
			<Link
				href={href}
				className={`
					group
					flex items-center gap-3
					h-10
					px-3
					rounded-xl
					text-sm font-medium
					transition-colors
					${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}
				`}>
				<Icon
					className={`
						w-4 h-4
						${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 group-hover:text-gray-600 dark:text-zinc-500'}
					`}
					strokeWidth={1.8}
				/>
				{label}
			</Link>
		</li>
	);
}
