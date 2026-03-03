/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Folder, HardDrive, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ProjectsSettings = {
	path?: string;
	requiredFolders?: string[];
	dateFormat?: string;
};

export default function ProjectsSettings() {
	const [settings, setSettings] = useState<ProjectsSettings>({
		path: '',
		requiredFolders: [],
		dateFormat: 'DDMMYYYY',
	});

	const [newFolder, setNewFolder] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [dateParts, setDateParts] = useState<string[]>(['DD', 'MM', 'YYYY']);
	const [dragIndex, setDragIndex] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			const res = await fetch('/api/settings/projects');
			const data = await res.json();

			const merged = {
				path: '',
				requiredFolders: [],
				dateFormat: 'DDMMYYYY',
				...data,
			};

			setSettings(merged);

			if (merged.dateFormat) {
				const parts = ['DD', 'MM', 'YYYY'].sort((a, b) => merged.dateFormat!.indexOf(a) - merged.dateFormat!.indexOf(b));
				setDateParts(parts);
			}

			setLoading(false);
		}

		load();
	}, []);

	function handleDrop(index: number) {
		if (dragIndex === null) return;

		const next = [...dateParts];
		const [moved] = next.splice(dragIndex, 1);
		next.splice(index, 0, moved);

		setDateParts(next);
		setDragIndex(null);
	}

	async function save() {
		setSaving(true);

		const updated = {
			...settings,
			dateFormat: dateParts.join(''),
		};

		await fetch('/api/settings/projects', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updated),
		});

		setTimeout(() => setSaving(false), 600);
	}

	function addFolder() {
		if (!newFolder.trim()) return;

		setSettings({
			...settings,
			requiredFolders: [...(settings.requiredFolders || []), newFolder.trim()],
		});

		setNewFolder('');
	}

	function removeFolder(name: string) {
		setSettings({
			...settings,
			requiredFolders: settings.requiredFolders?.filter((f) => f !== name) || [],
		});
	}

	function formatPreview(parts: string[]) {
		const d = new Date();
		const DD = String(d.getDate()).padStart(2, '0');
		const MM = String(d.getMonth() + 1).padStart(2, '0');
		const YYYY = d.getFullYear();

		return parts.join('').replace('DD', DD).replace('MM', MM).replace('YYYY', String(YYYY));
	}

	if (loading) return <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading…</div>;

	const card = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6';

	const input =
		'h-10 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition';

	return (
		<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className='space-y-8'>
			{/* Header */}
			<div>
				<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2'>
					<Folder className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
					Projects
				</h2>
				<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Configure project storage and default structure.</p>
			</div>

			{/* Base Path */}
			<div className={card}>
				<div className='flex items-center gap-3'>
					<div className='h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center'>
						<HardDrive className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
					</div>
					<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Location</h3>
				</div>

				<input
					className={input}
					placeholder='/sim'
					value={settings.path || ''}
					onChange={(e) =>
						setSettings({
							...settings,
							path: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500 dark:text-zinc-500'>Relative to application root.</p>
			</div>

			{/* Required Folders */}
			<div className={card}>
				<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Required Folders</h3>

				<div className='space-y-2'>
					<AnimatePresence>
						{settings.requiredFolders?.map((folder) => (
							<motion.div
								key={folder}
								initial={{
									opacity: 0,
									y: -4,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								exit={{
									opacity: 0,
									x: 10,
								}}
								className='flex items-center justify-between rounded-xl border border-gray-200 dark:border-zinc-700 px-4 py-3 bg-gray-50 dark:bg-zinc-800'>
								<span className='text-sm font-medium text-gray-900 dark:text-zinc-100'>{folder}</span>

								<button onClick={() => removeFolder(folder)} className='h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition'>
									<Trash2 className='w-4 h-4' />
								</button>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				<div className='flex gap-3'>
					<input className={input} placeholder='New folder name' value={newFolder} onChange={(e) => setNewFolder(e.target.value)} />

					<button onClick={addFolder} className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition'>
						Add
					</button>
				</div>
			</div>

			{/* Date Format */}
			<div className={card}>
				<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Date Format</h3>

				<p className='text-sm text-gray-500 dark:text-zinc-400'>Drag to reorder how dates are saved in project uploads.</p>

				<div className='flex gap-3'>
					{dateParts.map((part, index) => (
						<div
							key={part}
							draggable
							onDragStart={() => setDragIndex(index)}
							onDragOver={(e) => e.preventDefault()}
							onDrop={() => handleDrop(index)}
							className='h-10 px-4 flex items-center bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl cursor-move text-sm font-medium text-gray-900 dark:text-zinc-100'>
							{part}
						</div>
					))}
				</div>

				<div className='text-sm text-gray-600 dark:text-zinc-400'>
					Preview: <span className='font-medium text-gray-900 dark:text-zinc-100'>{formatPreview(dateParts)}</span>
				</div>
			</div>

			{/* Save */}
			<div>
				<button onClick={save} className='h-10 px-5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-60' disabled={saving}>
					{saving ? 'Saving…' : 'Save Changes'}
				</button>
			</div>
		</motion.div>
	);
}
