/** @format */
'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

import { Session } from 'next-auth';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

type User = Omit<Session['user'], 'passwordHash'> & {
	presence: {
		status: 'online' | 'idle' | 'offline';
		lastSeen: string | null;
		lastSeenAgo: number | null;
		page?: string;
		project?: string;
		idle: boolean;
	};
};

type StatusContextType = {
	users: User[];
	refresh: () => Promise<void>;
};

const StatusContext = createContext<StatusContextType | null>(null);

const HEARTBEAT_INTERVAL = 30000;
const IDLE_TIMEOUT = 5 * 60 * 1000;

export function StatusProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const pathname = usePathname();

	const [users, setUsers] = useState<User[]>([]);

	const lastActivity = useRef(Date.now());

	const refresh = async () => {
		try {
			const res = await fetch('/api/users');

			const data = await res.json();

			setUsers((data.users ?? []).filter((u: User) => u.id !== session?.user.id));
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		const updateActivity = () => {
			lastActivity.current = Date.now();
		};

		window.addEventListener('mousemove', updateActivity);
		window.addEventListener('mousedown', updateActivity);
		window.addEventListener('keydown', updateActivity);
		window.addEventListener('touchstart', updateActivity);
		window.addEventListener('scroll', updateActivity);

		return () => {
			window.removeEventListener('mousemove', updateActivity);
			window.removeEventListener('mousedown', updateActivity);
			window.removeEventListener('keydown', updateActivity);
			window.removeEventListener('touchstart', updateActivity);
			window.removeEventListener('scroll', updateActivity);
		};
	}, []);

	useEffect(() => {
		if (!session?.user.id) return;

		const heartbeat = async () => {
			try {
				await fetch(`/api/users/${session.user.id}/presence`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						page: pathname,
						idle: Date.now() - lastActivity.current > IDLE_TIMEOUT,
					}),
				});
			} catch (error) {
				console.error(error);
			}
		};

		heartbeat();

		const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL);

		return () => clearInterval(interval);
	}, [session?.user.id]);

	useEffect(() => {
		if (!session?.user.id) return;

		(async () => {
			await fetch(`/api/users/${session.user.id}/presence`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					page: pathname,
					idle: Date.now() - lastActivity.current > IDLE_TIMEOUT,
				}),
			});

			refresh();
		})();
	}, [pathname, session?.user.id]);

	useEffect(() => {
		refresh();
	}, []);

	const REFRESH_INTERVAL = 15000;

	useEffect(() => {
		refresh();

		const interval = setInterval(refresh, REFRESH_INTERVAL);

		return () => clearInterval(interval);
	}, []);

	return (
		<StatusContext.Provider
			value={{
				users,
				refresh,
			}}>
			{children}
		</StatusContext.Provider>
	);
}

export function useStatus() {
	const ctx = useContext(StatusContext);

	if (!ctx) {
		throw new Error('Status must be used inside StatusProvider');
	}

	return ctx;
}
