/** @format */
'use client';

import { Folder, MapPin, Pencil, Plus, Search } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useMemo, useState } from 'react';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

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

export default function Page() {
	const { has, loading } = usePermissions();
	const router = useRouter();

	const [projects, setProjects] = useState<Project[]>([]);
	const [settings, setSettings] = useState<Settings | null>(null);

	const [creating, setCreating] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');

	const [renaming, setRenaming] = useState(false);
	const [renameProjectName, setRenameProjectName] = useState('');
	const [renameTarget, setRenameTarget] = useState('');

	const [query, setQuery] = useState('');
	const [labelFilter, setLabelFilter] = useState('');

	const [sortKey, setSortKey] = useState<SortKey>('name');
	const [sortAsc, setSortAsc] = useState(true);

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

	async function createProject() {
		if (!settings?.path || !newProjectName.trim()) return;

		const name = newProjectName.trim();
		const newPath = `${settings.path}/${name}`;

		await fetch(`/api/files?view=${encodeURIComponent(newPath)}`);

		setCreating(false);
		setNewProjectName('');

		router.push(`/dashboard/projects/${encodeURIComponent(name)}`);
	}

	function renameProject(oldName: string) {
		setRenameTarget(oldName);
		setRenameProjectName(oldName);
		setRenaming(true);
	}

	async function submitRenameProject() {
		if (!settings?.path) return;

		const next = renameProjectName.trim();

		if (!next || next === renameTarget) {
			setRenaming(false);
			return;
		}

		await fetch('/api/files', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				oldPath: `${settings.path}/${renameTarget}`,
				newName: next,
			}),
		});

		setProjects((current) =>
			current.map((project) =>
				project.name === renameTarget
					? {
							...project,
							name: next,
							path: project.path.replace(renameTarget, next),
						}
					: project
			)
		);

		setRenaming(false);
		setRenameTarget('');
		setRenameProjectName('');
	}

	function openMaps(p: Project) {
		if (!p.address) return;

		const q = [p.address.street, p.address.number, p.address.postalCode, p.address.city, p.address.country].filter(Boolean).join(' ');

		window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
	}

	function labelColor(name?: string) {
		if (!name || !settings?.labels) return 'var(--accent)';

		const l = settings.labels.find((l) => l.name === name);
		return l?.color ?? 'var(--accent)';
	}

	if (loading) return null;

	return (
		<NotPermitted permission='projects.read'>
			<motion.div className='space-y-6'>
				{/* Header */}

				<PageHeader
					icon={<Folder size={20} />}
					title='Projects'
					description='Browse and manage projects'
					action={
						has('projects.write') ? (
							<Button icon={<Plus size={16} />} onClick={() => setCreating(true)}>
								New Project
							</Button>
						) : undefined
					}
				/>

				{/* Search + Filter */}

				<div className='flex items-center gap-3 max-w-2xl'>
					<div className='flex-1'>
						<Input icon={<Search size={16} />} placeholder='Search projects...' value={query} onChange={(e) => setQuery(e.target.value)} />
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

				<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
					<Card className='overflow-hidden'>
						<div className='grid grid-cols-[1fr_24px_80px] md:grid-cols-[1fr_140px_120px_100px] px-5 h-10 items-center text-xs font-medium text-zinc-500 border-b border-zinc-200 dark:border-zinc-800'>
							<button onClick={() => toggleSort('name')} className='text-left'>
								Name
							</button>

							<span className='text-center md:text-left'>Label</span>

							<button onClick={() => toggleSort('updated')} className='hidden md:block text-left'>
								Updated
							</button>

							<span className='text-right'>Actions</span>
						</div>

						{filteredProjects.map((p, index) => (
							<motion.div
								layout
								key={p.path}
								className={`grid grid-cols-[1fr_24px_80px] md:grid-cols-[1fr_140px_120px_100px] items-center h-11 px-5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
									index !== filteredProjects.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''
								}`}>
								<Link href={`/dashboard/projects/${encodeURIComponent(p.name)}`} className='flex items-center gap-3 min-w-0'>
									<Folder size={16} className='text-zinc-400' />
									<span className='truncate font-medium'>{p.name}</span>
								</Link>

								{/* Label */}
								<div className='flex justify-center md:justify-start'>
									{p.label && (
										<>
											<span
												className='w-2.5 h-2.5 rounded-full md:hidden'
												style={{
													backgroundColor: labelColor(p.label),
												}}
											/>

											<div className='hidden md:block'>
												<Badge color={labelColor(p.label)}>{p.label}</Badge>
											</div>
										</>
									)}
								</div>

								{/* Updated */}
								<div className='hidden md:block text-xs text-zinc-500'>{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''}</div>

								{/* Actions */}
								<div className='flex justify-end gap-1'>
									{p.address?.city && <Button size='sm' variant='ghost' icon={<MapPin size={16} />} onClick={() => openMaps(p)} />}

									{has('projects.write') && <Button size='sm' variant='ghost' icon={<Pencil size={16} />} onClick={() => renameProject(p.name)} />}
								</div>
							</motion.div>
						))}
					</Card>
				</motion.div>
			</motion.div>

			<Modal
				open={creating}
				title='Create Project'
				onClose={() => {
					setCreating(false);
					setNewProjectName('');
				}}
				footer={
					<>
						<Button
							variant='secondary'
							onClick={() => {
								setCreating(false);
								setNewProjectName('');
							}}>
							Cancel
						</Button>

						<Button onClick={createProject}>Create</Button>
					</>
				}>
				<Input
					autoFocus
					value={newProjectName}
					onChange={(e) => setNewProjectName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							createProject();
						}
					}}
					placeholder='Project name'
				/>
			</Modal>

			<Modal
				open={renaming}
				title='Rename Project'
				onClose={() => {
					setRenaming(false);
					setRenameTarget('');
					setRenameProjectName('');
				}}
				footer={
					<>
						<Button
							variant='secondary'
							onClick={() => {
								setRenaming(false);
								setRenameTarget('');
								setRenameProjectName('');
							}}>
							Cancel
						</Button>

						<Button onClick={submitRenameProject}>Rename</Button>
					</>
				}>
				<Input
					autoFocus
					value={renameProjectName}
					onChange={(e) => setRenameProjectName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							submitRenameProject();
						}
					}}
					placeholder='Project name'
				/>
			</Modal>
		</NotPermitted>
	);
}
