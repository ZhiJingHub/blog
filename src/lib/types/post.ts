export interface PostStats {
	wordCount: number;
	readTime: number;
	imageCount: number;
}

export interface RawPostMetadata {
	title: string;
	image?: string;
	date?: string;
	published?: string;
	pinned?: boolean;
	description: string;
	draft?: boolean;
	updated?: string;
	tags?: string[];
	author?: string;
	stats?: PostStats;
}

export interface PostMetadata {
	title: string;
	image?: string;
	published: string;
	pinned?: boolean;
	description: string;
	draft?: boolean;
	updated?: string;
	tags?: string[];
	author?: string;
	stats: PostStats;
}
