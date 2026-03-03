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
		const progPath = `${basePath}/${client}/programmation`;

		const success = await uploadFile(file, progPath);

		if (success) {
			await load();
		}
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

	const sectionBase = 'bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-4'>
			<header className='flex items-center gap-3'>
				<div className='w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600'>
					<Code size={20} />
				</div>
				<div>
					<h2 className='text-xl font-semibold'>Programmatie</h2>
					<p className='text-sm text-zinc-500'>DuoTecno, DALI and Loxone projects</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='.zip,.dnc,.loxone,.nhc2,.lsc' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div className={sectionBase}>
				{/* Section Header */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Projects ({items.length})</span>
					{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='px-5 pb-5 space-y-6'>
							{/* Upload */}
							<div className='flex justify-end'>
								<button
									onClick={() => inputRef.current?.click()}
									disabled={uploading}
									className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
										uploading ? 'bg-violet-400 cursor-not-allowed opacity-70 text-white' : 'bg-violet-600 hover:opacity-90 text-white'
									}`}>
									<Upload size={14} />
									{uploading ? 'Uploading…' : 'Upload'}
								</button>
							</div>

							{/* Loading */}
							{loading && <div className='text-sm text-zinc-500'>Loading projects…</div>}

							{/* Groups */}
							{!loading &&
								Object.entries(grouped).map(([type, entries]) => {
									if (entries.length === 0) return null;

									const latest = entries[0];
									const older = entries.slice(1);

									const isExpanded = expandedGroups.includes(type);

									return (
										<div key={type} className='space-y-3'>
											<h3 className='text-xs uppercase tracking-wide text-zinc-500'>{type}</h3>

											{/* Latest */}
											<div className='p-4 rounded-xl border border-violet-200 bg-violet-50 flex justify-between items-center'>
												<span className='font-medium text-sm truncate'>{latest.name}</span>

												<button onClick={() => download(latest.path)} className='text-sm flex items-center gap-1 text-violet-700 hover:text-violet-900'>
													<Download size={14} />
													Download
												</button>
											</div>

											{/* Older toggle */}
											{older.length > 0 && (
												<>
													<button
														onClick={() => setExpandedGroups((prev) => (prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]))}
														className='text-xs text-zinc-500 hover:text-black flex items-center gap-1'>
														{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
														{isExpanded ? 'Hide older' : `Show older (${older.length})`}
													</button>

													<AnimatePresence>
														{isExpanded && (
															<motion.div
																initial={{
																	height: 0,
																	opacity: 0,
																}}
																animate={{
																	height: 'auto',
																	opacity: 1,
																}}
																exit={{
																	height: 0,
																	opacity: 0,
																}}
																className='space-y-2'>
																{older.map((item, index) => (
																	<motion.div
																		key={item.path}
																		initial={{
																			opacity: 0,
																			y: 5,
																		}}
																		animate={{
																			opacity: 1,
																			y: 0,
																		}}
																		transition={{
																			delay: index * 0.03,
																		}}
																		className='flex justify-between items-center p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:shadow-sm transition'>
																		<span className='text-sm truncate'>{item.name}</span>

																		<button onClick={() => download(item.path)} className='text-sm flex items-center gap-1 text-zinc-600 hover:text-violet-600'>
																			<Download size={14} />
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
								<div className='text-sm text-zinc-500 border border-dashed border-zinc-300 rounded-xl p-6 text-center'>No programmation files found.</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
