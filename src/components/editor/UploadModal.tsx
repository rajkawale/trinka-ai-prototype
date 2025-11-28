import React from 'react'
import { X, Upload, FileText } from 'lucide-react'

interface UploadModalProps {
    showUploadModal: boolean
    setShowUploadModal: (show: boolean) => void
    uploadedFiles: File[]
    setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>
    handleFileUpload: (files: FileList | null) => void
}

export const UploadModal: React.FC<UploadModalProps> = ({
    showUploadModal,
    setShowUploadModal,
    uploadedFiles,
    setUploadedFiles,
    handleFileUpload
}) => {
    if (!showUploadModal) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
                    <button
                        onClick={() => setShowUploadModal(false)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#6B46FF] transition-colors cursor-pointer"
                    onDrop={(e) => {
                        e.preventDefault()
                        handleFileUpload(e.dataTransfer.files)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drag and drop files here</p>
                    <p className="text-sm text-gray-400 mb-4">or</p>
                    <label className="inline-block px-4 py-2 bg-[#6B46FF] text-white rounded-lg cursor-pointer hover:bg-[#6B46FF]/90 transition-colors">
                        Browse Files
                        <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.pdf,.docx,.pptx"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                        />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG, PDF, DOCX, PPTX</p>
                </div>
                {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                        {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">{file.name}</span>
                                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // Insert into document
                                        }}
                                        className="text-xs text-[#6B46FF] hover:underline"
                                    >
                                        Insert
                                    </button>
                                    <button
                                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
