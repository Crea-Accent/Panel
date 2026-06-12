/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { readContacts, writeContacts } from '@/lib/contacts';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const contacts = await readContacts();

		const contact = contacts.find((contact) => contact.id === id);

		if (!contact) {
			return NextResponse.json(
				{
					error: 'Contact not found',
				},
				{
					status: 404,
				}
			);
		}

		return NextResponse.json(contact);
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: 'Failed to load contact',
			},
			{
				status: 500,
			}
		);
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const body = await request.json();

		const contacts = await readContacts();

		const index = contacts.findIndex((contact) => contact.id === id);

		if (index === -1) {
			return NextResponse.json(
				{
					error: 'Contact not found',
				},
				{
					status: 404,
				}
			);
		}

		contacts[index] = {
			...contacts[index],
			...body,
			id,
			updatedAt: new Date().toISOString(),
		};

		await writeContacts(contacts);

		return NextResponse.json(contacts[index]);
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: 'Failed to update contact',
			},
			{
				status: 500,
			}
		);
	}
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		const contacts = await readContacts();

		const filtered = contacts.filter((contact) => contact.id !== id);

		if (filtered.length === contacts.length) {
			return NextResponse.json(
				{
					error: 'Contact not found',
				},
				{
					status: 404,
				}
			);
		}

		await writeContacts(filtered);

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: 'Failed to delete contact',
			},
			{
				status: 500,
			}
		);
	}
}
