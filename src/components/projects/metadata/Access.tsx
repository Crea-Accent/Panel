/** @format */
'use client';

import { User as UserIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import Input from '@/components/ui/Input';
import { User } from 'next-auth';

type Props = {
	users: User[];
	value: string[];
	onChange: (value: string[]) => void;
};

export default function Access({ users, value, onChange }: Props) {
	const [query, setQuery] = useState('');

	const filtered = useMemo(() => {
		if (!query.trim()) {
			return [];
		}

		const q = query.toLowerCase();

		return users.filter((user) => !value.includes(user.id) && (user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q))).slice(0, 8);
	}, [users, value, query]);

	function add(id: string) {
		if (value.includes(id)) return;

		onChange([...value, id]);

		setQuery('');
	}

	function remove(id: string) {
		onChange(value.filter((x) => x !== id));
	}

	return (
		<div className='flex flex-col gap-4'>
			<Input label='' placeholder='Search users...' value={query} onChange={(e) => setQuery(e.target.value)} />

			{filtered.length > 0 && (
				<div
					className='rounded-xl overflow-hidden'
					style={{
						background: 'var(--bg-main)',
						border: '1px solid var(--border)',
						boxShadow: '0 12px 32px rgba(0,0,0,.12)',
					}}>
					{filtered.map((user) => (
						<button key={user.id} type='button' onClick={() => add(user.id)} className='w-full text-left p-3 transition hover:bg-black/5 dark:hover:bg-white/5'>
							<div className='font-medium'>{user.name || 'Unnamed User'}</div>

							<div
								className='text-sm'
								style={{
									color: 'var(--text-muted)',
								}}>
								{user.email}
							</div>
						</button>
					))}
				</div>
			)}

			<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
				{value.map((id) => {
					const user = users.find((x) => x.id === id);

					if (!user) {
						return null;
					}

					return (
						<div
							key={id}
							className='rounded-xl p-4 flex flex-col'
							style={{
								background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
								border: '1px solid color-mix(in srgb, var(--accent) 20%, var(--border))',
							}}>
							<div className='flex items-center gap-3'>
								<div
									className='h-9 w-9 rounded-lg flex items-center justify-center'
									style={{
										background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
									}}>
									<UserIcon size={16} />
								</div>

								<div className='flex-1 min-w-0'>
									<div className='font-medium truncate'>{user.name || 'Unnamed User'}</div>

									<div
										className='text-xs truncate'
										style={{
											color: 'var(--text-muted)',
										}}>
										{user.email}
									</div>
								</div>
							</div>

							<div className='mt-4'>
								<button
									onClick={() => remove(id)}
									className='w-full rounded-lg py-2 text-sm transition'
									style={{
										border: '1px solid var(--border)',
									}}>
									<div className='flex items-center justify-center gap-2'>
										<X size={14} />
										Remove Access
									</div>
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
