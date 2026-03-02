/** @format */
'use client';

import { ChevronDown, Folder, Package, Settings, Shield, Users } from 'lucide-react';

import AppsSettings from '@/components/settings/Apps';
import GeneralSettings from '@/components/settings/General';
import ProjectSettings from '@/components/settings/Projects';
import RoleSettings from '@/components/settings/Roles';
import UserSettings from '@/components/settings/Users';
import { motion } from 'framer-motion';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useState } from 'react';

type Tab = 'general' | 'projects' | 'users' | 'roles' | 'apps';

export default function SettingsPage() {
	const { hasAll, loading } = usePermissions();
	const [tab, setTab] = useState<Tab>('general');

	if (loading) return null;

	if (!hasAll(['admin.read', 'admin.write'])) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50 px-6'>
				<div className='text-center space-y-2'>
					<h1 className='text-xl font-semibold'>Access denied</h1>
					<p className='text-sm text-gray-500'>You do not have permission to view/edit settings.</p>
				</div>
			</div>
		);
	}

	const tabs = [
		{ key: 'general', label: 'General', icon: <Settings size={16} /> },
		{ key: 'apps', label: 'Apps', icon: <Package size={16} /> },
		{ key: 'projects', label: 'Projects', icon: <Folder size={16} /> },
		{ key: 'users', label: 'Users', icon: <Users size={16} /> },
		{ key: 'roles', label: 'Roles', icon: <Shield size={16} /> },
	] as const;

	return (
		<div className='min-h-screen'>
			<div className='max-w-6xl mx-auto py-10 sm:py-12 px-4 sm:px-6 space-y-8 sm:space-y-12'>
				{/* Header */}
				<div>
					<h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>Settings</h1>
					<p className='text-sm text-gray-500 mt-2'>Manage project configuration and access control.</p>
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
				<div className='hidden sm:block relative z-10'>
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
											layoutId='settings-tab'
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
				<motion.div key={tab} className='relative z-0' initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
					{tab === 'general' && <GeneralSettings />}
					{tab === 'projects' && <ProjectSettings />}
					{tab === 'users' && <UserSettings />}
					{tab === 'roles' && <RoleSettings />}
					{tab === 'apps' && <AppsSettings />}
				</motion.div>
			</div>
		</div>
	);
}
