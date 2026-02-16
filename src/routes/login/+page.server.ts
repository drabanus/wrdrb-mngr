import { fail, redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { lucia } from '$lib/server/auth';
import { verifyPassword } from '$lib/server/password';
import { prisma } from '$lib/server/db';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, `${base}/dashboard`);
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
			return fail(400, { error: 'Username and password are required.' });
		}

		const user = await prisma.user.findUnique({
			where: { username }
		});

		if (!user) {
			return fail(400, { error: 'Invalid username or password.' });
		}

		if (!user.active) {
			return fail(400, { error: 'This account has been deactivated.' });
		}

		const validPassword = await verifyPassword(user.passwordHash, password);

		if (!validPassword) {
			return fail(400, { error: 'Invalid username or password.' });
		}

		const session = await lucia.createSession(user.id, {});
		const sessionCookie = lucia.createSessionCookie(session.id);

		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		redirect(302, `${base}/dashboard`);
	},

	logout: async ({ locals, cookies }) => {
		if (locals.session) {
			await lucia.invalidateSession(locals.session.id);
		}

		const sessionCookie = lucia.createBlankSessionCookie();
		cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});

		redirect(302, `${base}/login`);
	}
};
