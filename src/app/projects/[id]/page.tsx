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
	if (!settings?.path) return <div>Base path not configured.</div>;

	const tabs = [
		{ key: 'info', label: 'Info', icon: <Folder size={16} /> },
		{ key: 'schemas', label: 'Schemas', icon: <FileText size={16} /> },
		{ key: 'documents', label: 'Documents', icon: <File size={16} /> },
		{ key: 'programmation', label: 'Programmation', icon: <Code size={16} /> },
		{ key: 'pictures', label: 'Pictures', icon: <ImageIcon size={16} /> },
	] as const;

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto py-10 px-6 space-y-8'>
				{/* Header */}
				<div>
					<h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>{client}</h1>
					<p className='text-sm text-gray-500 mt-2'>Project dashboard</p>
				</div>

				{/* Mobile Dropdown */}
				<div className='sm:hidden'>
					<div className='relative'>
						<select
							value={tab}
							onChange={(e) => setTab(e.target.value as Tab)}
							className='w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10'>
							{tabs.map((t) => (
								<option key={t.key} value={t.key}>
									{t.label}
								</option>
							))}
						</select>

						<ChevronDown size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none' />
					</div>
				</div>

				{/* Desktop Tabs */}
				<div className='hidden sm:block'>
					<div className='flex gap-2 bg-gray-100 p-1 rounded-xl w-fit'>
						{tabs.map((t) => {
							const active = tab === t.key;

							return (
								<button
									key={t.key}
									onClick={() => setTab(t.key)}
									className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition ${active ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
									{active && (
										<motion.div
											layoutId='project-tab'
											className='absolute inset-0 bg-white rounded-lg shadow-sm z-0'
											transition={{
												type: 'spring',
												stiffness: 300,
												damping: 30,
											}}
										/>
									)}

									<span className='relative z-10 flex items-center gap-2'>
										{t.icon}
										{t.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Content */}
				<motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
					{tab === 'info' && <Metadata client={client} />}
					{tab === 'schemas' && <Schemas basePath={settings.path} client={client} />}
					{tab === 'documents' && <Documents basePath={settings.path} client={client} />}
					{tab === 'programmation' && <Programmation basePath={settings.path} client={client} />}
					{tab === 'pictures' && <Pictures basePath={settings.path} client={client} />}
				</motion.div>
			</div>
		</div>
	);
}
