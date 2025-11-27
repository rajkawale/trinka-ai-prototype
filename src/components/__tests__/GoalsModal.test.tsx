import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import GoalsModal, { Goals } from '../GoalsModal'

describe('GoalsModal', () => {
    const defaultGoals: Goals = {
        audience: 'general',
        formality: 'neutral',
        domain: 'general'
    }

    const mockOnClose = vi.fn()
    const mockOnSave = vi.fn()

    it('should not render when isOpen is false', () => {
        render(
            <GoalsModal
                isOpen={false}
                onClose={mockOnClose}
                initialGoals={defaultGoals}
                onSave={mockOnSave}
            />
        )
        expect(screen.queryByText('Writing Goals')).not.toBeInTheDocument()
    })

    it('should render correctly when isOpen is true', () => {
        render(
            <GoalsModal
                isOpen={true}
                onClose={mockOnClose}
                initialGoals={defaultGoals}
                onSave={mockOnSave}
            />
        )
        expect(screen.getByText('Writing Goals')).toBeInTheDocument()
        expect(screen.getByText('Domain')).toBeInTheDocument()
        expect(screen.getByText('Audience')).toBeInTheDocument()
        expect(screen.getByText('Formality')).toBeInTheDocument()
    })

    it('should update goals when options are clicked', () => {
        render(
            <GoalsModal
                isOpen={true}
                onClose={mockOnClose}
                initialGoals={defaultGoals}
                onSave={mockOnSave}
            />
        )

        // Click "Academic" domain
        // Note: The text might be inside a div, so getByText should find it.
        const academicOption = screen.getByText('Academic')
        fireEvent.click(academicOption)

        // Click "Experts" audience
        const expertOption = screen.getByText('Experts')
        fireEvent.click(expertOption)

        // Click "Formal" formality
        const formalOption = screen.getByText('Formal')
        fireEvent.click(formalOption)

        // Click Save
        const saveButton = screen.getByText('Save Goals')
        fireEvent.click(saveButton)

        expect(mockOnSave).toHaveBeenCalledWith({
            domain: 'academic',
            audience: 'expert',
            formality: 'formal'
        })
        expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close when Cancel is clicked', () => {
        render(
            <GoalsModal
                isOpen={true}
                onClose={mockOnClose}
                initialGoals={defaultGoals}
                onSave={mockOnSave}
            />
        )

        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        expect(mockOnClose).toHaveBeenCalled()
    })
})
