/** @format */
'use client';

import { Download, DownloadIcon, Package } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { NotPermitted } from '@/providers/PermissionsProvider';
import PageHeader from '@/components/ui/PageHeader';

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
		return (
			<Card className='p-8 text-center'>
				<div className='text-sm text-zinc-500'>Loading installers...</div>
			</Card>
		);
	}

	return (
		<NotPermitted permission='applications.read'>
			<div className='space-y-6'>
				<PageHeader icon={<Package size={20} />} title='Apps' description='Available installer packages' />

				{!settings?.path && <EmptyState icon={<Package size={24} />} title='Apps path not configured' description='Configure the applications directory in settings.' />}

				<Card className='overflow-hidden'>
					{installers.length === 0 && (
						<div className='p-8'>
							<EmptyState icon={<Package size={24} />} title='No installers found' description={`No installer files were found in ${settings?.path}`} />
						</div>
					)}

					{installers.map((file, index) => (
						<div
							key={file.path}
							className={`
				flex
				items-center
				justify-between

				px-5
				py-4

				hover:bg-zinc-50
				dark:hover:bg-zinc-800

				transition

				${index !== installers.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''}
			`}>
							<div className='flex items-center gap-3 min-w-0'>
								<div
									className='
						h-10 w-10
						rounded-xl

						bg-(--active-accent)
						dark:bg-(--accent)/20

						flex
						items-center
						justify-center
						shrink-0
					'>
									<Package size={18} className='text-(--accent)' />
								</div>

								<div className='min-w-0'>
									<p className='font-medium truncate'>{file.name}</p>

									<p className='text-xs text-zinc-500 truncate'>{file.path}</p>
								</div>
							</div>

							<Button size='sm' icon={<Download size={16} />} onClick={() => download(file.path)}>
								<DownloadIcon size={14} />
							</Button>
						</div>
					))}
				</Card>
			</div>
		</NotPermitted>
	);
}
