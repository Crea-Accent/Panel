/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

import { X } from 'lucide-react';

type Props = {
	open: boolean;
	title: string;
	children: ReactNode;
	onClose: () => void;
	footer?: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function Modal({ open, title, children, onClose, footer, size = 'md' }: Props) {
	const widths = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl',
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [onClose]);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
					<motion.div
						initial={{
							opacity: 0,
							scale: 0.96,
							y: 12,
						}}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
						}}
						exit={{
							opacity: 0,
							scale: 0.96,
							y: 12,
						}}
						transition={{
							type: 'spring',
							stiffness: 350,
							damping: 30,
						}}
						onClick={(e) => e.stopPropagation()}
						className={`
							w-full
							${widths[size]}
							bg-white dark:bg-zinc-900
							border border-zinc-200 dark:border-zinc-800
							rounded-2xl
							shadow-xl
							overflow-hidden
						`}>
						<div className='flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800'>
							<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>{title}</h2>

							<button
								onClick={onClose}
								className='
									h-8 w-8
									flex items-center justify-center
									rounded-lg
									hover:bg-zinc-100
									dark:hover:bg-zinc-800
									transition
								'>
								<X size={16} />
							</button>
						</div>

						<div className='p-6'>{children}</div>

						{footer && <div className='px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3'>{footer}</div>}
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
