/** @format */

import './globals.css';

import Header from '@/components/Header';
import type { Metadata } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import Sidebar from '@/components/Sidebar';
import { SidebarLayout } from '@/components/SidebarLayout';
import { SidebarProvider } from '@/components/SidebarProvider';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Crea-Accent',
	description: '',
	icons: {
		icon: '/Crea-Accent-logo.png',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession();

	if (!session) return redirect('/api/auth/signin');

	return (
		<html lang='en'>
			<body className={``}>
				<SessionProvider>
					<SidebarProvider>
						<Header />
						<Sidebar />
						<SidebarLayout>
							<main className='flex-1'>{children}</main>
						</SidebarLayout>
					</SidebarProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
