/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, File, FileText, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

const SCHEMA_EXTENSIONS = ['.pdf', '.schrack', '.trikker'];

export default function Schemas({ basePath, client }: { basePath: string; client: string }) {
	const { uploading, uploadFile } = useUpload();
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const schemasPath = `${basePath}/${client}/schema`;
		const res = await fetch(`/api/files?view=${encodeURIComponent(schemasPath)}`);
		const data: FileEntry[] = await res.json();

		const filtered = data.filter((f) => f.type === 'file' && SCHEMA_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		setFiles(filtered);
		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const upload = async (file: File) => {
		const success = await uploadFile(file, client, 'schema');
		if (success) await load();
	};

	const download = (path: string) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;
		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const section = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-6'>
			{/* Header */}
			<header className='flex items-center gap-3'>
				<div className='h-10 w-10 rounded-xl bg-(--active-accent) dark:bg-(--accent)/30 flex items-center justify-center'>
					<FileText className='w-5 h-5 text-(--accent) dark:text-(--accent)' />
				</div>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Schemas</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>PDF, .schrack, .trikker files</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='.pdf,.schrack,.trikker' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div className={section}>
				{/* Collapse Header */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center px-5 py-4 text-sm font-medium text-gray-900 dark:text-zinc-100'>
					<span>Files ({files.length})</span>
					{open ? <ChevronUp className='w-4 h-4 text-gray-400 dark:text-zinc-500' /> : <ChevronDown className='w-4 h-4 text-gray-400 dark:text-zinc-500' />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className='px-5 pb-5 space-y-4'>
							{/* Upload Button */}
							<div className='flex justify-end'>
								<button
									onClick={() => inputRef.current?.click()}
									disabled={uploading}
									className={`h-10 px-4 flex items-center gap-2 rounded-xl text-sm font-medium transition
										${uploading ? 'bg-(--accent) text-white cursor-not-allowed' : 'bg-(--accent) text-white hover:bg-(--hover-accent)'}`}>
									<Upload className='w-4 h-4' />
									{uploading ? 'Uploading…' : 'Upload'}
								</button>
							</div>

							{/* Loading */}
							{loading && <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading schemas…</div>}

							{/* Empty */}
							{!loading && files.length === 0 && (
								<div className='text-sm text-gray-500 dark:text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-6 text-center'>No schema files found.</div>
							)}

							{/* Files */}
							{!loading &&
								files.map((file, index) => (
									<motion.div
										key={file.path}
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.03 }}
										className='
											flex items-center justify-between
											h-12 px-4
											rounded-2xl
											border border-gray-200 dark:border-zinc-700
											bg-gray-50 dark:bg-zinc-800
											hover:bg-white dark:hover:bg-zinc-700
											hover:shadow-sm
											transition
										'>
										<div className='flex items-center gap-3 min-w-0'>
											<File className='w-4 h-4 text-gray-400 dark:text-zinc-500' />
											<span className='truncate text-sm text-gray-800 dark:text-zinc-100'>{file.name}</span>
										</div>

										<button
											onClick={() => download(file.path)}
											className='flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-(--hover-accent) dark:hover:text-(--hover-accent) transition'>
											<Download className='w-4 h-4' />
											Download
										</button>
									</motion.div>
								))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
