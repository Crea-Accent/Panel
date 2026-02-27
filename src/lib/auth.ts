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

				// what ends up in the JWT
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				};
			},
		}),
	],

	session: { strategy: 'jwt' },

	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = (user as unknown as Record<'role', string>).role;
			}
			return token;
		},

		async session({ session, token }) {
			if (session.user) {
				(session.user as Record<'role', string>).role = token.role as 'Technieker' | 'Verkoper';
			}
			return session;
		},
	},
};
