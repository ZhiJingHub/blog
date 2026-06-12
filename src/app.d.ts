// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	const __PLATFORM__: string;

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				VIEWS?: KVNamespace;
			};
		}
	}

	/** Local Font Access API */
	interface FontData {
		family: string;
		fullName: string;
		style: string;
	}

	interface Window {
		queryLocalFonts(): Promise<FontData[]>;
	}
}

export {};
