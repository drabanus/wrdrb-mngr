import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { sendGigReminders } from '$lib/server/email';
import { requireRole } from '$lib/server/roles';

export const load: PageServerLoad = async () => {
	const gigs = await prisma.gig.findMany({
		orderBy: { date: 'asc' }
	});
	return { gigs };
};

export const actions: Actions = {
	createGig: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const name = data.get('name') as string;
		const date = data.get('date') as string;
		const location = (data.get('location') as string) || '';
		const notes = (data.get('notes') as string) || '';

		if (!name || !date) return fail(400, { error: 'Name and date are required' });

		await prisma.gig.create({
			data: { name, date: new Date(date), location, notes }
		});
		return { success: true };
	},

	sendReminders: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const gigId = data.get('gigId') as string;

		if (!gigId) return fail(400, { error: 'Gig ID is required' });

		const result = await sendGigReminders(gigId, locals.user?.id);
		if (!result.success) {
			return fail(500, { error: result.error || 'Failed to send reminders' });
		}
		return { success: true, remindersSent: true };
	}
};
