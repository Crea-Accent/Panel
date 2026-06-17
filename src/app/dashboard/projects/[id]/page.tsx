/** @format */
'use client';

import { Cable, Check, ClipboardCheck, Code, File, FileText, Folder, ImageIcon, Save, Settings, Share, Sun } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Canbus from '@/components/projects/Canbus';
import Documents from '@/components/projects/Document';
import Loading from '@/components/ui/Loading';
import Metadata from '@/components/projects/Metadata';
import Pictures from '@/components/projects/Picture';
import Programmation from '@/components/projects/Programmation';
import Schemas from '@/components/projects/Schema';
import Selector from '@/components/ui/Selector';
import Solar from '@/components/projects/Solar';
import { motion } from 'framer-motion';

type Tab = 'info' | 'schemas' | 'documents' | 'programmation' | 'pictures' | 'solar' | 'canbus';

type Settings = {
	path: string;
	requiredFolders: string[];
};

type MetadataActions = {
	save: () => Promise<void>;
	share: () => Promise<void>;
	hasChanges: boolean;
	saving: boolean;
	saved: boolean;
	label: string;
	setLabel: (label: string) => void;
	labels: {
		name: string;
		color: string;
	}[];
};

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
	const { has } = usePermissions();

	const [settings, setSettings] = useState<Settings | null>(null);
	const [client, setClient] = useState<string | null>(null);
	const [tab, setTab] = useState<Tab>('info');
	const [loading, setLoading] = useState(true);
	const [shareAccess, setShareAccess] = useState(false);
	const [shared, setShared] = useState(false);
	const [metadataActions, setMetadataActions] = useState<MetadataActions | null>(null);

	const tabs = [
		{ key: 'info', label: 'Info', icon: Folder },
		{ key: 'solar', label: 'Solar', icon: Sun },
		{ key: 'schemas', label: 'Schemas', icon: FileText },
		{ key: 'documents', label: 'Documents', icon: File },
		{ key: 'programmation', label: 'Programmation', icon: Code },
		{ key: 'canbus', label: 'Canbus', icon: Cable },
		{ key: 'pictures', label: 'Pictures', icon: ImageIcon },
	] as const;

	const isAllowed = has('projects.write');

	useEffect(() => {
		(async () => {
			const id = decodeURIComponent((await params).id);
			setClient(id);

			const s = await fetch('/api/settings/projects').then((r) => r.json());
			const m = await fetch(`/api/projects/metadata?client=${encodeURIComponent(id)}&reveal=true`).then((r) => r.json());

			setSettings(s);

			const code = new URL(window.location.href).searchParams.get('code');

			if (code) {
				setShareAccess(m.shareCode === code);
			}

			setLoading(false);
		})();
	}, [params]);

	if (loading || !client) return <Loading title={`Loading ${client || 'project'}`} />;

	if (!settings?.path)
		return <div className='text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3'>Base path not configured.</div>;

	return (
		<NotPermitted permission='projects.read' shareAccess={shareAccess}>
			<div className='space-y-6'>
				{/* Header */}

				<div>
					<h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>{client}</h1>

					<p className='text-sm text-zinc-500 dark:text-zinc-400 mt-1'>Project dashboard</p>
				</div>

				{/* Navigation + Actions */}

				<div
					className='
		flex flex-col sm:flex-row
		sm:items-center sm:justify-between
		gap-2
		bg-zinc-100 dark:bg-zinc-900
		p-1
		rounded-xl
		border border-zinc-200 dark:border-zinc-800
	'>
					{/* Mobile Navigation */}

					<div className='sm:hidden w-full'>
						<Selector
							className='w-full'
							value={tab}
							options={tabs.map((t) => ({
								label: t.label,
								value: t.key,
							}))}
							onChange={(value) => setTab(value as Tab)}
						/>
					</div>

					{/* Desktop Tabs */}

					<div className='hidden sm:flex gap-1'>
						{tabs.map((t) => {
							const active = tab === t.key;
							const Icon = t.icon;

							return (
								<Button key={t.key} icon={<Icon size={16} />} onClick={() => setTab(t.key)} variant={active ? 'primary' : 'secondary'}>
									{t.label}
								</Button>
							);
						})}
					</div>

					{/* Actions */}

					<div className='flex gap-1 w-full sm:w-auto'>
						<Button
							icon={metadataActions?.saved ? <Check size={16} /> : <Save size={16} />}
							disabled={!metadataActions?.hasChanges || metadataActions?.saving || !isAllowed}
							onClick={() => metadataActions?.save()}>
							<span className='hidden sm:inline'>{metadataActions?.saving ? 'Saving...' : metadataActions?.saved ? 'Saved' : 'Save'}</span>
						</Button>

						<Button
							icon={shared ? <ClipboardCheck size={16} /> : <Share size={16} />}
							onClick={() => {
								metadataActions?.share();
								setShared(true);
								setTimeout(() => {
									setShared(false);
								}, 1500);
							}}
							disabled={shared || !isAllowed}>
							<span className='hidden sm:inline'>{shared ? 'Copied' : 'Share'}</span>
						</Button>

						<Selector
							className='flex-1 sm:flex-none min-w-45'
							value={metadataActions?.label ?? ''}
							options={[
								{
									label: 'No status',
									value: '',
								},
								...(metadataActions?.labels ?? []).map((label) => ({
									label: label.name,
									value: label.name,
									color: label.color,
								})),
							]}
							onChange={(value) => metadataActions?.setLabel(value)}
						/>
					</div>
				</div>

				{/* Content */}

				<motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
					{tab === 'info' && <Metadata client={client} onActionsChange={setMetadataActions} />}
					{tab === 'solar' && <Solar client={client} />}
					{tab === 'schemas' && <Schemas basePath={settings.path} client={client} />}
					{tab === 'documents' && <Documents basePath={settings.path} client={client} />}
					{tab === 'programmation' && <Programmation basePath={settings.path} client={client} />}
					{tab === 'canbus' && <Canbus basePath={settings.path} client={client} />}
					{tab === 'pictures' && <Pictures basePath={settings.path} client={client} />}
				</motion.div>
			</div>
		</NotPermitted>
	);
}
