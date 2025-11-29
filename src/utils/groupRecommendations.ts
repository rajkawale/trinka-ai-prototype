import type { Recommendation } from '../components/RecommendationCard'

export type RecommendationGroupType = 
    | 'Paraphrasing' 
    | 'Grammar' 
    | 'Clarity' 
    | 'Tone' 
    | 'Structure'

export interface RecommendationGroup {
    type: RecommendationGroupType
    recommendations: Recommendation[]
    count: number
}

/**
 * Maps action types to group categories
 */
function getRecommendationGroup(actionType: string, title: string): RecommendationGroupType {
    const titleLower = title.toLowerCase()
    
    // Grammar: grammar, spelling, syntax, verb agreement
    if (actionType === 'rewrite' || titleLower.includes('grammar') || titleLower.includes('spell') || titleLower.includes('syntax')) {
        return 'Grammar'
    }
    
    // Tone: tone, formal, friendly, academic
    if (actionType === 'tone' || titleLower.includes('tone') || titleLower.includes('formal') || titleLower.includes('friendly') || titleLower.includes('academic')) {
        return 'Tone'
    }
    
    // Clarity: clarity, simplify, improve readability
    if (titleLower.includes('clarity') || titleLower.includes('simplify') || titleLower.includes('readability') || actionType === 'clarify') {
        return 'Clarity'
    }
    
    // Paraphrasing: rephrase, paraphrase, rewrite
    if (actionType === 'paraphrase' || titleLower.includes('rephrase') || titleLower.includes('paraphrase')) {
        return 'Paraphrasing'
    }
    
    // Structure: headings, structure, organization
    if (titleLower.includes('structure') || titleLower.includes('heading') || titleLower.includes('organization')) {
        return 'Structure'
    }
    
    // Default to Grammar if unclear
    return 'Grammar'
}

/**
 * Groups recommendations by type and sorts by impact
 */
export function groupRecommendations(recommendations: Recommendation[]): RecommendationGroup[] {
    const groups: Record<RecommendationGroupType, Recommendation[]> = {
        'Paraphrasing': [],
        'Grammar': [],
        'Clarity': [],
        'Tone': [],
        'Structure': []
    }
    
    // Sort by impact first (high -> medium -> low)
    const impactOrder = { high: 3, medium: 2, low: 1 }
    const sorted = [...recommendations].sort((a, b) => {
        return impactOrder[b.estimatedImpact] - impactOrder[a.estimatedImpact]
    })
    
    // Group by type
    sorted.forEach(rec => {
        const groupType = getRecommendationGroup(rec.actionType, rec.title)
        groups[groupType].push(rec)
    })
    
    // Convert to array and filter out empty groups
    return Object.entries(groups)
        .map(([type, recs]) => ({
            type: type as RecommendationGroupType,
            recommendations: recs,
            count: recs.length
        }))
        .filter(group => group.count > 0)
        .sort((a, b) => {
            // Sort groups by highest impact recommendation
            const aMax = Math.max(...a.recommendations.map(r => impactOrder[r.estimatedImpact]))
            const bMax = Math.max(...b.recommendations.map(r => impactOrder[r.estimatedImpact]))
            return bMax - aMax
        })
}

/**
 * Get top N recommendations across all groups
 */
export function getTopRecommendations(recommendations: Recommendation[], topN: number = 3): Recommendation[] {
    const impactOrder = { high: 3, medium: 2, low: 1 }
    return [...recommendations]
        .sort((a, b) => impactOrder[b.estimatedImpact] - impactOrder[a.estimatedImpact])
        .slice(0, topN)
}

