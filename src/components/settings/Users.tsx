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
	password?: string;
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

	const [expandedUser, setExpandedUser] = useState<string | null>(null);
	const [savingUser, setSavingUser] = useState<string | null>(null);

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
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(newUser),
		});

		setShowModal(false);
		setNewUser({
			name: '',
			email: '',
			password: '',
			roleId: '',
		});
		load();
	}

	async function deleteUser(id: string) {
		await fetch(`/api/users?id=${id}`, {
			method: 'DELETE',
		});
		load();
	}

	async function updateUser(user: UserType) {
		setSavingUser(user.id);

		await fetch('/api/users', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
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

	const card = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	const input =
		'h-10 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-(--accent)/20 focus:border-(--accent) transition';

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex justify-between items-center'>
				<div>
					<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2'>
						<User className='w-4 h-4 text-(--accent) dark:text-(--accent)' />
						Users
					</h2>
					<p className='text-sm text-gray-500 dark:text-zinc-400 mt-1'>Manage system access and permissions.</p>
				</div>

				<button onClick={() => setShowModal(true)} className='h-10 px-4 rounded-xl bg-(--accent) text-white text-sm font-medium flex items-center gap-2 hover:bg-(--hover-accent) transition'>
					<Plus className='w-4 h-4' />
					New User
				</button>
			</div>

			{/* Users */}
			<div className='space-y-4'>
				<AnimatePresence>
					{users.map((user) => {
						const role = roles.find((r) => r.id === user.roleId);
						const isOpen = expandedUser === user.id;

						return (
							<motion.div
								key={user.id}
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
									<div>
										<div className='text-sm font-medium text-gray-900 dark:text-zinc-100'>{user.name}</div>
										<div className='text-xs text-gray-500 dark:text-zinc-400'>{user.email}</div>

										{role && (
											<div className='mt-2 inline-flex items-center gap-1 text-xs bg-(--active-accent) dark:bg-(--accent)/40 text-(--accent) dark:text-(--accent) px-2 py-1 rounded-full'>
												<ShieldCheck className='w-3 h-3' />
												{role.name}
											</div>
										)}
									</div>

									<div className='flex items-center gap-3'>
										<button
											onClick={() => setExpandedUser(isOpen ? null : user.id)}
											className='h-9 w-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
											{isOpen ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
										</button>

										<button onClick={() => deleteUser(user.id)} className='h-9 w-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition'>
											<Trash2 className='w-4 h-4' />
										</button>
									</div>
								</div>

								{/* Expanded */}
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
											className='border-t border-gray-200 dark:border-zinc-800 px-6 pb-6'>
											<div className='pt-6 space-y-6'>
												<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
													<input
														className={input}
														value={user.name}
														onChange={(e) =>
															setUsers((prev) =>
																prev.map((u) =>
																	u.id === user.id
																		? {
																				...u,
																				name: e.target.value,
																			}
																		: u
																)
															)
														}
													/>

													<input
														className={input}
														value={user.email}
														onChange={(e) =>
															setUsers((prev) =>
																prev.map((u) =>
																	u.id === user.id
																		? {
																				...u,
																				email: e.target.value,
																			}
																		: u
																)
															)
														}
													/>

													<input
														type='password'
														className={`${input} md:col-span-2`}
														placeholder='New password (optional)'
														onChange={(e) =>
															setUsers((prev) =>
																prev.map((u) =>
																	u.id === user.id
																		? {
																				...u,
																				password: e.target.value,
																			}
																		: u
																)
															)
														}
													/>
												</div>

												<select
													className={input}
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

												<PermissionMatrix
													value={user.permissions}
													compareWith={roles.find((r) => r.id === user.roleId)?.defaultPermissions}
													onChange={(next) =>
														updateUser({
															...user,
															permissions: next,
														})
													}
												/>

												<div className='flex justify-between items-center pt-4 border-t border-gray-200 dark:border-zinc-800'>
													<div className='flex gap-4'>
														<button onClick={() => resetToRole(user)} className='text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition'>
															Reset to role defaults
														</button>

														<button onClick={() => updateUser(user)} className='h-9 px-3 rounded-xl bg-(--accent) text-white text-sm font-medium hover:bg-(--hover-accent) transition'>
															Save changes
														</button>
													</div>

													{savingUser === user.id && <span className='text-xs text-gray-500 dark:text-zinc-400'>Saving…</span>}
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
									<h3 className='text-base font-medium text-gray-900 dark:text-zinc-100'>Create User</h3>
									<button onClick={() => setShowModal(false)} className='h-9 w-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition'>
										<X className='w-4 h-4' />
									</button>
								</div>

								<div className='space-y-4'>
									<input
										className={input}
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
										className={input}
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
										className={input}
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
										className={input}
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

								<button onClick={createUser} className='h-10 w-full rounded-xl bg-(--accent) text-white text-sm font-medium hover:bg-(--hover-accent) transition'>
									Create User
								</button>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
