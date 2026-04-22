/** @format */
'use client';

import { HardDrive, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

type AppsSettings = {
	path?: string;
};

export default function AppsSettings() {
	const [settings, setSettings] = useState<AppsSettings>({
		path: '',
	});

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		async function load() {
			const res = await fetch('/api/settings/apps');
			const data = await res.json();

			setSettings({
				path: '',
				...data,
			});

			setLoading(false);
		}

		load();
	}, []);

	async function save() {
		setSaving(true);

		await fetch('/api/settings/apps', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(settings),
		});

		setTimeout(() => setSaving(false), 600);
	}

	if (loading) return <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading…</div>;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Apps</h2>
				<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Configure where installer files are stored.</p>
			</div>

			{/* Card */}
			<motion.div
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.2 }}
				className='
					bg-white dark:bg-zinc-900
					border border-gray-200 dark:border-zinc-800
					rounded-2xl
					shadow-sm
					p-6
					space-y-5
				'>
				<div className='flex items-center gap-3'>
					<div className='h-9 w-9 rounded-xl bg-(--active-accent) dark:bg-(--accent)/10 flex items-center justify-center'>
						<HardDrive className='w-4 h-4 text-(--accent) dark:text-(--accent)' strokeWidth={1.8} />
					</div>
					<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Location</h3>
				</div>

				<input
					className='
						h-10 w-full
						rounded-xl
						border border-gray-200 dark:border-zinc-700
						bg-white dark:bg-zinc-800
						px-4 text-sm
						text-gray-900 dark:text-zinc-100
						placeholder:text-gray-400 dark:placeholder:text-zinc-500
						focus:outline-none
						focus:ring-2 focus:ring-(--accent)/20
						focus:border-(--accent)
						transition
					'
					placeholder='C:/Installers'
					value={settings.path || ''}
					onChange={(e) =>
						setSettings({
							...settings,
							path: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500 dark:text-zinc-500'>This folder will be scanned for setup files (.exe, .msi, etc).</p>

				<div className='pt-2'>
					<button
						onClick={save}
						className='
							h-10 px-4
							rounded-xl
							bg-(--accent)
							text-white
							text-sm font-medium
							flex items-center gap-2
							hover:bg-(--hover-accent)
							transition
							disabled:opacity-60
						'
						disabled={saving}>
						<Save className='w-4 h-4' />
						{saving ? 'Saving…' : 'Save Changes'}
					</button>
				</div>
			</motion.div>
		</div>
	);
}
