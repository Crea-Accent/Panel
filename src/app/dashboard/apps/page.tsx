/** @format */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { Download } from 'lucide-react';
import { NotPermitted } from '@/providers/PermissionsProvider';

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
		return <div className='text-sm text-zinc-500 dark:text-zinc-400'>Loading installers…</div>;
	}

	return (
		<NotPermitted permission='applications.read'>
			<div className='space-y-6'>
				<div>
					<h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>Apps</h1>
					<p className='text-sm text-zinc-500 dark:text-zinc-400'>Available installer packages</p>
				</div>

				{!settings?.path && <div className='text-sm text-zinc-500 dark:text-zinc-400'>No base path configured. Go to Settings → Apps.</div>}

				{settings?.path && (
					<div
						className='
							bg-white dark:bg-zinc-900
							border border-zinc-200 dark:border-zinc-800
							rounded-xl
							shadow-sm
							overflow-hidden
						'>
						{installers.length === 0 && (
							<div className='px-6 py-6 text-sm text-zinc-500 dark:text-zinc-400'>
								No installer files found in <span className='font-medium text-zinc-700 dark:text-zinc-200'>{settings.path}</span>.
							</div>
						)}

						{installers.map((file) => (
							<div
								key={file.path}
								className='
									flex items-center justify-between
									px-6 py-4
									border-t border-zinc-200 dark:border-zinc-800
									first:border-t-0
									hover:bg-zinc-50 dark:hover:bg-zinc-800
									transition-colors
								'>
								<div className='flex flex-col min-w-0'>
									<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate'>{file.name}</span>

									<span className='text-xs text-zinc-500 dark:text-zinc-400 truncate'>{file.path}</span>
								</div>

								<button
									onClick={() => download(file.path)}
									className='
										h-9 px-3
										flex items-center gap-2
										rounded-lg
										text-sm font-medium
										text-zinc-600 dark:text-zinc-300
										hover:text-(--accent) dark:hover:text-(--hover-accent)
										hover:bg-(--active-accent) dark:hover:bg-(--hover-accent)/30
										transition-colors
									'>
									<Download size={16} strokeWidth={1.8} />
									Download
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</NotPermitted>
	);
}
