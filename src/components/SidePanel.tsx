/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useStatus } from '@/providers/StatusProvider';

export default function SidePanel() {
	const { users } = useStatus();

	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const filtered = useMemo(() => {
		const q = search.toLowerCase();

		const priority = {
			online: 0,
			idle: 1,
			offline: 2,
		};

		return [...users]
			.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
			.sort((a, b) => {
				const diff = priority[a.presence.status] - priority[b.presence.status];

				if (diff !== 0) return diff;

				return a.name.localeCompare(b.name);
			});
	}, [users, search]);

	const online = users.filter((u) => u.presence.status === 'online').length;

	function statusColor(status: string) {
		switch (status) {
			case 'online':
				return '#22c55e';

			case 'idle':
				return '#eab308';

			default:
				return '#71717a';
		}
	}

	function lastSeen(lastSeen: string | null) {
		if (!lastSeen) return 'Offline';

		const minutes = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;

		const hours = Math.floor(minutes / 60);

		if (hours < 24) return `${hours}h ago`;

		const days = Math.floor(hours / 24);

		return `${days}d ago`;
	}

	return (
		<>
			{/* Floating Button */}

			<div className='fixed bottom-6 right-6 z-[9998]'>
				<Button size='lg' onClick={() => setOpen((x) => !x)} icon={open ? <X size={18} /> : <Users size={18} />}>
					{open ? null : online}
				</Button>
			</div>

			{/* Backdrop */}

			<AnimatePresence>
				{open && (
					<>
						<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className='fixed inset-0 z-[9997] bg-black/20 backdrop-blur-sm' />

						<motion.aside
							initial={{ x: 460 }}
							animate={{ x: 0 }}
							exit={{ x: 460 }}
							transition={{
								type: 'spring',
								stiffness: 350,
								damping: 32,
							}}
							className='fixed right-0 top-0 bottom-0 z-[9998] w-[420px] bg-(--background) border-l border-(--border)/10 shadow-2xl'>
							<div className='flex flex-col h-full'>
								{/* Header */}

								<div className='p-6 border-b border-(--border)/10'>
									<h2 className='text-xl font-semibold'>Contacts</h2>
								</div>

								{/* Controls */}

								<div className='p-6 space-y-4'>
									<Input placeholder='Search users...' value={search} onChange={(e) => setSearch(e.target.value)} />
								</div>

								{/* Users */}

								<div className='flex-1 overflow-y-auto'>
									{filtered.map((user) => (
										<button
											key={user.id}
											className='
				w-full
				px-6
				py-4
				flex
				items-center
				gap-4
				text-left
				hover:bg-(--foreground)
				transition
			'>
											<div
												className='
					h-11
					w-11
					shrink-0
					rounded-full
					bg-(--accent)/15
					text-(--accent)
					font-semibold
					flex
					items-center
					justify-center
				'>
												{user.name?.[0]?.toUpperCase()}
											</div>

											<div className='flex-1 min-w-0'>
												<div className='font-medium truncate'>{user.name}</div>

												<div className='text-sm text-(--text-muted) truncate'>
													{user.presence.status === 'offline'
														? `Last seen ${lastSeen(user.presence.lastSeen)}`
														: String(user.presence.project ?? user.presence.page ?? 'Online')
																.split('/')
																.map((p) => <span className='capitalize'>{p}</span>)
																.join(' - ')}
												</div>
											</div>

											{user.presence.status === 'offline' ? (
												<div className='text-xs text-(--text-muted)'>{lastSeen(user.presence.lastSeen)}</div>
											) : (
												<div
													className='h-3 w-3 rounded-full'
													style={{
														background: user.presence.status === 'online' ? '#22c55e' : '#eab308',
													}}
												/>
											)}
										</button>
									))}
								</div>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
