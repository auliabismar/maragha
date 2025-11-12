import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user: layoutUser } = await parent();
	const user = locals.user || layoutUser;
	return {
		user
	};
};