/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, Copy, Download, File, Folder, Home, LucideIcon, Pencil, RotateCw, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ContextMenu from '@/components/ui/ContextMenu';
import EmptyState from '@/components/ui/EmptyState';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';

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

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

function isImage(name: string) {
	const lower = name.toLowerCase();
	return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function FilesPage() {
	const abortRef = useRef<AbortController | null>(null);
	const uploadRef = useRef<HTMLInputElement>(null);

	const [settings, setSettings] = useState<Settings | null>(null);
	const [currentPath, setCurrentPath] = useState<string | null>(null);
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

	const hasImages = useMemo(() => files.some((f) => isImage(f.name)), [files]);

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

	function navigate(file: FileEntry) {
		if (file.type === 'directory') {
			clearSelection();

			setQuery('');

			setCurrentPath(file.path);
		}
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

	function goUp() {
		if (!currentPath || !settings?.path || isSearching) return;
		if (currentPath === settings.path) return;

		const parent = currentPath.substring(0, currentPath.lastIndexOf('\\'));
		setCurrentPath(parent);
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

			if (s?.path) {
				setCurrentPath(s.path);
				await loadFiles(s.path);
			}

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

				navigate(selectedFile);
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
						<Button variant='ghost' icon={<RotateCw size={16} />} onClick={() => currentPath && loadFiles(currentPath, isSearching)} />

						<Button variant='ghost' icon={<ArrowUp size={16} />} onClick={goUp} disabled={isSearching} />

						<Button variant='ghost' icon={<Copy size={16} />} onClick={() => currentPath && copyToClipboard(currentPath)} disabled={isSearching} />

						<div className='w-full md:w-80'>
							<Input icon={<Search size={16} />} placeholder='Search files...' value={query} onChange={(e) => setQuery(e.target.value)} />
						</div>

						{hasImages && (
							<Button variant='secondary' onClick={() => setView((v) => (v === 'list' ? 'grid' : 'list'))}>
								{view === 'list' ? 'Gallery' : 'List'}
							</Button>
						)}

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
				<div className='flex flex-wrap items-center gap-2 text-sm'>
					<button onClick={() => settings?.path && setCurrentPath(settings.path)} className='font-medium text-(--accent)'>
						<Home size={16} />
					</button>

					{currentPath &&
						settings?.path &&
						currentPath
							.replace(settings.path, '')
							.split('\\')
							.filter(Boolean)
							.map((segment, index, arr) => {
								const path = settings.path + '\\' + arr.slice(0, index + 1).join('\\');

								return (
									<div key={path} className='flex items-center gap-2'>
										<span className='text-zinc-400'>/</span>

										<button onClick={() => setCurrentPath(path)} className='hover:text-(--accent)'>
											{segment}
										</button>
									</div>
								);
							})}
				</div>
			</Card>

			{/* Table */}
			{view === 'list' ? (
				<motion.div
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden'>
					{/* Header */}
					<div className='hidden md:grid grid-cols-4 px-6 py-3 text-xs uppercase tracking-wide text-zinc-500 bg-zinc-50 dark:bg-zinc-800'>
						<div>Name</div>
						<div>Size</div>
						<div>Modified</div>
						<div className='text-right'>Actions</div>
					</div>

					{loadingFiles && <div className='p-8 text-center text-sm text-zinc-500'>Loading files...</div>}

					{!loadingFiles && filtered.length === 0 && (
						<div className='p-8'>
							<EmptyState icon={<Folder size={24} />} title='Folder is empty' description='Upload files or create a folder to get started.' />
						</div>
					)}

					{!loadingFiles &&
						filtered.map((file) => (
							<motion.div
								layout
								key={file.path}
								onClick={(e) => toggleSelection(file.path, e)}
								onContextMenu={(e) => openContextMenu(e, file)}
								className={`border-t border-zinc-200 dark:border-zinc-800 transition ${selected.includes(file.path) ? `bg-(--active-accent) dark:bg-(--accent)/10` : `hover:bg-zinc-50 dark:hover:bg-zinc-800`}`}>
								<div className='flex md:grid md:grid-cols-4 items-center px-4 md:px-6 py-4 gap-3'>
									{/* Name */}
									<div
										className='flex items-start gap-3 cursor-pointer flex-1'
										onDoubleClick={() => {
											navigate(file);
										}}>
										{file.type === 'directory' ? (
											<Folder size={18} className='text-(--accent)' />
										) : isImage(file.name) ? (
											<img src={`/api/files/download?path=${encodeURIComponent(file.path)}`} className='w-6 h-6 object-cover rounded' />
										) : (
											<File size={18} className='text-zinc-400' />
										)}

										<div className='flex flex-col min-w-0'>
											<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate'>{file.name}</span>

											{/* Mobile meta */}
											<div className='text-xs text-zinc-500 md:hidden mt-1 space-x-3'>
												<span>{formatSize(file.size)}</span>
												<span>{formatDate(file.modified)}</span>
											</div>
										</div>
									</div>

									{/* Size */}
									<div className='hidden md:block text-sm text-zinc-500'>{formatSize(file.size)}</div>

									{/* Modified */}
									<div className='hidden md:block text-sm text-zinc-500'>{formatDate(file.modified)}</div>

									{/* Actions */}
									<div className='flex justify-end gap-2'>
										<ActionIcon icon={Copy} onClick={() => copyToClipboard(file.path)} />
										<ActionIcon icon={Download} onClick={() => download(file.path)} />
										<ActionIcon icon={Pencil} onClick={() => rename(file.path)} />
										<ActionIcon icon={Trash2} onClick={() => setDeleteTarget(file.path)} danger />
									</div>
								</div>
							</motion.div>
						))}
				</motion.div>
			) : (
				/* ===== GRID / IMAGE VIEW ===== */
				<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
					{filtered.length === 0 ? (
						<EmptyState icon={<Folder size={24} />} title='Folder is empty' description='Upload files or create a folder to get started.' />
					) : (
						<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
							{filtered.map((file, i) => {
								const image = isImage(file.name);

								return (
									<Card
										key={file.path}
										onContextMenu={(e) => openContextMenu(e, file)}
										className={`group relative overflow-hidden p-0 cursor-pointer ${selected.includes(file.path) ? `ring-2 ring-(--accent)` : ''}`}>
										{image ? (
											<Image src={`/api/files/download?path=${encodeURIComponent(file.path)}`} className='w-full h-40 object-cover' alt={file.name} height={512} width={512} />
										) : (
											<div className='h-40 flex items-center justify-center'>
												{' '}
												{file.type === 'directory' ? <Folder size={32} className='text-(--accent)' /> : <File size={32} className='text-zinc-400' />}{' '}
											</div>
										)}

										<div className='p-3'>
											{' '}
											<p className='text-sm font-medium truncate'>{file.name}</p> <p className='text-xs text-zinc-500 mt-1'>{formatSize(file.size)}</p>
										</div>

										<div className='absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition'>
											{' '}
											<ActionIcon icon={Download} onClick={() => download(file.path)} /> <ActionIcon icon={Trash2} onClick={() => setDeleteTarget(file.path)} danger />
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</motion.div>
			)}

			<ContextMenu
				open={!!contextMenu.file}
				x={contextMenu.x}
				y={contextMenu.y}
				onClose={() =>
					setContextMenu({
						x: 0,
						y: 0,
						file: null,
					})
				}
				items={
					contextMenu.file
						? [
								{
									label: 'Open',
									icon: <Folder size={16} />,
									onClick: () => navigate(contextMenu.file!),
								},
								{
									label: 'Rename',
									icon: <Pencil size={16} />,
									onClick: () => rename(contextMenu.file!.path),
								},
								{
									label: 'Download',
									icon: <Download size={16} />,
									onClick: () => download(contextMenu.file!.path),
								},
								{
									label: 'Copy Path',
									icon: <Copy size={16} />,
									onClick: () => copyToClipboard(contextMenu.file!.path),
								},
								{
									label: 'Delete',
									icon: <Trash2 size={16} />,
									danger: true,
									onClick: () => setDeleteTarget(contextMenu.file!.path),
								},
							]
						: []
				}
			/>

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

function ActionIcon({ icon: Icon, onClick, danger }: { icon: LucideIcon; onClick: () => void; danger?: boolean }) {
	return <Button size='sm' variant={danger ? 'danger-ghost' : 'ghost'} icon={<Icon size={14} />} onClick={onClick} />;
}
