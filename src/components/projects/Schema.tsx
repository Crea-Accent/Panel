/** @format */
'use client';

import { useEffect, useRef, useState } from 'react';

import FileEditModal from '../files/FileEditModal';
import FileGrid from '../files/FileGrid';
import FileList from '../files/FileList';
import FileUploadModal from '../files/FileUploadModal';
import Loading from '../ui/Loading';
import { Upload } from 'lucide-react';
import { User } from 'next-auth';
import ViewToggle from '../ui/ViewToggle';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useSession } from 'next-auth/react';
import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

const SCHEMA_EXTENSIONS = ['.pdf', '.schrack', '.trik'];

export default function Schemas({ basePath, client }: { basePath: string; client: string }) {
	const inputRef = useRef<HTMLInputElement>(null);

	const { data: session } = useSession();

	const { uploading, uploadFile } = useUpload();
	const { has } = usePermissions();

	const [files, setFiles] = useState<FileEntry[]>([]);
	const [users, setUsers] = useState<User[]>([]);

	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const [view, setView] = useState<'grid' | 'list'>('list');

	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadModalOpen, setUploadModalOpen] = useState(false);

	const [editingFile, setEditingFile] = useState<FileEntry | null>(null);
	const [editModalOpen, setEditModalOpen] = useState(false);

	const canWrite = has('projects.write');

	const load = async () => {
		try {
			setLoading(true);

			const schemasPath = `${basePath}/${client}/schema`;

			const [filesRes, usersRes] = await Promise.all([fetch(`/api/files?view=${encodeURIComponent(schemasPath)}`), fetch('/api/users')]);

			const fileData: FileEntry[] = await filesRes.json();
			const userData = await usersRes.json();

			setUsers(userData.users ?? []);

			setFiles(fileData.filter((file) => file.type === 'file' && SCHEMA_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))));
		} finally {
			setLoading(false);
		}
	};

	const download = (path: string) => {
		const a = document.createElement('a');

		a.href = `/api/files/download?path=${encodeURIComponent(path)}`;

		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const uploadWithMetadata = async (file: File, name: string, comment: string, collaborators: string[]) => {
		await uploadFile(file, client, 'schema', {
			name,
			comment,
			collaborators,
		});
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
		if (!session?.user?.preferences?.defaultView) return;

		setView(session.user.preferences.defaultView);
	}, [session]);

	useEffect(() => {
		load();
	}, [basePath, client]);

	return (
		<section className='space-y-6'>
			<input
				ref={inputRef}
				type='file'
				multiple
				accept='.pdf,.schrack,.trik'
				className='hidden'
				onChange={(e) => {
					const files = Array.from(e.target.files ?? []);

					if (!files.length) return;

					setSelectedFiles(files);
					setUploadModalOpen(true);

					e.target.value = '';
				}}
			/>

			<div
				className='rounded-3xl p-6 space-y-6'
				style={{
					background: 'var(--container)',
					border: '1px solid var(--border)',
				}}>
				<div className='flex items-center justify-between'>
					<div></div>
					<div className='flex gap-2'>
						<ViewToggle value={view ?? 'list'} onChange={setView} />

						{canWrite && (
							<button
								onClick={() => inputRef.current?.click()}
								disabled={uploading}
								className='h-10 px-4 flex items-center gap-2 rounded-xl bg-(--accent) text-white hover:bg-(--hover-accent) transition'>
								<Upload size={16} />

								{uploading ? 'Uploading...' : 'Upload'}
							</button>
						)}
					</div>
				</div>

				{loading && <Loading title="Loading schema's" />}

				{!loading && files.length === 0 && <div className='border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-10 text-center text-sm text-zinc-500'>No schema files found</div>}

				{view === 'grid' ? (
					<FileGrid
						files={files}
						users={users}
						onDownload={download}
						onEdit={(file) => {
							setEditingFile(file);
							setEditModalOpen(true);
						}}
						permission='projects.write'
					/>
				) : (
					<FileList
						files={files}
						users={users}
						onDownload={download}
						onEdit={(file) => {
							setEditingFile(file);
							setEditModalOpen(true);
						}}
						permission='projects.write'
					/>
				)}
			</div>

			<FileUploadModal
				open={uploadModalOpen}
				files={selectedFiles}
				users={users}
				onUpload={uploadWithMetadata}
				onClose={async () => {
					setUploadModalOpen(false);
					setSelectedFiles([]);

					await load();
				}}
			/>

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
