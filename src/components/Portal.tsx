import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
    children: React.ReactNode
}

export const Portal: React.FC<PortalProps> = ({ children }) => {
    const [mounted, setMounted] = useState(false)
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null)

    useEffect(() => {
        console.log('[Portal] Mount')
        setMounted(true)
        let root = document.getElementById('trinka-portal-root')
        if (!root) {
            root = document.createElement('div')
            root.id = 'trinka-portal-root'
            document.body.appendChild(root)
        }
        setPortalRoot(root)

        return () => {
            // Optional: cleanup if we wanted to remove the root when no portals exist
            // But usually keeping the root is fine
        }
    }, [])

    if (!mounted || !portalRoot) {
        return null
    }

    return createPortal(children, portalRoot)
}
