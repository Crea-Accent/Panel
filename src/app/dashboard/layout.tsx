/** @format */

import { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import { SidebarLayout } from '@/components/SidebarLayout';
import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Crea-Accent | Dashboard',
	description: '',
	icons: {
		icon: '/favicon.svg',
	},
};

export default async function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authConfig);
	const headerList = await headers();

	// Not logged in
	if (!session && !headerList.get('x-current-path')?.match(new RegExp('\/dashboard\/projects\/\w*'))) return redirect('/auth/login');

	const permissions = session?.user?.permissions ?? [];

	// Client users are not allowed in dashboard
	if (permissions.includes('client.read') || permissions.includes('client.write')) return redirect('/portal');

	return (
		<>
			<Sidebar />

			<SidebarLayout>
				<main className='flex-1 w-full md:px-6'>{children}</main>
			</SidebarLayout>
		</>
	);
}
