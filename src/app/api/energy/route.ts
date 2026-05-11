/** @format */
'use server';

import '@/lib/mqtt';

export async function GET() {
	return Response.json({
		data: global.latestEnergyData ?? null,
	});
}
