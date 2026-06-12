/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs/promises';
import path from 'path';

const contactsPath = path.join(process.cwd(), 'data', 'contacts.json');

export type Contact = {
	id: string;
	name: string;
	role: string;
	phone: string;
	email: string;
	createdAt: string;
	updatedAt: string;
};

export async function readContacts(): Promise<Contact[]> {
	try {
		const file = await fs.readFile(contactsPath, 'utf8');

		return JSON.parse(file);
	} catch {
		return [];
	}
}

export async function writeContacts(contacts: Contact[]) {
	await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2), 'utf8');
}
