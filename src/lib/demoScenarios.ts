import type { ActionType } from '../components/RecommendationCard'

export type DemoScenario = {
    id: 'onboarding' | 'therapy' | 'safety'
    title: string
    content: string
    issues: {
        from: number
        to: number
        type: 'grammar' | 'tone' | 'ai-suggestion'
        message: string
        suggestion: string
        original: string
    }[]
}

export const DEMO_SCENARIOS: Record<string, DemoScenario> = {
    onboarding: {
        id: 'onboarding',
        title: 'Onboarding Flow',
        content: `
      <h2>Welcome to Trinka AI</h2>
      <p>
        Trinka is an advanced writing assistant designed for academic and technical writing. 
        It helps you enhance your writing by checking for grammar errors, tone consistency, and style improvements.
      </p>
      <p>
        To get started, simply type or paste your text here. Trinka will automatically analyze your content 
        and provide real-time suggestions. You can accept suggestions by clicking on them or ignore them if you prefer.
      </p>
      <p>
        We hope you enjoy using Trinka to improve your writing skills!
      </p>
    `,
        issues: [
            {
                from: 150,
                to: 168,
                type: 'grammar',
                message: 'Redundant phrasing',
                suggestion: 'helps you improve',
                original: 'helps you enhance'
            },
            {
                from: 350,
                to: 365,
                type: 'tone',
                message: 'Consider more formal closing',
                suggestion: 'We trust Trinka will be valuable',
                original: 'We hope you enjoy'
            }
        ]
    },
    therapy: {
        id: 'therapy',
        title: 'Therapy Session Notes',
        content: `
      <h2>Session Notes: Patient A.R.</h2>
      <p>
        The patient expressed feelings of anxiety regarding their upcoming job interview. 
        They mentioned that they often feel overwhelmed when preparing for such events.
      </p>
      <p>
        I suggested that they try some relaxation techniques, such as deep breathing or visualization. 
        The patient seemed receptive to these ideas and agreed to practice them before the next session.
      </p>
      <p>
        Overall, the session was productive, and the patient made good progress in identifying their stressors.
      </p>
    `,
        issues: [
            {
                from: 60,
                to: 78,
                type: 'tone',
                message: 'Use clinical terminology',
                suggestion: 'reported symptoms of',
                original: 'expressed feelings of'
            },
            {
                from: 250,
                to: 265,
                type: 'ai-suggestion',
                message: 'Clarify intervention',
                suggestion: 'Recommended implementation of',
                original: 'I suggested that they try'
            }
        ]
    },
    safety: {
        id: 'safety',
        title: 'Safety Escalation Protocol',
        content: `
      <h2>Incident Report: 2023-10-27</h2>
      <p>
        An incident occurred in the lab involving a chemical spill. 
        The spill was contained quickly, but some equipment was damaged.
      </p>
      <p>
        The safety officer was notified immediately, and the area was evacuated. 
        No injuries were reported, but a full investigation is underway.
      </p>
      <p>
        We need to ensure that all safety protocols are followed strictly to prevent future incidents.
      </p>
    `,
        issues: [
            {
                from: 45,
                to: 65,
                type: 'grammar',
                message: 'Passive voice usage',
                suggestion: 'A chemical spill occurred',
                original: 'involving a chemical spill'
            },
            {
                from: 300,
                to: 320,
                type: 'tone',
                message: 'Strengthen imperative',
                suggestion: 'Compliance with safety protocols is mandatory',
                original: 'We need to ensure that all safety protocols are followed strictly'
            }
        ]
    }
}
