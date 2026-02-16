import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [gigs, bags] = await Promise.all([
		prisma.gig.findMany({
			include: {
				dispatchEvents: {
					include: { bag: { include: { bagAssignment: { include: { child: true } } } } }
				}
			},
			orderBy: { date: 'asc' }
		}),
		prisma.bag.findMany({
			include: {
				bagAssignment: { include: { child: true } },
				clothingPieces: true
			},
			orderBy: { label: 'asc' }
		})
	]);

	return { gigs, bags };
};

export const actions: Actions = {
	createGig: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const date = data.get('date') as string;
		const location = (data.get('location') as string) || '';

		if (!name || !date) return fail(400, { error: 'Name and date are required' });

		await prisma.gig.create({
			data: { name, date: new Date(date), location }
		});
		return { success: true };
	},

	updateGigStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const status = data.get('status') as string;

		if (!id || !status) return fail(400, { error: 'ID and status required' });

		await prisma.gig.update({ where: { id }, data: { status } });
		return { success: true };
	},

	dispatchBag: async ({ request, locals }) => {
		const data = await request.formData();
		const gigId = data.get('gigId') as string;
		const bagId = data.get('bagId') as string;

		if (!gigId || !bagId) return fail(400, { error: 'Gig and bag are required' });

		await prisma.dispatchEvent.create({
			data: { gigId, bagId, action: 'dispatch', scannedBy: locals.user?.name || '' }
		});
		return { success: true };
	},

	receiveBag: async ({ request, locals }) => {
		const data = await request.formData();
		const gigId = data.get('gigId') as string;
		const bagId = data.get('bagId') as string;

		if (!gigId || !bagId) return fail(400, { error: 'Gig and bag are required' });

		await prisma.dispatchEvent.create({
			data: { gigId, bagId, action: 'receive', scannedBy: locals.user?.name || '' }
		});
		return { success: true };
	},

	deleteGig: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID required' });
		await prisma.gig.delete({ where: { id } });
		return { success: true };
	}
};
