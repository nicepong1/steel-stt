"use client";

import { useState, useRef, useEffect } from "react";
import { HighlightedText } from "@/components/HighlightedText";

interface EditableTranscriptProps {
  text: string;
  onUpdate: (newText: string) => void;
}

export function EditableTranscript({ text, onUpdate }: EditableTranscriptProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleConfirm = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== text) {
      onUpdate(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(text);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
            if (e.key === "Escape") handleCancel();
          }}
          onBlur={handleConfirm}
          className="flex-1 text-lg px-2 py-1 border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
        />
      </div>
    );
  }

  return (
    <p
      onClick={() => {
        setEditValue(text);
        setIsEditing(true);
      }}
      className="text-lg leading-relaxed cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
      title="클릭하여 수정"
    >
      <HighlightedText text={text} />
    </p>
  );
}
