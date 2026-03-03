/** @format */

import NextAuth, { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
	interface Session {
		user: {
			roleId?: string;
			permissions?: string[];
			theme?: 'light' | 'dark' | 'system';
		} & DefaultSession['user'];
	}

	interface User {
		roleId?: string;
		permissions?: string[];
		theme?: 'light' | 'dark' | 'system';
	}
}

declare module 'next-auth/jwt' {
	interface JWT extends DefaultJWT {
		roleId?: string;
		permissions?: string[];
		theme?: 'light' | 'dark' | 'system';
	}
}
