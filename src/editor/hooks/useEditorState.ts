import { useState } from 'react'

export interface EditorState {
    isHealthCollapsed: boolean
    setIsHealthCollapsed: (value: boolean) => void
    writingScore: number
    setWritingScore: (value: number) => void
    wordCount: number
    setWordCount: (value: number) => void
    readTime: string
    setReadTime: (value: string) => void
    isCalculating: boolean
    setIsCalculating: (value: boolean) => void
    showGoalsModal: boolean
    setShowGoalsModal: (value: boolean) => void
    selectedFactorForImprovement: string | null
    setSelectedFactorForImprovement: (value: string | null) => void
    versions: any[]
    setVersions: (value: any[]) => void
    revisionCount: number
    setRevisionCount: (value: number) => void
    preview: any
    setPreview: (value: any) => void
    toast: { message: string, undo?: () => void } | null
    setToast: (value: { message: string, undo?: () => void } | null) => void
    showUploadModal: boolean
    setShowUploadModal: (value: boolean) => void
    uploadedFiles: File[]
    setUploadedFiles: (value: File[]) => void
    isMoreMenuOpen: boolean
    setIsMoreMenuOpen: (value: boolean) => void
}

export function useEditorState(): EditorState {
    const [isHealthCollapsed, setIsHealthCollapsed] = useState(false)
    const [writingScore, setWritingScore] = useState(85)
    const [wordCount, setWordCount] = useState(0)
    const [readTime, setReadTime] = useState('0 min')
    const [isCalculating, setIsCalculating] = useState(false)
    const [showGoalsModal, setShowGoalsModal] = useState(false)
    const [selectedFactorForImprovement, setSelectedFactorForImprovement] = useState<string | null>(null)
    const [versions, setVersions] = useState<any[]>([])
    const [revisionCount, setRevisionCount] = useState(0)
    const [preview, setPreview] = useState<any>(null)
    const [toast, setToast] = useState<{ message: string, undo?: () => void } | null>(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

    return {
        isHealthCollapsed, setIsHealthCollapsed,
        writingScore, setWritingScore,
        wordCount, setWordCount,
        readTime, setReadTime,
        isCalculating, setIsCalculating,
        showGoalsModal, setShowGoalsModal,
        selectedFactorForImprovement, setSelectedFactorForImprovement,
        versions, setVersions,
        revisionCount, setRevisionCount,
        preview, setPreview,
        toast, setToast,
        showUploadModal, setShowUploadModal,
        uploadedFiles, setUploadedFiles,
        isMoreMenuOpen, setIsMoreMenuOpen
    }
}
