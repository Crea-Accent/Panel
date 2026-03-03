/** @format */
'use client';

import { AlertCircle, AlertTriangle, CheckCircle, HardDrive, Info, Loader2, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

type VersionInfo = {
	localVersion: string;
	remoteVersion: string;
	upToDate: boolean;
	error?: string;
};

type FilesSettings = {
	path?: string;
};

export default function GeneralSettings() {
	const [info, setInfo] = useState<VersionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);

	const [filesSettings, setFilesSettings] = useState<FilesSettings>({
		path: '',
	});
	const [savingPath, setSavingPath] = useState(false);

	/* ---------------- VERSION ---------------- */

	async function checkVersion() {
		setLoading(true);
		try {
			const res = await fetch('/api/version', { cache: 'no-store' });
			const data = await res.json();
			setInfo(data);
		} catch {
			setInfo({
				localVersion: '-',
				remoteVersion: '-',
				upToDate: false,
				error: 'Failed to check version',
			});
		}
		setLoading(false);
	}

	function runUpdate() {
		setUpdating(true);
		setLogs([]);

		const source = new EventSource('/api/update');

		source.onmessage = (event) => {
			setLogs((prev) => [...prev, event.data]);

			if (event.data.toLowerCase().includes('update complete')) {
				source.close();
				window.location.reload();
			}
		};

		source.onerror = () => {
			source.close();
			setUpdating(false);
		};
	}

	function getMessageMeta(message: string) {
		const lower = message.toLowerCase();

		if (lower.includes('error')) {
			return {
				icon: AlertCircle,
				className: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40',
			};
		}

		if (lower.includes('warning') || lower.includes('warn')) {
			return {
				icon: AlertTriangle,
				className: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/40',
			};
		}

		if (lower.includes('complete') || lower.includes('success')) {
			return {
				icon: CheckCircle,
				className: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/40',
			};
		}

		return {
			icon: Info,
			className: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40',
		};
	}

	/* ---------------- FILES PATH ---------------- */

	async function loadFilesSettings() {
		const res = await fetch('/api/settings/files');
		const data = await res.json();
		setFilesSettings({ path: '', ...data });
	}

	async function saveFilesPath() {
		setSavingPath(true);

		await fetch('/api/settings/files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(filesSettings),
		});

		setTimeout(() => setSavingPath(false), 600);
	}

	useEffect(() => {
		(() => {
			checkVersion();
			loadFilesSettings();
		})();
	}, []);

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div>
				<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>General</h2>
				<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>System information, application updates and root configuration.</p>
			</div>

			{/* VERSION CARD */}
			<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-6'>
				<div className='flex justify-between items-center'>
					<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Application Version</h3>

					<button
						onClick={checkVersion}
						className='h-9 px-3 flex items-center gap-2 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
						<RefreshCw className='w-4 h-4' />
						Refresh
					</button>
				</div>

				{loading ? (
					<div className='flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400'>
						<Loader2 className='w-4 h-4 animate-spin' />
						Checking version…
					</div>
				) : info?.error ? (
					<div className='text-sm text-red-600 dark:text-red-400'>{info.error}</div>
				) : (
					<>
						<div className='text-sm space-y-1 text-gray-700 dark:text-zinc-400'>
							<div>
								Current version: <span className='font-medium text-gray-900 dark:text-zinc-100'>{info?.localVersion}</span>
							</div>
							<div>
								Latest version: <span className='font-medium text-gray-900 dark:text-zinc-100'>{info?.remoteVersion}</span>
							</div>
						</div>

						{info?.upToDate ? (
							<div className='flex items-center gap-2 text-green-600 dark:text-green-400 text-sm'>
								<CheckCircle className='w-4 h-4' />
								Application is up to date
							</div>
						) : (
							<div className='space-y-4'>
								<div className='flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm'>
									<AlertCircle className='w-4 h-4' />
									Update available
								</div>

								<motion.button
									whileTap={{ scale: 0.97 }}
									onClick={runUpdate}
									disabled={updating}
									className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-500 transition'>
									{updating ? (
										<>
											<Loader2 className='w-4 h-4 animate-spin' />
											Updating…
										</>
									) : (
										<>
											<RefreshCw className='w-4 h-4' />
											Update Now
										</>
									)}
								</motion.button>

								{updating && logs.length > 0 && (
									<div className='space-y-2 max-h-56 overflow-y-auto'>
										{logs.map((log, i) => {
											const meta = getMessageMeta(log);
											const Icon = meta.icon;

											return (
												<div key={i} className={`flex items-start gap-2 text-xs font-mono p-2 rounded-lg border ${meta.className}`}>
													<Icon className='w-3.5 h-3.5 mt-[2px]' />
													<span className='whitespace-pre-wrap break-words'>{log}</span>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>

			{/* FILES ROOT PATH */}
			<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-4'>
				<div className='flex items-center gap-3'>
					<div className='h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center'>
						<HardDrive className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
					</div>
					<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Files Root Path</h3>
				</div>

				<input
					className='h-10 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition'
					placeholder='D:\\Shared'
					value={filesSettings.path || ''}
					onChange={(e) =>
						setFilesSettings({
							...filesSettings,
							path: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500 dark:text-zinc-500'>This directory is used as the root for the file explorer module.</p>

				<div className='pt-2'>
					<button
						onClick={saveFilesPath}
						className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-500 transition disabled:opacity-60'
						disabled={savingPath}>
						<Save className='w-4 h-4' />
						{savingPath ? 'Saving…' : 'Save Path'}
					</button>
				</div>
			</div>
		</div>
	);
}
