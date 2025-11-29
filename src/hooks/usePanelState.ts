import { useState, useCallback } from 'react'

export type PanelType = 'score' | 'sidebar' | 'profile' | 'suggestion' | 'goals' | null

interface PanelState {
    activePanel: PanelType
    isScoreSubPopupOpen: boolean
}

interface UsePanelStateReturn {
    activePanel: PanelType
    isScoreSubPopupOpen: boolean
    openPanel: (panel: PanelType) => void
    closePanel: (panel: PanelType) => void
    closeAllPanels: () => void
    closeAllPanelsExcept: (except: PanelType) => void
    openScoreSubPopup: () => void
    closeScoreSubPopup: () => void
    isOpen: (panel: PanelType) => boolean
}

/**
 * Unified panel state management hook
 * Ensures single source of truth for all panel states
 * Implements mutual exclusivity between panels
 */
export function usePanelState(): UsePanelStateReturn {
    const [state, setState] = useState<PanelState>({
        activePanel: null,
        isScoreSubPopupOpen: false
    })

    const openPanel = useCallback((panel: PanelType) => {
        if (!panel) return

        setState(() => {
            // Close all other panels when opening a new one
            return {
                activePanel: panel,
                isScoreSubPopupOpen: false // Reset sub-popup when switching panels
            }
        })
    }, [])

    const closePanel = useCallback((panel: PanelType) => {
        if (!panel) return

        setState(prev => {
            if (prev.activePanel === panel) {
                return {
                    activePanel: null,
                    isScoreSubPopupOpen: false
                }
            }
            return prev
        })
    }, [])

    const closeAllPanels = useCallback(() => {
        setState({
            activePanel: null,
            isScoreSubPopupOpen: false
        })
    }, [])

    const closeAllPanelsExcept = useCallback((except: PanelType) => {
        setState(prev => {
            if (prev.activePanel === except) {
                // Already open, just reset sub-popup
                return {
                    activePanel: except,
                    isScoreSubPopupOpen: false
                }
            }
            // Open the excepted panel and close others
            return {
                activePanel: except,
                isScoreSubPopupOpen: false
            }
        })
    }, [])

    const openScoreSubPopup = useCallback(() => {
        setState(prev => {
            if (prev.activePanel === 'score') {
                return {
                    ...prev,
                    isScoreSubPopupOpen: true
                }
            }
            return prev
        })
    }, [])

    const closeScoreSubPopup = useCallback(() => {
        setState(prev => ({
            ...prev,
            isScoreSubPopupOpen: false
        }))
    }, [])

    const isOpen = useCallback((panel: PanelType) => {
        if (!panel) return false
        return state.activePanel === panel
    }, [state.activePanel])

    return {
        activePanel: state.activePanel,
        isScoreSubPopupOpen: state.isScoreSubPopupOpen,
        openPanel,
        closePanel,
        closeAllPanels,
        closeAllPanelsExcept,
        openScoreSubPopup,
        closeScoreSubPopup,
        isOpen
    }
}

