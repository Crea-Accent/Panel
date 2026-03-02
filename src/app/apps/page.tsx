/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { Download } from 'lucide-react';

type FileEntry = {
	path: string;
	name: string;
	type: string;
	accessible?: boolean;
};

type AppsSettings = {
	path?: string;
};

const INSTALLER_EXTENSIONS = ['.exe', '.msi', '.msix', '.msixbundle', '.appx', '.appxbundle'];

export default function AppsPage() {
	const [settings, setSettings] = useState<AppsSettings | null>(null);
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/apps').then((r) => r.json());
			setSettings(s);

			if (!s.path) {
				setLoading(false);
				return;
			}

			const res = await fetch(`/api/files?view=${encodeURIComponent(s.path)}`);
			const data: FileEntry[] = await res.json();

			setFiles(data || []);
			setLoading(false);
		})();
	}, []);

	const installers = useMemo(() => {
		return files.filter((f) => {
			if (f.type !== 'file') return false;

			const lower = f.name.toLowerCase();
			return INSTALLER_EXTENSIONS.some((ext) => lower.endsWith(ext));
		});
	}, [files]);

	function download(path: string) {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;

		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}

	if (loading) {
		return <div className='max-w-6xl mx-auto py-10'>Loading installers...</div>;
	}

	if (!settings?.path) {
		return (
			<div className='max-w-6xl mx-auto py-10 space-y-2'>
				<h1 className='text-3xl font-semibold'>Apps</h1>
				<p className='text-gray-500'>No base path configured. Go to Settings → Apps.</p>
			</div>
		);
	}

	return (
		<div className='max-w-6xl mx-auto py-10 space-y-8'>
			<div>
				<h1 className='text-3xl font-semibold'>Apps</h1>
				<p className='text-gray-500'>Available installer packages</p>
			</div>

			<div className='bg-white border border-gray-200 rounded-2xl shadow-sm'>
				{installers.length === 0 && (
					<div className='px-6 py-6 text-sm text-gray-500'>
						No installer files found in <b>{settings.path}</b>.
					</div>
				)}

				{installers.map((file) => (
					<div key={file.path} className='flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition'>
						<div className='flex flex-col'>
							<span className='text-sm font-medium text-gray-900'>{file.name}</span>
							<span className='text-xs text-gray-500'>{file.path}</span>
						</div>

						<button onClick={() => download(file.path)} className='text-sm text-zinc-500 flex items-center gap-1 hover:text-indigo-600'>
							<Download size={14} />
							Download
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
