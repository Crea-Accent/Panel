/** @format */
'use client';

import { ChevronDown, Folder, Package, Settings, Shield, Users } from 'lucide-react';

import AppsSettings from '@/components/settings/Apps';
import GeneralSettings from '@/components/settings/General';
import { NotPermitted } from '@/providers/PermissionsProvider';
import ProjectSettings from '@/components/settings/Projects';
import RoleSettings from '@/components/settings/Roles';
import UserSettings from '@/components/settings/Users';
import { motion } from 'framer-motion';
import { useState } from 'react';

type Tab = 'general' | 'projects' | 'users' | 'roles' | 'apps';

export default function SettingsPage() {
	const [tab, setTab] = useState<Tab>('general');

	const tabs = [
		{ key: 'general', label: 'General', icon: Settings },
		{ key: 'apps', label: 'Apps', icon: Package },
		{ key: 'projects', label: 'Projects', icon: Folder },
		{ key: 'users', label: 'Users', icon: Users },
		{ key: 'roles', label: 'Roles', icon: Shield },
	] as const;

	return (
		<NotPermitted permission='admin.read'>
			<div className='space-y-6'>
				{/* Header */}
				<div>
					<h1 className='text-2xl font-semibold text-gray-900 dark:text-zinc-100'>Settings</h1>
					<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Manage project configuration and access control.</p>
				</div>

				{/* Mobile Select */}
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
							focus:ring-2 focus:ring-(--accent)/20
							focus:border-(--accent)
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
					<div className='flex gap-1 bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl w-fit'>
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
											layoutId='settings-tab'
											className='absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-sm'
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
					{tab === 'general' && <GeneralSettings />}
					{tab === 'projects' && <ProjectSettings />}
					{tab === 'users' && <UserSettings />}
					{tab === 'roles' && <RoleSettings />}
					{tab === 'apps' && <AppsSettings />}
				</motion.div>
			</div>
		</NotPermitted>
	);
}
