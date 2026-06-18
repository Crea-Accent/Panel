/** @format */
'use client';

type Props = {
	title?: string;
	description?: string;
};

export default function Loading({ title = 'Loading', description = 'Please wait...' }: Props) {
	return (
		<div className='flex items-center justify-center my-auto'>
			<div className='rounded-3xl p-10 text-center max-w-md w-full'>
				<div className='flex justify-center mb-6'>
					<div className='relative h-16 w-16'>
						<div className='absolute inset-0 rounded-full border-4 border-zinc-300 dark:border-zinc-700' />

						<div
							className='absolute inset-0 rounded-full border-4 border-transparent border-t-[#a4b795] animate-spin'
							style={{
								animationDuration: '1s',
							}}
						/>
					</div>
				</div>

				<div className='text-xl font-semibold'>{title}</div>

				<div className='text-sm text-zinc-500 mt-2'>{description}</div>
			</div>
		</div>
	);
}
