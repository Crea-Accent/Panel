/** @format */
'use client';

import { ReactNode, createContext, useContext } from 'react';

import { useSession } from 'next-auth/react';

type PermissionsContextType = {
	permissions: string[];
	loading: boolean;
	has: (perm: string) => boolean;
	hasAny: (perms: string[]) => boolean;
	hasAll: (perms: string[]) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession() as unknown as { data: { user: { permissions: string[] } }; status: string };

	const loading = status === 'loading';

	const permissions: string[] = session?.user?.permissions || [];

	function has(perm: string) {
		return permissions.includes(perm);
	}

	function hasAny(perms: string[]) {
		return perms.some((p) => permissions.includes(p));
	}

	function hasAll(perms: string[]) {
		console.log(permissions, perms);
		return perms.every((p) => permissions.includes(p));
	}

	return (
		<PermissionsContext.Provider
			value={{
				permissions,
				loading,
				has,
				hasAny,
				hasAll,
			}}>
			{children}
		</PermissionsContext.Provider>
	);
}

export function usePermissions() {
	const ctx = useContext(PermissionsContext);
	if (!ctx) throw new Error('usePermissions must be used inside PermissionsProvider');
	return ctx;
}
