"use client";

import { useState } from "react";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import type { Question } from "./questions";

interface QuestionCardProps {
  question: Question;
  /** Pre-existing answer (for resume). String for single, string[] for multi. */
  initialValue: string | string[] | undefined;
  /** Fired when single-select picks; or when multi-select hits Continue. */
  onAnswer: (value: string | string[] | null) => void;
  /** Allows the back arrow up in the parent to disable while a save is in flight. */
  disabled?: boolean;
}

export function QuestionCard({
  question,
  initialValue,
  onAnswer,
  disabled,
}: QuestionCardProps) {
  const isMulti = question.kind === "multi";

  // Local selection state. We re-derive from `initialValue` when the
  // question changes (parent navigates back/forward), but otherwise
  // it lives entirely in this component.
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(initialValue)
      ? initialValue
      : initialValue
        ? [initialValue]
        : [],
  );
  const [confirmingValue, setConfirmingValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (disabled) return;

    if (isMulti) {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
      return;
    }

    // Single-select: brief confirm flash so the tap feels acknowledged
    // before we transition to the next screen. The 220ms matches the
    // CSS transition on the parent flow.
    setSelected([value]);
    setConfirmingValue(value);
    window.setTimeout(() => {
      onAnswer(value);
    }, 220);
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="space-y-1.5 text-center">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {question.intro}
        </p>
        <h2 className="text-xl font-semibold text-balance sm:text-2xl">
          {question.prompt}
        </h2>
      </div>

      <div className="grid gap-2.5">
        {question.options.map((option) => {
          const isSelected = selected.includes(option.value);
          const isConfirming = confirmingValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={(disabled ?? false) || confirmingValue !== null}
              className={cn(
                "group relative w-full rounded-xl border bg-white px-4 py-3 text-left transition-all duration-200",
                "hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm",
                "dark:bg-neutral-900 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isSelected &&
                  "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-emerald-950/30",
                !isSelected && "border-neutral-200 dark:border-neutral-800",
                isConfirming && "scale-[1.01]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-semibold transition-colors",
                      isSelected && "text-emerald-700 dark:text-emerald-300",
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {option.description}
                  </p>
                </div>
                {isMulti && <CheckBox checked={isSelected} />}
                {!isMulti && isSelected && <CheckMark />}
              </div>
            </button>
          );
        })}
      </div>

      {isMulti && (
        <div className="flex items-center justify-between gap-3 pt-2">
          {question.skippable ? (
            <Button
              variant="ghost"
              type="button"
              onClick={() => onAnswer(null)}
              disabled={disabled}
            >
              Skip — I'm not sure
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={() => onAnswer(selected)}
            disabled={(disabled ?? false) || selected.length === 0}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={cn(
        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-all",
        checked
          ? "border-emerald-500 bg-emerald-500"
          : "border-neutral-300 bg-transparent dark:border-neutral-600",
      )}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="size-3.5 text-white" fill="none">
          <path
            d="M5 12l5 5L20 7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
