import React, { useRef, useState, useEffect } from 'react'
import { User, Settings, Target, CreditCard, LogOut, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'
import { useClickOutside } from '../hooks/useClickOutside'

interface ProfileMenuProps {
    isOpen: boolean
    onClose: () => void
    onOpenWritingGoals?: () => void
    anchorElement?: HTMLElement | null
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    isOpen,
    onClose,
    onOpenWritingGoals,
    anchorElement
}) => {
    const menuRef = useRef<HTMLDivElement>(null)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

    useClickOutside(menuRef, () => {
        if (isOpen) {
            onClose()
        }
    })

    // Calculate menu position based on anchor element
    useEffect(() => {
        if (!isOpen || !anchorElement) return

        const rect = anchorElement.getBoundingClientRect()
        const menuWidth = 200
        const spacing = 8

        setMenuPosition({
            top: rect.bottom + spacing,
            left: rect.right - menuWidth // Align right edge with button
        })
    }, [isOpen, anchorElement])

    // Add data attribute to body when menu is open to help CSS targeting
    // MUST be before early return to follow Rules of Hooks
    useEffect(() => {
        if (isOpen) {
            document.body.setAttribute('data-profile-menu-open', 'true')
            return () => {
                document.body.removeAttribute('data-profile-menu-open')
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    const menuItems = [
        {
            id: 'edit-profile',
            label: 'Edit Profile',
            icon: User,
            onClick: () => {
                console.log('Edit Profile clicked')
                onClose()
            }
        },
        {
            id: 'preferences',
            label: 'Preferences',
            icon: Settings,
            onClick: () => {
                console.log('Preferences clicked')
                onClose()
            }
        },
        {
            id: 'writing-goals',
            label: 'Writing Goals',
            icon: Target,
            onClick: () => {
                if (onOpenWritingGoals) {
                    onOpenWritingGoals()
                }
                onClose()
            }
        },
        {
            id: 'subscription',
            label: 'Subscription',
            icon: CreditCard,
            onClick: () => {
                console.log('Subscription clicked')
                onClose()
            },
            subtitle: 'Current Plan: Premium'
        },
        {
            id: 'divider',
            type: 'divider' as const
        },
        {
            id: 'logout',
            label: 'Log Out',
            icon: LogOut,
            onClick: () => {
                console.log('Log Out clicked')
                onClose()
            },
            danger: true
        }
    ]

    const menuStyle = anchorElement
        ? { top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }
        : { top: '3.5rem', right: '1rem' }

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] bg-white rounded-lg border border-gray-200 shadow-xl py-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200"
            style={menuStyle}
            data-profile-menu-open="true"
        >
            {menuItems.map((item) => {
                if (item.type === 'divider') {
                    return (
                        <div key={item.id} className="my-1 h-px bg-gray-100" />
                    )
                }

                const Icon = item.icon

                return (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-4 text-sm text-left transition-colors", // Increased padding to py-4 (16px)
                            "hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                            item.danger ? "text-red-600 hover:text-red-700" : "text-gray-700"
                        )}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 flex flex-col gap-0.5">
                            <span>{item.label}</span>
                            {'subtitle' in item && item.subtitle && (
                                <span className="text-xs font-semibold text-gray-700">{item.subtitle}</span>
                            )}
                        </div>
                        {item.id !== 'logout' && (
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                    </button>
                )
            })}
        </div>
    )
}

export default ProfileMenu

