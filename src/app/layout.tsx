/** @format */

import './globals.css';

import Header from '@/components/Header';
import type { Metadata } from 'next';
import { PermissionsProvider } from '@/providers/PermissionsProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import Sidebar from '@/components/Sidebar';
import { SidebarLayout } from '@/components/SidebarLayout';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { UploadProvider } from '@/providers/UploadProvider';
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
					<UploadProvider>
						<PermissionsProvider>
							<SidebarProvider>
								<Header />
								<Sidebar />
								<SidebarLayout>
									<main className='flex-1'>{children}</main>
								</SidebarLayout>
							</SidebarProvider>
						</PermissionsProvider>
					</UploadProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
