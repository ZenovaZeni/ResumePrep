"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Skills tag input.
 * - Press Enter to add current input as a tag.
 * - Type a comma to auto-split into tags.
 * - Click × on a chip to remove it.
 * - Stores skills as string[].
 */
export function TagInput({ tags, onChange, placeholder = "Add skill…", className = "" }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitInput(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const newTags = [...tags];
    parts.forEach((p) => {
      if (!newTags.map((t) => t.toLowerCase()).includes(p.toLowerCase())) {
        newTags.push(p);
      }
    });
    onChange(newTags);
    setInputValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitInput(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function handleChange(value: string) {
    if (value.endsWith(",")) {
      commitInput(value);
    } else {
      setInputValue(value);
    }
  }

  function removeTag(index: number) {
    onChange(tags.filter((_, i) => i !== index));
  }

  return (
    <div
      className={`flex flex-wrap gap-1.5 items-center min-h-[42px] px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 cursor-text transition-colors ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            className="hover:text-white ml-0.5 leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) commitInput(inputValue); }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent text-white text-sm outline-none placeholder:text-zinc-500"
      />
    </div>
  );
}
