import Editor from '../components/Editor'

export default function EditorRepro() {
    return (
        <div className="p-8 border rounded-lg m-4 h-screen flex flex-col">
            <h1 className="mb-4 text-xl font-bold">Editor Repro Page</h1>
            <div className="border p-4 flex-1 overflow-hidden">
                <Editor
                    setShowChat={() => { }}
                    setShowHealthSidebar={() => { }}
                    setCopilotQuery={(q) => console.log('Copilot query:', q)}
                />
            </div>
        </div>
    )
}
