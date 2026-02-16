import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(302, `${base}/dashboard`);
};
