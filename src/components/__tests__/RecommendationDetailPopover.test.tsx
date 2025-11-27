import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import RecommendationDetailPopover from '../RecommendationDetailPopover'
import type { Recommendation } from '../RecommendationCard'

vi.mock('../lib/diffUtils', () => ({
    diffWords: () => [{ value: 'mock diff', added: false, removed: false }]
}))

describe('RecommendationDetailPopover', () => {
    const mockRecommendation: Recommendation = {
        id: '1',
        title: 'Fix Grammar',
        summary: 'Change "is" to "are"',
        fullText: 'The data are correct.',
        originalText: 'The data is correct.',
        actionType: 'rewrite',
        estimatedImpact: 'high'
    }

    const mockOnClose = vi.fn()
    const mockOnApply = vi.fn()
    const mockOnDismiss = vi.fn()

    beforeEach(() => {
        (global as any).fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            })
        )
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('should render recommendation details', () => {
        render(
            <RecommendationDetailPopover
                recommendation={mockRecommendation}
                docId="doc-1"
                onClose={mockOnClose}
                onApply={mockOnApply}
                onDismiss={mockOnDismiss}
            />
        )
        expect(screen.getByText('Fix Grammar')).toBeInTheDocument()
        expect(screen.getByText('Change "is" to "are"')).toBeInTheDocument()
    })

    it('should call onApply when Accept button is clicked', () => {
        render(
            <RecommendationDetailPopover
                recommendation={mockRecommendation}
                docId="doc-1"
                onClose={mockOnClose}
                onApply={mockOnApply}
                onDismiss={mockOnDismiss}
            />
        )
        const applyButton = screen.getByText('Accept')
        fireEvent.click(applyButton)
        expect(mockOnApply).toHaveBeenCalledWith('1')
    })

    it('should call onDismiss when Ignore button is clicked', () => {
        render(
            <RecommendationDetailPopover
                recommendation={mockRecommendation}
                docId="doc-1"
                onClose={mockOnClose}
                onApply={mockOnApply}
                onDismiss={mockOnDismiss}
            />
        )
        const ignoreButton = screen.getByTitle('Ignore')
        fireEvent.click(ignoreButton)
        expect(mockOnDismiss).toHaveBeenCalledWith('1')
    })
})
