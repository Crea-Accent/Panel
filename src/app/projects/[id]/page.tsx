/** @format */
'use client';

// clients/[id]/page

import { ChevronDown, ChevronUp, Code, Download, File, FileText, Folder, Image as ImageIcon, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { motion } from 'framer-motion';

type Settings = {
	basePath: string;
	requiredFolders: string[];
};

type FileEntry = {
	path: string;
	name: string;
	type: string;
	accessible: boolean;
};

const SCHEMA_EXTENSIONS = ['.pdf', '.schrack', '.trikker'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// turn "DDMMYYYY" into a comparable number YYYYMMDD
function parseDateFromFolderName(name: string): number {
	const parts = name.split(' ');
	const datePart = parts[parts.length - 2]; // second-last token

	if (!/^\d{8}$/.test(datePart)) return 0;

	const dd = datePart.slice(0, 2);
	const mm = datePart.slice(2, 4);
	const yyyy = datePart.slice(4, 8);

	return Number(`${yyyy}${mm}${dd}`);
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
	const [client, setClient] = useState<string | null>(null);
	const [settings, setSettings] = useState<Settings | null>(null);

	const [schemas, setSchemas] = useState<FileEntry[]>([]);
	const [loadingSchemas, setLoadingSchemas] = useState(true);

	const [programmation, setProgrammation] = useState<FileEntry[]>([]);
	const [loadingProg, setLoadingProg] = useState(true);
	const [showOlder, setShowOlder] = useState(false);

	const [pictures, setPictures] = useState<FileEntry[]>([]);
	const [loadingPics, setLoadingPics] = useState(true);

	const schemaInputRef = useRef<HTMLInputElement | null>(null);
	const progInputRef = useRef<HTMLInputElement | null>(null);
	const picsInputRef = useRef<HTMLInputElement | null>(null);

	// ---------- LOAD SCHEMAS ----------
	const loadSchemas = async (basePath: string, id: string) => {
		const schemasPath = `${basePath}/${id}/schemas`;

		const res = await fetch(`/api/files?view=${encodeURIComponent(schemasPath)}`);
		const data: FileEntry[] = await res.json();

		const schemaFiles = data.filter((f) => {
			if (f.type !== 'file') return false;
			const lower = f.name.toLowerCase();
			return SCHEMA_EXTENSIONS.some((ext) => lower.endsWith(ext));
		});

		setSchemas(schemaFiles);
		setLoadingSchemas(false);
	};

	// ---------- LOAD PROGRAMMATION ----------
	const loadProgrammation = async (basePath: string, id: string) => {
		const progPath = `${basePath}/${id}/programmation`;

		const res = await fetch(`/api/files?view=${encodeURIComponent(progPath)}`);
		const data: FileEntry[] = await res.json();

		const projects = data.filter((f) => f.type === 'directory').sort((a, b) => parseDateFromFolderName(b.name) - parseDateFromFolderName(a.name));

		setProgrammation(projects);
		setLoadingProg(false);
	};

	// ---------- LOAD PICTURES ----------
	const loadPictures = async (basePath: string, id: string) => {
		const picsPath = `${basePath}/${id}/pictures`;

		const res = await fetch(`/api/files?view=${encodeURIComponent(picsPath)}`);
		const data: FileEntry[] = await res.json();

		const images = data.filter((f) => {
			if (f.type !== 'file') return false;
			const lower = f.name.toLowerCase();
			return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
		});

		setPictures(images);
		setLoadingPics(false);
	};

	useEffect(() => {
		(async () => {
			const id = decodeURIComponent((await params).id);
			setClient(id);

			const s = await fetch('/api/settings').then((r) => r.json());
			setSettings(s);

			if (!s.basePath) return;

			const clientPath = `${s.basePath}/${id}`;
			await fetch(`/api/files?view=${encodeURIComponent(clientPath)}`);

			await loadSchemas(s.basePath, id);
			await loadProgrammation(s.basePath, id);
			await loadPictures(s.basePath, id);
		})();
	}, [params]);

	// ---------- SCHEMAS UPLOAD ----------
	const handleSchemaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !client || !settings?.basePath) return;

		const file = e.target.files[0];

		const fd = new FormData();
		fd.append('file', file);
		fd.append('client', client);
		fd.append('kind', 'schemas');

		await fetch('/api/files/upload', { method: 'POST', body: fd });
		await loadSchemas(settings.basePath, client);
	};

	// ---------- PROGRAMMATION UPLOAD ----------
	const handleProgrammationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !client || !settings?.basePath) return;

		const file = e.target.files[0];
		const initials = prompt('Your initials?');
		if (!initials) return;

		const fd = new FormData();
		fd.append('file', file);
		fd.append('client', client);
		fd.append('initials', initials.toUpperCase());
		fd.append('kind', 'programmation');

		await fetch('/api/files/upload', { method: 'POST', body: fd });
		await loadProgrammation(settings.basePath, client);
	};

	// ---------- PICTURES UPLOAD ----------
	const handlePicturesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || !client || !settings?.basePath) return;

		const files = Array.from(e.target.files);

		for (const file of files) {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('client', client);
			fd.append('kind', 'pictures');

			await fetch('/api/files/upload', {
				method: 'POST',
				body: fd,
			});
		}

		await loadPictures(settings.basePath, client);
	};

	const downloadPath = (path: string, zip = false) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}${zip ? '&zip=true' : ''}`;

		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	if (!settings) {
		return <div className='text-zinc-900'>Loading…</div>;
	}

	if (!settings.basePath) {
		return (
			<div className='w-full max-w-7xl mx-auto'>
				<h1 className='text-3xl font-semibold'>{client}</h1>
				<p className='text-zinc-500 mt-2'>Base path not configured. Visit settings first.</p>
			</div>
		);
	}

	const latest = programmation[0];
	const older = programmation.slice(1);

	return (
		<div className='w-full max-w-7xl mx-auto space-y-8'>
			<input ref={schemaInputRef} type='file' accept='.pdf,.schrack,.trikker' className='hidden' onChange={handleSchemaUpload} />

			<input ref={progInputRef} type='file' accept='.zip' className='hidden' onChange={handleProgrammationUpload} />

			<input ref={picsInputRef} type='file' accept='image/*' multiple className='hidden' onChange={handlePicturesUpload} />

			<header className='flex items-center gap-4'>
				<div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0'>
					<Folder size={24} />
				</div>
				<div className='flex flex-col min-w-0'>
					<h1 className='text-3xl md:text-4xl font-semibold tracking-tight truncate'>{client}</h1>
					<p className='text-zinc-500'>Project dashboard</p>
				</div>
			</header>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className='space-y-10'>
				{/* SCHEMAS */}
				<section>
					<div className='flex items-center gap-3 mb-3'>
						<div className='w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600'>
							<FileText size={20} />
						</div>
						<div className='flex flex-col'>
							<h2 className='text-xl font-medium'>Schema’s</h2>
							<p className='text-sm text-zinc-500'>PDF, .schrack, .trikker files</p>
						</div>
					</div>

					<div className='bg-white border border-zinc-200 rounded-xl shadow-sm'>
						<div className='p-3 border-b border-zinc-200 flex justify-between items-center'>
							<span className='text-sm font-medium'>Files</span>
							<button onClick={() => schemaInputRef.current?.click()} className='flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm'>
								<Upload size={14} />
								Upload
							</button>
						</div>

						{loadingSchemas && <div className='px-4 py-4 text-zinc-500'>Loading schemas…</div>}

						{!loadingSchemas && schemas.length === 0 && (
							<div className='px-4 py-4 text-zinc-500'>
								No schema files found in <b>schemas/</b>
							</div>
						)}

						{!loadingSchemas && schemas.length > 0 && (
							<div className='divide-y divide-zinc-100'>
								{schemas.map((file) => (
									<div key={file.path} className='px-4 py-3 flex justify-between items-center hover:bg-zinc-50'>
										<div className='flex items-center gap-2'>
											<File size={16} className='text-zinc-500' />
											<span className='text-zinc-800 truncate'>{file.name}</span>
										</div>

										<button onClick={() => downloadPath(file.path)} className='text-sm text-zinc-500 flex items-center gap-1 hover:text-indigo-600'>
											<Download size={14} />
											Download
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</section>

				{/* PROGRAMMATION */}
				<section>
					<div className='flex items-center gap-3 mb-3'>
						<div className='w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600'>
							<Code size={20} />
						</div>
						<div className='flex flex-col'>
							<h2 className='text-xl font-medium'>Programmatie</h2>
							<p className='text-sm text-zinc-500'>Duotecno projects</p>
						</div>
					</div>

					<div className='bg-white border border-zinc-200 rounded-xl shadow-sm'>
						<div className='p-3 border-b border-zinc-200 flex justify-between items-center'>
							<span className='text-sm font-medium'>Projects</span>
							<button onClick={() => progInputRef.current?.click()} className='flex items-center gap-2 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm'>
								<Upload size={14} />
								Upload project
							</button>
						</div>

						{loadingProg && <div className='px-4 py-4 text-zinc-500'>Loading projects…</div>}

						{!loadingProg && programmation.length === 0 && (
							<div className='px-4 py-4 text-zinc-500'>
								No projects found in <b>programmation/</b>
							</div>
						)}

						{!loadingProg && latest && (
							<div className='divide-y divide-zinc-100'>
								<div className='px-4 py-3 flex justify-between items-center bg-violet-50'>
									<span className='font-medium text-zinc-900 truncate'>Latest: {latest.name}</span>

									<button onClick={() => downloadPath(latest.path, true)} className='text-sm text-violet-700 flex items-center gap-1'>
										<Download size={14} />
										Download
									</button>
								</div>

								{older.length > 0 && (
									<>
										<button onClick={() => setShowOlder(!showOlder)} className='w-full px-4 py-2 text-sm text-zinc-600 flex items-center justify-center gap-1 hover:bg-zinc-50'>
											{showOlder ? (
												<>
													<ChevronUp size={14} /> Hide older
												</>
											) : (
												<>
													<ChevronDown size={14} /> Show older ({older.length})
												</>
											)}
										</button>

										{showOlder &&
											older.map((folder) => (
												<div key={folder.path} className='px-4 py-3 flex justify-between items-center hover:bg-zinc-50'>
													<span className='text-zinc-800 truncate'>{folder.name}</span>

													<button onClick={() => downloadPath(folder.path, true)} className='text-sm text-zinc-500 flex items-center gap-1 hover:text-violet-600'>
														<Download size={14} />
														Download
													</button>
												</div>
											))}
									</>
								)}
							</div>
						)}
					</div>
				</section>

				{/* PICTURES */}
				<section>
					<div className='flex items-center gap-3 mb-3'>
						<div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600'>
							<ImageIcon size={20} />
						</div>
						<div className='flex flex-col'>
							<h2 className='text-xl font-medium'>Foto’s</h2>
							<p className='text-sm text-zinc-500'>Site images and documentation</p>
						</div>
					</div>

					<div className='bg-white border border-zinc-200 rounded-xl shadow-sm'>
						<div className='p-3 border-b border-zinc-200 flex justify-between items-center'>
							<span className='text-sm font-medium'>Images</span>
							<button onClick={() => picsInputRef.current?.click()} className='flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm'>
								<Upload size={14} />
								Upload images
							</button>
						</div>

						{loadingPics && <div className='px-4 py-4 text-zinc-500'>Loading images…</div>}

						{!loadingPics && pictures.length === 0 && (
							<div className='px-4 py-4 text-zinc-500'>
								No images found in <b>pictures/</b>
							</div>
						)}

						{!loadingPics && pictures.length > 0 && (
							<div className='p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
								{pictures.map((img) => (
									<div key={img.path} className='group border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50'>
										<img src={`/api/files/download?path=${encodeURIComponent(img.path)}`} alt={img.name} className='w-full h-40 object-cover' />

										<div className='p-2 flex justify-between items-center'>
											<span className='text-xs text-zinc-600 truncate'>{img.name}</span>

											<button onClick={() => downloadPath(img.path)} className='text-xs text-zinc-500 hover:text-emerald-600'>
												<Download size={14} />
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</section>
			</motion.div>
		</div>
	);
}
