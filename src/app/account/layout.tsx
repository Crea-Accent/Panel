/** @format */

import Sidebar from '@/components/Sidebar';
import { SidebarLayout } from '@/components/SidebarLayout';
import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authConfig);

	if (!session) redirect('/auth/login');

	return (
		<>
			<Sidebar />

			<SidebarLayout>
				<main
					className='
                        flex-1
                        min-h-0
                        w-full
                        px-4
                        md:px-6
                        lg:px-8
                        py-6
                    '>
					{children}
				</main>
			</SidebarLayout>
		</>
	);
}
