/** @format */
'use client';

import { ChevronDown, Code, File, FileText, Folder, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import Documents from '@/components/projects/Document';
import Metadata from '@/components/projects/Metadata';
import Pictures from '@/components/projects/Picture';
import Programmation from '@/components/projects/Programmation';
import Schemas from '@/components/projects/Schema';
import { motion } from 'framer-motion';

type Tab = 'info' | 'schemas' | 'documents' | 'programmation' | 'pictures';

type Settings = {
	path: string;
	requiredFolders: string[];
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
	const [client, setClient] = useState<string | null>(null);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [tab, setTab] = useState<Tab>('info');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			const id = decodeURIComponent((await params).id);
			setClient(id);

			const s = await fetch('/api/settings/projects').then((r) => r.json());
			setSettings(s);

			if (s?.path) {
				await fetch(`/api/files?view=${encodeURIComponent(`${s.path}/${id}`)}`);
			}

			setLoading(false);
		})();
	}, [params]);

	if (loading || !client) return null;

	if (!settings?.path) {
		return <div className='p-6 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl'>Base path not configured.</div>;
	}

	const tabs = [
		{ key: 'info', label: 'Info', icon: Folder },
		{ key: 'schemas', label: 'Schemas', icon: FileText },
		{ key: 'documents', label: 'Documents', icon: File },
		{ key: 'programmation', label: 'Programmation', icon: Code },
		{ key: 'pictures', label: 'Pictures', icon: ImageIcon },
	] as const;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100'>{client}</h1>
				<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Project dashboard</p>
			</div>

			{/* Mobile Dropdown */}
			<div className='sm:hidden w-full'>
				<div className='relative'>
					<select
						value={tab}
						onChange={(e) => setTab(e.target.value as Tab)}
						className='
							w-full h-10
							appearance-none
							bg-white dark:bg-zinc-900
							border border-gray-200 dark:border-zinc-700
							rounded-xl
							px-4 pr-10
							text-sm font-medium
							text-gray-900 dark:text-zinc-100
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/20
							focus:border-indigo-500
							transition
						'>
						{tabs.map((t) => (
							<option key={t.key} value={t.key}>
								{t.label}
							</option>
						))}
					</select>

					<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500 pointer-events-none' strokeWidth={1.8} />
				</div>
			</div>

			{/* Desktop Tabs */}
			<div className='hidden sm:block'>
				<div className='flex gap-1 bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit border border-gray-200 dark:border-zinc-800'>
					{tabs.map((t) => {
						const active = tab === t.key;
						const Icon = t.icon;

						return (
							<button
								key={t.key}
								onClick={() => setTab(t.key)}
								className={`
									relative
									h-10
									px-4
									rounded-xl
									text-sm font-medium
									flex items-center gap-2
									transition-colors
									${active ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100'}
								`}>
								{active && (
									<motion.div
										layoutId='project-tab'
										className='absolute inset-0 bg-white dark:bg-zinc-800 rounded-xl shadow-sm'
										transition={{
											type: 'spring',
											stiffness: 350,
											damping: 30,
										}}
									/>
								)}

								<span className='relative z-10 flex items-center gap-2'>
									<Icon className='w-4 h-4' strokeWidth={1.8} />
									{t.label}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Content */}
			<motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
				{tab === 'info' && <Metadata client={client} />}
				{tab === 'schemas' && <Schemas basePath={settings.path} client={client} />}
				{tab === 'documents' && <Documents basePath={settings.path} client={client} />}
				{tab === 'programmation' && <Programmation basePath={settings.path} client={client} />}
				{tab === 'pictures' && <Pictures basePath={settings.path} client={client} />}
			</motion.div>
		</div>
	);
}
