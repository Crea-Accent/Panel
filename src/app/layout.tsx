/** @format */

import './globals.css';

import BackgroundGlow from '@/components/ui/BackGroundGlow';
import { HEADER_HEIGHT } from '@/lib/layout';
import Header from '@/components/Header';
import { LocalProvider } from '@/providers/LocalProvider';
import type { Metadata } from 'next';
import { PermissionsProvider } from '@/providers/PermissionsProvider';
import { ProjectPromptProvider } from '@/providers/ProjectPromptProvider';
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
		<html lang='en' className='h-full dark'>
			<body className='h-full antialiased font-sans selection:bg-(--accent) selection:text-white transition-colors duration-1000'>
				<SessionProvider>
					<ThemeProvider sessionTheme={session?.user?.theme}>
						<PermissionsProvider>
							<LocalProvider>
								<ProjectPromptProvider>
									<UploadProvider>
										<SidebarProvider>
											<div className='min-h-screen flex flex-col relative overflow-hidden'>
												{/* Background glow */}
												{/* <BackgroundGlow /> */}

												<Header />
												<div className={`mt-[${HEADER_HEIGHT}px]`}>{children}</div>
											</div>
										</SidebarProvider>
									</UploadProvider>
								</ProjectPromptProvider>
							</LocalProvider>
						</PermissionsProvider>
					</ThemeProvider>
				</SessionProvider>
			</body>
		</html>
	);
}
