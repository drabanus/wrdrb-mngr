import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

const PRIORITY_ORDER: Record<string, number> = {
	urgent: 0,
	high: 1,
	normal: 2,
	low: 3
};

export const load: PageServerLoad = async () => {
	const [todoItems, users] = await Promise.all([
		prisma.todoItem.findMany({
			include: { assignedUser: true },
			orderBy: [{ createdAt: 'desc' }]
		}),
		prisma.user.findMany({
			where: { active: true },
			orderBy: { name: 'asc' },
			select: { id: true, name: true, username: true, role: true }
		})
	]);

	// Sort in JS to handle priority ordering (urgent first), then dueDate asc, then createdAt desc
	const sorted = todoItems.sort((a, b) => {
		const pa = PRIORITY_ORDER[a.priority] ?? 2;
		const pb = PRIORITY_ORDER[b.priority] ?? 2;
		if (pa !== pb) return pa - pb;

		// dueDate asc (nulls last)
		if (a.dueDate && b.dueDate) {
			const diff = a.dueDate.getTime() - b.dueDate.getTime();
			if (diff !== 0) return diff;
		} else if (a.dueDate && !b.dueDate) {
			return -1;
		} else if (!a.dueDate && b.dueDate) {
			return 1;
		}

		// createdAt desc
		return b.createdAt.getTime() - a.createdAt.getTime();
	});

	return { todoItems: sorted, users };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const type = data.get('type') as string;
		const title = data.get('title') as string;
		const description = (data.get('description') as string) || '';
		const priority = (data.get('priority') as string) || 'normal';
		const assignedTo = (data.get('assignedTo') as string) || null;
		const dueDateStr = data.get('dueDate') as string;

		if (!type || !title) {
			return fail(400, { error: 'Type and title are required' });
		}

		const dueDate = dueDateStr ? new Date(dueDateStr) : null;

		await prisma.todoItem.create({
			data: {
				type,
				title,
				description,
				priority,
				assignedTo: assignedTo || null,
				dueDate
			}
		});

		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const type = data.get('type') as string;
		const title = data.get('title') as string;
		const description = (data.get('description') as string) || '';
		const priority = (data.get('priority') as string) || 'normal';
		const status = (data.get('status') as string) || 'open';
		const assignedTo = (data.get('assignedTo') as string) || null;
		const dueDateStr = data.get('dueDate') as string;

		if (!id || !type || !title) {
			return fail(400, { error: 'ID, type, and title are required' });
		}

		const dueDate = dueDateStr ? new Date(dueDateStr) : null;

		await prisma.todoItem.update({
			where: { id },
			data: {
				type,
				title,
				description,
				priority,
				status,
				assignedTo: assignedTo || null,
				dueDate
			}
		});

		return { success: true };
	},

	updateStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const status = data.get('status') as string;

		if (!id || !status) {
			return fail(400, { error: 'ID and status are required' });
		}

		await prisma.todoItem.update({
			where: { id },
			data: { status }
		});

		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await prisma.todoItem.delete({ where: { id } });

		return { success: true };
	}
};
