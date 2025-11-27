import React, { createContext, useContext, useState, useEffect } from 'react'

interface FeatureFlags {
    trinkaPopoverV2: boolean
}

interface FeatureFlagContextType {
    features: FeatureFlags
    toggleFeature: (feature: keyof FeatureFlags) => void
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null)

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext)
    if (!context) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
    }
    return context
}

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [features, setFeatures] = useState<FeatureFlags>(() => {
        const saved = localStorage.getItem('trinka_features')
        return saved ? JSON.parse(saved) : {
            trinkaPopoverV2: import.meta.env.VITE_FEATURE_TRINKA_V2 === 'true'
        }
    })

    useEffect(() => {
        localStorage.setItem('trinka_features', JSON.stringify(features))
        // Update body class for CSS styling if needed
        if (features.trinkaPopoverV2) {
            document.body.classList.add('feature-v2')
        } else {
            document.body.classList.remove('feature-v2')
        }
    }, [features])

    const toggleFeature = (feature: keyof FeatureFlags) => {
        setFeatures(prev => ({ ...prev, [feature]: !prev[feature] }))
    }

    return (
        <FeatureFlagContext.Provider value={{ features, toggleFeature }}>
            {children}
        </FeatureFlagContext.Provider>
    )
}
