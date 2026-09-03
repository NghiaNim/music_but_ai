import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Question } from "./questions";
import type { Palette } from "~/theme";
import { radius } from "~/theme";

interface QuestionCardProps {
  question: Question;
  /** Pre-existing answer (for resume). String for single, string[] for multi. */
  initialValue: string | string[] | undefined;
  /** Fired when single-select picks; or when multi-select hits Continue. */
  onAnswer: (value: string | string[] | null) => void;
  /** Disables interaction while a save is in flight. */
  disabled?: boolean;
  palette: Palette;
}

export function QuestionCard({
  question,
  initialValue,
  onAnswer,
  disabled,
  palette,
}: QuestionCardProps) {
  const isMulti = question.kind === "multi";

  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(initialValue)
      ? initialValue
      : initialValue
        ? [initialValue]
        : [],
  );
  const [confirmingValue, setConfirmingValue] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    if (disabled || confirmingValue !== null) return;

    if (isMulti) {
      setSelected((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
      return;
    }

    // Single-select: brief confirm flash so the tap feels acknowledged
    // before we transition to the next screen.
    setSelected([value]);
    setConfirmingValue(value);
    setTimeout(() => {
      onAnswer(value);
    }, 220);
  };

  return (
    <View style={{ width: "100%", gap: 20 }}>
      <View style={{ gap: 6, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: palette.mutedForeground,
            textAlign: "center",
          }}
        >
          {question.intro}
        </Text>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "600",
            color: palette.foreground,
            textAlign: "center",
          }}
        >
          {question.prompt}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {question.options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <Pressable
              key={option.value}
              disabled={(disabled ?? false) || confirmingValue !== null}
              onPress={() => handleSelect(option.value)}
              style={{
                borderRadius: radius.lg,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? palette.emerald : palette.border,
                backgroundColor: isSelected
                  ? palette.emeraldSoft
                  : palette.card,
                paddingHorizontal: 16,
                paddingVertical: 12,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isSelected
                        ? palette.emeraldForeground
                        : palette.foreground,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 13,
                      color: palette.mutedForeground,
                      lineHeight: 18,
                    }}
                  >
                    {option.description}
                  </Text>
                </View>
                {isMulti ? (
                  <View
                    style={{
                      marginTop: 2,
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isSelected
                        ? palette.emerald
                        : palette.border,
                      backgroundColor: isSelected
                        ? palette.emerald
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                ) : isSelected ? (
                  <View style={{ marginTop: 2 }}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={palette.emerald}
                    />
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {isMulti && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 4,
          }}
        >
          {question.skippable ? (
            <Pressable
              disabled={disabled}
              onPress={() => onAnswer(null)}
              style={{ paddingVertical: 8, paddingHorizontal: 4 }}
            >
              <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
                Skip — I'm not sure
              </Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            disabled={(disabled ?? false) || selected.length === 0}
            onPress={() => onAnswer(selected)}
            style={{
              borderRadius: radius.lg,
              backgroundColor:
                selected.length === 0 ? palette.border : palette.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color:
                  selected.length === 0
                    ? palette.mutedForeground
                    : palette.primaryForeground,
              }}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
