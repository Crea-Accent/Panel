/** @format */
'use client';

import { ChevronDown, ChevronRight, Copy, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useMemo, useState } from 'react';

import { useSession } from 'next-auth/react';

type Password = {
	id: string;
	label: string;
	username?: string;
	password: string;
	tags?: string[];
	link?: string;
	users: string[];
	ownerId: string;
};

type User = {
	id: string;
	name: string;
	email?: string;
	permissions?: string[];
};

/* ---------------- SECTION ---------------- */

function Section({ id, title, children, collapsed, toggle }: { id: string; title: string; children: React.ReactNode; collapsed: Record<string, boolean>; toggle: (id: string) => void }) {
	const isCollapsed = collapsed[id];

	return (
		<div className='space-y-3'>
			<button onClick={() => toggle(id)} className='flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
				{isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
				{title}
			</button>

			{!isCollapsed && <div className='space-y-2'>{children}</div>}
		</div>
	);
}

/* ---------------- PAGE ---------------- */

export default function Page() {
	const { data: session } = useSession();
	const { has } = usePermissions();

	const [passwords, setPasswords] = useState<Password[]>([]);
	const [users, setUsers] = useState<User[]>([]);
	const [search, setSearch] = useState('');

	const [open, setOpen] = useState(false);
	const [editing, setEditing] = useState<Password | null>(null);
	const [viewing, setViewing] = useState<Password | null>(null);

	const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

	const [label, setLabel] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [tags, setTags] = useState('');
	const [link, setLink] = useState('');
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const sessionUser = users.find((u) => u.email === session?.user?.email) ?? null;

	const isAdmin = has('admin.read');
	const canRead = has('passwords.read');
	const canWrite = has('passwords.write');

	function toggleSection(id: string) {
		setCollapsed((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	}

	async function load() {
		const res = await fetch('/api/passwords');
		const data = await res.json();
		setPasswords(data.passwords ?? []);
	}

	async function loadUsers() {
		const res = await fetch('/api/users');
		const data = await res.json();
		setUsers(data.users ?? data);
	}

	useEffect(() => {
		(() => {
			load();
			loadUsers();
		})();
	}, []);

	function ownerName(id: string) {
		return users.find((u) => u.id === id)?.name ?? 'Unknown';
	}

	const filtered = useMemo(() => {
		const q = search.toLowerCase();

		return passwords.filter((p) => {
			if (p.label.toLowerCase().includes(q)) return true;
			if (p.username?.toLowerCase().includes(q)) return true;
			if (p.tags?.some((t) => t.toLowerCase().includes(q))) return true;
			return false;
		});
	}, [passwords, search]);

	const yourPasswords = filtered.filter((p) => p.ownerId === sessionUser?.id);

	const sharedPasswords = filtered.filter((p) => p.ownerId !== sessionUser?.id && p.users.includes(sessionUser?.id ?? ''));

	async function openView(id: string) {
		const res = await fetch(`/api/passwords?id=${id}`);
		const data = await res.json();
		setViewing(data.password);
	}

	async function openEdit(p: Password) {
		const res = await fetch(`/api/passwords?id=${p.id}`);
		const data = await res.json();

		const pw = data.password;

		setEditing(pw);
		setLabel(pw.label);
		setUsername(pw.username ?? '');
		setPassword(pw.password);
		setTags(pw.tags?.join(', ') ?? '');
		setLink(pw.link ?? '');
		setSelectedUsers(pw.users ?? []);
		setOpen(true);
	}

	function openCreate() {
		setEditing(null);
		setLabel('');
		setUsername('');
		setPassword('');
		setTags('');
		setLink('');
		setSelectedUsers([]);
		setOpen(true);
	}

	function toggleUser(id: string) {
		setSelectedUsers((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
	}

	async function save() {
		if (!canWrite) return;

		const body = {
			id: editing?.id,
			label,
			username,
			password,
			link,
			users: selectedUsers,
			tags: tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
		};

		const method = editing ? 'PATCH' : 'POST';

		const res = await fetch('/api/passwords', {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		const data = await res.json();
		const pw = data.password;

		setPasswords((list) => {
			const index = list.findIndex((x) => x.id === pw.id);

			if (index === -1) return [...list, pw];

			const clone = [...list];
			clone[index] = pw;
			return clone;
		});

		setOpen(false);
	}

	async function remove(id: string) {
		await fetch(`/api/passwords?id=${id}`, { method: 'DELETE' });
		setPasswords((p) => p.filter((x) => x.id !== id));
	}

	function canEdit(p: Password) {
		return canWrite && (p.ownerId === sessionUser?.id || isAdmin);
	}

	function canDelete(p: Password) {
		return canWrite && (p.ownerId === sessionUser?.id || isAdmin);
	}

	function Card(p: Password, shared = false) {
		return (
			<div key={p.id} className='group border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition'>
				<div className='flex flex-col gap-1 min-w-0'>
					<div className='font-medium text-zinc-900 dark:text-zinc-100'>{p.label}</div>

					{shared && <div className='text-xs text-zinc-500'>Shared by {ownerName(p.ownerId)}</div>}

					{p.username && <div className='text-sm text-zinc-500'>{p.username}</div>}

					{p.link && (
						<a href={p.link} target='_blank' className='text-xs text-indigo-500 truncate hover:underline'>
							{p.link}
						</a>
					)}

					{p.tags?.length ? (
						<div className='flex gap-2 flex-wrap mt-1'>
							{p.tags.map((t) => (
								<span key={t} className='text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded'>
									{t}
								</span>
							))}
						</div>
					) : null}
				</div>

				<div className='flex gap-2 opacity-70 group-hover:opacity-100 transition'>
					<button onClick={() => openView(p.id)} className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
						<Eye size={16} />
					</button>

					{canEdit(p) && (
						<button onClick={() => openEdit(p)} className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
							<Pencil size={16} />
						</button>
					)}

					{canDelete(p) && (
						<button onClick={() => remove(p.id)} className='h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'>
							<Trash2 size={16} />
						</button>
					)}
				</div>
			</div>
		);
	}

	return (
		<NotPermitted permission='passwords.read'>
			<div className='space-y-8'>
				{/* HEADER */}

				<div className='flex items-center justify-between'>
					<h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>Passwords</h1>

					{canWrite && (
						<button onClick={openCreate} className='h-9 px-4 flex items-center gap-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition'>
							<Plus size={16} />
							New
						</button>
					)}
				</div>

				{/* SEARCH */}

				<div className='flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 h-9 bg-white dark:bg-zinc-900'>
					<Search size={16} className='text-zinc-400' />

					<input className='flex-1 outline-none bg-transparent text-sm' placeholder='Search passwords' value={search} onChange={(e) => setSearch(e.target.value)} />
				</div>

				{/* YOUR */}

				<Section id='your' title='Your Passwords' collapsed={collapsed} toggle={toggleSection}>
					{yourPasswords.map((p) => Card(p))}
				</Section>

				{/* SHARED */}

				<Section id='shared' title='Shared With You' collapsed={collapsed} toggle={toggleSection}>
					{sharedPasswords.map((p) => Card(p, true))}
				</Section>

				{/* ADMIN */}

				{isAdmin && (
					<div className='space-y-6'>
						<h2 className='text-lg font-semibold'>Other Users</h2>

						{users
							.filter((u) => u.id !== sessionUser?.id)
							.map((u) => {
								const userPasswords = filtered.filter((p) => p.ownerId === u.id);

								if (!userPasswords.length) return null;

								return (
									<Section key={u.id} id={`user-${u.id}`} title={u.name} collapsed={collapsed} toggle={toggleSection}>
										{userPasswords.map((p) => Card(p))}
									</Section>
								);
							})}
					</div>
				)}

				{open && (
					<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
						<div className='bg-white dark:bg-zinc-900 rounded-xl w-[520px] p-6 space-y-4 border border-zinc-200 dark:border-zinc-800 shadow-lg'>
							<div className='flex justify-between items-center'>
								<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>{editing ? 'Edit Password' : 'Create Password'}</h2>

								<button onClick={() => setOpen(false)} className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
									<X size={18} />
								</button>
							</div>

							<input
								className='w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
								placeholder='Label'
								value={label}
								onChange={(e) => setLabel(e.target.value)}
							/>

							<input
								className='w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
								placeholder='Username'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
							/>

							<input
								className='w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
								placeholder='Password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>

							<input
								className='w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
								placeholder='Link'
								value={link}
								onChange={(e) => setLink(e.target.value)}
							/>

							<input
								className='w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm'
								placeholder='Tags (comma separated)'
								value={tags}
								onChange={(e) => setTags(e.target.value)}
							/>

							<div className='space-y-2'>
								<div className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>Share with users</div>

								{users.map((u) => {
									const active = selectedUsers.includes(u.id);

									return (
										<div key={u.id} className='flex items-center justify-between border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2'>
											<span className='text-sm'>{u.name}</span>

											<button onClick={() => toggleUser(u.id)} className={`w-10 h-5 rounded-full transition ${active ? 'bg-indigo-600' : 'bg-zinc-400'}`}>
												<div className={`w-4 h-4 bg-white rounded-full transform transition ${active ? 'translate-x-5' : 'translate-x-1'}`} />
											</button>
										</div>
									);
								})}
							</div>

							<div className='flex justify-end gap-2 pt-2'>
								<button onClick={() => setOpen(false)} className='h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800'>
									Cancel
								</button>

								<button onClick={save} className='h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500'>
									Save
								</button>
							</div>
						</div>
					</div>
				)}
				{viewing && (
					<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
						<div className='bg-white dark:bg-zinc-900 rounded-xl w-[520px] p-6 space-y-4 border border-zinc-200 dark:border-zinc-800 shadow-lg'>
							<div className='flex justify-between items-center'>
								<h2 className='font-semibold text-zinc-900 dark:text-zinc-100'>Password Details</h2>

								<button onClick={() => setViewing(null)} className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
									<X size={18} />
								</button>
							</div>

							<div>
								<div className='text-xs text-zinc-500'>Label</div>
								<div className='text-sm'>{viewing.label}</div>
							</div>

							{viewing.username && (
								<div>
									<div className='text-xs text-zinc-500'>Username</div>

									<div className='flex justify-between items-center'>
										<span className='font-mono text-sm'>{viewing.username}</span>

										<button
											onClick={() => navigator.clipboard.writeText(viewing.username ?? '')}
											className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
											<Copy size={16} />
										</button>
									</div>
								</div>
							)}

							<div>
								<div className='text-xs text-zinc-500'>Password</div>

								<div className='flex justify-between items-center'>
									<span className='font-mono text-sm'>{viewing.password}</span>

									<button onClick={() => navigator.clipboard.writeText(viewing.password)} className='h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800'>
										<Copy size={16} />
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</NotPermitted>
	);
}
