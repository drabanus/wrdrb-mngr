import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { requireRole } from '$lib/server/roles';

export const load: PageServerLoad = async () => {
	const children = await prisma.child.findMany({
		orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
		include: {
			measurements: {
				orderBy: { measuredAt: 'desc' }
			},
			parents: true,
			bagAssignments: {
				include: { bag: true }
			},
			clothingAssignments: {
				include: { clothingPiece: true }
			}
		}
	});

	return { children };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const firstName = data.get('firstName') as string;
		const lastName = data.get('lastName') as string;
		const birthDate = data.get('birthDate') as string;
		const gender = data.get('gender') as string;

		if (!firstName || !lastName || !birthDate || !gender) {
			return fail(400, { error: 'All fields are required' });
		}

		await prisma.child.create({
			data: {
				firstName,
				lastName,
				birthDate: new Date(birthDate),
				gender
			}
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const id = data.get('id') as string;
		const firstName = data.get('firstName') as string;
		const lastName = data.get('lastName') as string;
		const birthDate = data.get('birthDate') as string;
		const gender = data.get('gender') as string;
		const notes = data.get('notes') as string;
		const active = data.get('active') === 'on';

		if (!id || !firstName || !lastName || !birthDate || !gender) {
			return fail(400, { error: 'All fields are required' });
		}

		await prisma.child.update({
			where: { id },
			data: {
				firstName,
				lastName,
				birthDate: new Date(birthDate),
				gender,
				notes: notes ?? '',
				active
			}
		});

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await prisma.child.delete({ where: { id } });

		return { success: true };
	},

	addMeasurement: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const childId = data.get('childId') as string;

		if (!childId) {
			return fail(400, { error: 'Child ID is required' });
		}

		const parseFloat_ = (val: FormDataEntryValue | null): number | null => {
			if (!val || val === '') return null;
			const n = parseFloat(val as string);
			return isNaN(n) ? null : n;
		};

		await prisma.measurement.create({
			data: {
				childId,
				heightCm: parseFloat_(data.get('heightCm')),
				armLengthCm: parseFloat_(data.get('armLengthCm')),
				legLengthCm: parseFloat_(data.get('legLengthCm')),
				headCircCm: parseFloat_(data.get('headCircCm')),
				bellyCircCm: parseFloat_(data.get('bellyCircCm')),
				hipCircCm: parseFloat_(data.get('hipCircCm')),
				clothingSize: (data.get('clothingSize') as string) || null,
				shoeSize: (data.get('shoeSize') as string) || null
			}
		});

		return { success: true };
	},

	addParent: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const childId = data.get('childId') as string;
		const name = data.get('name') as string;
		const phone = data.get('phone') as string;
		const email = data.get('email') as string;
		const relation = data.get('relation') as string;

		if (!childId || !name) {
			return fail(400, { error: 'Child ID and name are required' });
		}

		await prisma.parent.create({
			data: {
				childId,
				name,
				phone: phone ?? '',
				email: email ?? '',
				relation: relation || 'parent'
			}
		});

		return { success: true };
	},

	deleteParent: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Parent ID is required' });
		}

		await prisma.parent.delete({ where: { id } });

		return { success: true };
	}
};
