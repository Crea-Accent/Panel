/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Copy, Download, File, Folder, Home, LucideIcon, Pencil, Search, Trash2, Upload } from 'lucide-react';
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

	const isSearching = query.trim().length > 0;

	async function loadFiles(path: string, recursive = false) {
		if (abortRef.current) abortRef.current.abort();

		const controller = new AbortController();
		abortRef.current = controller;

		const url = `/api/files?view=${encodeURIComponent(path)}${recursive ? '&recursive=1' : ''}`;

		try {
			const res = await fetch(url, { signal: controller.signal });
			const data = await res.json();
			setFiles(Array.isArray(data) ? data : []);
		} catch {}
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

			let timeout: NodeJS.Timeout;

			if (isSearching) {
				timeout = setTimeout(() => loadFiles(currentPath, true), 600);
			} else {
				loadFiles(currentPath, false);
			}

			return () => timeout && clearTimeout(timeout);
		})();
	}, [currentPath, query]);

	const filtered = useMemo(() => {
		const list = !query ? files : files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

		return [...list].sort((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	}, [files, query]);

	function navigate(file: FileEntry) {
		if (file.type === 'directory') {
			setQuery('');
			setCurrentPath(file.path);
		}
	}

	function goUp() {
		if (!currentPath || !settings?.path || isSearching) return;
		if (currentPath === settings.path) return;

		const parent = currentPath.substring(0, currentPath.lastIndexOf('\\'));
		setCurrentPath(parent);
	}

	function goHome() {
		if (settings?.path && !isSearching) setCurrentPath(settings.path);
	}

	async function copyToClipboard(text: string) {
		if (isSearching) return;
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
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

	if (loading) {
		return <div className='text-sm text-zinc-500 dark:text-zinc-400'>Loading…</div>;
	}

	if (!settings?.path) {
		return <div className='text-sm text-zinc-500 dark:text-zinc-400'>No files path configured.</div>;
	}

	return (
		<div className='space-y-6'>
			<h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>Files</h1>

			{/* Toolbar */}
			<div className='flex flex-wrap items-center gap-3'>
				{[
					{ icon: Home, onClick: goHome },
					{ icon: ArrowUp, onClick: goUp },
					{ icon: Copy, onClick: () => currentPath && copyToClipboard(currentPath) },
				].map(({ icon: Icon, onClick }, i) => (
					<button
						key={i}
						onClick={onClick}
						disabled={isSearching}
						className='h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition'>
						<Icon size={16} />
					</button>
				))}

				<div className='relative max-w-xs'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' size={16} />
					<input
						placeholder='Search files…'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='h-9 pl-9 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-(--accent)/30 transition'
					/>
					{query && (
						<button onClick={() => setQuery('')} className='absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'>
							✕
						</button>
					)}
				</div>

				<button onClick={() => uploadRef.current?.click()} className='h-9 px-4 flex items-center gap-2 rounded-lg bg-(--accent) text-white text-sm font-medium hover:bg-(--hover-accent) transition'>
					<Upload size={16} />
					Upload
				</button>

				<input type='file' ref={uploadRef} multiple className='hidden' onChange={upload} />
			</div>

			{/* Table */}
			<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden'>
				<div className='hidden md:grid grid-cols-4 px-6 py-3 text-xs uppercase tracking-wide text-zinc-500 bg-zinc-50 dark:bg-zinc-800'>
					<div>Name</div>
					<div>Size</div>
					<div>Modified</div>
					<div className='text-right'>Actions</div>
				</div>

				{filtered.map((file) => (
					<div key={file.path} className='border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
						<div className='flex md:grid md:grid-cols-4 items-center px-4 md:px-6 py-4 gap-3'>
							<div className='flex items-start gap-3 cursor-pointer flex-1' onClick={() => navigate(file)}>
								{file.type === 'directory' ? <Folder size={18} className='text-(--accent) dark:text-(--accent)' /> : <File size={18} className='text-zinc-400' />}

								<div className='flex flex-col'>
									<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate'>{file.name}</span>

									<div className='text-xs text-zinc-500 md:hidden mt-1 space-x-3'>
										<span>{formatSize(file.size)}</span>
										<span>{formatDate(file.modified)}</span>
									</div>
								</div>
							</div>

							<div className='hidden md:block text-sm text-zinc-500'>{formatSize(file.size)}</div>

							<div className='hidden md:block text-sm text-zinc-500'>{formatDate(file.modified)}</div>

							<div className='flex justify-end gap-2'>
								<ActionIcon icon={Copy} onClick={() => copyToClipboard(file.path)} />
								<ActionIcon icon={Download} onClick={() => download(file.path)} />
								<ActionIcon icon={Pencil} onClick={() => rename(file.path)} />
								<ActionIcon icon={Trash2} onClick={() => remove(file.path)} danger />
							</div>
						</div>
					</div>
				))}
			</motion.div>
		</div>
	);
}

function ActionIcon({ icon: Icon, onClick, danger }: { icon: LucideIcon; onClick: () => void; danger?: boolean }) {
	return (
		<button
			onClick={onClick}
			className={`h-8 w-8 flex items-center justify-center rounded-lg transition ${
				danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
			}`}>
			<Icon size={14} />
		</button>
	);
}
