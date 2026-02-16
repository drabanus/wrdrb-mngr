import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user
			? {
					id: locals.user.id,
					username: locals.user.username,
					name: locals.user.name,
					email: locals.user.email,
					role: locals.user.role
				}
			: null
	};
};
