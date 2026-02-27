/** @format */
'use client';

import { Folder, Settings, Shield, Users } from 'lucide-react';

import GeneralSettings from '@/components/settings/General';
import ProjectSettings from '@/components/settings/Projects';
import RoleSettings from '@/components/settings/Roles';
import UserSettings from '@/components/settings/Users';
import { motion } from 'framer-motion';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useState } from 'react';

type Tab = 'general' | 'projects' | 'users' | 'roles';

export default function SettingsPage() {
	const { hasAll, loading } = usePermissions();
	const [tab, setTab] = useState<Tab>('general');

	// 🔒 Wait for session
	if (loading) return null;

	// 🔒 Block non-admins
	if (!hasAll(['admin.read', 'admin.write'])) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-50'>
				<div className='text-center space-y-2'>
					<h1 className='text-xl font-semibold'>Access denied</h1>
					<p className='text-sm text-gray-500'>You do not have permission to view/edit settings.</p>
				</div>
			</div>
		);
	}

	const tabs = [
		{ key: 'general', label: 'General', icon: <Settings size={16} /> },
		{ key: 'projects', label: 'Projects', icon: <Folder size={16} /> },
		{ key: 'users', label: 'Users', icon: <Users size={16} /> },
		{ key: 'roles', label: 'Roles', icon: <Shield size={16} /> },
	] as const;

	return (
		<div className='min-h-screen bg-gray-50'>
			<div className='max-w-6xl mx-auto py-12 px-6 space-y-12'>
				{/* Header */}
				<div>
					<h1 className='text-3xl font-semibold tracking-tight'>Settings</h1>
					<p className='text-sm text-gray-500 mt-2'>Manage project configuration and access control.</p>
				</div>

				{/* Navigation */}
				<div className='relative'>
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
											className='absolute inset-0 bg-white rounded-lg shadow-sm'
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
					{tab === 'general' && <GeneralSettings />}
					{tab === 'projects' && <ProjectSettings />}
					{tab === 'users' && <UserSettings />}
					{tab === 'roles' && <RoleSettings />}
				</motion.div>
			</div>
		</div>
	);
}
