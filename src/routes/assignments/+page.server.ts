import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [children, unassignedBags, unassignedClothing] = await Promise.all([
		prisma.child.findMany({
			where: { active: true },
			include: {
				bagAssignments: {
					include: {
						bag: {
							include: { clothingPieces: true }
						}
					}
				},
				clothingAssignments: {
					include: {
						clothingPiece: {
							include: { bag: true }
						}
					}
				}
			},
			orderBy: { firstName: 'asc' }
		}),
		prisma.bag.findMany({
			where: { bagAssignment: null },
			orderBy: { label: 'asc' }
		}),
		prisma.clothingPiece.findMany({
			where: { clothingAssignment: null },
			include: { bag: true },
			orderBy: { type: 'asc' }
		})
	]);

	return { children, unassignedBags, unassignedClothing };
};

export const actions: Actions = {
	assignBag: async ({ request }) => {
		const data = await request.formData();
		const bagId = data.get('bagId') as string;
		const childId = data.get('childId') as string;

		if (!bagId || !childId) {
			return fail(400, { error: 'Bag and child are required' });
		}

		// Check if bag is already assigned
		const existing = await prisma.bagAssignment.findUnique({
			where: { bagId }
		});

		if (existing) {
			return fail(400, { error: 'Bag is already assigned' });
		}

		await prisma.bagAssignment.create({
			data: { bagId, childId }
		});

		return { success: true };
	},

	unassignBag: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Assignment ID is required' });
		}

		await prisma.bagAssignment.delete({ where: { id } });

		return { success: true };
	},

	assignClothing: async ({ request }) => {
		const data = await request.formData();
		const clothingPieceId = data.get('clothingPieceId') as string;
		const childId = data.get('childId') as string;
		const notes = (data.get('notes') as string) || '';

		if (!clothingPieceId || !childId) {
			return fail(400, { error: 'Clothing piece and child are required' });
		}

		// Check if piece is already assigned
		const existing = await prisma.clothingAssignment.findUnique({
			where: { clothingPieceId }
		});

		if (existing) {
			return fail(400, { error: 'Clothing piece is already assigned' });
		}

		await prisma.clothingAssignment.create({
			data: { clothingPieceId, childId, notes }
		});

		return { success: true };
	},

	unassignClothing: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Assignment ID is required' });
		}

		await prisma.clothingAssignment.delete({ where: { id } });

		return { success: true };
	}
};
