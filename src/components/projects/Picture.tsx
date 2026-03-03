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

		// 1️⃣ Create group entries from real folders
		for (const dir of directories) {
			grouped[dir.name] = [];
		}

		// 2️⃣ Assign images to folders (robust version)
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

		// 3️⃣ Ensure Ungrouped exists only if needed
		if (!grouped['Ungrouped'] || grouped['Ungrouped'].length === 0) {
			delete grouped['Ungrouped'];
		}

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
			body: JSON.stringify({
				dir,
				name,
			}),
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

		if (successCount > 0) {
			await load();
		}

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

	return (
		<section className='space-y-4'>
			<header className='flex items-center gap-3'>
				<div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600'>
					<ImageIcon size={20} />
				</div>
				<div>
					<h2 className='text-xl font-semibold'>Foto’s</h2>
					<p className='text-sm text-zinc-500'>Site images and documentation</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => e.target.files && upload(e.target.files)} />

			<div className='bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden'>
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Images ({totalImages})</span>
					{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className='px-5 pb-5 space-y-6'>
							<div className='flex justify-between'>
								<button onClick={createGroup} className='flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-300 text-sm font-medium hover:bg-zinc-50 transition'>
									<FolderPlus size={14} />
									New Group
								</button>

								<button
									onClick={() => {
										setActiveUploadFolder(undefined);
										inputRef.current?.click();
									}}
									disabled={uploading}
									className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
										uploading ? 'bg-emerald-400 opacity-70 cursor-not-allowed text-white' : 'bg-emerald-600 hover:opacity-90 text-white'
									}`}>
									<Upload size={14} />
									Upload
								</button>
							</div>

							{loading && <div className='text-sm text-zinc-500'>Loading images…</div>}

							{!loading &&
								groups.map((group) => (
									<div key={group.name} className='border border-zinc-200 rounded-xl overflow-hidden'>
										<button
											onClick={() =>
												setOpenFolders((prev) => ({
													...prev,
													[group.name]: !prev[group.name],
												}))
											}
											className='w-full flex justify-between items-center px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition'>
											<span className='text-sm font-medium'>
												{group.name} ({group.images.length})
											</span>
											{openFolders[group.name] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
										</button>

										<AnimatePresence>
											{openFolders[group.name] && (
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
													transition={{
														duration: 0.2,
													}}
													className='p-4 space-y-4'>
													<div className='flex justify-end'>
														<button
															onClick={() => {
																setActiveUploadFolder(group.name);
																inputRef.current?.click();
															}}
															disabled={uploading}
															className={`text-xs px-3 py-1 rounded-lg transition ${uploading ? 'bg-zinc-200 cursor-not-allowed opacity-70' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
															Upload to {group.name}
														</button>
													</div>

													<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
														{group.images.map((img) => (
															<div key={img.path} className='group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50'>
																<img src={`/api/files/download?path=${encodeURIComponent(img.path)}`} alt={img.name} className='w-full h-40 object-cover' />

																<div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2 gap-2'>
																	<span className='text-xs text-white truncate'>{img.name}</span>

																	<div className='flex justify-between items-center gap-2'>
																		<select onChange={(e) => moveImage(img.path, e.target.value)} className='text-xs rounded' defaultValue=''>
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

																		<button onClick={() => download(img.path)} className='text-white'>
																			<Download size={14} />
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
