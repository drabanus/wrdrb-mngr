import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { predictGrowth } from '$lib/utils/growth';

export const load: PageServerLoad = async () => {
	const [childCount, upcomingGigs, openTodos, recentScans, children] = await Promise.all([
		prisma.child.count({ where: { active: true } }),
		prisma.gig.findMany({
			where: { status: 'upcoming' },
			orderBy: { date: 'asc' },
			take: 5
		}),
		prisma.todoItem.findMany({
			where: { status: { not: 'done' } },
			include: { assignedUser: true },
			orderBy: { createdAt: 'desc' },
			take: 10
		}),
		prisma.scanEvent.findMany({
			include: { tag: true, user: true },
			orderBy: { timestamp: 'desc' },
			take: 10
		}),
		prisma.child.findMany({
			where: { active: true },
			include: {
				measurements: { orderBy: { measuredAt: 'desc' } }
			}
		})
	]);

	// Calculate growth predictions
	const growthAlerts = children
		.map((child) =>
			predictGrowth(
				child.id,
				`${child.firstName} ${child.lastName}`,
				child.measurements
			)
		)
		.filter(Boolean);

	// Count todos by type
	const todosByType = openTodos.reduce((acc: Record<string, number>, todo) => {
		acc[todo.type] = (acc[todo.type] || 0) + 1;
		return acc;
	}, {});

	// Pending returns (dispatched gigs)
	const pendingReturns = await prisma.gig.count({ where: { status: 'dispatched' } });

	return {
		childCount,
		upcomingGigs,
		openTodos,
		recentScans,
		growthAlerts,
		todosByType,
		pendingReturns
	};
};
