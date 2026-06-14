/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { Session, getServerSession } from 'next-auth';

import { Role } from '@/types/next-auth';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const ROLES_PATH = path.join(DATA_DIR, 'roles.json');

type User = Session['user'];

function ensureFiles() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
	if (!fs.existsSync(USERS_PATH)) {
		fs.writeFileSync(USERS_PATH, JSON.stringify([], null, 2));
	}
	if (!fs.existsSync(ROLES_PATH)) {
		fs.writeFileSync(ROLES_PATH, JSON.stringify([], null, 2));
	}
}

function loadUsers(): User[] {
	ensureFiles();
	return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function saveUsers(users: User[]) {
	ensureFiles();
	fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadRoles(): Role[] {
	ensureFiles();
	return JSON.parse(fs.readFileSync(ROLES_PATH, 'utf8'));
}

// ---------- GET ----------
export async function GET() {
	const users = loadUsers();
	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}

// ---------- POST (CREATE USER) ----------
export async function POST(request: NextRequest) {
	const body = await request.json();
	const { name, email, password, roleId } = body || {};

	if (!name || !email || !password || !roleId) {
		return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
	}

	const users = loadUsers();
	const roles = loadRoles();

	if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
		return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
	}

	const role = roles.find((r) => r.id === roleId);
	if (!role) {
		return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
	}

	const passwordHash = await bcrypt.hash(password, 12);

	const newUser: User = {
		id: `u_${Date.now()}`,
		name,
		email,
		passwordHash,
		roleId,
		permissions: [...role.defaultPermissions],
		theme: 'system',
		preferences: {
			projectPrompts: true,
			defaultView: 'list',
		},
	};

	users.push(newUser);
	saveUsers(users);

	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}

// ---------- PATCH (ADMIN EDIT USER) ----------
export async function PATCH(request: NextRequest) {
	const body = await request.json();

	const { id, name, email, roleId, password, permissions, theme, projects, preferences } = body || {};

	if (!id) {
		return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
	}

	const users = loadUsers();
	const roles = loadRoles();

	const index = users.findIndex((u) => u.id === id);

	if (index === -1) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	if (email) {
		const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);

		if (exists) {
			return NextResponse.json(
				{
					error: 'Another user already has this email',
				},
				{ status: 409 }
			);
		}
	}

	if (name) users[index].name = name;
	if (email) users[index].email = email;

	if (roleId) {
		const role = roles.find((r) => r.id === roleId);

		if (!role) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
		}

		users[index].roleId = roleId;
	}

	if (Array.isArray(permissions)) {
		users[index].permissions = permissions;
	}

	if (Array.isArray(projects)) {
		users[index].projects = projects;
	}

	if (theme && ['light', 'dark', 'system'].includes(theme)) {
		users[index].theme = theme;
	}

	if (preferences) {
		users[index].preferences = {
			...users[index].preferences,
			...preferences,
		};
	}

	if (password) {
		users[index].passwordHash = await bcrypt.hash(password, 12);
	}

	saveUsers(users);

	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);

	return NextResponse.json({
		users: safeUsers,
	});
}

// ---------- PATCH SELF (Theme + Password) ----------
export async function PUT(request: NextRequest) {
	const session = await getServerSession();

	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();

	const { theme, currentPassword, newPassword, preferences } = body || {};

	const users = loadUsers();

	const index = users.findIndex((u) => u.email.toLowerCase() === session.user?.email?.toLowerCase());

	if (index === -1) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	if (theme && ['light', 'dark', 'system'].includes(theme)) {
		users[index].theme = theme;
	}

	if (preferences) {
		users[index].preferences = {
			...users[index].preferences,
			...preferences,
		};
	}

	if (newPassword) {
		if (!currentPassword) {
			return NextResponse.json({ error: 'Current password required' }, { status: 400 });
		}

		const valid = await bcrypt.compare(currentPassword, users[index].passwordHash as string);

		if (!valid) {
			return NextResponse.json({ error: 'Current password incorrect' }, { status: 401 });
		}

		users[index].passwordHash = await bcrypt.hash(newPassword, 12);
	}

	saveUsers(users);

	return NextResponse.json({
		success: true,
		user: {
			...users[index],
			passwordHash: undefined,
		},
	});
}

// ---------- DELETE ----------
export async function DELETE(request: NextRequest) {
	const url = new URL(request.url);
	const id = url.searchParams.get('id');

	if (!id) {
		return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
	}

	const users = loadUsers();
	const exists = users.some((u) => u.id === id);

	if (!exists) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const nextUsers = users.filter((u) => u.id !== id);
	saveUsers(nextUsers);

	const safeUsers = nextUsers.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}
