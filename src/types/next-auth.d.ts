/** @format */

import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
	interface Session {
		user: {
			roleId?: string;
			permissions?: string[];
			theme?: 'light' | 'dark' | 'system';
			projects: string[];
		} & DefaultSession['user'];
	}

	interface User {
		roleId?: string;
		permissions?: string[];
		theme?: 'light' | 'dark' | 'system';
		projects: string[];
	}
}

declare module 'next-auth/jwt' {
	interface JWT extends DefaultJWT {
		roleId?: string;
		permissions?: string[];
		theme?: 'light' | 'dark' | 'system';
		projects: string[];
	}
}
