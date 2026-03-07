/** @format */

import Credentials from 'next-auth/providers/credentials';
import { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json');

function loadUsers() {
	if (!fs.existsSync(USERS_PATH)) return [];
	const raw = fs.readFileSync(USERS_PATH, 'utf8');
	const parsed = JSON.parse(raw);
	return Array.isArray(parsed) ? parsed : [];
}

export const authConfig: NextAuthOptions = {
	pages: {
		signIn: '/auth/login',
		error: '/auth/login',
		signOut: '/auth/logout',
	},

	providers: [
		Credentials({
			name: 'Credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},

			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const users = loadUsers();
				const user = users.find((u) => u.email.toLowerCase() === credentials.email.toLowerCase());

				if (!user) return null;

				const valid = await bcrypt.compare(credentials.password, user.passwordHash);

				if (!valid) return null;

				return {
					id: user.id,
					name: user.name,
					email: user.email,
					roleId: user.roleId,
					permissions: user.permissions,
					theme: user.theme || 'system',
					projects: user.projects || [],
				};
			},
		}),
	],

	session: { strategy: 'jwt' },

	callbacks: {
		async jwt({ token, user }) {
			// 🔹 On login
			if (user) {
				token.roleId = user.roleId;
				token.permissions = user.permissions;
				token.theme = user.theme;
				token.projects = user.projects ?? [];
				return token;
			}

			// 🔹 On refresh → rehydrate from users.json
			const users = loadUsers();
			const dbUser = users.find((u) => u.email.toLowerCase() === token.email?.toLowerCase());

			if (dbUser) {
				token.roleId = dbUser.roleId;
				token.permissions = dbUser.permissions;
				token.theme = dbUser.theme ?? 'system';
				token.projects = dbUser.projects ?? [];
			}

			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				session.user.roleId = token.roleId;
				session.user.permissions = token.permissions;
				session.user.theme = token.theme;
				session.user.projects = token.projects;
			}
			return session;
		},
	},
};
