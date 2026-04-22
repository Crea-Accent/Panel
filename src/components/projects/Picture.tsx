/** @format */

// eslint-disable @typescript-eslint/no-explicit-any

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Eye, Image as ImageIcon, Pencil, Trash2, Upload, X } from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
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

/* ---------------- Draggable ---------------- */

function DraggableImage({ img, children, enabled }: { img: FileEntry; children: React.ReactNode; enabled: boolean }) {
	const { attributes, listeners, setNodeRef } = useDraggable({
		id: img.path,
		disabled: !enabled,
	});

	if (!enabled) return <>{children}</>;

	return (
		<div ref={setNodeRef}>
			<div {...listeners} {...attributes}>
				{children}
			</div>
		</div>
	);
}

/* ---------------- Droppable Folder ---------------- */

function DroppableFolder({ id, children, enabled }: { id: string; children: React.ReactNode; enabled: boolean }) {
	const { setNodeRef, isOver } = useDroppable({
		id,
		disabled: !enabled,
	});

	if (!enabled) return <div className='space-y-4'>{children}</div>;

	return (
		<div
			ref={setNodeRef}
			className={`
			space-y-4
			transition
			${isOver ? 'ring-2 ring-(--accent) rounded-xl p-2' : ''}
		`}>
			{children}
		</div>
	);
}

export default function Pictures({ basePath, client }: { basePath: string; client: string }) {
	const { uploading, uploadFile } = useUpload();

	const [groups, setGroups] = useState<FolderGroup[]>([]);
	const [loading, setLoading] = useState(true);

	const [viewerImages, setViewerImages] = useState<FileEntry[]>([]);
	const [viewerIndex, setViewerIndex] = useState<number | null>(null);

	const [draggingImage, setDraggingImage] = useState<FileEntry | null>(null);

	const [isMobile, setIsMobile] = useState(false);

	const inputRef = useRef<HTMLInputElement | null>(null);

	const baseDir = `${basePath}/${client}/picture`;

	/* ---------------- Detect mobile ---------------- */

	useEffect(() => {
		(() => {
			const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

			setIsMobile(touch);
		})();
	}, []);

	const dragEnabled = !isMobile;

	/* ---------------- Load ---------------- */

	const load = async () => {
		setLoading(true);

		const res = await fetch(`/api/files?view=${encodeURIComponent(baseDir)}&recursive=1`);
		const data: FileEntry[] = await res.json();

		const directories = data.filter((f) => f.type === 'directory');

		const imageFiles = data.filter((f) => f.type === 'file' && IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		const grouped: Record<string, FileEntry[]> = {};

		for (const dir of directories) grouped[dir.name] = [];

		for (const file of imageFiles) {
			const normalized = file.path.replace(/\\/g, '/');
			const parts = normalized.split('/');
			const idx = parts.lastIndexOf('pictures');

			let folder = 'Ungrouped';

			if (idx !== -1 && parts.length > idx + 2) {
				folder = parts[idx + 1];
			}

			if (!grouped[folder]) grouped[folder] = [];

			grouped[folder].push(file);
		}

		if (!grouped['Ungrouped']?.length) delete grouped['Ungrouped'];

		setGroups(
			Object.entries(grouped).map(([name, images]) => ({
				name,
				images,
			}))
		);

		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	/* ---------------- Upload ---------------- */

	const upload = async (files: FileList) => {
		for (const file of Array.from(files)) {
			await uploadFile(file, client, 'picture');
		}

		load();
	};

	/* ---------------- Image Actions ---------------- */

	const renameFolder = async (name: string) => {
		const newName = prompt('New folder name', name);
		if (!newName || newName === name) return;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				oldPath: `${baseDir}/${name}`,
				newName,
			}),
		});

		load();
	};

	const deleteFolder = async (name: string) => {
		if (!confirm(`Delete folder "${name}" and all images?`)) return;

		await fetch(`/api/files?path=${encodeURIComponent(`${baseDir}/${name}`)}`, {
			method: 'DELETE',
		});

		load();
	};

	const download = (path: string) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;

		const a = document.createElement('a');
		a.href = url;
		a.download = path.split('/').pop() || 'file';

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const deleteImage = async (path: string) => {
		if (!confirm('Delete image?')) return;

		await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
			method: 'DELETE',
		});

		load();
	};

	const renameImage = async (path: string, name: string) => {
		const newName = prompt('New file name', name);
		if (!newName) return;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				oldPath: path,
				newName,
			}),
		});

		load();
	};

	const moveImage = async (path: string, folder: string) => {
		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				oldPath: path,
				newDir: `${baseDir}/${folder}`,
			}),
		});

		load();
	};

	/* ---------------- Drag ---------------- */

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleDragStart = (event: any) => {
		const path = event.active.id;

		const img = groups.flatMap((g) => g.images).find((i) => i.path === path);

		if (img) setDraggingImage(img);
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleDragEnd = (event: any) => {
		if (!dragEnabled) return;

		const { active, over } = event;

		setDraggingImage(null);

		if (!over) return;

		const img = groups.flatMap((g) => g.images).find((i) => i.path === active.id);
		if (!img) return;

		const parts = img.path.replace(/\\/g, '/').split('/');
		const currentFolder = parts[parts.length - 2];

		if (currentFolder === over.id) return;

		moveImage(active.id, over.id);
	};

	/* ---------------- Viewer ---------------- */

	const openViewer = (images: FileEntry[], index: number) => {
		setViewerImages(images);
		setViewerIndex(index);
	};

	const closeViewer = () => setViewerIndex(null);

	const next = () => viewerIndex !== null && setViewerIndex((viewerIndex + 1) % viewerImages.length);

	const prev = () => viewerIndex !== null && setViewerIndex((viewerIndex - 1 + viewerImages.length) % viewerImages.length);

	/* ---------------- UI ---------------- */

	const Content = (
		<>
			<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6'>
				<div className='flex justify-between'>
					<button onClick={() => inputRef.current?.click()} disabled={uploading} className='h-10 px-4 flex items-center gap-2 rounded-xl bg-(--accent) text-white'>
						<Upload className='w-4 h-4' />
						Upload
					</button>
				</div>

				{loading && <div className='text-sm text-gray-500'>Loading images...</div>}

				{groups.map((group) => (
					<DroppableFolder key={group.name} id={group.name} enabled={dragEnabled}>
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<h3 className='text-sm font-medium'>
									{group.name} ({group.images.length})
								</h3>

								<div className='flex items-center gap-2'>
									<button onClick={() => renameFolder(group.name)} className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'>
										<Pencil size={14} />
									</button>

									<button onClick={() => deleteFolder(group.name)} className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'>
										<Trash2 size={14} />
									</button>
								</div>
							</div>

							<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
								{group.images.map((img, i) => (
									<div key={img.path} className='bg-zinc-50 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-sm'>
										<DraggableImage img={img} enabled={dragEnabled}>
											<div className='relative h-40 cursor-pointer' onClick={() => openViewer(group.images, i)}>
												<Image src={`/api/files/download?path=${encodeURIComponent(img.path)}`} alt={img.name} fill className='object-cover' />
											</div>
										</DraggableImage>

										<div className='flex items-center justify-between px-3 py-2 text-xs'>
											<span className='truncate'>{img.name}</span>

											<div className='flex gap-2'>
												<button onClick={() => openViewer(group.images, i)}>
													<Eye size={14} />
												</button>

												<button onClick={() => download(img.path)}>
													<Download size={14} />
												</button>

												<button onClick={() => renameImage(img.path, img.name)}>
													<Pencil size={14} />
												</button>

												<button onClick={() => deleteImage(img.path)}>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</DroppableFolder>
				))}
			</div>

			{dragEnabled && (
				<DragOverlay>
					{draggingImage && (
						<div className='w-40 h-40 rounded-xl overflow-hidden shadow-xl relative'>
							<Image src={`/api/files/download?path=${encodeURIComponent(draggingImage.path)}`} alt={draggingImage.name} fill className='object-cover' />
						</div>
					)}
				</DragOverlay>
			)}
		</>
	);

	return (
		<section className='space-y-6'>
			<header className='flex items-center gap-3'>
				<div className='h-10 w-10 rounded-xl bg-(--active-accent) dark:bg-(--accent)/30 flex items-center justify-center'>
					<ImageIcon className='w-5 h-5 text-(--accent) dark:text-(--accent)' />
				</div>

				<div>
					<h2 className='text-lg font-semibold'>Pictures</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>Site images and documentation</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => e.target.files && upload(e.target.files)} />

			{dragEnabled ? (
				<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
					{Content}
				</DndContext>
			) : (
				Content
			)}

			<AnimatePresence>
				{viewerIndex !== null && viewerImages[viewerIndex] && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 bg-black/90 z-50 flex items-center justify-center'>
						<div className='relative w-[90vw] h-[90vh] flex items-center justify-center'>
							<button onClick={() => setViewerIndex(null)} className='absolute top-6 right-6 text-white z-10'>
								<X />
							</button>

							<button onClick={() => setViewerIndex((viewerIndex - 1 + viewerImages.length) % viewerImages.length)} className='absolute left-4 text-white z-10'>
								<ChevronLeft size={40} />
							</button>

							<div className='relative w-full h-full'>
								<Image src={`/api/files/download?path=${encodeURIComponent(viewerImages[viewerIndex].path)}`} alt={viewerImages[viewerIndex].name} fill className='object-contain' priority />
							</div>

							<button onClick={() => setViewerIndex((viewerIndex + 1) % viewerImages.length)} className='absolute right-4 text-white z-10'>
								<ChevronRight size={40} />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	);
}
