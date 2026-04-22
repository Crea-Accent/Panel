/** @format */

import './globals.css';

import Header from '@/components/Header';
import type { Metadata } from 'next';
import { PermissionsProvider } from '@/providers/PermissionsProvider';
import { SessionProvider } from '@/providers/SessionProvider';
import { SidebarProvider } from '@/providers/SidebarProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { UploadProvider } from '@/providers/UploadProvider';
import { authConfig } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
	title: 'Crea-Accent',
	description: '',
	icons: {
		icon: '/favicon.svg',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getServerSession(authConfig);

	return (
		<html lang='en' className='h-full'>
			<body
				className='
					h-full
					bg-zinc-50 dark:bg-zinc-950
					text-zinc-900 dark:text-zinc-100
					antialiased
					font-sans
					selection:bg-(--accent) selection:text-white
					transition-colors duration-200
				'>
				<SessionProvider>
					<ThemeProvider sessionTheme={session?.user?.theme}>
						<UploadProvider>
							<PermissionsProvider>
								<SidebarProvider>
									<div className='min-h-screen flex flex-col'>
										<Header />
										{children}
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
