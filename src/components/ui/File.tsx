/** @format */
'use client';

import { Calendar, Download, FileText, UserIcon, Users } from 'lucide-react';

import Button from '@/components/ui/Button';
import { User } from 'next-auth'; // adjust import

type Props = {
	file: {
		name: string;
		path: string;
	};

	users?: User[];
	compact?: boolean;

	onDownload?: () => void;
};

function getInitials(name?: string) {
	if (!name) return '';

	return name
		.split(/\s+/)
		.map((x) => x[0])
		.join('')
		.toUpperCase();
}

export default function File({ file, users = [], onDownload, compact = false }: Props) {
	const extension = file.name.split('.').pop() ?? '';

	const filename = file.name.replace(new RegExp(`\\.${extension}$`), '');

	const parts = filename.split('__');

	const rawName = parts[0] ?? '';
	const rawDate = parts[1] ?? '';
	const rawUploader = parts[2] ?? '';
	const rawCollaborators = parts[3] ?? '';
	const rawComment = parts.slice(4).join('__');

	const formattedName = rawName.replaceAll('_', ' ');

	const formattedComment = rawComment.replaceAll('__', ' ');

	const formattedDate = rawDate.length === 8 ? `${rawDate.slice(0, 2)}/${rawDate.slice(2, 4)}/${rawDate.slice(4, 8)}` : rawDate;

	const uploader = users.find((u) => getInitials(u.name as string) === rawUploader)?.name ?? rawUploader;

	const collaborators = rawCollaborators
		.split('-')
		?.filter(Boolean)
		.map((initials) => {
			return users.find((u) => getInitials(u.name as string) === initials)?.name ?? initials;
		});

	if (compact)
		return (
			<div className='rounded-xl dark:bg-zinc-900 px-4 py-3 flex items-center justify-between gap-4'>
				<div className='min-w-0 flex-1'>
					<div className='truncate font-medium'>{formattedName}</div>

					<div className='flex flex-wrap gap-3 mt-1 text-xs text-zinc-500'>
						<span>{formattedDate}</span>

						<span>{uploader || '-'}</span>

						{!!collaborators.length && <span>{collaborators.join(', ')}</span>}
					</div>

					{!!formattedComment && <div className='text-xs text-zinc-400 truncate mt-1'>{formattedComment}</div>}
				</div>

				<Button size='sm' icon={<Download size={14} />} onClick={onDownload}></Button>
			</div>
		);

	return (
		<div className='rounded-2xl dark:bg-zinc-900 p-4 transition hover:shadow-md min-h-45'>
			<div className='flex items-start justify-between gap-4'>
				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<FileText size={18} className='text-zinc-400 shrink-0' />

						<h3 className='font-semibold truncate'>{formattedName}</h3>
					</div>

					{!!formattedComment && <p className='text-sm text-zinc-500 mt-2 wrap-break-word'>{formattedComment}</p>}
				</div>

				<Button icon={<Download size={14} />} onClick={onDownload}></Button>
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
