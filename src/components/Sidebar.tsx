/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Folder, FolderArchive, FolderKanban, Home, KeyRound, LogIn, LogOut, Network, Package, Settings, User } from 'lucide-react';
import { HEADER_HEIGHT, SIDEBAR_WIDTH } from '@/lib/layout';
import { signIn, signOut, useSession } from 'next-auth/react';

import Button from './ui/Button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useSidebar } from '../providers/SidebarProvider';

export default function Sidebar() {
	const pathname = usePathname() || '';
	const { open, setOpen, toggle } = useSidebar();
	const { data: session, status } = useSession();
	const { has, loading } = usePermissions();

	const navItems = [
		{ href: '/dashboard', label: 'Home', icon: Home },
		{ href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, permission: 'projects.read' },
		{ href: '/dashboard/files', label: 'Files', icon: Folder, permission: 'files.read' },
		{ href: '/dashboard/procedures', label: 'Procedures', icon: ClipboardList, permission: 'projects.read' },
		{ href: '/dashboard/apps', label: 'Apps', icon: Package, permission: 'applications.read' },
		{ href: '/dashboard/passwords', label: 'Passwords', icon: KeyRound, permission: 'passwords.read' },
		{ href: '/dashboard/workspace', label: 'Workspace', icon: FolderArchive, permission: 'files.read' },
		{ href: '/dashboard/events', label: 'Events', icon: Network, permission: 'events.read' },
		{ href: '/dashboard/settings', label: 'Settings', icon: Settings, permission: 'admin.read' },
	];

	const visibleItems = navItems.filter((item) => !item.permission || has(item.permission as any));

	if (!session && status !== 'loading') {
		setOpen(false);
		return null;
	}

	if (loading) return null;

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
						className='fixed left-0 right-0 bottom-0 z-40 md:hidden backdrop-blur-md'
						style={{
							top: HEADER_HEIGHT,
							background: 'rgba(0,0,0,0.18)',
						}}
					/>

					{/* Sidebar */}
					<motion.aside
						initial={{ x: -SIDEBAR_WIDTH }}
						animate={{ x: 0 }}
						exit={{ x: -SIDEBAR_WIDTH }}
						transition={{ duration: 0.25 }}
						className='fixed left-0 z-50 p-4 flex flex-col backdrop-blur-xl'
						style={{
							width: SIDEBAR_WIDTH,
							top: HEADER_HEIGHT,
							height: `calc(100dvh - ${HEADER_HEIGHT}px)`,
							background: 'color-mix(in srgb, var(--foreground) 92%, transparent)',
						}}>
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
						<div className='relative pt-6 space-y-3'>
							<div
								className='absolute top-0 left-0 right-0 h-px'
								style={{
									background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent)',
								}}
							/>

							{session ? (
								<>
									{/* User Info */}
									<div className='flex items-center gap-3 px-2'>
										<div
											className='w-10 h-10 rounded-xl flex items-center justify-center font-semibold'
											style={{
												background: 'color-mix(in srgb, var(--accent) 20%, var(--foreground))',
												color: 'var(--accent)',
											}}>
											{session.user?.name?.[0] ?? session.user?.email?.[0]}
										</div>

										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate'>{session.user?.name ?? 'Account'}</p>
											<p className='text-xs text-zinc-500 dark:text-zinc-400 truncate'>{session.user?.email}</p>
										</div>
									</div>

									{/* Account Button */}
									<Link href='/account'>
										<Button className='w-full flex justify-start' variant='ghost'>
											<User size={16} strokeWidth={1.8} />
											Account
										</Button>
									</Link>

									{/* Logout */}
									<Button className='w-full flex justify-start' variant='danger-ghost' onClick={() => signOut()}>
										<LogOut size={16} strokeWidth={1.8} />
										Log out
									</Button>
								</>
							) : (
								<Button onClick={() => signIn()}>
									<LogIn size={16} strokeWidth={1.8} />
									Login
								</Button>
							)}
						</div>

						<div
							className='absolute top-0 right-0 h-full w-px pointer-events-none'
							style={{
								background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 40%, transparent), transparent)',
							}}
						/>
					</motion.aside>
				</>
			)}
		</AnimatePresence>
	);
}

function NavItem({ href, label, Icon, currentPath }: { href: string; label: string; Icon: React.ElementType; currentPath: string }) {
	const isActive = href === '/dashboard' ? currentPath === '/dashboard' : currentPath.startsWith(href);

	return (
		<li className='relative'>
			<Link
				href={href}
				style={
					isActive
						? {
								background: 'color-mix(in srgb, var(--accent) 15%, var(--foreground))',
								color: 'var(--accent)',
								boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 12%, transparent)',
							}
						: undefined
				}
				className='group flex items-center gap-3 h-10 px-3 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-1
'>
				{isActive && (
					<motion.div
						layoutId='sidebar-active'
						className='absolute left-0 top-1 bottom-1 w-1 rounded-r-full'
						style={{
							background: 'var(--accent)',
						}}
					/>
				)}

				<Icon
					size={16}
					strokeWidth={1.8}
					className={`
						${isActive ? 'text-(--accent)' : 'text-(--text-muted)'}
					`}
				/>

				{label}
			</Link>
		</li>
	);
}
