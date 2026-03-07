/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, File, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useUpload } from '@/providers/UploadProvider';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

export default function Documents({ basePath, client }: { basePath: string; client: string }) {
	const { uploading, uploadFile } = useUpload();
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const docsPath = `${basePath}/${client}/documents`;
		const res = await fetch(`/api/files?view=${encodeURIComponent(docsPath)}&ensure=1`);
		const data: FileEntry[] = await res.json();

		const filtered = data.filter((f) => f.type === 'file' && DOCUMENT_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		setFiles(filtered);
		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const upload = async (file: File) => {
		const success = await uploadFile(file, client, 'documents');
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

	const sectionBase = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-6'>
			<header className='flex items-center gap-3'>
				<div className='h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center'>
					<File className='w-5 h-5 text-indigo-600 dark:text-indigo-400' strokeWidth={1.8} />
				</div>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Documents</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>PDF, Word and Excel files</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='.pdf,.doc,.docx,.xls,.xlsx' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div className={sectionBase}>
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center px-5 py-4 text-sm font-medium text-gray-900 dark:text-zinc-100'>
					<span>Files ({files.length})</span>

					{open ? <ChevronUp className='w-4 h-4 text-gray-400 dark:text-zinc-500' /> : <ChevronDown className='w-4 h-4 text-gray-400 dark:text-zinc-500' />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className='px-5 pb-5 space-y-4'>
							<div className='flex justify-end'>
								<button
									onClick={() => inputRef.current?.click()}
									disabled={uploading}
									className={`
										h-10 px-4 flex items-center gap-2 rounded-xl
										text-sm font-medium transition-colors
										${uploading ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500'}
									`}>
									<Upload className='w-4 h-4' />
									{uploading ? 'Uploading…' : 'Upload'}
								</button>
							</div>

							{loading && <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading documents…</div>}

							{!loading && files.length === 0 && (
								<div className='text-sm text-gray-500 dark:text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl p-6 text-center'>No documents found.</div>
							)}

							{!loading &&
								files.map((file, index) => (
									<motion.div
										key={file.path}
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.03 }}
										className='flex items-center justify-between h-12 px-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:shadow-sm transition'>
										<div className='flex items-center gap-3 min-w-0'>
											<File className='w-4 h-4 text-gray-400 dark:text-zinc-500' />
											<span className='truncate text-sm text-gray-800 dark:text-zinc-200'>{file.name}</span>
										</div>

										<button
											onClick={() => download(file.path)}
											className='flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors'>
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
