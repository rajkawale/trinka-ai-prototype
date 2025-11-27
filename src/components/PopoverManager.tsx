import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export type PopoverAnchor = HTMLElement | Range | DOMRect | { getBoundingClientRect: () => DOMRect }

interface PopoverOptions {
    placement?: 'top' | 'bottom'
    offset?: number
    closeOnOutsideClick?: boolean
    onClose?: () => void
    isInteractive?: boolean // If true, clicking inside popover doesn't close it
}

interface PopoverContextType {
    openPopover: (anchor: PopoverAnchor, content: React.ReactNode, options?: PopoverOptions) => void
    closePopover: () => void
    isPopoverOpen: boolean
}

const PopoverContext = createContext<PopoverContextType | null>(null)

export const usePopover = () => {
    const context = useContext(PopoverContext)
    if (!context) {
        throw new Error('usePopover must be used within a PopoverProvider')
    }
    return context
}

export const PopoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState<React.ReactNode>(null)
    const [anchor, setAnchor] = useState<PopoverAnchor | null>(null)
    const [options, setOptions] = useState<PopoverOptions>({})
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

    const popoverRef = useRef<HTMLDivElement>(null)
    const closeTimerRef = useRef<number | null>(null)
    const isHoveringPopoverRef = useRef(false)

    const calculatePosition = useCallback(() => {
        if (!anchor || !popoverRef.current) return

        let anchorRect: DOMRect

        if (anchor instanceof DOMRect) {
            anchorRect = anchor
        } else if (anchor instanceof Range) {
            const rects = anchor.getClientRects()
            anchorRect = rects.length > 0 ? rects[0] : anchor.getBoundingClientRect()
        } else {
            anchorRect = anchor.getBoundingClientRect()
        }

        const popoverRect = popoverRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const offset = options.offset || 10

        // Default to top centered
        let top = anchorRect.top - popoverRect.height - offset
        let left = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2)

        // Flip to bottom if not enough space on top (less than 120px or popover height)
        // Requirement: If rect.top < 120px place popover below
        if (anchorRect.top < 120 || top < 10) {
            top = anchorRect.bottom + offset
        }

        // Requirement: If rect.bottom > innerHeight - 120px place popover above (already default, but ensure logic holds)
        if (anchorRect.bottom > viewportHeight - 120 && top > anchorRect.bottom) {
            // If we flipped to bottom but it's too low, try top again if space permits
            if (anchorRect.top > popoverRect.height + offset) {
                top = anchorRect.top - popoverRect.height - offset
            }
        }

        // Clamp horizontal
        if (left < 10) left = 10
        if (left + popoverRect.width > viewportWidth - 10) {
            left = viewportWidth - popoverRect.width - 10
        }

        // Apply scroll
        const scrollX = window.scrollX
        const scrollY = window.scrollY

        setPosition({ top: top + scrollY, left: left + scrollX })
    }, [anchor, options.offset])

    useEffect(() => {
        if (isOpen) {
            calculatePosition()
            console.debug('trinka: popover_open', {
                anchorType: anchor instanceof Range ? 'Range' : (anchor instanceof HTMLElement ? 'Element' : 'Rect'),
                position
            })
            // Focus the popover for accessibility (Tab navigation)
            setTimeout(() => {
                if (popoverRef.current) {
                    const focusable = popoverRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement
                    if (focusable) {
                        focusable.focus()
                    } else {
                        popoverRef.current.focus()
                    }
                }
            }, 50)
        }
    }, [isOpen, anchor, calculatePosition])

    // Re-calculate on scroll/resize
    useEffect(() => {
        if (!isOpen) return
        window.addEventListener('scroll', calculatePosition, true)
        window.addEventListener('resize', calculatePosition)
        return () => {
            window.removeEventListener('scroll', calculatePosition, true)
            window.removeEventListener('resize', calculatePosition)
        }
    }, [isOpen, calculatePosition])

    const openPopover = useCallback((newAnchor: PopoverAnchor, newContent: React.ReactNode, newOptions: PopoverOptions = {}) => {
        // Clear any pending close
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current)
            closeTimerRef.current = null
        }

        setAnchor(newAnchor)
        setContent(newContent)
        setOptions({
            closeOnOutsideClick: true,
            isInteractive: true,
            ...newOptions
        })
        setIsOpen(true)
    }, [])

    const closePopover = useCallback((reason: string = 'unknown') => {
        // If hovering popover and it's interactive, don't close immediately (handled by mouseleave)
        if (isHoveringPopoverRef.current && options.isInteractive) {
            return
        }

        setIsOpen(false)
        setAnchor(null)
        console.debug('trinka:popover_closed_reason', reason)
        if (options.onClose) options.onClose()
    }, [options])

    // Outside click handling
    useEffect(() => {
        if (!isOpen || !options.closeOnOutsideClick) return

        const handleClickOutside = (event: PointerEvent) => {
            // Use composedPath for shadow DOM / robust detection
            const path = event.composedPath()
            const target = event.target as Node

            // Don't close if clicking inside popover
            if (popoverRef.current && path.includes(popoverRef.current)) {
                return
            }

            // Don't close if clicking the anchor (if it's an element)
            if (anchor instanceof HTMLElement && (path.includes(anchor) || anchor.contains(target))) {
                return
            }

            closePopover('outside-click')
        }

        document.addEventListener('pointerdown', handleClickOutside)
        return () => document.removeEventListener('pointerdown', handleClickOutside)
    }, [isOpen, options.closeOnOutsideClick, anchor, closePopover])

    // Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePopover('escape')
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closePopover])

    return (
        <PopoverContext.Provider value={{ openPopover, closePopover: () => closePopover('manual'), isPopoverOpen: isOpen }}>
            {children}
            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: position.top,
                        left: position.left,
                        position: 'absolute'
                    }}
                    onMouseEnter={() => {
                        isHoveringPopoverRef.current = true
                        if (closeTimerRef.current) {
                            window.clearTimeout(closeTimerRef.current)
                            closeTimerRef.current = null
                        }
                    }}
                    onMouseLeave={() => {
                        isHoveringPopoverRef.current = false
                        // 250ms graceful close delay
                        closeTimerRef.current = window.setTimeout(() => {
                            closePopover('timeout')
                        }, 250)
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </PopoverContext.Provider>
    )
}
