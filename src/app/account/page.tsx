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

	/* ---------------- THEME ---------------- */

	function updateTheme(next: 'light' | 'dark' | 'system') {
		setTheme(next); // Provider handles persistence
	}

	/* ---------------- PASSWORD ---------------- */

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
		<div className='max-w-3xl space-y-8'>
			{/* Account Info */}
			<motion.div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-3'>
					<User className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
					<h1 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Account</h1>
				</div>

				<div className='text-sm space-y-2 text-gray-700 dark:text-zinc-300'>
					<p>
						<strong className='text-gray-900 dark:text-zinc-100'>Name:</strong> {session.user?.name}
					</p>
					<p>
						<strong className='text-gray-900 dark:text-zinc-100'>Email:</strong> {session.user?.email}
					</p>
				</div>
			</motion.div>

			{/* Theme */}
			<motion.div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-3'>
					<Moon className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Appearance</h2>
				</div>

				<div className='flex gap-2'>
					{(['light', 'dark', 'system'] as const).map((t) => (
						<button
							key={t}
							onClick={() => updateTheme(t)}
							className={`h-9 px-4 rounded-xl text-sm capitalize transition ${
								theme === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
							}`}>
							{t}
						</button>
					))}
				</div>
			</motion.div>

			{/* Change Password */}
			<motion.div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-3'>
					<Lock className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Change Password</h2>
				</div>

				<input
					type='password'
					placeholder='Current password'
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
					className='w-full h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition'
				/>

				<input
					type='password'
					placeholder='New password'
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					className='w-full h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition'
				/>

				<button
					onClick={changePassword}
					disabled={saving}
					className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition'>
					{saving ? 'Saving...' : 'Update Password'}
				</button>

				{message && <p className='text-sm text-gray-500 dark:text-zinc-400'>{message}</p>}
			</motion.div>
		</div>
	);
}
