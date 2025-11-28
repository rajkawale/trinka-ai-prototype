import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Central Trinka AI API helpers
export const TRINKA_API_BASE = 'http://localhost:5005'

export function trinkaApi(path: string) {
    if (!path.startsWith('/')) path = `/${path}`
    return `${TRINKA_API_BASE}${path}`
}