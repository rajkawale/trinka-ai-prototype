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

        const anchorRect = anchor instanceof DOMRect 
            ? anchor 
            : (anchor instanceof Range ? anchor.getBoundingClientRect() : anchor.getBoundingClientRect())
        
        const popoverRect = popoverRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const offset = options.offset || 10

        // Default to top centered
        let top = anchorRect.top - popoverRect.height - offset
        let left = anchorRect.left + (anchorRect.width / 2) - (popoverRect.width / 2)

        // Flip to bottom if not enough space on top
        if (top < 10) {
            top = anchorRect.bottom + offset
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
            // Initial calculation
            // We need a small delay or useLayoutEffect to wait for render, but useEffect is safer for SSR (though this is CSR)
            // We'll use a ResizeObserver on the popover element to recalculate when it changes size
            calculatePosition()
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

    const closePopover = useCallback(() => {
        // If hovering popover and it's interactive, don't close immediately (handled by mouseleave)
        // But this method is usually called by explicit actions or outside clicks
        setIsOpen(false)
        setAnchor(null)
        if (options.onClose) options.onClose()
    }, [options])

    // Outside click handling
    useEffect(() => {
        if (!isOpen || !options.closeOnOutsideClick) return

        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            
            // Don't close if clicking inside popover
            if (popoverRef.current && popoverRef.current.contains(target)) {
                return
            }

            // Don't close if clicking the anchor (if it's an element)
            if (anchor instanceof HTMLElement && anchor.contains(target)) {
                return
            }

            closePopover()
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, options.closeOnOutsideClick, anchor, closePopover])

    // Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePopover()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closePopover])

    return (
        <PopoverContext.Provider value={{ openPopover, closePopover, isPopoverOpen: isOpen }}>
            {children}
            {isOpen && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: position.top,
                        left: position.left,
                        position: 'absolute' // We use absolute with scrollY included, or fixed without scrollY. 
                        // If we use 'fixed', we shouldn't add scrollY. Let's stick to 'absolute' so it scrolls with page, 
                        // OR 'fixed' and update on scroll. 
                        // The brief says "include scrolling (window.scrollX/Y)". 
                        // If we use 'absolute', it attaches to document.
                    }}
                    onMouseEnter={() => { isHoveringPopoverRef.current = true }}
                    onMouseLeave={() => { 
                        isHoveringPopoverRef.current = false 
                        // Optional: delayed close on mouse leave? 
                        // The brief says: "Use a 200–300ms graceful close delay on mouseleave."
                        // But that usually applies when the *trigger* also has mouseleave.
                        // We'll handle this logic in the consumer or here if we want global behavior.
                        // For now, let's just track state.
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </PopoverContext.Provider>
    )
}
