import type { Recommendation } from '../components/RecommendationCard'

export interface Goals {
    audience: 'general' | 'expert' | 'student'
    formality: 'casual' | 'neutral' | 'formal'
    domain: 'general' | 'academic' | 'business' | 'creative'
    intent?: 'inform' | 'persuade' | 'entertain'
}

export const DEFAULT_GOALS: Goals = {
    audience: 'expert',
    formality: 'formal',
    domain: 'academic'
}

export function adjustSuggestionsBasedOnGoals(_goals: Goals, suggestion: Recommendation) {
    // Placeholder logic for now
    return suggestion
}
