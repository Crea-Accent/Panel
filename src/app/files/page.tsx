/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Copy, Download, File, Folder, Home, MoreVertical, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type FileEntry = {
	path: string;
	name: string;
	type: string;
	size?: number | null;
	modified?: string;
};

type Settings = {
	path?: string;
};

function formatSize(bytes?: number | null) {
	if (bytes == null) return '-';
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(date?: string) {
	if (!date) return '-';
	return new Date(date).toLocaleString();
}

export default function FilesPage() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [currentPath, setCurrentPath] = useState<string | null>(null);
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const abortRef = useRef<AbortController | null>(null);

	const uploadRef = useRef<HTMLInputElement>(null);

	async function loadFiles(path: string, recursive = false) {
		// Cancel previous request
		if (abortRef.current) {
			abortRef.current.abort();
		}

		const controller = new AbortController();
		abortRef.current = controller;

		const url = `/api/files?view=${encodeURIComponent(path)}${recursive ? '&recursive=1' : ''}`;

		try {
			const res = await fetch(url, { signal: controller.signal });
			const data = await res.json();
			setFiles(Array.isArray(data) ? data : []);
		} catch (err: unknown) {
			if ((err as Error).name !== 'AbortError') {
				console.error('File load failed:', err);
			}
		}
	}

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/files').then((r) => r.json());
			setSettings(s);

			if (s?.path) {
				setCurrentPath(s.path);
				await loadFiles(s.path);
			}

			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		(() => {
			if (!currentPath) return;

			let timeout: NodeJS.Timeout | undefined;

			if (query.trim()) {
				timeout = setTimeout(() => {
					loadFiles(currentPath, true);
				}, 800); // slightly faster, feels better
			} else {
				loadFiles(currentPath, false);
			}

			return () => {
				if (timeout) clearTimeout(timeout);
			};
		})();
	}, [currentPath, query]);

	const filtered = useMemo(() => {
		const list = !query ? files : files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

		return [...list].sort((a, b) => {
			if (a.type !== b.type) {
				return a.type === 'directory' ? -1 : 1;
			}
			return a.name.localeCompare(b.name);
		});
	}, [files, query]);

	function navigate(file: FileEntry) {
		if (file.type === 'directory') {
			setCurrentPath(file.path);
		}
	}

	function goUp() {
		if (!currentPath || !settings?.path) return;
		if (currentPath === settings.path) return;

		const parent = currentPath.substring(0, currentPath.lastIndexOf('\\'));

		setCurrentPath(parent);
	}

	function goHome() {
		if (settings?.path) setCurrentPath(settings.path);
	}

	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			console.warn('Clipboard failed');
		}
	}

	function download(path: string) {
		window.location.href = `/api/files/download?path=${encodeURIComponent(path)}`;
	}

	async function remove(path: string) {
		await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
			method: 'DELETE',
		});
		loadFiles(currentPath!);
	}

	async function rename(oldPath: string) {
		const newName = prompt('New name?');
		if (!newName) return;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ oldPath, newName }),
		});

		loadFiles(currentPath!);
	}

	async function upload(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files || !currentPath) return;

		for (const file of Array.from(e.target.files)) {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('dir', currentPath);

			await fetch('/api/files', {
				method: 'POST',
				body: fd,
			});
		}

		loadFiles(currentPath);
	}

	if (loading) return <div className='max-w-6xl mx-auto py-12 text-gray-500'>Loading...</div>;

	if (!settings?.path) return <div className='max-w-6xl mx-auto py-12 text-gray-500'>No files path configured.</div>;

	return (
		<div className='max-w-6xl mx-auto py-12 space-y-8'>
			<h1 className='text-3xl font-semibold tracking-tight'>Files</h1>

			{/* Toolbar */}
			<div className='flex items-center gap-3 flex-wrap'>
				<motion.button whileTap={{ scale: 0.95 }} onClick={goHome} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm'>
					<Home size={16} />
				</motion.button>

				<motion.button whileTap={{ scale: 0.95 }} onClick={goUp} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm'>
					<ArrowUp size={16} />
				</motion.button>

				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={() => currentPath && copyToClipboard(currentPath)}
					className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm'>
					<Copy size={16} />
				</motion.button>

				<div className='relative'>
					<Search size={14} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
					<input
						placeholder='Search files...'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none'
					/>
				</div>

				<motion.button whileTap={{ scale: 0.95 }} onClick={() => uploadRef.current?.click()} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm'>
					<Upload size={16} />
					Upload
				</motion.button>

				<input type='file' ref={uploadRef} multiple className='hidden' onChange={upload} />
			</div>

			{/* Table */}
			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'>
				<div className='grid grid-cols-4 px-6 py-3 text-xs uppercase tracking-wide text-gray-500 bg-gray-50'>
					<div>Name</div>
					<div>Size</div>
					<div>Modified</div>
					<div className='text-right'>Actions</div>
				</div>

				<AnimatePresence>
					{filtered.map((file) => (
						<motion.div key={file.path} layout initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className='border-t border-gray-100 hover:bg-gray-50 transition'>
							<div className='flex items-center justify-between px-4 py-4 md:grid md:grid-cols-4 md:items-center md:px-6'>
								{/* Left Side */}
								<div className='flex items-start gap-3 cursor-pointer flex-1' onClick={() => navigate(file)}>
									{file.type === 'directory' ? <Folder size={20} className='text-blue-600 mt-0.5 shrink-0' /> : <File size={20} className='text-gray-500 mt-0.5 shrink-0' />}

									<div className='flex flex-col'>
										<span className='text-sm font-medium truncate'>{file.name}</span>

										{/* Mobile meta */}
										<div className='text-xs text-gray-500 md:hidden mt-1 space-x-3'>
											<span>{formatSize(file.size)}</span>
											<span>{formatDate(file.modified)}</span>
										</div>
									</div>
								</div>

								{/* Desktop Size */}
								<div className='hidden md:block text-sm text-gray-500'>{formatSize(file.size)}</div>

								{/* Desktop Modified */}
								<div className='hidden md:block text-sm text-gray-500'>{formatDate(file.modified)}</div>

								{/* Actions */}
								<div className='flex justify-end md:justify-end relative'>
									{/* Desktop Buttons */}
									<div className='hidden md:flex gap-2'>
										<button onClick={() => copyToClipboard(file.path)} className='p-2 hover:bg-gray-100 rounded-lg'>
											<Copy size={16} />
										</button>
										<button onClick={() => download(file.path)} className='p-2 hover:bg-gray-100 rounded-lg'>
											<Download size={16} />
										</button>
										<button onClick={() => rename(file.path)} className='p-2 hover:bg-gray-100 rounded-lg'>
											<Pencil size={16} />
										</button>
										<button onClick={() => remove(file.path)} className='p-2 hover:bg-gray-100 rounded-lg text-red-500'>
											<Trash2 size={16} />
										</button>
									</div>

									{/* Mobile Dropdown */}
									<div className='md:hidden relative'>
										<MobileActions onCopy={() => copyToClipboard(file.path)} onDownload={() => download(file.path)} onRename={() => rename(file.path)} onDelete={() => remove(file.path)} />
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</AnimatePresence>
			</motion.div>
		</div>
	);
}

function MobileActions({ onCopy, onDownload, onRename, onDelete }: { onCopy: () => void; onDownload: () => void; onRename: () => void; onDelete: () => void }) {
	const [open, setOpen] = useState(false);

	return (
		<div className='relative'>
			<button onClick={() => setOpen(!open)} className='p-2 rounded-lg hover:bg-gray-100'>
				<MoreVertical size={18} />
			</button>

			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className='absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20'>
						<button
							onClick={() => {
								onCopy();
								setOpen(false);
							}}
							className='flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50'>
							<Copy size={14} /> Copy path
						</button>

						<button
							onClick={() => {
								onDownload();
								setOpen(false);
							}}
							className='flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50'>
							<Download size={14} /> Download
						</button>

						<button
							onClick={() => {
								onRename();
								setOpen(false);
							}}
							className='flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50'>
							<Pencil size={14} /> Rename
						</button>

						<button
							onClick={() => {
								onDelete();
								setOpen(false);
							}}
							className='flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-50'>
							<Trash2 size={14} /> Delete
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
