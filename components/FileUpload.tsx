"use client";

import { useState, DragEvent, ChangeEvent } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(ext ?? "")) {
      alert("Please upload a PDF or DOCX file.");
      return;
    }
    onFileSelect(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      className={`rounded-xl border-2 border-dashed p-6 transition-colors ${
        dragging
          ? "border-blue-500 bg-blue-50"
          : selectedFile
          ? "border-green-500 bg-green-50"
          : "border-gray-300 bg-white"
      }`}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckIcon />
            <span className="font-medium text-sm">{selectedFile.name}</span>
          </div>
          <span className="text-xs text-gray-500">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          {/* Native input to allow changing the file */}
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleChange}
            className="block w-full text-xs text-gray-500 cursor-pointer
              file:mr-3 file:py-1.5 file:px-3
              file:rounded-md file:border-0
              file:text-xs file:font-medium
              file:bg-gray-100 file:text-gray-700
              hover:file:bg-gray-200"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <UploadIcon />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Drop your resume here</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF or DOCX · Max 10 MB</p>
          </div>
          {/* Native input — visible "Choose File" button, works in all browsers */}
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleChange}
            className="block w-full text-sm text-gray-500 cursor-pointer
              file:mr-3 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 file:cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg className="h-9 w-9 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
