import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
    children: React.ReactNode
    /** Z-index layer for this portal content */
    zIndex?: number
}

const PORTAL_ROOT_ID = 'trinka-portal-root'

/**
 * Global portal for ephemeral popups (suggestions, tooltips, etc.)
 * Ensures proper z-ordering and single popup root
 */
export const Portal: React.FC<PortalProps> = ({ children, zIndex = 9999 }) => {
    const [mounted, setMounted] = useState(false)
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

    useEffect(() => {
        setMounted(true)
        let root = document.getElementById(PORTAL_ROOT_ID)
        if (!root) {
            root = document.createElement('div')
            root.id = PORTAL_ROOT_ID
            root.style.position = 'fixed'
            root.style.top = '0'
            root.style.left = '0'
            root.style.width = '100%'
            root.style.height = '100%'
            root.style.pointerEvents = 'none'
            root.style.zIndex = '9999'
            document.body.appendChild(root)
        }
        setPortalRoot(root)

        return () => {
            // Keep root alive for other portals
        }
    }, [])

    if (!mounted || !portalRoot) {
        return null
    }

    return createPortal(
        <div style={{ position: 'relative', zIndex }}>
            {children}
        </div>,
        portalRoot
    )
}
