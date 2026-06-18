/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import FileEditModal from '../files/FileEditModal';
import FileGrid from '../files/FileGrid';
import FileList from '../files/FileList';
import Loading from '../ui/Loading';
import ProjectFile from '../files/File';
import { User } from 'next-auth';
import ViewToggle from '../ui/ViewToggle';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

function parseDateFromFolderName(name: string, dateFormat: string = 'DDMMYYYY'): number {
	const parts = name.split(' ');
	const datePart = parts[parts.length - 2];

	if (!/^\d{8}$/.test(datePart)) return 0;

	let dd = '';
	let mm = '';
	let yyyy = '';

	switch (dateFormat) {
		case 'DDMMYYYY':
			dd = datePart.slice(0, 2);
			mm = datePart.slice(2, 4);
			yyyy = datePart.slice(4, 8);
			break;

		case 'MMDDYYYY':
			mm = datePart.slice(0, 2);
			dd = datePart.slice(2, 4);
			yyyy = datePart.slice(4, 8);
			break;

		case 'YYYYMMDD':
			yyyy = datePart.slice(0, 4);
			mm = datePart.slice(4, 6);
			dd = datePart.slice(6, 8);
			break;

		default:
			return 0;
	}

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
	const { has } = usePermissions();
	const [view, setView] = useState<'grid' | 'list'>('list');
	const hasWrite = has('projects.write');
	const { uploading, uploadFile } = useUpload();
	const [items, setItems] = useState<FileEntry[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	const [editingFile, setEditingFile] = useState<FileEntry | null>(null);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [loading, setLoading] = useState(true);

	const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [dateFormat, setDateFormat] = useState('DDMMYYYY');

	const grouped = {
		DuoTecno: items.filter((i) => detectProgrammationType(i) === 'DuoTecno'),
		DALI: items.filter((i) => detectProgrammationType(i) === 'DALI'),
		Loxone: items.filter((i) => detectProgrammationType(i) === 'Loxone'),
		Niko: items.filter((i) => detectProgrammationType(i) === 'Niko'),
		Siemens: items.filter((i) => detectProgrammationType(i) === 'Siemens'),
	};

	const load = async () => {
		setLoading(true);

		const progPath = `${basePath}/${client}/programmation`;
		const [filesRes, usersRes] = await Promise.all([fetch(`/api/files?view=${encodeURIComponent(progPath)}`), fetch('/api/users')]);

		const data: FileEntry[] = await filesRes.json();
		const userData = await usersRes.json();

		setUsers(userData.users ?? []);

		const sorted = data.sort((a, b) => parseDateFromFolderName(b.name, dateFormat) - parseDateFromFolderName(a.name, dateFormat));

		setItems(sorted);
		setLoading(false);
	};

	const upload = async (file: File) => {
		const success = await uploadFile(file, client, 'programmation');
		if (success) await load();
	};

	const download = async (path: string) => {
		try {
			const url = `/api/files/download?path=${encodeURIComponent(path)}`;

			const a = document.createElement('a');
			a.href = url;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} catch {}
	};

	const saveFileMetadata = async (file: FileEntry, name: string, comment: string, collaborators: string[]) => {
		const extension = file.name.split('.').pop() ?? '';

		const filename = file.name.replace(new RegExp(`\\.${extension}$`), '');

		const parts = filename.split('__');

		const date = parts[1] ?? '';
		const uploader = parts[2] ?? '';

		const newFilename = [name.replaceAll(' ', '_'), date, uploader, collaborators.join('-'), comment].join('__') + '.' + extension;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				oldPath: file.path,
				newName: newFilename,
			}),
		});

		await load();
	};

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const res = await fetch('/api/settings/projects');
				const s = await res.json();
				if (s?.dateFormat) setDateFormat(s.dateFormat);
			} catch {}
		};

		loadSettings();
	}, []);

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	return (
		<section className='space-y-6'>
			<input ref={inputRef} type='file' accept='.zip,.dnc,.loxone,.nhc2,.lsc' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div
				className='rounded-3xl p-6 space-y-6'
				style={{
					background: 'var(--container)',
					border: '1px solid var(--border)',
				}}>
				<AnimatePresence>
					{/* Upload */}
					<div className='flex justify-between'>
						<div></div>
						<div className='flex gap-2'>
							<ViewToggle value={view} onChange={setView} />

							{hasWrite && (
								<button
									onClick={() => inputRef.current?.click()}
									disabled={uploading}
									className={`h-10 px-4 flex items-center gap-2 rounded-xl text-sm font-medium transition
										${uploading ? 'bg-(--accent) text-white cursor-not-allowed' : 'bg-(--accent) text-white hover:bg-(--hover-accent)'}`}>
									<Upload className='w-4 h-4' />
									{uploading ? 'Uploading…' : 'Upload'}
								</button>
							)}
						</div>
					</div>

					{/* Loading */}
					{loading && <Loading title='Loading programmation files' />}

					{/* Groups */}
					{!loading &&
						Object.entries(grouped).map(([type, entries], i) => {
							if (!entries.length) return null;

							const latest = entries[0];
							const older = entries.slice(1);
							const isExpanded = expandedGroups.includes(type);

							return (
								<div key={type + i} className='space-y-3'>
									<h3 className='text-xs uppercase tracking-wide text-zinc-500'>{type}</h3>

									{view === 'grid' ? (
										<>
											<div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4'>
												<ProjectFile
													file={latest}
													users={users}
													onDownload={() => download(latest.path)}
													onEdit={() => {
														setEditingFile(latest);
														setEditModalOpen(true);
													}}
												/>

												{older.length > 0 && (
													<div
														onClick={() => setExpandedGroups((prev) => (prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]))}
														className='rounded-2xl cursor-pointer border border-dashed border-zinc-300 dark:border-zinc-700 min-h-45 flex items-center justify-center hover:border-(--accent) transition'>
														<div className='text-center'>
															{isExpanded ? <ChevronLeft className='mx-auto w-8 h-8' /> : <ChevronRight className='mx-auto w-8 h-8' />}

															<div className='text-xs mt-2 text-zinc-500'>{older.length} older</div>
														</div>
													</div>
												)}
											</div>

											<AnimatePresence>
												{isExpanded && (
													<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
														<FileGrid
															files={older}
															users={users}
															onDownload={download}
															onEdit={(file) => {
																setEditingFile(file);
																setEditModalOpen(true);
															}}
															permission='projects.write'
														/>
													</motion.div>
												)}
											</AnimatePresence>
										</>
									) : (
										<>
											<FileList
												files={[latest]}
												users={users}
												onDownload={download}
												onEdit={(file) => {
													setEditingFile(file);
													setEditModalOpen(true);
												}}
												permission='projects.write'
											/>

											{older.length > 0 && (
												<button
													onClick={() => setExpandedGroups((prev) => (prev.includes(type) ? prev.filter((g) => g !== type) : [...prev, type]))}
													className=' 							w-full 							h-12 							px-4 							rounded-2xl 							border 							border-zinc-200 							dark:border-zinc-800 							flex 							items-center 							gap-2 text-zinc-500 hover:text-(--hover-accent) transition'>
													{isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}

													<span>{isExpanded ? 'Hide older' : `Show older (${older.length})`}</span>
												</button>
											)}

											<AnimatePresence>
												{isExpanded && (
													<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className='overflow-hidden'>
														<FileList
															files={older}
															users={users}
															onDownload={download}
															onEdit={(file) => {
																setEditingFile(file);
																setEditModalOpen(true);
															}}
															permission='projects.write'
														/>
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
				</AnimatePresence>
			</div>

			<FileEditModal
				open={editModalOpen}
				file={editingFile}
				users={users}
				onClose={() => {
					setEditModalOpen(false);
					setEditingFile(null);
				}}
				onSave={async (name, comment, collaborators) => {
					if (!editingFile) {
						return;
					}

					await saveFileMetadata(editingFile, name, comment, collaborators);

					setEditModalOpen(false);
					setEditingFile(null);
				}}
			/>
		</section>
	);
}
