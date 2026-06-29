/** @format */
'use client';

import { ArrowUp, ChevronLeft, ChevronRight, Folder, Home, Pencil, Search, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FileGrid from '@/components/files/FileGrid';
import FileList from '@/components/files/FileList';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import ViewToggle from '@/components/ui/ViewToggle';
import { motion } from 'framer-motion';
import { useFileNavigation } from '@/hooks/useFileNavigation';

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

export default function FilesPage() {
	const abortRef = useRef<AbortController | null>(null);
	const uploadRef = useRef<HTMLInputElement>(null);
	const [settings, setSettings] = useState<Settings | null>(null);

	const { currentPath, navigate, goUp, goBack, goForward, canGoBack, canGoForward, canGoUp, breadcrumbs } = useFileNavigation(settings?.path ?? '');

	const [files, setFiles] = useState<FileEntry[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<'list' | 'grid'>('list');
	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [loadingFiles, setLoadingFiles] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [selected, setSelected] = useState<string[]>([]);
	const [renaming, setRenaming] = useState(false);
	const [renamePath, setRenamePath] = useState('');
	const [renameValue, setRenameValue] = useState('');
	const [contextMenu, setContextMenu] = useState<{
		x: number;
		y: number;
		file: FileEntry | null;
	}>({
		x: 0,
		y: 0,
		file: null,
	});

	const [creatingFolder, setCreatingFolder] = useState(false);

	const [folderName, setFolderName] = useState('');

	const lastSelected = useRef<string | null>(null);
	const isSearching = query.trim().length > 0;
	const dragCounter = useRef(0);

	const filtered = useMemo(() => {
		const list = !query ? files : files.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

		return [...list].sort((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
	}, [files, query]);

	const selectedFile = useMemo(() => (selected.length === 1 ? filtered.find((f) => f.path === selected[0]) : null), [selected, filtered]);

	async function loadFiles(path: string, recursive = false) {
		if (abortRef.current) abortRef.current.abort();

		const controller = new AbortController();

		abortRef.current = controller;

		const url = `/api/files?view=${encodeURIComponent(path)}${recursive ? '&recursive=1' : ''}`;

		try {
			setLoadingFiles(true);

			const res = await fetch(url, {
				signal: controller.signal,
			});

			const data = await res.json();

			setFiles(Array.isArray(data) ? data : []);
		} catch {
		} finally {
			setLoadingFiles(false);
		}
	}

	function openFile(file: FileEntry) {
		if (file.type !== 'directory') {
			return;
		}

		clearSelection();
		setQuery('');

		navigate(file.path);
	}

	function toggleSelection(path: string, event: React.MouseEvent) {
		const isCtrl = event.ctrlKey || event.metaKey;

		const isShift = event.shiftKey;

		if (isShift && lastSelected.current) {
			const currentIndex = filtered.findIndex((f) => f.path === path);

			const lastIndex = filtered.findIndex((f) => f.path === lastSelected.current);

			if (currentIndex === -1 || lastIndex === -1) return;

			const start = Math.min(currentIndex, lastIndex);

			const end = Math.max(currentIndex, lastIndex);

			const range = filtered.slice(start, end + 1).map((f) => f.path);

			setSelected(range);

			return;
		}

		if (isCtrl) {
			setSelected((current) => (current.includes(path) ? current.filter((p) => p !== path) : [...current, path]));

			lastSelected.current = path;

			return;
		}

		setSelected([path]);

		lastSelected.current = path;
	}

	function clearSelection() {
		setSelected([]);

		lastSelected.current = null;
	}

	async function copyToClipboard(text: string) {
		if (isSearching) return;
		try {
			await navigator.clipboard.writeText(text);
		} catch {}
	}

	function download(path: string) {
		const link = document.createElement('a');

		link.href = `/api/files/download?path=${encodeURIComponent(path)}`;

		link.download = '';

		document.body.appendChild(link);

		link.click();

		document.body.removeChild(link);
	}

	async function remove(path: string) {
		await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
			method: 'DELETE',
		});
		loadFiles(currentPath!);
	}

	function rename(oldPath: string) {
		const currentName = oldPath.split('\\').pop() ?? '';

		setRenamePath(oldPath);
		setRenameValue(currentName);
		setRenaming(true);
	}

	async function submitRename() {
		if (!renameValue.trim()) return;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				oldPath: renamePath,
				newName: renameValue.trim(),
			}),
		});

		await loadFiles(currentPath!);

		setRenaming(false);
		setRenamePath('');
		setRenameValue('');
	}

	async function createFolder() {
		if (!currentPath || !folderName.trim()) return;

		const name = folderName.trim();

		const optimisticFolder: FileEntry = {
			path: `${currentPath}\\${name}`,
			name,
			type: 'directory',
			size: 0,
		};

		setFiles((current) => [optimisticFolder, ...current]);

		setCreatingFolder(false);
		setFolderName('');

		try {
			await fetch('/api/files/folder', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					path: currentPath,
					name,
				}),
			});

			await loadFiles(currentPath);
		} catch {
			await loadFiles(currentPath);
		}
	}

	async function uploadFiles(fileList: File[]) {
		if (!currentPath) return;

		for (const file of fileList) {
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

	async function upload(e: React.ChangeEvent<HTMLInputElement>) {
		if (!e.target.files) return;

		await uploadFiles(Array.from(e.target.files));
	}

	function openContextMenu(e: React.MouseEvent, file: FileEntry) {
		e.preventDefault();

		setContextMenu({
			x: e.clientX,
			y: e.clientY,
			file,
		});
	}

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/files').then((r) => r.json());
			setSettings(s);

			if (s?.path) navigate(s.path);

			setLoading(false);
		})();
	}, []);

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			if (e.key === 'Escape') {
				clearSelection();
			}

			if (e.key === 'Delete' && selected.length > 0) {
				e.preventDefault();

				setDeleteTarget(selected.length === 1 ? selected[0] : 'MULTI');
			}

			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
				e.preventDefault();

				setSelected(filtered.map((f) => f.path));
			}

			if (e.key === 'F2' && selectedFile) {
				e.preventDefault();

				rename(selectedFile.path);
			}

			if (e.key === 'Enter' && selectedFile) {
				e.preventDefault();

				openFile(selectedFile);
			}
		}

		window.addEventListener('keydown', handleKeyDown);

		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selected, selectedFile, filtered]);

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

	if (loading) {
		return <div className='text-sm text-zinc-500 dark:text-zinc-400'>Loading…</div>;
	}

	if (!settings?.path) {
		return <div className='text-sm text-zinc-500 dark:text-zinc-400'>No files path configured.</div>;
	}

	return (
		<div
			className='space-y-6 relative'
			onDragEnter={(e) => {
				e.preventDefault();

				dragCounter.current++;

				setDragging(true);
			}}
			onDragOver={(e) => {
				e.preventDefault();
			}}>
			<PageHeader icon={<Folder size={20} />} title='Files' description='Browse, upload and manage files' />

			{/* Toolbar */}
			<Card className='p-4 sticky top-4 z-20 backdrop-blur bg-white/80 dark:bg-zinc-900/80'>
				<div className='flex flex-wrap items-center justify-between gap-4'>
					<div className='flex flex-wrap items-center gap-3'>
						<Button icon={<ChevronLeft size={16} />} onClick={goBack} disabled={!canGoBack} />

						<Button icon={<ChevronRight size={16} />} onClick={goForward} disabled={!canGoForward} />

						<Button icon={<ArrowUp size={16} />} onClick={goUp} disabled={!canGoUp} />

						<div className='w-full md:w-80'>
							<Input icon={<Search size={16} />} placeholder='Search files...' value={query} onChange={(e) => setQuery(e.target.value)} />
						</div>

						<ViewToggle value={view} onChange={setView} />

						<>
							<Button variant='secondary' icon={<Folder size={16} />} onClick={() => setCreatingFolder(true)}>
								New Folder
							</Button>

							<Button icon={<Upload size={16} />} onClick={() => uploadRef.current?.click()}>
								Upload
							</Button>
						</>

						<input type='file' ref={uploadRef} multiple className='hidden' onChange={upload} />
					</div>

					{selected.length > 0 && (
						<div className='flex items-center gap-2'>
							<span className='text-sm text-zinc-500'>{selected.length === 1 ? selectedFile?.name : `${selected.length} selected`}</span>

							<Button variant='ghost' onClick={clearSelection}>
								Clear
							</Button>

							{selected.length === 1 && selectedFile && (
								<Button variant='secondary' icon={<Pencil size={16} />} onClick={() => rename(selectedFile.path)}>
									Rename
								</Button>
							)}

							<Button variant='danger' onClick={() => setDeleteTarget(selected.length === 1 ? selected[0] : 'MULTI')}>
								Delete
							</Button>
						</div>
					)}
				</div>
			</Card>

			{/* NAVIGATION */}

			<Card className='p-4'>
				<div className='flex flex-wrap items-center gap-2'>
					{breadcrumbs.map((crumb, index) => (
						<div key={crumb.path} className='flex items-center gap-2'>
							{index > 0 && <span className='text-(--text-muted)'>/</span>}

							<Button variant='ghost' onClick={() => navigate(crumb.path)}>
								{index === 0 ? <Home size={16} /> : crumb.label}
							</Button>
						</div>
					))}
				</div>
			</Card>

			{/* Table */}
			{view === 'grid' ? (
				<FileGrid
					permission={'files.write'}
					files={filtered}
					onDownload={(file) => download(file.path)}
					onEdit={(file) => rename(file.path)}
					// onOpen={(file) => openFile(file)}
				/>
			) : (
				<FileList
					permission={'files.write'}
					files={filtered}
					onDownload={(file) => download(file.path)}
					onEdit={(file) => rename(file.path)}
					// onOpen={(file) => openFile(file)}
				/>
			)}

			<Modal
				open={creatingFolder}
				title='Create Folder'
				onClose={() => {
					setCreatingFolder(false);
					setFolderName('');
				}}
				footer={
					<>
						<Button
							variant='secondary'
							onClick={() => {
								setCreatingFolder(false);
								setFolderName('');
							}}>
							Cancel
						</Button>

						<Button onClick={createFolder}>Create</Button>
					</>
				}>
				<Input
					autoFocus
					label='Folder Name'
					value={folderName}
					onChange={(e) => setFolderName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							createFolder();
						}
					}}
					placeholder='New Folder'
				/>
			</Modal>

			<Modal
				open={renaming}
				title='Rename'
				onClose={() => {
					setRenaming(false);
					setRenamePath('');
					setRenameValue('');
				}}
				footer={
					<>
						<Button
							variant='secondary'
							onClick={() => {
								setRenaming(false);
								setRenamePath('');
								setRenameValue('');
							}}>
							Cancel
						</Button>

						<Button onClick={submitRename}>Rename</Button>
					</>
				}>
				<Input
					autoFocus
					value={renameValue}
					onChange={(e) => setRenameValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							submitRename();
						}
					}}
					label='Name'
				/>
			</Modal>

			<ConfirmDialog
				open={!!deleteTarget}
				title='Delete Files'
				description={selected.length > 1 ? `Delete ${selected.length} items?` : 'This action cannot be undone.'}
				onClose={() => setDeleteTarget(null)}
				onConfirm={async () => {
					if (deleteTarget === 'MULTI') {
						for (const path of selected) {
							await remove(path);
						}

						clearSelection();
					} else if (deleteTarget) {
						await remove(deleteTarget);
					}

					setDeleteTarget(null);
				}}
			/>

			{dragging && (
				<motion.div
					initial={{
						opacity: 0,
					}}
					animate={{
						opacity: 1,
					}}
					exit={{
						opacity: 0,
					}}
					onDragLeave={() => {
						dragCounter.current--;

						if (dragCounter.current <= 0) {
							setDragging(false);
						}
					}}
					onDrop={async (e) => {
						e.preventDefault();

						dragCounter.current = 0;
						setDragging(false);

						const files = Array.from(e.dataTransfer.files);

						if (files.length === 0) return;

						await uploadFiles(files);
					}}
					className='
			fixed inset-0
			z-[100]
			bg-black/40
			backdrop-blur-sm

			flex
			items-center
			justify-center
		'>
					<Card className='p-12 text-center'>
						<div className='space-y-3'>
							<Upload size={48} className='mx-auto text-(--accent)' />

							<h2 className='text-xl font-semibold'>Drop files to upload</h2>

							<p className='text-sm text-zinc-500'>Release your files anywhere to upload them into this folder.</p>
						</div>
					</Card>
				</motion.div>
			)}
		</div>
	);
}
