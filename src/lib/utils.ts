import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    // Minutes
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;

    // Hours
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    // Days
    const days = Math.floor(hours / 24);
    return `${days}d`;
};
