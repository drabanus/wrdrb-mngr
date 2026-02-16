import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import Database from 'better-sqlite3';

import type { RequestEvent } from '@sveltejs/kit';

const db = new Database('prisma/garderobe.db');

const adapter = new BetterSqlite3Adapter(db, {
	user: 'User',
	session: 'Session'
});

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		attributes: {
			secure: false
		}
	},
	getUserAttributes: (attributes) => {
		return {
			username: attributes.username,
			name: attributes.name,
			email: attributes.email,
			role: attributes.role,
			active: attributes.active
		};
	}
});

declare module 'lucia' {
	interface Register {
		Lucia: typeof lucia;
		DatabaseUserAttributes: DatabaseUserAttributes;
	}
}

interface DatabaseUserAttributes {
	username: string;
	password_hash: string;
	name: string;
	email: string;
	role: string;
	active: number;
}

export async function validateSession(event: RequestEvent) {
	const sessionId = event.cookies.get(lucia.sessionCookieName);

	if (!sessionId) {
		event.locals.user = null;
		event.locals.session = null;
		return;
	}

	const { session, user } = await lucia.validateSession(sessionId);

	if (session && session.fresh) {
		const sessionCookie = lucia.createSessionCookie(session.id);
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	if (!session) {
		const sessionCookie = lucia.createBlankSessionCookie();
		event.cookies.set(sessionCookie.name, sessionCookie.value, {
			path: '/',
			...sessionCookie.attributes
		});
	}

	event.locals.user = user;
	event.locals.session = session;
}
