/** @format */
'use client';

import { ChevronDown, ChevronRight, Copy, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useMemo, useState } from 'react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
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

type PasswordCardProps = {
	password: Password;
	shared?: boolean;
	ownerName?: string;
	onView: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
};

function PasswordCard({ password, shared, ownerName, onView, onEdit, onDelete }: PasswordCardProps) {
	return (
		<Card className='p-4'>
			<div className='flex items-center justify-between gap-4'>
				<div className='min-w-0 flex-1 space-y-1'>
					<p className='font-medium truncate'>{password.label}</p>

					{shared && ownerName && <p className='text-xs text-zinc-500'>Shared by {ownerName}</p>}

					{password.username && <p className='text-sm text-zinc-500 truncate'>{password.username}</p>}

					{password.link && (
						<a href={password.link} target='_blank' rel='noreferrer' className='text-xs text-(--accent) hover:underline truncate block'>
							{password.link}
						</a>
					)}

					{password.tags?.length ? (
						<div className='flex flex-wrap gap-2 pt-1'>
							{password.tags.map((tag) => (
								<span
									key={tag}
									className='
											px-2
											py-1
											text-xs
											rounded-lg

											bg-zinc-100
											dark:bg-zinc-800
										'>
									{tag}
								</span>
							))}
						</div>
					) : null}
				</div>

				<div className='flex items-center gap-2 shrink-0'>
					<Button variant='ghost' icon={<Eye size={16} />} onClick={onView} />

					{onEdit && <Button variant='ghost' icon={<Pencil size={16} />} onClick={onEdit} />}

					{onDelete && <Button variant='danger-ghost' icon={<Trash2 size={16} />} onClick={onDelete} />}
				</div>
			</div>
		</Card>
	);
}

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
	const [deleteTarget, setDeleteTarget] = useState<Password | null>(null);

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

	async function confirmDelete() {
		if (!deleteTarget) return;

		await remove(deleteTarget.id);

		setDeleteTarget(null);
	}

	function canEdit(p: Password) {
		return canWrite && (p.ownerId === sessionUser?.id || isAdmin);
	}

	function canDelete(p: Password) {
		return canWrite && (p.ownerId === sessionUser?.id || isAdmin);
	}

	return (
		<NotPermitted permission='passwords.read'>
			<div className='space-y-8'>
				{/* HEADER */}

				<PageHeader
					icon={<Eye size={20} />}
					title='Passwords'
					description='Manage shared credentials and secure access.'
					action={
						canWrite ? (
							<Button icon={<Plus size={16} />} onClick={openCreate}>
								New Password
							</Button>
						) : undefined
					}
				/>

				{/* SEARCH */}

				<Card className='p-4'>
					<Input icon={<Search size={16} />} placeholder='Search passwords' value={search} onChange={(e) => setSearch(e.target.value)} />
				</Card>

				{/* YOUR */}

				<Section id='your' title='Your Passwords' collapsed={collapsed} toggle={toggleSection}>
					{yourPasswords.map((p) => (
						<PasswordCard key={p.id} password={p} onView={() => openView(p.id)} onEdit={canEdit(p) ? () => openEdit(p) : undefined} onDelete={canDelete(p) ? () => setDeleteTarget(p) : undefined} />
					))}
				</Section>

				{/* SHARED */}

				<Section id='shared' title='Shared With You' collapsed={collapsed} toggle={toggleSection}>
					{sharedPasswords.map((p) => (
						<PasswordCard
							key={p.id}
							password={p}
							shared
							ownerName={ownerName(p.ownerId)}
							onView={() => openView(p.id)}
							onEdit={canEdit(p) ? () => openEdit(p) : undefined}
							onDelete={canDelete(p) ? () => setDeleteTarget(p) : undefined}
						/>
					))}
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
										{userPasswords.map((p) => (
											<PasswordCard
												key={p.id}
												password={p}
												onView={() => openView(p.id)}
												onEdit={canEdit(p) ? () => openEdit(p) : undefined}
												onDelete={canDelete(p) ? () => setDeleteTarget(p) : undefined}
											/>
										))}
									</Section>
								);
							})}
					</div>
				)}

				<Modal
					open={open}
					title={editing ? 'Edit Password' : 'Create Password'}
					onClose={() => setOpen(false)}
					footer={
						<>
							<Button variant='secondary' onClick={() => setOpen(false)}>
								Cancel
							</Button>

							<Button onClick={save}>Save</Button>
						</>
					}>
					<div className='space-y-4'>
						<Input label='Label' value={label} onChange={(e) => setLabel(e.target.value)} />

						<Input label='Username' value={username} onChange={(e) => setUsername(e.target.value)} />

						<Input label='Password' value={password} onChange={(e) => setPassword(e.target.value)} />

						<Input label='Link' value={link} onChange={(e) => setLink(e.target.value)} />

						<Input label='Tags' placeholder='comma,separated,tags' value={tags} onChange={(e) => setTags(e.target.value)} />

						<Card className='p-4'>
							<div className='space-y-3'>
								<p className='text-sm font-medium'>Share with users</p>

								<div className='space-y-2 max-h-60 overflow-auto'>
									{users.map((user) => {
										const active = selectedUsers.includes(user.id);

										return (
											<button
												key={user.id}
												onClick={() => toggleUser(user.id)}
												className={`
										w-full

										flex
										items-center
										justify-between

										px-3
										py-2

										rounded-xl
										border

										transition

										${active ? 'border-(--accent) bg-(--active-accent)' : 'border-zinc-200 dark:border-zinc-800'}
									`}>
												<span className='text-sm'>{user.name}</span>

												<div
													className={`
											w-4
											h-4
											rounded-full

											${active ? 'bg-(--accent)' : 'bg-zinc-300 dark:bg-zinc-700'}
										`}
												/>
											</button>
										);
									})}
								</div>
							</div>
						</Card>
					</div>
				</Modal>

				<Modal open={!!viewing} title='Password Details' onClose={() => setViewing(null)}>
					{viewing && (
						<div className='space-y-5'>
							<Card className='p-4'>
								<div className='space-y-1'>
									<p className='text-xs text-zinc-500'>Label</p>

									<p className='font-medium'>{viewing.label}</p>
								</div>
							</Card>

							{viewing.username && (
								<Card className='p-4'>
									<div className='flex items-center justify-between gap-4'>
										<div className='min-w-0'>
											<p className='text-xs text-zinc-500'>Username</p>

											<p className='font-mono text-sm truncate'>{viewing.username}</p>
										</div>

										<Button variant='ghost' icon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(viewing.username ?? '')} />
									</div>
								</Card>
							)}

							<Card className='p-4'>
								<div className='flex items-center justify-between gap-4'>
									<div className='min-w-0'>
										<p className='text-xs text-zinc-500'>Password</p>

										<p className='font-mono text-sm truncate'>{viewing.password}</p>
									</div>

									<Button variant='ghost' icon={<Copy size={16} />} onClick={() => navigator.clipboard.writeText(viewing.password)} />
								</div>
							</Card>

							{viewing.link && (
								<Card className='p-4'>
									<div className='space-y-1'>
										<p className='text-xs text-zinc-500'>Link</p>

										<a href={viewing.link} target='_blank' rel='noreferrer' className='text-(--accent) hover:underline break-all'>
											{viewing.link}
										</a>
									</div>
								</Card>
							)}

							{viewing.tags?.length ? (
								<Card className='p-4'>
									<div className='space-y-2'>
										<p className='text-xs text-zinc-500'>Tags</p>

										<div className='flex flex-wrap gap-2'>
											{viewing.tags.map((tag) => (
												<span
													key={tag}
													className='
											px-2
											py-1
											text-xs
											rounded-lg

											bg-zinc-100
											dark:bg-zinc-800
										'>
													{tag}
												</span>
											))}
										</div>
									</div>
								</Card>
							) : null}
						</div>
					)}
				</Modal>
			</div>

			<ConfirmDialog
				open={!!deleteTarget}
				title='Delete Password'
				description={deleteTarget ? `Are you sure you want to delete "${deleteTarget.label}"?` : ''}
				confirmText='Delete'
				onConfirm={confirmDelete}
				onClose={() => setDeleteTarget(null)}
			/>
		</NotPermitted>
	);
}
