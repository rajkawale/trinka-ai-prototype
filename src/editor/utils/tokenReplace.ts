import { Editor } from '@tiptap/react'

/**
 * Token-level replacement utilities for precise text editing
 * Handles mapping between DOM nodes and editor offsets
 */

export interface TokenRange {
    from: number
    to: number
    text: string
}

/**
 * Find the editor position (offset) for a given DOM node and offset
 * Used for precise token-level replacements
 */
export function findEditorPositionForDOM(
    editor: Editor,
    domNode: Node,
    domOffset: number
): number | null {
    try {
        const { view } = editor
        const pos = view.posAtDOM(domNode, domOffset)
        return pos >= 0 ? pos : null
    } catch (e) {
        console.error('[TokenReplace] Failed to find editor position:', e)
        return null
    }
}

/**
 * Calculate the range in the editor that corresponds to a specific token
 * within the original text
 */
export function findTokenRangeInOriginal(
    originalText: string,
    tokenText: string,
    tokenStartInDiff: number
): { from: number; to: number } | null {
    // Simple implementation: find the token in the original text
    // In a more robust version, we'd use the diff alignment
    const index = originalText.indexOf(tokenText, tokenStartInDiff)
    if (index === -1) {
        return null
    }
    return {
        from: index,
        to: index + tokenText.length
    }
}

/**
 * Replace a specific token range in the editor with new text
 * Ensures atomic operation with proper undo handling
 */
export function replaceTokenRange(
    editor: Editor,
    range: TokenRange,
    newText: string,
    selectionRange?: { from: number; to: number }
): boolean {
    try {
        // Determine the actual range to replace
        const replaceFrom = selectionRange?.from ?? range.from
        const replaceTo = selectionRange?.to ?? range.to

        // Perform atomic replacement
        editor
            .chain()
            .focus()
            .setTextSelection({ from: replaceFrom, to: replaceTo })
            .insertContent(newText)
            .run()

        // Place caret after the inserted content
        const newCaretPos = replaceFrom + newText.length
        editor
            .chain()
            .setTextSelection(newCaretPos)
            .run()

        return true
    } catch (e) {
        console.error('[TokenReplace] Failed to replace token:', e)
        return false
    }
}

/**
 * Replace a specific part of text when clicking on a diff token
 * This handles the case where user clicks on just one changed word/phrase
 */
export function replaceSingleToken(
    editor: Editor,
    _originalText: string,
    originalRange: { from: number; to: number },
    clickedToken: string,
    _fullSuggestion: string
): boolean {
    try {
        // For now, replace the entire selection with just the clicked token
        // In future, we can make this more precise by mapping the token position
        editor
            .chain()
            .focus()
            .setTextSelection(originalRange)
            .insertContent(clickedToken)
            .run()

        // Place caret after the inserted token
        const newCaretPos = originalRange.from + clickedToken.length
        editor
            .chain()
            .setTextSelection(newCaretPos)
            .run()

        return true
    } catch (e) {
        console.error('[TokenReplace] Failed to replace single token:', e)
        return false
    }
}

