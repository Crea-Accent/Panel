/** @format */
'use client';

import { HardDrive, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

type AppsSettings = {
	path?: string;
};

export default function AppsSettings() {
	const [settings, setSettings] = useState<AppsSettings>({
		path: '',
	});

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		async function load() {
			const res = await fetch('/api/settings/apps');
			const data = await res.json();

			setSettings({
				path: '',
				...data,
			});

			setLoading(false);
		}

		load();
	}, []);

	async function save() {
		setSaving(true);

		await fetch('/api/settings/apps', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(settings),
		});

		setTimeout(() => setSaving(false), 600);
	}

	if (loading) return <div className='p-8'>Loading...</div>;

	return (
		<div className='max-w-4xl mx-auto py-10 space-y-10'>
			<div>
				<h2 className='text-2xl font-semibold'>Apps</h2>
				<p className='text-sm text-gray-500 mt-1'>Configure where installer files are stored.</p>
			</div>

			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-2'>
					<HardDrive size={18} />
					<h3 className='text-lg font-medium'>Location</h3>
				</div>

				<input
					className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black'
					placeholder='C:/Installers'
					value={settings.path || ''}
					onChange={(e) =>
						setSettings({
							...settings,
							path: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500'>This folder will be scanned for setup files (.exe, .msi, etc).</p>

				<button onClick={save} className='px-5 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2'>
					<Save size={16} />
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
			</div>
		</div>
	);
}
