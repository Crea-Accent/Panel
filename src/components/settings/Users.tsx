/** @format */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Plus, ShieldCheck, Trash2, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import PermissionMatrix from './PermissionMatrix';

type UserType = {
	id: string;
	name: string;
	email: string;
	roleId: string;
	permissions: string[];
};

type Role = {
	id: string;
	name: string;
	defaultPermissions: string[];
};

export default function UserSettings() {
	const [users, setUsers] = useState<UserType[]>([]);
	const [roles, setRoles] = useState<Role[]>([]);
	const [showModal, setShowModal] = useState(false);

	const [newUser, setNewUser] = useState({
		name: '',
		email: '',
		password: '',
		roleId: '',
	});

	async function load() {
		const [uRes, rRes] = await Promise.all([fetch('/api/users'), fetch('/api/settings/roles')]);

		const uData = await uRes.json();
		const rData = await rRes.json();

		setUsers(uData.users);
		setRoles(rData.roles);
	}

	useEffect(() => {
		(() => {
			load();
		})();
	}, []);

	async function createUser() {
		await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(newUser),
		});

		setShowModal(false);
		setNewUser({ name: '', email: '', password: '', roleId: '' });
		load();
	}

	async function deleteUser(id: string) {
		await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
		load();
	}

	const [expandedUser, setExpandedUser] = useState<string | null>(null);
	const [savingUser, setSavingUser] = useState<string | null>(null);

	async function updateUser(user: UserType) {
		setSavingUser(user.id);

		await fetch('/api/users', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(user),
		});

		setTimeout(() => setSavingUser(null), 500);
		load();
	}

	function resetToRole(user: UserType) {
		const role = roles.find((r) => r.id === user.roleId);
		if (!role) return;

		updateUser({
			...user,
			permissions: [...role.defaultPermissions],
		});
	}

	return (
		<div className='max-w-5xl mx-auto py-10 space-y-10'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h2 className='text-2xl font-semibold flex items-center gap-2'>
						<User size={20} />
						Users
					</h2>
					<p className='text-sm text-gray-500 mt-1'>Manage system access and permissions.</p>
				</div>

				<motion.button
					whileTap={{ scale: 0.95 }}
					onClick={() => setShowModal(true)}
					className='px-4 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition'>
					<Plus size={16} />
					New User
				</motion.button>
			</div>

			{/* User Cards */}
			<div className='space-y-4'>
				<AnimatePresence>
					{users.map((user) => {
						const role = roles.find((r) => r.id === user.roleId);
						const isOpen = expandedUser === user.id;

						return (
							<motion.div
								key={user.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
								className='bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden'>
								{/* Header */}
								<div className='p-6 flex justify-between items-center'>
									<div>
										<div className='font-medium text-sm'>{user.name}</div>
										<div className='text-xs text-gray-500'>{user.email}</div>

										{role && (
											<div className='mt-2 inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full'>
												<ShieldCheck size={12} />
												{role.name}
											</div>
										)}
									</div>

									<div className='flex items-center gap-4'>
										<button onClick={() => setExpandedUser(isOpen ? null : user.id)} className='text-gray-500 hover:text-black transition'>
											{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
										</button>

										<button onClick={() => deleteUser(user.id)} className='text-red-500 hover:text-red-600 transition'>
											<Trash2 size={18} />
										</button>
									</div>
								</div>

								{/* Expand Section */}
								<AnimatePresence>
									{isOpen && (
										<motion.div
											initial={{ height: 0, opacity: 0 }}
											animate={{ height: 'auto', opacity: 1 }}
											exit={{ height: 0, opacity: 0 }}
											transition={{ duration: 0.2 }}
											className='border-t border-gray-200 px-6 pb-6'>
											<div className='pt-6 space-y-6'>
												{/* Editable Info */}
												<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
													<input
														className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
														value={user.name}
														onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, name: e.target.value } : u)))}
														placeholder='Name'
													/>

													<input
														className='rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
														value={user.email}
														onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, email: e.target.value } : u)))}
														placeholder='Email'
													/>

													<input
														type='password'
														className='md:col-span-2 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
														placeholder='New password (leave empty to keep current)'
														onChange={(e) => setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, password: e.target.value } : u)))}
													/>
												</div>

												{/* Role Select */}
												<select
													className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
													value={user.roleId}
													onChange={(e) =>
														updateUser({
															...user,
															roleId: e.target.value,
														})
													}>
													{roles.map((role) => (
														<option key={role.id} value={role.id}>
															{role.name}
														</option>
													))}
												</select>

												{/* Permissions */}
												<PermissionMatrix
													value={user.permissions}
													compareWith={roles.find((r) => r.id === user.roleId)?.defaultPermissions}
													onChange={(next) => updateUser({ ...user, permissions: next })}
												/>

												<div className='flex justify-between items-center pt-4 border-t border-gray-200'>
													<div className='flex gap-3'>
														<button onClick={() => resetToRole(user)} className='text-sm text-gray-500 hover:text-black transition'>
															Reset to role defaults
														</button>

														<button
															onClick={() => {
																const { id, name, email } = user;
																const password = (user as unknown as Record<string, string>).password;

																updateUser({
																	id,
																	name,
																	email,
																	roleId: user.roleId,
																	permissions: user.permissions,
																	...(password ? { password } : {}),
																});
															}}
															className='text-sm bg-black text-white px-3 py-1.5 rounded-lg'>
															Save changes
														</button>
													</div>

													{savingUser === user.id && <span className='text-xs text-gray-500'>Saving...</span>}
												</div>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</motion.div>
						);
					})}
				</AnimatePresence>
			</div>

			{/* Create User Modal */}
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
									<h3 className='text-lg font-medium'>Create User</h3>
									<button onClick={() => setShowModal(false)}>
										<X size={18} />
									</button>
								</div>

								<div className='space-y-4'>
									<input
										className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
										placeholder='Name'
										value={newUser.name}
										onChange={(e) =>
											setNewUser({
												...newUser,
												name: e.target.value,
											})
										}
									/>

									<input
										className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
										placeholder='Email'
										value={newUser.email}
										onChange={(e) =>
											setNewUser({
												...newUser,
												email: e.target.value,
											})
										}
									/>

									<input
										type='password'
										className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
										placeholder='Password'
										value={newUser.password}
										onChange={(e) =>
											setNewUser({
												...newUser,
												password: e.target.value,
											})
										}
									/>

									<select
										className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
										value={newUser.roleId}
										onChange={(e) =>
											setNewUser({
												...newUser,
												roleId: e.target.value,
											})
										}>
										<option value=''>Select Role</option>
										{roles.map((role) => (
											<option key={role.id} value={role.id}>
												{role.name}
											</option>
										))}
									</select>
								</div>

								<motion.button whileTap={{ scale: 0.97 }} onClick={createUser} className='w-full px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90 transition'>
									Create User
								</motion.button>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
