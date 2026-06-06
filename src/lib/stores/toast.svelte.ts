export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
	id: string;
	type: ToastType;
	title: string;
	description?: string;
}

let toasts = $state<ToastMessage[]>([]);
let counter = 0;

function add(type: ToastType, title: string, description?: string) {
	const id = `toast-${++counter}-${Date.now()}`;
	toasts = [...toasts, { id, type, title, description }];
	const delay = type === 'error' ? 6000 : 4000;
	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id);
	}, delay);
}

function dismiss(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}

export const toast = {
	get items() { return toasts; },
	success: (title: string, description?: string) => add('success', title, description),
	error: (title: string, description?: string) => add('error', title, description),
	info: (title: string, description?: string) => add('info', title, description),
	dismiss
};
