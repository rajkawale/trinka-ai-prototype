import { useEffect, useRef } from 'react'

interface KeyboardShortcutHandlers {
    onOpenCopilot?: () => void
    onRephrase?: () => void
    onGrammarFixes?: () => void
    onClosePopup?: () => void
    enabled?: boolean
}

/**
 * Global keyboard shortcuts hook
 * - Ctrl+K (Cmd+K on Mac): Open Copilot
 * - Ctrl+Shift+G: Show grammar fixes
 * - Esc: Close active popup/modal
 * Note: Ctrl+Shift+R is NOT handled here - let browser handle hard refresh
 */
export function useKeyboardShortcuts({
    onOpenCopilot,
    onRephrase,
    onGrammarFixes,
    onClosePopup,
    enabled = true
}: KeyboardShortcutHandlers) {
    const handlersRef = useRef({
        onOpenCopilot,
        onRephrase,
        onGrammarFixes,
        onClosePopup
    })

    // Update handlers ref when they change
    useEffect(() => {
        handlersRef.current = {
            onOpenCopilot,
            onRephrase,
            onGrammarFixes,
            onClosePopup
        }
    }, [onOpenCopilot, onRephrase, onGrammarFixes, onClosePopup])

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
            const modKey = isMac ? e.metaKey : e.ctrlKey

            // Ctrl+K / Cmd+K: Open Copilot
            if (modKey && e.key === 'k' && !e.shiftKey && !e.altKey) {
                e.preventDefault()
                handlersRef.current.onOpenCopilot?.()
                return
            }

            // Ctrl+Shift+R: NOT handled - let browser handle hard refresh
            // (Do not prevent default for Ctrl+Shift+R)

            // Ctrl+Shift+G: Show grammar fixes
            if (modKey && e.shiftKey && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault()
                handlersRef.current.onGrammarFixes?.()
                return
            }

            // Esc: Close active popup/modal
            if (e.key === 'Escape' && !modKey && !e.shiftKey && !e.altKey) {
                handlersRef.current.onClosePopup?.()
                return
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [enabled])
}

