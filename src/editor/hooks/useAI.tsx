import { useState, useCallback, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { trinkaApi } from '../../lib/utils'
import type { Recommendation, ActionType } from '../../components/RecommendationCard'
import RecommendationDetailPopover from '../../components/RecommendationDetailPopover'
import { usePopover } from '../../components/PopoverManager'

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
    const { openPopover, closePopover } = usePopover()

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
            await fetch(trinkaApi('/versions'), {
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

        const id = `rec-${Date.now()}`
        const recommendation: Recommendation = {
            id,
            title: action.label,
            summary: 'Generating...',
            fullText: 'Generating...',
            originalText: selected,
            actionType: action.mode as ActionType,
            estimatedImpact: 'medium',
            range: { from, to }
        }

        const range = document.createRange()
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            range.setStart(selection.getRangeAt(0).startContainer, selection.getRangeAt(0).startOffset)
            range.setEnd(selection.getRangeAt(0).endContainer, selection.getRangeAt(0).endOffset)
        }

        openPopover(range, (
            <RecommendationDetailPopover
                recommendation={recommendation}
                docId="current-doc"
                onClose={closePopover}
                onShowToast={showToast}
                onApply={(text) => {
                    editor.chain()
                        .focus()
                        .insertContentAt({ from, to }, text)
                        .run()

                    setRevisionCount(prev => prev + 1)
                    showToast('Suggestion applied')
                    createSnapshot(action.label, text)
                }}
            />
        ), {
            placement: 'bottom',
            offset: 8,
            isInteractive: true
        })
    }, [editor, openPopover, closePopover, showToast, setRevisionCount, createSnapshot])

    useEffect(() => {
        requestRewriteRef.current = requestRewrite
    }, [requestRewrite])

    const applySuggestion = useCallback(() => {
        if (!editor || !preview || preview.status !== 'ready') return

        editor
            .chain()
            .focus()
            .insertContentAt({ from: preview.range.from, to: preview.range.to }, preview.suggestion)
            .run()

        const delta = JSON.stringify({ from: preview.range.from, to: preview.range.to, text: preview.suggestion })
        createSnapshot('AI rewrite', delta)

        showToast('Suggestion applied')
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
