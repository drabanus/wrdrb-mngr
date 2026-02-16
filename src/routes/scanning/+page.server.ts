import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [tags, bags, clothingPieces] = await Promise.all([
		prisma.tag.findMany({
			include: {
				bag: {
					include: {
						bagAssignment: { include: { child: true } }
					}
				},
				clothingPiece: {
					include: {
						bag: true
					}
				},
				scanEvents: {
					orderBy: { timestamp: 'desc' },
					take: 5
				}
			},
			orderBy: { createdAt: 'desc' }
		}),
		prisma.bag.findMany({
			orderBy: { label: 'asc' },
			select: { id: true, label: true, type: true }
		}),
		prisma.clothingPiece.findMany({
			orderBy: { type: 'asc' },
			select: { id: true, type: true, size: true, color: true }
		})
	]);

	return { tags, bags, clothingPieces };
};

export const actions: Actions = {
	registerTag: async ({ request }) => {
		const data = await request.formData();
		const type = data.get('type') as string;
		const code = data.get('code') as string;
		const linkedToType = data.get('linkedToType') as string;
		const linkedToBagId = (data.get('linkedToBagId') as string) || null;
		const linkedToPieceId = (data.get('linkedToPieceId') as string) || null;

		if (!type || !code || !linkedToType) {
			return fail(400, { error: 'Type, code, and link target are required' });
		}

		if (linkedToType === 'bag' && !linkedToBagId) {
			return fail(400, { error: 'Please select a bag to link to' });
		}

		if (linkedToType === 'clothing_piece' && !linkedToPieceId) {
			return fail(400, { error: 'Please select a clothing piece to link to' });
		}

		// Check for duplicate code
		const existing = await prisma.tag.findUnique({ where: { code } });
		if (existing) {
			return fail(400, { error: 'A tag with this code already exists' });
		}

		await prisma.tag.create({
			data: {
				type,
				code,
				linkedToType,
				linkedToBagId: linkedToType === 'bag' ? linkedToBagId : null,
				linkedToPieceId: linkedToType === 'clothing_piece' ? linkedToPieceId : null
			}
		});

		return { success: true };
	},

	deleteTag: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await prisma.tag.delete({ where: { id } });

		return { success: true };
	},

	logScan: async ({ request, locals }) => {
		const data = await request.formData();
		const tagId = data.get('tagId') as string;
		const action = data.get('action') as string;
		const notes = (data.get('notes') as string) || '';

		if (!tagId || !action) {
			return fail(400, { error: 'Tag ID and action are required' });
		}

		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		await prisma.scanEvent.create({
			data: {
				tagId,
				userId: locals.user.id,
				action,
				notes
			}
		});

		return { success: true, scanLogged: true };
	}
};
