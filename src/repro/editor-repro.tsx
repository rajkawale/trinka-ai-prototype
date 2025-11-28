import { useState } from 'react'
import Editor from '../components/Editor'

export default function EditorRepro() {
    const [showChat, setShowChat] = useState(false)
    const [isPrivacyMode] = useState(false)
    const [showHealthSidebar, setShowHealthSidebar] = useState(false)

    return (
        <div className="p-8 border rounded-lg m-4 h-screen flex flex-col">
            <h1 className="mb-4 text-xl font-bold">Editor Repro Page</h1>
            <div className="border p-4 flex-1 overflow-hidden">
                <Editor
                    showChat={showChat}
                    setShowChat={setShowChat}
                    isPrivacyMode={isPrivacyMode}
                    showHealthSidebar={showHealthSidebar}
                    setShowHealthSidebar={setShowHealthSidebar}
                    setCopilotQuery={(q) => console.log('Copilot query:', q)}
                />
            </div>
        </div>
    )
}
