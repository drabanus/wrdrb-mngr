import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { hashPassword } from '$lib/server/password';

export const load: PageServerLoad = async () => {
	const users = await prisma.user.findMany({
		orderBy: { name: 'asc' },
		select: {
			id: true,
			username: true,
			name: true,
			email: true,
			role: true,
			active: true,
			createdAt: true
		}
	});
	return { users };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const role = data.get('role') as string;

		if (!username || !password || !name || !email || !role) {
			return fail(400, { error: 'All fields are required' });
		}

		const existing = await prisma.user.findUnique({ where: { username } });
		if (existing) return fail(400, { error: 'Username already taken' });

		const passwordHash = await hashPassword(password);
		await prisma.user.create({
			data: { username, passwordHash, name, email, role }
		});
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const role = data.get('role') as string;
		const password = data.get('password') as string;
		const active = data.get('active') === 'on';

		if (!id || !name || !email || !role) {
			return fail(400, { error: 'Name, email, and role are required' });
		}

		const updateData: any = { name, email, role, active };
		if (password) {
			updateData.passwordHash = await hashPassword(password);
		}

		await prisma.user.update({ where: { id }, data: updateData });
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID required' });

		// Prevent deleting the last admin
		const adminCount = await prisma.user.count({ where: { role: 'admin', active: true } });
		const user = await prisma.user.findUnique({ where: { id } });
		if (user?.role === 'admin' && adminCount <= 1) {
			return fail(400, { error: 'Cannot delete the last administrator' });
		}

		await prisma.user.delete({ where: { id } });
		return { success: true };
	},

	toggleActive: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID required' });

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) return fail(404, { error: 'User not found' });

		// Prevent deactivating the last admin
		if (user.role === 'admin' && user.active) {
			const adminCount = await prisma.user.count({ where: { role: 'admin', active: true } });
			if (adminCount <= 1) {
				return fail(400, { error: 'Cannot deactivate the last administrator' });
			}
		}

		await prisma.user.update({
			where: { id },
			data: { active: !user.active }
		});
		return { success: true };
	}
};
