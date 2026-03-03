/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import PermissionMatrix from './PermissionMatrix';

type Role = {
	id: string;
	name: string;
	defaultPermissions: string[];
};

export default function RoleSettings() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [newRoleName, setNewRoleName] = useState('');
	const [expandedRole, setExpandedRole] = useState<string | null>(null);
	const [showModal, setShowModal] = useState(false);

	async function load() {
		const res = await fetch('/api/settings/roles');
		const data = await res.json();
		setRoles(data.roles);
	}

	useEffect(() => {
		(() => {
			load();
		})();
	}, []);

	async function saveRole(role: Role) {
		await fetch('/api/settings/roles', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(role),
		});
		load();
	}

	async function createRole() {
		if (!newRoleName.trim()) return;

		await fetch('/api/settings/roles', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newRoleName,
				defaultPermissions: [],
			}),
		});

		setNewRoleName('');
		load();
	}

	async function deleteRole(id: string) {
		await fetch(`/api/settings/roles?id=${id}`, {
			method: 'DELETE',
		});
		load();
	}

	const card = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	const input = 'text-base font-medium bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none transition text-gray-900 dark:text-zinc-100';

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2'>
						<Shield className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
						Roles
					</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Define default permission templates.</p>
				</div>

				<button onClick={() => setShowModal(true)} className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-500 transition'>
					<Plus className='w-4 h-4' />
					New Role
				</button>
			</div>

			{/* Role Cards */}
			<div className='space-y-4'>
				<AnimatePresence>
					{roles.map((role) => {
						const isOpen = expandedRole === role.id;

						return (
							<motion.div
								key={role.id}
								initial={{
									opacity: 0,
									y: 6,
								}}
								animate={{
									opacity: 1,
									y: 0,
								}}
								exit={{
									opacity: 0,
									y: -6,
								}}
								className={card}>
								{/* Header */}
								<div className='p-6 flex justify-between items-center'>
									<input
										className={input}
										value={role.name}
										onChange={(e) =>
											saveRole({
												...role,
												name: e.target.value,
											})
										}
									/>

									<div className='flex items-center gap-3'>
										<button
											onClick={() => setExpandedRole(isOpen ? null : role.id)}
											className='h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
											{isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
										</button>

										<button onClick={() => deleteRole(role.id)} className='h-9 w-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition'>
											<Trash2 className='w-4 h-4' />
										</button>
									</div>
								</div>

								{/* Permissions */}
								<AnimatePresence>
									{isOpen && (
										<motion.div
											initial={{
												opacity: 0,
												y: -4,
											}}
											animate={{
												opacity: 1,
												y: 0,
											}}
											exit={{
												opacity: 0,
												y: -4,
											}}
											className='px-6 pb-6 border-t border-gray-200 dark:border-zinc-800'>
											<div className='pt-6'>
												<PermissionMatrix
													value={role.defaultPermissions}
													onChange={(next) =>
														saveRole({
															...role,
															defaultPermissions: next,
														})
													}
												/>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			{/* Modal */}
			<AnimatePresence>
				{showModal && (
					<>
						<motion.div
							initial={{
								opacity: 0,
							}}
							animate={{
								opacity: 1,
							}}
							exit={{
								opacity: 0,
							}}
							className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40'
							onClick={() => setShowModal(false)}
						/>

						<motion.div
							initial={{
								opacity: 0,
								scale: 0.96,
							}}
							animate={{
								opacity: 1,
								scale: 1,
							}}
							exit={{
								opacity: 0,
								scale: 0.96,
							}}
							className='fixed inset-0 flex items-center justify-center z-50'>
							<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6'>
								<div className='flex justify-between items-center'>
									<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Create Role</h3>
									<button onClick={() => setShowModal(false)} className='h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
										<X className='w-4 h-4' />
									</button>
								</div>

								<input
									className='h-10 w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition'
									placeholder='Role name'
									value={newRoleName}
									onChange={(e) => setNewRoleName(e.target.value)}
								/>

								<button
									onClick={async () => {
										await createRole();
										setShowModal(false);
									}}
									className='h-10 w-full rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition'>
									Create Role
								</button>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
