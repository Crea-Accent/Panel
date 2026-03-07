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
	const pathname = usePathname() || '';
	const { open, toggle } = useSidebar();
	const { data: session } = useSession();
	const { has, loading } = usePermissions();

	if (loading) return null;

	const navItems = [
		{ href: '/dashboard', label: 'Home', icon: Home },
		{ href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, permission: 'projects.read' },
		{ href: '/dashboard/files', label: 'Files', icon: Folder, permission: 'files.read' },
		{ href: '/dashboard/apps', label: 'Apps', icon: Package, permission: 'applications.read' },
		{ href: '/dashboard/passwords', label: 'Passwords', icon: KeyRound, permission: 'passwords.read' },
		{ href: '/dashboard/settings', label: 'Settings', icon: Settings, permission: 'admin.read' },
	];

	const visibleItems = navItems.filter((item) => !item.permission || has(item.permission));

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
						className='fixed left-0 right-0 bottom-0 bg-black/25 backdrop-blur-sm z-40 md:hidden'
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
							fixed left-0 z-50
							bg-white dark:bg-zinc-950
							border-r border-zinc-200 dark:border-zinc-800
							p-4
							flex flex-col
						'>
						{/* Navigation */}
						<nav>
							<ul className='space-y-1.5'>
								{visibleItems.map((item) => (
									<NavItem key={item.href} href={item.href} label={item.label} Icon={item.icon} currentPath={pathname} />
								))}
							</ul>
						</nav>

						<div className='flex-1' />

						{/* Account Section */}
						<div className='border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3'>
							{session ? (
								<>
									{/* User Info */}
									<div className='flex items-center gap-3 px-2'>
										<div className='w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-sm font-semibold'>
											{session.user?.name?.[0] ?? session.user?.email?.[0]}
										</div>

										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate'>{session.user?.name ?? 'Account'}</p>
											<p className='text-xs text-zinc-500 dark:text-zinc-400 truncate'>{session.user?.email}</p>
										</div>
									</div>

									{/* Account Button */}
									<Link href='/account'>
										<button
											className='
												w-full h-9 px-3 rounded-lg
												flex items-center gap-2
												text-sm
												text-zinc-600 dark:text-zinc-300
												hover:bg-zinc-100 dark:hover:bg-zinc-800
												transition-colors
											'>
											<User size={16} strokeWidth={1.8} />
											Account
										</button>
									</Link>

									{/* Logout */}
									<button
										onClick={() => signOut()}
										className='
											w-full h-9 px-3 rounded-lg
											flex items-center gap-2
											text-sm
											text-red-600
											hover:bg-red-50 dark:hover:bg-red-900/20
											transition-colors
										'>
										<LogOut size={16} strokeWidth={1.8} />
										Log out
									</button>
								</>
							) : (
								<button
									onClick={() => signIn()}
									className='
										w-full h-9
										flex items-center gap-2
										px-3 rounded-lg
										bg-indigo-600 text-white
										text-sm font-medium
										hover:bg-indigo-500
										active:scale-[0.98]
										transition-all
									'>
									<LogIn size={16} strokeWidth={1.8} />
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
	const isActive = href === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(href);

	return (
		<li>
			<Link
				href={href}
				className={`
					group flex items-center gap-3 h-10 px-3
					rounded-lg
					text-sm font-medium
					transition-colors
					${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
				`}>
				<Icon
					size={16}
					strokeWidth={1.8}
					className={`
						${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500'}
					`}
				/>
				{label}
			</Link>
		</li>
	);
}
