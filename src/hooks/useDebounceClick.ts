import { useRef, useCallback } from 'react'

/**
 * Debounces click events to prevent rapid double-clicks and race conditions
 * @param callback Function to execute after debounce delay
 * @param delay Debounce delay in milliseconds (default: 200ms)
 */
export function useDebounceClick<T extends (...args: any[]) => void>(
    callback: T,
    delay: number = 200
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)
    const lastClickTimeRef = useRef<number>(0)

    const debouncedCallback = useCallback(
        ((...args: Parameters<T>) => {
            const now = Date.now()
            const timeSinceLastClick = now - lastClickTimeRef.current

            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            // If clicked very rapidly (< 50ms), ignore (likely double-click)
            if (timeSinceLastClick < 50) {
                lastClickTimeRef.current = now
                return
            }

            lastClickTimeRef.current = now

            // Execute after delay
            timeoutRef.current = setTimeout(() => {
                callback(...args)
                timeoutRef.current = null
            }, delay)
        }) as T,
        [callback, delay]
    )

    return debouncedCallback
}

