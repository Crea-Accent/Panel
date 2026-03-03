/** @format */

'use client';

import { PERMISSIONS } from '@/lib/permissions';
import { motion } from 'framer-motion';

type Props = {
	value: string[];
	onChange: (next: string[]) => void;
	compareWith?: string[];
};

export default function PermissionMatrix({ value, onChange, compareWith }: Props) {
	const domains = Array.from(new Set(PERMISSIONS.map((p) => p.key.split('.')[0])));

	function has(domain: string, type: 'read' | 'write') {
		return value.includes(`${domain}.${type}`);
	}

	function toggle(domain: string, type: 'read' | 'write') {
		const key = `${domain}.${type}`;
		const exists = value.includes(key);

		let next = [...value];

		if (exists) {
			next = next.filter((p) => p !== key);
		} else {
			next.push(key);

			// write implies read
			if (type === 'write' && !next.includes(`${domain}.read`)) {
				next.push(`${domain}.read`);
			}
		}

		onChange(next);
	}

	function isOverride(domain: string, type: 'read' | 'write') {
		if (!compareWith) return false;

		const roleHas = compareWith.includes(`${domain}.${type}`);
		const userHas = value.includes(`${domain}.${type}`);

		return roleHas !== userHas;
	}

	return (
		<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm'>
			{/* Header */}
			<div className='grid grid-cols-3 bg-gray-50 dark:bg-zinc-800 text-xs font-medium text-gray-500 dark:text-zinc-500 uppercase tracking-wide px-6 py-4'>
				<div>Permission</div>
				<div className='text-center'>Read</div>
				<div className='text-center'>Write</div>
			</div>

			{/* Rows */}
			{domains.map((domain) => (
				<motion.div key={domain} layout className='grid grid-cols-3 items-center px-6 py-4 border-t border-gray-100 dark:border-zinc-800 text-sm'>
					<div className='capitalize font-medium text-gray-900 dark:text-zinc-100'>{domain}</div>

					{(['read', 'write'] as const).map((type) => {
						const active = has(domain, type);
						const override = isOverride(domain, type);

						return (
							<div key={type} className='flex justify-center'>
								<button
									onClick={() => toggle(domain, type)}
									className={`
										relative w-11 h-6 rounded-full transition-colors duration-200
										${active ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}
										${override ? 'ring-2 ring-amber-400/60 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900' : ''}
									`}>
									<motion.span
										layout
										transition={{
											type: 'spring',
											stiffness: 500,
											damping: 30,
										}}
										className='absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white dark:bg-zinc-200 shadow-sm'
										style={{
											x: active ? 20 : 0,
										}}
									/>
								</button>
							</div>
						);
					})}
				</motion.div>
			))}
		</div>
	);
}
