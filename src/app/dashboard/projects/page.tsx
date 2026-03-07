/** @format */
'use client';

import { Folder, MapPin, Pencil, Search } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

type LabelSetting = {
	name: string;
	color: string;
};

type Project = {
	path: string;
	name: string;
	type: string;
	label?: string;
	updatedAt?: string;
	address?: {
		street?: string;
		number?: string;
		postalCode?: string;
		city?: string;
		country?: string;
	};
};

type Settings = {
	path: string;
	requiredFolders: string[];
	labels?: LabelSetting[];
};

type SortKey = 'name' | 'updated';

export default function ProjectsPage() {
	const [projects, setProjects] = useState<Project[]>([]);
	const [settings, setSettings] = useState<Settings | null>(null);

	const [query, setQuery] = useState('');
	const [labelFilter, setLabelFilter] = useState('');

	const [sortKey, setSortKey] = useState<SortKey>('name');
	const [sortAsc, setSortAsc] = useState(true);

	const { loading } = usePermissions();

	useEffect(() => {
		async function load() {
			const s = await fetch('/api/settings/projects').then((r) => r.json());
			setSettings(s);

			if (!s?.path) return;

			const res = await fetch(`/api/files?view=${encodeURIComponent(s.path)}`);
			const data = await res.json();

			const foldersOnly = data.filter((f: Project) => f.type === 'directory');

			const withMetadata = await Promise.all(
				foldersOnly.map(async (p: Project) => {
					try {
						const meta = await fetch(`/api/projects/metadata?client=${encodeURIComponent(p.name)}`).then((r) => r.json());

						return {
							...p,
							label: meta?.label,
							updatedAt: meta?.updatedAt,
							address: meta?.address,
						};
					} catch {
						return p;
					}
				})
			);

			setProjects(withMetadata);
		}

		load();
	}, []);

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			setSortAsc(!sortAsc);
		} else {
			setSortKey(key);
			setSortAsc(true);
		}
	}

	const filteredProjects = useMemo(() => {
		let list = [...projects];
		const q = query.toLowerCase().trim();

		list = list.filter((p) => {
			if (q && !p.name.toLowerCase().includes(q)) return false;
			if (labelFilter && p.label !== labelFilter) return false;
			return true;
		});

		list.sort((a, b) => {
			if (sortKey === 'name') {
				return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
			}

			if (sortKey === 'updated') {
				const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
				const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

				return sortAsc ? aDate - bDate : bDate - aDate;
			}

			return 0;
		});

		return list;
	}, [projects, query, labelFilter, sortKey, sortAsc]);

	async function renameProject(oldName: string) {
		const next = prompt('Rename project', oldName);
		if (!next || next === oldName || !settings?.path) return;

		await fetch('/api/files', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				oldPath: `${settings.path}/${oldName}`,
				newName: next,
			}),
		});

		location.reload();
	}

	function openMaps(p: Project) {
		if (!p.address) return;

		const q = [p.address.street, p.address.number, p.address.postalCode, p.address.city, p.address.country].filter(Boolean).join(' ');

		window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
	}

	function labelColor(name?: string) {
		if (!name || !settings?.labels) return '#6366f1';

		const l = settings.labels.find((l) => l.name === name);
		return l?.color ?? '#6366f1';
	}

	if (loading) return null;

	return (
		<NotPermitted permission='projects.read'>
			<div className='space-y-6'>
				{/* Header */}

				<div className='flex items-center gap-4'>
					<div className='h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0'>
						<Folder size={20} className='text-indigo-600 dark:text-indigo-400' />
					</div>

					<div className='min-w-0'>
						<h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>Projects</h1>

						<p className='text-sm text-zinc-500 dark:text-zinc-400'>Browse and manage projects</p>
					</div>
				</div>

				{/* Search + Filter */}

				<div className='flex items-center gap-3 max-w-2xl'>
					<div className='relative flex-1'>
						<Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />

						<input
							type='text'
							placeholder='Search projects…'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className='w-full h-9 pl-9 pr-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
						/>
					</div>

					<select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className='h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'>
						<option value=''>All labels</option>

						{settings?.labels?.map((l) => (
							<option key={l.name} value={l.name}>
								{l.name}
							</option>
						))}
					</select>
				</div>

				{/* Table */}

				<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden'>
					<div className='grid grid-cols-[1fr_140px_120px_100px] px-5 h-10 items-center text-xs font-medium text-zinc-500 border-b border-zinc-200 dark:border-zinc-800'>
						<button onClick={() => toggleSort('name')} className='text-left'>
							Name
						</button>

						<span>Label</span>

						<button onClick={() => toggleSort('updated')} className='text-left'>
							Updated
						</button>

						<span className='text-right'>Actions</span>
					</div>

					{filteredProjects.map((p, index) => (
						<div
							key={p.path}
							className={`grid grid-cols-[1fr_140px_120px_100px] items-center h-11 px-5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
								index !== filteredProjects.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
							}`}>
							<Link href={`/dashboard/projects/${encodeURIComponent(p.name)}`} className='flex items-center gap-3 min-w-0'>
								<Folder size={16} className='text-zinc-400' />
								<span className='truncate font-medium'>{p.name}</span>
							</Link>

							<div>
								{p.label && (
									<span className='px-2 py-0.5 text-xs rounded-md text-white' style={{ backgroundColor: labelColor(p.label) }}>
										{p.label}
									</span>
								)}
							</div>

							<div className='text-xs text-zinc-500'>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}</div>

							<div className='flex justify-end gap-1'>
								{p.address?.city && (
									<button
										onClick={() => openMaps(p)}
										className='h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'>
										<MapPin size={16} />
									</button>
								)}

								<button
									onClick={() => renameProject(p.name)}
									className='h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer'>
									<Pencil size={16} />
								</button>
							</div>
						</div>
					))}
				</motion.div>
			</div>
		</NotPermitted>
	);
}
