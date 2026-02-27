/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Folder, HardDrive, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type ProjectsSettings = {
	basePath?: string;
	requiredFolders?: string[];
	dateFormat?: string;
};

export default function ProjectsSettings() {
	const [settings, setSettings] = useState<ProjectsSettings>({
		basePath: '',
		requiredFolders: [],
		dateFormat: 'DDMMYYYY',
	});

	const [newFolder, setNewFolder] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [dateParts, setDateParts] = useState<string[]>(['DD', 'MM', 'YYYY']);
	const [dragIndex, setDragIndex] = useState<number | null>(null);

	// ---------------- LOAD ----------------
	useEffect(() => {
		async function load() {
			const res = await fetch('/api/settings/projects');
			const data = await res.json();

			const merged = {
				basePath: '',
				requiredFolders: [],
				dateFormat: 'DDMMYYYY',
				...data,
			};

			setSettings(merged);

			// derive draggable parts from stored format
			if (merged.dateFormat) {
				const parts = ['DD', 'MM', 'YYYY'].sort((a, b) => merged.dateFormat!.indexOf(a) - merged.dateFormat!.indexOf(b));

				setDateParts(parts);
			}

			setLoading(false);
		}

		load();
	}, []);

	// ---------------- DRAG ----------------
	function handleDrop(index: number) {
		if (dragIndex === null) return;

		const next = [...dateParts];
		const [moved] = next.splice(dragIndex, 1);
		next.splice(index, 0, moved);

		setDateParts(next);
		setDragIndex(null);
	}

	// ---------------- SAVE ----------------
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

	if (loading) return <div className='p-8'>Loading...</div>;

	return (
		<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className='max-w-4xl mx-auto py-10 space-y-12'>
			{/* Header */}
			<div>
				<h2 className='text-2xl font-semibold flex items-center gap-2'>
					<Folder size={20} />
					Projects
				</h2>
				<p className='text-sm text-gray-500 mt-1'>Configure project storage and default structure.</p>
			</div>

			{/* Base Path */}
			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-2'>
					<HardDrive size={18} />
					<h3 className='text-lg font-medium'>Base Path</h3>
				</div>

				<input
					className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
					placeholder='/sim'
					value={settings.basePath || ''}
					onChange={(e) =>
						setSettings({
							...settings,
							basePath: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500'>Relative to application root.</p>
			</div>

			{/* Required Folders */}
			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6'>
				<div className='flex items-center gap-2'>
					<Folder size={18} />
					<h3 className='text-lg font-medium'>Required Folders</h3>
				</div>

				<div className='space-y-3'>
					<AnimatePresence>
						{settings.requiredFolders?.map((folder) => (
							<motion.div
								key={folder}
								initial={{ opacity: 0, y: -5 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, x: 10 }}
								transition={{ duration: 0.15 }}
								className='flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 bg-gray-50'>
								<span className='text-sm font-medium'>{folder}</span>

								<button onClick={() => removeFolder(folder)} className='text-red-500'>
									<Trash2 size={16} />
								</button>
							</motion.div>
						))}
					</AnimatePresence>
				</div>

				<div className='flex gap-3'>
					<input
						className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
						placeholder='New folder name'
						value={newFolder}
						onChange={(e) => setNewFolder(e.target.value)}
					/>

					<button onClick={addFolder} className='px-4 py-2 rounded-lg bg-black text-white text-sm font-medium'>
						Add
					</button>
				</div>
			</div>

			{/* Date Format */}
			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6'>
				<h3 className='text-lg font-medium'>Date Format</h3>

				<p className='text-sm text-gray-500'>Drag to reorder how dates are saved in project uploads.</p>

				<div className='flex gap-3'>
					{dateParts.map((part, index) => (
						<div
							key={part}
							draggable
							onDragStart={() => setDragIndex(index)}
							onDragOver={(e) => e.preventDefault()}
							onDrop={() => handleDrop(index)}
							className='px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-move text-sm font-medium'>
							{part}
						</div>
					))}
				</div>

				<div className='text-sm text-gray-600'>
					Preview: <b>{formatPreview(dateParts)}</b>
				</div>
			</div>

			{/* Save */}
			<div>
				<button onClick={save} className='px-5 py-2 rounded-lg bg-black text-white text-sm font-medium'>
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</motion.div>
	);
}
