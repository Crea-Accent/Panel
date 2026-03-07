/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Code, Download, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

function parseDateFromFolderName(name: string): number {
	const parts = name.split(' ');
	const datePart = parts[parts.length - 2];

	if (!/^\d{8}$/.test(datePart)) return 0;

	const dd = datePart.slice(0, 2);
	const mm = datePart.slice(2, 4);
	const yyyy = datePart.slice(4, 8);

	return Number(`${yyyy}${mm}${dd}`);
}

function detectProgrammationType(entry: FileEntry): 'DuoTecno' | 'DALI' | 'Loxone' | 'Niko' | 'Siemens' | 'Other' {
	const lower = entry.name.toLowerCase();

	if (entry.type === 'file') {
		if (lower.endsWith('.nhc2')) return 'Niko';
		if (lower.endsWith('.lsc')) return 'Siemens';
		if (lower.endsWith('.dnc')) return 'DALI';
		if (lower.endsWith('.loxone')) return 'Loxone';
	}

	if (entry.type === 'directory') return 'DuoTecno';

	return 'Other';
}

export default function Programmation({ basePath, client }: { basePath: string; client: string }) {
	const { uploading, uploadFile } = useUpload();
	const [items, setItems] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const progPath = `${basePath}/${client}/programmation`;
		const res = await fetch(`/api/files?view=${encodeURIComponent(progPath)}`);
		const data: FileEntry[] = await res.json();

		const sorted = data.sort((a, b) => parseDateFromFolderName(b.name) - parseDateFromFolderName(a.name));

		setItems(sorted);
		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const upload = async (file: File) => {
		const success = await uploadFile(file, client, 'programmation');
		if (success) await load();
	};

	const download = (path: string) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;
		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const grouped = {
		DuoTecno: items.filter((i) => detectProgrammationType(i) === 'DuoTecno'),
		DALI: items.filter((i) => detectProgrammationType(i) === 'DALI'),
		Loxone: items.filter((i) => detectProgrammationType(i) === 'Loxone'),
		Niko: items.filter((i) => detectProgrammationType(i) === 'Niko'),
		Siemens: items.filter((i) => detectProgrammationType(i) === 'Siemens'),
	};

	const section = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-6'>
			{/* Header */}
			<header className='flex items-center gap-3'>
				<div className='h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center'>
					<Code className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
				</div>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Programmation</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>DuoTecno, DALI, Loxone, Niko, Siemens</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='.zip,.dnc,.loxone,.nhc2,.lsc' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div className={section}>
				{/* Section Toggle */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center px-5 py-4 text-sm font-medium text-gray-900 dark:text-zinc-100'>
					<span>Projects ({items.length})</span>
					{open ? <ChevronUp className='w-4 h-4 text-gray-400 dark:text-zinc-500' /> : <ChevronDown className='w-4 h-4 text-gray-400 dark:text-zinc-500' />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className='px-5 pb-6 space-y-6'>
							{/* Upload */}
							<div className='flex justify-end'>
								<button
									onClick={() => inputRef.current?.click()}
									disabled={uploading}
									className={`h-10 px-4 flex items-center gap-2 rounded-xl text-sm font-medium transition
										${uploading ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
									<Upload className='w-4 h-4' />
									{uploading ? 'Uploading…' : 'Upload'}
								</button>
							</div>

							{/* Loading */}
							{loading && <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading projects…</div>}

							{/* Groups */}
							{!loading &&
								Object.entries(grouped).map(([type, entries]) => {
									if (!entries.length) return null;

									const latest = entries[0];
									const older = entries.slice(1);
									const isExpanded = expandedGroups.includes(type);

									return (
										<div key={type} className='space-y-3'>
											<h3 className='text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-500'>{type}</h3>

											{/* Latest */}
											<div className='h-12 px-4 flex items-center justify-between rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30'>
												<span className='text-sm font-medium truncate text-gray-900 dark:text-zinc-100'>{latest.name}</span>

												<button
													onClick={() => download(latest.path)}
													className='flex items-center gap-1 text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition'>
													<Download className='w-4 h-4' />
													Download
												</button>
											</div>

											{/* Older Toggle */}
											{older.length > 0 && (
												<>
													<button
														onClick={() => setExpandedGroups((prev) => (prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]))}
														className='text-xs text-gray-500 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition'>
														{isExpanded ? <ChevronUp className='w-3.5 h-3.5' /> : <ChevronDown className='w-3.5 h-3.5' />}
														{isExpanded ? 'Hide older' : `Show older (${older.length})`}
													</button>

													<AnimatePresence>
														{isExpanded && (
															<motion.div
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
																	y: -4,
																}}
																className='space-y-2'>
																{older.map((item, index) => (
																	<motion.div
																		key={item.path}
																		initial={{
																			opacity: 0,
																			y: 4,
																		}}
																		animate={{
																			opacity: 1,
																			y: 0,
																		}}
																		transition={{
																			delay: index * 0.03,
																		}}
																		className='h-12 px-4 flex items-center justify-between rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm transition'>
																		<span className='text-sm truncate text-gray-800 dark:text-zinc-100'>{item.name}</span>

																		<button
																			onClick={() => download(item.path)}
																			className='flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition'>
																			<Download className='w-4 h-4' />
																			Download
																		</button>
																	</motion.div>
																))}
															</motion.div>
														)}
													</AnimatePresence>
												</>
											)}
										</div>
									);
								})}

							{/* Empty */}
							{!loading && Object.values(grouped).every((arr) => arr.length === 0) && (
								<div className='text-sm text-gray-500 dark:text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-6 text-center'>No programmation files found.</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
