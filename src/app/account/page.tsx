/** @format */
'use client';

import { Lock, Moon, User } from 'lucide-react';

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export default function AccountPage() {
	const { data: session } = useSession();
	const { theme, setTheme } = useTheme();

	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (!session) return null;

	function updateTheme(next: 'light' | 'dark' | 'system') {
		setTheme(next);
	}

	async function changePassword() {
		setSaving(true);
		setMessage(null);

		const res = await fetch('/api/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				currentPassword,
				newPassword,
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			setMessage(data.error || 'Failed');
		} else {
			setMessage('Password updated successfully');
			setCurrentPassword('');
			setNewPassword('');
		}

		setSaving(false);
	}

	return (
		<div className='space-y-8'>
			<div className='grid gap-6 md:grid-cols-2'>
				{/* Account Info */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className='
						bg-white dark:bg-zinc-900
						border border-zinc-200 dark:border-zinc-800
						rounded-xl
						p-6
						shadow-sm
						space-y-4
					'>
					<div className='flex items-center gap-3'>
						<User size={18} className='text-indigo-600 dark:text-indigo-400' />
						<h1 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>Account</h1>
					</div>

					<div className='text-sm space-y-2 text-zinc-600 dark:text-zinc-400'>
						<p>
							<strong className='text-zinc-900 dark:text-zinc-100'>Name:</strong> {session.user?.name}
						</p>
						<p>
							<strong className='text-zinc-900 dark:text-zinc-100'>Email:</strong> {session.user?.email}
						</p>
					</div>
				</motion.div>

				{/* Theme */}
				<motion.div
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.05 }}
					className='
						bg-white dark:bg-zinc-900
						border border-zinc-200 dark:border-zinc-800
						rounded-xl
						p-6
						shadow-sm
						space-y-4
					'>
					<div className='flex items-center gap-3'>
						<Moon size={18} className='text-indigo-600 dark:text-indigo-400' />
						<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>Appearance</h2>
					</div>

					<div className='flex gap-2 flex-wrap'>
						{(['light', 'dark', 'system'] as const).map((t) => (
							<button
								key={t}
								onClick={() => updateTheme(t)}
								className={`
									h-9 px-4
									rounded-lg
									text-sm capitalize
									font-medium
									transition-colors
									${theme === t ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}
								`}>
								{t}
							</button>
						))}
					</div>
				</motion.div>
			</div>

			{/* Change Password */}
			<motion.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className='
					bg-white dark:bg-zinc-900
					border border-zinc-200 dark:border-zinc-800
					rounded-xl
					p-6
					shadow-sm
					space-y-4
				'>
				<div className='flex items-center gap-3'>
					<Lock size={18} className='text-indigo-600 dark:text-indigo-400' />
					<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>Change Password</h2>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<input
						type='password'
						placeholder='Current password'
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className='
							w-full h-10 px-3
							rounded-lg
							bg-zinc-50 dark:bg-zinc-900
							border border-zinc-200 dark:border-zinc-800
							text-sm
							text-zinc-900 dark:text-zinc-100
							placeholder:text-zinc-400 dark:placeholder:text-zinc-500
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/30
							transition
						'
					/>

					<input
						type='password'
						placeholder='New password'
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className='
							w-full h-10 px-3
							rounded-lg
							bg-zinc-50 dark:bg-zinc-900
							border border-zinc-200 dark:border-zinc-800
							text-sm
							text-zinc-900 dark:text-zinc-100
							placeholder:text-zinc-400 dark:placeholder:text-zinc-500
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/30
							transition
						'
					/>
				</div>

				<div className='flex items-center gap-4'>
					<button
						onClick={changePassword}
						disabled={saving}
						className='
							h-9 px-4
							rounded-lg
							bg-indigo-600
							text-white
							text-sm font-medium
							hover:bg-indigo-500
							active:scale-[0.98]
							disabled:opacity-60 disabled:cursor-not-allowed
							transition-all
						'>
						{saving ? 'Saving...' : 'Update Password'}
					</button>

					{message && <p className='text-sm text-zinc-500 dark:text-zinc-400'>{message}</p>}
				</div>
			</motion.div>
		</div>
	);
}
