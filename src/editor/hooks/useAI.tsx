import { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { getTrinkaApi } from '../../lib/utils'


export interface AiAction {
    id: string
    label: string
    description: string
    mode: string
    tone?: string
    icon?: any
}

interface UseAIProps {
    editor: Editor | null
    setRevisionCount: (count: number | ((prev: number) => number)) => void
    setVersions: (versions: any[] | ((prev: any[]) => any[])) => void
    showToast: (message: string, undo?: () => void) => void
    createRequestId: () => string
}

export function useAI({ editor, setRevisionCount, setVersions, showToast, createRequestId }: UseAIProps) {
    const [preview, setPreview] = useState<any>(null)
    const requestRewriteRef = useRef<any>(null)

    const createSnapshot = useCallback(async (action: string, delta: string) => {
        const snapshot = {
            id: createRequestId(),
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            action,
            delta
        }
        setVersions(prev => [snapshot, ...prev].slice(0, 20))
        setRevisionCount(prev => prev + 1)

        try {
            const plainText = editor?.state.doc.textBetween(0, editor.state.doc.content.size, ' ') || ''
            const words = plainText.trim().split(/\s+/).filter(Boolean).length
            await fetch(getTrinkaApi('/versions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    summary: `${action} - ${words} words`,
                    word_count: words,
                    action,
                    delta
                })
            })
        } catch (error) {
            console.error('Failed to save snapshot:', error)
        }
        return snapshot
    }, [editor, setVersions, setRevisionCount, createRequestId])

    const requestRewrite = useCallback(async (action: AiAction, sectionText?: string) => {
        if (!editor) return
        const { from, to } = editor.state.selection
        const selected = sectionText || editor.state.doc.textBetween(from, to, ' ')

        if (!selected.trim()) {
            showToast('Select text before triggering AI.')
            return
        }

        // Phase 3: Use SuggestionPopup via preview state
        setPreview({
            status: 'idle',
            label: action.label,
            original: selected,
            range: { from, to },
            initialTab: mapModeToTab(action.mode, action.tone)
        })
    }, [editor, showToast])

    function mapModeToTab(mode: string, tone?: string): string {
        if (mode === 'shorten') return 'shorten'
        if (mode === 'rewrite' || mode === 'paraphrase') return 'rephrase'
        if (mode === 'tone') return tone === 'friendly' ? 'friendly' : 'formal'
        return 'improve'
    }

    useEffect(() => {
        requestRewriteRef.current = requestRewrite
    }, [requestRewrite])

    const applySuggestion = useCallback((text?: string) => {
        console.log('[useAI] applySuggestion called')
        if (!editor || !preview) {
            console.log('[useAI] applySuggestion aborted: editor or preview missing', { editor: !!editor, preview: !!preview })
            return
        }

        const contentToInsert = text || preview.suggestion
        console.log('[useAI] Inserting content', contentToInsert)

        try {
            editor
                .chain()
                .focus()
                .insertContentAt({ from: preview.range.from, to: preview.range.to }, contentToInsert)
                .run()
            console.log('[useAI] Content inserted successfully')
        } catch (e) {
            console.error('[useAI] Error inserting content', e)
        }

        const delta = JSON.stringify({ from: preview.range.from, to: preview.range.to, text: contentToInsert })
        createSnapshot('AI rewrite', delta)

        showToast('Suggestion applied')
        console.log('[useAI] Setting preview to null')
        setPreview(null)
    }, [editor, preview, createSnapshot, showToast])

    const discardSuggestion = useCallback(() => {
        setPreview(null)
    }, [])

    return {
        preview,
        setPreview,
        requestRewrite,
        requestRewriteRef,
        applySuggestion,
        discardSuggestion,
        createSnapshot
    }
}
