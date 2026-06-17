/** @format */
'use client';

import { Eye, EyeOff, Globe, Link2, Plus, Trash2 } from 'lucide-react';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useState } from 'react';

export type LoginEntry = {
	id: string;
	label: string;
	link: string;
	username: string;
	password: string;
	client: boolean;
};

type Props = {
	value: LoginEntry[];
	onChange: (logins: LoginEntry[]) => void;
};

export default function Login({ value, onChange }: Props) {
	const { has } = usePermissions();

	const [editing, setEditing] = useState<number | null>(null);
	const [deleting, setDeleting] = useState<number | null>(null);
	const [createOpen, setCreateOpen] = useState(false);
	const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

	const [newLogin, setNewLogin] = useState<LoginEntry>({
		id: crypto.randomUUID(),
		label: '',
		link: '',
		username: '',
		password: '',
		client: false,
	});

	function updateField(index: number, key: keyof LoginEntry, fieldValue: any) {
		const next = structuredClone(value);

		next[index] = {
			...next[index],
			[key]: fieldValue,
		};

		onChange(next);
	}

	function addLogin() {
		onChange([
			...value,
			{
				...newLogin,
				id: crypto.randomUUID(),
			},
		]);

		setNewLogin({
			id: crypto.randomUUID(),
			label: '',
			link: '',
			username: '',
			password: '',
			client: false,
		});

		setCreateOpen(false);
	}

	function removeLogin(index: number) {
		onChange(value.filter((_, i) => i !== index));
	}

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
				{value.map((login, index) => (
					<div
						key={login.id}
						className='rounded-xl p-4 flex flex-col'
						style={{
							background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
							border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
						}}>
						<div className='flex items-center gap-3 mb-4'>
							<div
								className='h-9 w-9 rounded-lg flex items-center justify-center'
								style={{
									background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
								}}>
								<Globe size={16} />
							</div>

							<div className='flex-1 min-w-0'>
								<div className='font-medium truncate'>{login.label || 'Unnamed Login'}</div>

								<div
									className='text-xs truncate'
									style={{
										color: 'var(--text-muted)',
									}}>
									{login.username || 'No username'}
								</div>
							</div>

							<div
								className='h-9 w-9 rounded-lg flex items-center justify-center'
								style={{
									background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
								}}>
								{login.client ? <Eye size={16} /> : <EyeOff size={16} />}
							</div>
						</div>

						{editing === index ? (
							<div className='flex flex-col gap-3 flex-1'>
								<Input label='Label' value={login.label} onChange={(e) => updateField(index, 'label', e.target.value)} />

								<Input label='Link' value={login.link} onChange={(e) => updateField(index, 'link', e.target.value)} />

								<Input label='Username' value={login.username} onChange={(e) => updateField(index, 'username', e.target.value)} />

								<Input label='Password' value={login.password} onChange={(e) => updateField(index, 'password', e.target.value)} />

								<label className='flex items-center gap-3 text-sm'>
									<input type='checkbox' checked={login.client} onChange={(e) => updateField(index, 'client', e.target.checked)} />
									Visible to client
								</label>
							</div>
						) : (
							<div className='flex flex-col gap-3 flex-1'>
								<div
									className='text-sm'
									style={{
										color: 'var(--text-muted)',
									}}>
									{login.link || 'No URL'}
								</div>

								<div className='flex items-center justify-between rounded-lg px-3 py-2 border border-(--border)'>
									<span>{visiblePasswords[login.id] ? login.password : '••••••••••••'}</span>

									<button
										onClick={() =>
											setVisiblePasswords((prev) => ({
												...prev,
												[login.id]: !prev[login.id],
											}))
										}>
										{visiblePasswords[login.id] ? <EyeOff size={16} /> : <Eye size={16} />}
									</button>
								</div>
							</div>
						)}

						{has('projects.write') && (
							<div className='flex gap-2 mt-4'>
								<Button
									className='flex-1'
									onClick={() => {
										if (editing === index) {
											setEditing(null);
											return;
										}

										setEditing(index);
									}}>
									{editing === index ? 'Save' : 'Edit'}
								</Button>

								{login.link && (
									<Button variant='secondary' onClick={() => window.open(login.link, '_blank')}>
										<Link2 size={16} />
									</Button>
								)}

								<Button variant='danger' onClick={() => setDeleting(index)}>
									<Trash2 size={16} />
								</Button>
							</div>
						)}
					</div>
				))}

				{has('projects.write') && (
					<button
						onClick={() => setCreateOpen(true)}
						className='rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-55 transition hover:scale-[1.01]'
						style={{
							background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
							border: '1px dashed color-mix(in srgb, var(--accent) 30%, var(--border))',
						}}>
						<Plus size={28} />

						<span>Add Login</span>
					</button>
				)}
			</div>

			<Modal
				open={createOpen}
				title='New Login'
				size='lg'
				onClose={() => setCreateOpen(false)}
				footer={
					<>
						<Button variant='secondary' onClick={() => setCreateOpen(false)}>
							Cancel
						</Button>

						<Button onClick={addLogin}>Create Login</Button>
					</>
				}>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<Input label='Label' value={newLogin.label} onChange={(e) => setNewLogin({ ...newLogin, label: e.target.value })} />

					<Input label='Link' value={newLogin.link} onChange={(e) => setNewLogin({ ...newLogin, link: e.target.value })} />

					<Input label='Username' value={newLogin.username} onChange={(e) => setNewLogin({ ...newLogin, username: e.target.value })} />

					<Input label='Password' value={newLogin.password} onChange={(e) => setNewLogin({ ...newLogin, password: e.target.value })} />

					<label className='flex items-center gap-3 text-sm md:col-span-2'>
						<input type='checkbox' checked={newLogin.client} onChange={(e) => setNewLogin({ ...newLogin, client: e.target.checked })} />
						Visible to client
					</label>
				</div>
			</Modal>

			<ConfirmDialog
				open={deleting !== null}
				title='Delete Login'
				description={`Are you sure you want to delete ${deleting !== null ? value[deleting]?.label || 'this login' : 'this login'}?`}
				confirmText='Delete'
				onClose={() => setDeleting(null)}
				onConfirm={() => {
					if (deleting === null) return;

					removeLogin(deleting);

					if (editing === deleting) {
						setEditing(null);
					}

					setDeleting(null);
				}}
			/>
		</div>
	);
}
