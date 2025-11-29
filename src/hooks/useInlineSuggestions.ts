import { useState, useEffect, useRef } from 'react'

interface InlineSuggestion {
    from: number
    to: number
    type: 'grammar' | 'tone' | 'clarity' | 'paraphrase'
    message: string
    suggestion?: string
}

interface TooltipState {
    visible: boolean
    position: { top: number; left: number }
    suggestion: InlineSuggestion | null
}

export function useInlineSuggestions(editor: any) {
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        position: { top: 0, left: 0 },
        suggestion: null
    })
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        if (!editor) return

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target || !target.classList.contains('grammar-tone-underline')) {
                return
            }

            // Clear any existing timeout
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }

            // Get issue data from the element
            const issueType = target.getAttribute('data-type') as InlineSuggestion['type']
            const message = target.getAttribute('data-message') || ''
            const suggestion = target.getAttribute('data-suggestion') || ''
            const from = parseInt(target.getAttribute('data-from') || '0')
            const to = parseInt(target.getAttribute('data-to') || '0')

            if (!message) return

            // Delay showing tooltip slightly for better UX
            hoverTimeoutRef.current = setTimeout(() => {
                const rect = target.getBoundingClientRect()
                setTooltip({
                    visible: true,
                    position: {
                        top: rect.top - 10, // Position above the underlined text
                        left: rect.left + rect.width / 2
                    },
                    suggestion: {
                        from,
                        to,
                        type: issueType || 'grammar',
                        message,
                        suggestion: suggestion || undefined
                    }
                })
            }, 300) // 300ms delay before showing tooltip
        }

        const handleMouseLeave = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null
            if (!target) {
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                }
                setTooltip(prev => ({ ...prev, visible: false }))
                return
            }
            // Only close if leaving the underlined element or the tooltip
            try {
                const isUnderlined = target.classList && target.classList.contains('grammar-tone-underline')
                const isTooltip = target.closest && target.closest('[data-tooltip]')
                if (!isUnderlined && !isTooltip) {
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current)
                    }
                    setTooltip(prev => ({ ...prev, visible: false }))
                }
            } catch (error) {
                // Safety check failed, close tooltip
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current)
                }
                setTooltip(prev => ({ ...prev, visible: false }))
            }
        }

        document.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mouseleave', handleMouseLeave, true)

        return () => {
            document.removeEventListener('mouseover', handleMouseOver)
            document.removeEventListener('mouseleave', handleMouseLeave, true)
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [editor])

    const closeTooltip = () => {
        setTooltip(prev => ({ ...prev, visible: false }))
    }

    return {
        tooltip,
        closeTooltip
    }
}

