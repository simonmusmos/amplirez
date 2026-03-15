"use client";

import { ChangeEvent } from "react";

interface JobUrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JobUrlInput({ value, onChange }: JobUrlInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const showError = value.length > 0 && !isValidUrl(value);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="job-url" className="text-sm font-medium text-gray-700">
        Job Listing URL
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <LinkIcon />
        </div>
        <input
          id="job-url"
          type="url"
          value={value}
          onChange={handleChange}
          placeholder="https://company.com/jobs/software-engineer"
          className={`
            w-full rounded-lg border py-3 pl-10 pr-4 text-sm outline-none transition-colors
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${showError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"}
          `}
        />
      </div>
      {showError && (
        <p className="text-xs text-red-600">Please enter a valid URL (include https://)</p>
      )}
    </div>
  );
}

function LinkIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
