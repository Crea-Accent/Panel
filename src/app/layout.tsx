/** @format */

import './globals.css';

import Header from '@/components/Header';
import type { Metadata } from 'next';
import { PermissionsProvider } from '@/providers/PermissionsProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import Sidebar from '@/components/Sidebar';
import { SidebarLayout } from '@/components/SidebarLayout';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { UploadProvider } from '@/providers/UploadProvider';
import { authConfig } from '@/lib/auth';
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
	const session = await getServerSession(authConfig);

	if (!session) return redirect('/api/auth/signin');

	return (
		<html lang='en' className={`h-full`}>
			<body
				className='
					h-full
					bg-gray-50 dark:bg-zinc-950
					text-gray-900 dark:text-zinc-100
					antialiased
					selection:bg-indigo-600 selection:text-white
					transition-colors
				'>
				<SessionProvider>
					<ThemeProvider sessionTheme={session?.user?.theme}>
						<UploadProvider>
							<PermissionsProvider>
								<SidebarProvider>
									<div className='min-h-screen flex flex-col'>
										<Header />
										<Sidebar />
										<SidebarLayout>
											<main className='flex-1'>{children}</main>
										</SidebarLayout>
									</div>
								</SidebarProvider>
							</PermissionsProvider>
						</UploadProvider>
					</ThemeProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
