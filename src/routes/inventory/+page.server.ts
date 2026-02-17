import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/roles';

export const load: PageServerLoad = async () => {
	const [bags, clothingPieces, children, allBags] = await Promise.all([
		prisma.bag.findMany({
			include: {
				bagAssignment: { include: { child: true } },
				clothingPieces: true,
				tags: true
			},
			orderBy: { createdAt: 'desc' }
		}),
		prisma.clothingPiece.findMany({
			include: {
				clothingAssignment: { include: { child: true } },
				bag: true,
				tags: true
			},
			orderBy: { createdAt: 'desc' }
		}),
		prisma.child.findMany({
			where: { active: true },
			orderBy: { firstName: 'asc' }
		}),
		prisma.bag.findMany({
			orderBy: { label: 'asc' },
			select: { id: true, label: true, type: true }
		})
	]);

	return { bags, clothingPieces, children, allBags };
};

export const actions: Actions = {
	createBag: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const type = data.get('type') as string;
		const label = data.get('label') as string;
		const condition = data.get('condition') as string;
		const notes = (data.get('notes') as string) || '';

		if (!type || !label) {
			return fail(400, { error: 'Type and label are required' });
		}

		await prisma.bag.create({
			data: { type, label, condition: condition || 'good', notes }
		});

		return { success: true };
	},

	updateBag: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin', 'laundry', 'mender');
		const data = await request.formData();
		const id = data.get('id') as string;
		const type = data.get('type') as string;
		const label = data.get('label') as string;
		const condition = data.get('condition') as string;
		const notes = (data.get('notes') as string) || '';

		if (!id || !type || !label) {
			return fail(400, { error: 'ID, type, and label are required' });
		}

		await prisma.bag.update({
			where: { id },
			data: { type, label, condition, notes }
		});

		return { success: true };
	},

	deleteBag: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await prisma.bag.delete({ where: { id } });

		return { success: true };
	},

	createClothing: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const type = data.get('type') as string;
		const size = data.get('size') as string;
		const color = (data.get('color') as string) || '';
		const condition = data.get('condition') as string;
		const season = data.get('season') as string;
		const bagId = (data.get('bagId') as string) || null;
		const notes = (data.get('notes') as string) || '';

		if (!type || !size) {
			return fail(400, { error: 'Type and size are required' });
		}

		await prisma.clothingPiece.create({
			data: {
				type,
				size,
				color,
				condition: condition || 'good',
				season: season || 'all',
				bagId: bagId || null,
				notes
			}
		});

		return { success: true };
	},

	updateClothing: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin', 'laundry', 'mender');
		const data = await request.formData();
		const id = data.get('id') as string;
		const type = data.get('type') as string;
		const size = data.get('size') as string;
		const color = (data.get('color') as string) || '';
		const condition = data.get('condition') as string;
		const season = data.get('season') as string;
		const bagId = (data.get('bagId') as string) || null;
		const notes = (data.get('notes') as string) || '';

		if (!id || !type || !size) {
			return fail(400, { error: 'ID, type, and size are required' });
		}

		await prisma.clothingPiece.update({
			where: { id },
			data: {
				type,
				size,
				color,
				condition,
				season,
				bagId: bagId || null,
				notes
			}
		});

		return { success: true };
	},

	deleteClothing: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await prisma.clothingPiece.delete({ where: { id } });

		return { success: true };
	}
};
