import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'

import { cn } from '../lib/utils'

export interface CommandItemProps {
    title: string
    description?: string
    icon: React.ElementType
    command: (editor: any, range: any) => void
    category: string
}

interface SlashCommandListProps {
    items: CommandItemProps[]
    command: any
    editor: any
    range: any
}

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = useCallback((index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }, [props])

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
                return true
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length)
                return true
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex)
                return true
            }
            return false
        },
    }))

    // Group items by category
    const groupedItems = props.items.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, CommandItemProps[]>)

    // Flatten for rendering but keep track of global index
    let globalIndex = 0

    return (
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {Object.entries(groupedItems).map(([category, items]: [string, CommandItemProps[]]) => (
                <div key={category} className="mb-2 last:mb-0">
                    <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {category}
                    </div>
                    {items.map((item: CommandItemProps, index: number) => {
                        const isSelected = globalIndex === selectedIndex
                        const currentGlobalIndex = globalIndex
                        globalIndex++

                        return (
                            <button
                                key={index}
                                onClick={() => selectItem(currentGlobalIndex)}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors",
                                    isSelected ? "bg-[#6B46FF]/10 text-[#6B46FF]" : "hover:bg-gray-100"
                                )}
                            >
                                <div className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-md border",
                                    isSelected ? "border-[#6B46FF]/20 bg-white" : "border-gray-200 bg-white"
                                )}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium">{item.title}</span>
                                    {item.description && (
                                        <span className="text-[10px] text-gray-400">{item.description}</span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            ))}
            {props.items.length === 0 && (
                <div className="p-3 text-center text-sm text-gray-500">
                    No results found
                </div>
            )}
        </div>
    )
})

SlashCommandList.displayName = 'SlashCommandList'
