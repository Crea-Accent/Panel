/** @format */
'use client';

import { useEffect, useState } from 'react';

import { FolderKanban } from 'lucide-react';
import Link from 'next/link';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

type Settings = {
	basePath: string;
};

export default function ProjectsPage() {
	const [projects, setProjects] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			// 1️⃣ Get basePath
			const settingsRes = await fetch('/api/settings/projects');
			const settings: Settings = await settingsRes.json();

			if (!settings.basePath) {
				setLoading(false);
				return;
			}

			// 2️⃣ Read top-level folders
			const filesRes = await fetch(`/api/files?view=${encodeURIComponent(settings.basePath)}`);

			const json = await filesRes.json();

			// adjust depending on your API shape
			const files: FileEntry[] = json.files || json;

			const folders = files.filter((f) => f.type === 'directory');

			setProjects(folders);
			setLoading(false);
		})();
	}, []);

	if (loading) {
		return <div>Loading projects…</div>;
	}

	return (
		<div className='max-w-7xl mx-auto space-y-6'>
			<h1 className='text-3xl font-semibold'>Projects</h1>

			{projects.length === 0 && <p className='text-zinc-500'>No project folders found.</p>}

			<div className='bg-white border border-zinc-200 rounded-xl divide-y'>
				{projects.map((project) => (
					<Link key={project.path} href={`/projects/${encodeURIComponent(project.name)}`} className='flex items-center gap-3 px-6 py-4 hover:bg-zinc-50'>
						<FolderKanban size={18} className='text-zinc-500' />
						<span className='font-medium'>{project.name}</span>
					</Link>
				))}
			</div>
		</div>
	);
}
