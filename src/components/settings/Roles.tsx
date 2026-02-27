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

	return (
		<div className='max-w-4xl mx-auto py-8 space-y-10'>
			<div className='flex justify-between items-center'>
				<div>
					<h2 className='text-2xl font-semibold tracking-tight flex items-center gap-2'>
						<Shield size={20} />
						Roles
					</h2>
					<p className='text-sm text-gray-500 mt-1'>Define default permission templates.</p>
				</div>

				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={() => setShowModal(true)}
					className='px-4 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition'>
					<Plus size={16} />
					New Role
				</motion.button>
			</div>

			{/* Role Cards */}
			<div className='space-y-4'>
				<AnimatePresence>
					{roles.map((role) => {
						const isOpen = expandedRole === role.id;

						return (
							<motion.div
								key={role.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className='bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'>
								{/* Role Header */}
								<div className='p-6 flex justify-between items-center'>
									<div className='flex items-center gap-3'>
										<input
											className='text-lg font-medium bg-transparent border-none focus:outline-none'
											value={role.name}
											onChange={(e) =>
												saveRole({
													...role,
													name: e.target.value,
												})
											}
										/>
									</div>

									<div className='flex items-center gap-4'>
										<button onClick={() => setExpandedRole(isOpen ? null : role.id)} className='text-gray-500 hover:text-black transition'>
											{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
										</button>

										<button onClick={() => deleteRole(role.id)} className='text-red-500 hover:text-red-600 transition'>
											<Trash2 size={18} />
										</button>
									</div>
								</div>

								{/* Permissions */}
								<AnimatePresence>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className='px-6 pb-6 border-t border-gray-200'>
											<div className='pt-6'>
												<PermissionMatrix value={role.defaultPermissions} onChange={(next) => saveRole({ ...role, defaultPermissions: next })} />
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</AnimatePresence>

				<AnimatePresence>
					{showModal && (
						<>
							{/* Backdrop */}
							<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 bg-black/40 backdrop-blur-sm z-40' onClick={() => setShowModal(false)} />

							{/* Modal */}
							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.2 }}
								className='fixed inset-0 flex items-center justify-center z-50'>
								<div className='bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6'>
									<div className='flex justify-between items-center'>
										<h3 className='text-lg font-medium'>Create Role</h3>
										<button onClick={() => setShowModal(false)}>
											<X size={18} />
										</button>
									</div>

									<input
										className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
										placeholder='Role name'
										value={newRoleName}
										onChange={(e) => setNewRoleName(e.target.value)}
									/>

									<motion.button
										whileTap={{ scale: 0.97 }}
										onClick={async () => {
											await createRole();
											setShowModal(false);
										}}
										className='w-full px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90 transition'>
										Create Role
									</motion.button>
								</div>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
