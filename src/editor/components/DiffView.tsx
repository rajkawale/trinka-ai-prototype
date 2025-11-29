import React, { useMemo } from 'react'

interface Change {
    value: string
    added?: boolean
    removed?: boolean
}

interface DiffViewProps {
    originalText: string
    newText: string
    onReplace: (text: string) => void
}

// Robust local diff implementation to avoid package crashes
const calculateDiff = (original: string, modified: string): Change[] => {
    if (original === modified) return [{ value: original }]

    const originalWords = original.split(/(\s+)/)
    const modifiedWords = modified.split(/(\s+)/)

    let start = 0
    while (
        start < originalWords.length &&
        start < modifiedWords.length &&
        originalWords[start] === modifiedWords[start]
    ) {
        start++
    }

    let endOriginal = originalWords.length - 1
    let endModified = modifiedWords.length - 1

    while (
        endOriginal >= start &&
        endModified >= start &&
        originalWords[endOriginal] === modifiedWords[endModified]
    ) {
        endOriginal--
        endModified--
    }

    const changes: Change[] = []

    // Prefix
    if (start > 0) {
        changes.push({ value: originalWords.slice(0, start).join('') })
    }

    // Changes
    if (start <= endOriginal) {
        changes.push({ value: originalWords.slice(start, endOriginal + 1).join(''), removed: true })
    }
    if (start <= endModified) {
        changes.push({ value: modifiedWords.slice(start, endModified + 1).join(''), added: true })
    }

    // Suffix
    if (endModified < modifiedWords.length - 1) {
        changes.push({ value: modifiedWords.slice(endModified + 1).join('') })
    }

    return changes
}

export const DiffView: React.FC<DiffViewProps> = ({ originalText, newText, onReplace }) => {
    const diffs = useMemo(() => {
        try {
            return calculateDiff(originalText, newText)
        } catch (e) {
            console.error('Local diff failed:', e)
            return [{ value: newText, added: true }]
        }
    }, [originalText, newText])

    return (
        <div className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap font-sans">
            {diffs.map((part: Change, index: number) => {
                if (part.removed) {
                    return (
                        <span key={index} className="line-through text-red-500 decoration-red-500/40 mx-0.5 select-none opacity-60">
                            {part.value}
                        </span>
                    )
                }
                if (part.added) {
                    return (
                        <span
                            key={index}
                            onClick={() => onReplace(part.value)}
                            className="text-[#6C2BD9] font-bold hover:bg-[#6C2BD9]/10 cursor-pointer transition-colors rounded px-0.5"
                            title="Click to replace only this change"
                        >
                            {part.value}
                        </span>
                    )
                }
                return <span key={index} className="text-gray-800">{part.value}</span>
            })}
        </div>
    )
}
