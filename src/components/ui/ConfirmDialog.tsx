/** @format */
'use client';

import Button from './Button';
import Modal from './Modal';

type Props = {
	open: boolean;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

export default function ConfirmDialog({ open, title = 'Are you sure?', description, confirmText = 'Confirm', cancelText = 'Cancel', loading = false, onClose, onConfirm }: Props) {
	return (
		<Modal
			open={open}
			title={title}
			onClose={onClose}
			size='sm'
			footer={
				<>
					<Button variant='secondary' onClick={onClose} disabled={loading}>
						{cancelText}
					</Button>

					<Button variant='danger' onClick={onConfirm} loading={loading}>
						{confirmText}
					</Button>
				</>
			}>
			{description && <p className='text-sm text-zinc-500 dark:text-zinc-400'>{description}</p>}
		</Modal>
	);
}
