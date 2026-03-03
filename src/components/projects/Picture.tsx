/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, FolderPlus, Image as ImageIcon, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

type FolderGroup = {
	name: string;
	images: FileEntry[];
};

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export default function Pictures({ basePath, client }: { basePath: string; client: string }) {
	const { uploading, uploadFile } = useUpload();

	const [groups, setGroups] = useState<FolderGroup[]>([]);
	const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const [activeUploadFolder, setActiveUploadFolder] = useState<string | undefined>(undefined);

	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const picsPath = `${basePath}/${client}/pictures`;
		const res = await fetch(`/api/files?view=${encodeURIComponent(picsPath)}&recursive=1`);
		const data: FileEntry[] = await res.json();

		const directories = data.filter((f) => f.type === 'directory');
		const imageFiles = data.filter((f) => f.type === 'file' && IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		const grouped: Record<string, FileEntry[]> = {};

		for (const dir of directories) {
			grouped[dir.name] = [];
		}

		for (const file of imageFiles) {
			const normalized = file.path.replace(/\\/g, '/');
			const parts = normalized.split('/');
			const picturesIndex = parts.lastIndexOf('pictures');

			let folder = 'Ungrouped';

			if (picturesIndex !== -1 && parts.length > picturesIndex + 2) {
				folder = parts[picturesIndex + 1];
			}

			if (!grouped[folder]) grouped[folder] = [];
			grouped[folder].push(file);
		}

		if (!grouped['Ungrouped']?.length) delete grouped['Ungrouped'];

		const result: FolderGroup[] = Object.entries(grouped).map(([name, images]) => ({
			name,
			images,
		}));

		setGroups(result);

		const initialOpen: Record<string, boolean> = {};
		result.forEach((g) => (initialOpen[g.name] = true));
		setOpenFolders(initialOpen);

		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const createGroup = async () => {
		const name = prompt('Group name');
		if (!name) return;

		const dir = `${basePath}/${client}/pictures`;

		await fetch('/api/files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ dir, name }),
		});

		await load();
	};

	const upload = async (files: FileList) => {
		const baseDir = `${basePath}/${client}/pictures`;
		const targetDir = activeUploadFolder ? `${baseDir}/${activeUploadFolder}` : baseDir;

		let successCount = 0;

		for (const file of Array.from(files)) {
			const success = await uploadFile(file, targetDir);
			if (success) successCount++;
		}

		if (successCount > 0) await load();
		setActiveUploadFolder(undefined);
	};

	const moveImage = async (imagePath: string, targetFolder: string) => {
		const baseDir = `${basePath}/${client}/pictures`;
		const newDir = `${baseDir}/${targetFolder}`;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				oldPath: imagePath,
				newDir,
			}),
		});

		await load();
	};

	const download = (path: string) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;
		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const totalImages = groups.reduce((acc, g) => acc + g.images.length, 0);

	const section = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-6'>
			{/* Header */}
			<header className='flex items-center gap-3'>
				<div className='h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center'>
					<ImageIcon className='w-5 h-5 text-indigo-600 dark:text-indigo-400' />
				</div>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Pictures</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>Site images and documentation</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => e.target.files && upload(e.target.files)} />

			<div className={section}>
				{/* Toggle */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center px-5 py-4 text-sm font-medium text-gray-900 dark:text-zinc-100'>
					<span>Images ({totalImages})</span>
					{open ? <ChevronUp className='w-4 h-4 text-gray-400 dark:text-zinc-500' /> : <ChevronDown className='w-4 h-4 text-gray-400 dark:text-zinc-500' />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className='px-5 pb-6 space-y-6'>
							{/* Actions */}
							<div className='flex justify-between items-center'>
								<button
									onClick={createGroup}
									className='h-10 px-4 flex items-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition'>
									<FolderPlus className='w-4 h-4' />
									New Group
								</button>

								<button
									onClick={() => {
										setActiveUploadFolder(undefined);
										inputRef.current?.click();
									}}
									disabled={uploading}
									className={`h-10 px-4 flex items-center gap-2 rounded-xl text-sm font-medium transition
										${uploading ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
									<Upload className='w-4 h-4' />
									Upload
								</button>
							</div>

							{loading && <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading images…</div>}

							{/* Groups */}
							{!loading &&
								groups.map((group) => (
									<div key={group.name} className='border border-gray-200 dark:border-zinc-700 rounded-2xl overflow-hidden'>
										<button
											onClick={() =>
												setOpenFolders((prev) => ({
													...prev,
													[group.name]: !prev[group.name],
												}))
											}
											className='w-full flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-sm font-medium text-gray-900 dark:text-zinc-100'>
											<span>
												{group.name} ({group.images.length})
											</span>
											{openFolders[group.name] ? <ChevronUp className='w-4 h-4 text-gray-400 dark:text-zinc-500' /> : <ChevronDown className='w-4 h-4 text-gray-400 dark:text-zinc-500' />}
										</button>

										<AnimatePresence>
											{openFolders[group.name] && (
												<motion.div className='p-4 space-y-4'>
													<div className='flex justify-end'>
														<button
															onClick={() => {
																setActiveUploadFolder(group.name);
																inputRef.current?.click();
															}}
															className='text-xs px-3 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition'>
															Upload to {group.name}
														</button>
													</div>

													<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
														{group.images.map((img) => (
															<div key={img.path} className='group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'>
																<img src={`/api/files/download?path=${encodeURIComponent(img.path)}`} alt={img.name} className='w-full h-40 object-cover' />

																<div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2 gap-2'>
																	<span className='text-xs text-white truncate'>{img.name}</span>

																	<div className='flex justify-between items-center gap-2'>
																		<select onChange={(e) => moveImage(img.path, e.target.value)} className='text-xs rounded bg-white/90' defaultValue=''>
																			<option value='' disabled>
																				Move
																			</option>
																			{groups
																				.filter((g) => g.name !== group.name)
																				.map((g) => (
																					<option key={g.name} value={g.name}>
																						{g.name}
																					</option>
																				))}
																		</select>

																		<button onClick={() => download(img.path)} className='text-white hover:text-indigo-200 transition'>
																			<Download className='w-4 h-4' />
																		</button>
																	</div>
																</div>
															</div>
														))}
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
