/** @format */
'use client';

import { Calendar, Download, Eye, FileText, Loader2, Pencil, UserIcon, Users } from 'lucide-react';

import Button from '@/components/ui/Button';
import FileIcon from './FileIcon';
import FileViewer from './FileViewer';
import { User } from 'next-auth'; // adjust import
import { usePermissions } from '@/providers/PermissionsProvider';
import { useState } from 'react';

export type FileEntry = {
	name: string;
	path: string;
	type?: string;
	thumbnail?: string;
};

type Props = {
	file: FileEntry;

	permission?: string;
	users?: User[];
	compact?: boolean;
	image?: boolean;

	onDownload?: () => void;
	onEdit?: () => void;
	onDragStart?: (file: FileEntry) => void;
};

function getInitials(name?: string) {
	if (!name) return '';

	return name
		.split(/\s+/)
		.map((x) => x[0])
		.join('')
		.toUpperCase();
}

export default function File({ file, users = [], onDownload, onEdit, onDragStart, compact = false, image = false, permission }: Props) {
	const { has } = usePermissions();

	const [download, setDownload] = useState(false);
	const [viewing, setViewing] = useState(false);

	const isAllowed = (permission && has(permission as any)) ?? false;

	const extension = file.type === 'directory' ? '' : (file.name.split('.').pop() ?? '');

	const filename = file.name.replace(new RegExp(`\\.${extension}$`), '');

	const parts = filename.split('__');

	const rawName = parts[0] ?? '';
	const rawDate = parts[1] ?? '';
	const rawUploader = parts[2] ?? '';
	const rawCollaborators = parts[3] ?? '';
	const rawComment = parts.slice(4).join('__');

	const formattedName = rawName.replaceAll('_', ' ');

	const formattedComment = rawComment.replaceAll('__', ' ');

	const formattedDate = rawDate.length === 8 ? `${rawDate.slice(6, 8)}/${rawDate.slice(4, 6)}/${rawDate.slice(0, 4)}` : rawDate;

	const uploader = users.find((u) => getInitials(u.name as string) === rawUploader)?.name ?? rawUploader;

	const collaborators = rawCollaborators
		.split('-')
		?.filter(Boolean)
		.map((initials) => {
			return users.find((u) => getInitials(u.name as string) === initials)?.name ?? initials;
		});

	const isImage = image || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension);

	function handleDownload() {
		onDownload?.();

		setDownload(true);

		setTimeout(() => {
			setDownload(false);
		}, 5000);
	}

	if (isImage && !compact)
		return (
			<>
				<div className='rounded-2xl dark:bg-zinc-900 overflow-hidden transition hover:shadow-md' draggable={isAllowed || false} onDragStart={() => onDragStart?.(file)}>
					<button type='button' onClick={() => setViewing(true)} className='group aspect-square overflow-hidden w-full max-h-50 block cursor-zoom-in'>
						<div className='transition-transform duration-200 group-hover:scale-105'>
							<FileIcon file={file} height={1080} width={1920} />
						</div>
					</button>

					<div className='p-4'>
						<div className='font-medium truncate'>{formattedName}</div>

						<div className='flex gap-2 mt-3'>
							{isAllowed && <Button icon={<Pencil size={14} />} onClick={onEdit} />}

							<Button icon={download ? <Loader2 size={14} className='animate-spin' /> : <Download size={14} />} onClick={handleDownload} disabled={download} />
						</div>
					</div>
				</div>

				<FileViewer file={file} open={viewing} onClose={() => setViewing(false)} />
			</>
		);

	if (compact)
		return (
			<>
				<div className='rounded-xl dark:bg-zinc-900 px-4 py-3 flex items-center justify-between gap-4' draggable={isAllowed || false} onDragStart={() => onDragStart?.(file)}>
					<div className='min-w-0 flex-1'>
						<div className='flex items-center gap-2'>
							<FileIcon file={file} size={16} />

							<div className='truncate font-medium'>{formattedName}</div>
						</div>

						<div className='flex flex-wrap gap-3 mt-1 text-xs text-zinc-500'>
							<span>{formattedDate}</span>

							<span>{uploader || '-'}</span>

							{!!collaborators.length && <span>{collaborators.join(', ')}</span>}
						</div>

						{!!formattedComment && <div className='text-xs text-zinc-400 truncate mt-1'>{formattedComment}</div>}
					</div>

					<div className='flex gap-2'>
						{isImage && <Button icon={<Eye size={14} />} onClick={() => setViewing(true)} />}

						{isAllowed && <Button icon={<Pencil size={14} />} onClick={onEdit} />}

						<Button icon={download ? <Loader2 size={14} className='animate-spin' /> : <Download size={14} />} onClick={handleDownload} disabled={download} />
					</div>
				</div>
				<FileViewer file={file} open={viewing} onClose={() => setViewing(false)} />
			</>
		);

	return (
		<div className='rounded-2xl dark:bg-zinc-900 p-4 transition hover:shadow-md min-h-45' draggable={isAllowed || false} onDragStart={() => onDragStart?.(file)}>
			<div className='flex items-start justify-between gap-4'>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<FileIcon file={file} size={18} />

						<h3 className='font-semibold truncate'>{formattedName}</h3>
					</div>

					{!!formattedComment && <p className='text-sm text-zinc-500 mt-2 wrap-break-word'>{formattedComment}</p>}
				</div>

				<div className='flex gap-2'>
					{isAllowed && <Button icon={<Pencil size={14} />} onClick={onEdit} />}

					<Button icon={download ? <Loader2 size={14} className='animate-spin' /> : <Download size={14} />} onClick={handleDownload} disabled={download} />
				</div>
			</div>

			<div className='mt-4 grid gap-2 text-sm text-zinc-500'>
				<div className='flex items-center gap-2'>
					<Calendar size={14} />
					<span>{formattedDate || '-'}</span>
				</div>

				<div className='flex items-center gap-2'>
					<UserIcon size={14} />
					<span>{uploader || '-'}</span>
				</div>

				<div className='flex items-center gap-2'>
					<Users size={14} />
					<span>{collaborators.length ? collaborators.join(', ') : '-'}</span>
				</div>
			</div>
		</div>
	);
}
