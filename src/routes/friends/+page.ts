import type { FriendLink } from '$lib/types/friend';
import type { PageLoad } from './$types';

const friendModules = import.meta.glob<{ default: FriendLink }>('/src/data/friends/*.json', {
	eager: true
});

const friends: FriendLink[] = Object.values(friendModules)
	.map((mod) => mod.default)
	.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

export const load: PageLoad = () => {
	return { friends };
};
