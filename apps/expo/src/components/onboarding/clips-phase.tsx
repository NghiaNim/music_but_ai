import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { ClipReactionDraft } from "./clip-player";
import type { Palette } from "~/theme";
import { radius } from "~/theme";
import { trpc } from "~/utils/api";
import { ClipPlayer } from "./clip-player";
import { ProgressPips } from "./progress-pips";

interface ClipsPhaseProps {
  sessionId: string;
  onComplete: () => void;
  onSkipPhase: () => void;
  palette: Palette;
}

export function ClipsPhase({
  sessionId,
  onComplete,
  onSkipPhase,
  palette,
}: ClipsPhaseProps) {
  const clipsQuery = useQuery(
    trpc.onboarding.getClips.queryOptions({ sessionId }),
  );
  const saveReactions = useMutation(
    trpc.onboarding.saveClipReactions.mutationOptions(),
  );

  const [index, setIndex] = useState(0);
  const [reactions, setReactions] = useState<ClipReactionDraft[]>([]);
  const [firstTapConsumed, setFirstTapConsumed] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (clipsQuery.isLoading) {
    return (
      <Centered>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          Loading your clips…
        </Text>
      </Centered>
    );
  }

  if (clipsQuery.isError || !clipsQuery.data) {
    return (
      <Centered>
        <Text
          style={{
            fontSize: 13,
            color: palette.mutedForeground,
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          We couldn't load your clips. You can still finish onboarding.
        </Text>
        <PrimaryButton
          label="Skip clips & build profile"
          onPress={onSkipPhase}
          palette={palette}
        />
      </Centered>
    );
  }

  const clips = clipsQuery.data.clips;
  const total = clips.length;
  const currentClip = clips[index];

  const finalize = async (allReactions: ClipReactionDraft[]) => {
    setSaveError(null);
    try {
      await saveReactions.mutateAsync({
        sessionId,
        reactions: allReactions,
      });
      onComplete();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "We couldn't save your clip reactions — let's try again.",
      );
    }
  };

  const handleAdvance = (reaction: ClipReactionDraft) => {
    const next = [...reactions, reaction];
    setReactions(next);

    if (index + 1 >= total) {
      void finalize(next);
      return;
    }
    setIndex(index + 1);
  };

  const handleBack = () => {
    if (index === 0 || saveReactions.isPending) return;
    setIndex((i) => i - 1);
    setReactions((r) => r.slice(0, -1));
  };

  if (saveReactions.isPending) {
    return (
      <Centered>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          Saving your reactions…
        </Text>
      </Centered>
    );
  }

  if (!currentClip) {
    return (
      <Centered>
        <PrimaryButton
          label="Build my profile"
          onPress={onSkipPhase}
          palette={palette}
        />
      </Centered>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
          paddingLeft: 12,
          paddingRight: 56,
        }}
      >
        <View style={{ minWidth: 64 }}>
          {index > 0 ? (
            <Pressable
              onPress={handleBack}
              disabled={saveReactions.isPending}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="chevron-back" size={16} color={palette.primary} />
              <Text style={{ fontSize: 13, color: palette.primary }}>Back</Text>
            </Pressable>
          ) : null}
        </View>
        <ProgressPips total={total} currentIndex={index} palette={palette} />
        <View style={{ minWidth: 64 }} />
      </View>

      <View
        key={currentClip.id}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
          paddingVertical: 24,
        }}
      >
        <ClipPlayer
          clip={currentClip}
          index={index + 1}
          total={total}
          onAdvance={handleAdvance}
          requiresFirstTap={index === 0 && !firstTapConsumed}
          onFirstTapConsumed={() => setFirstTapConsumed(true)}
          palette={palette}
        />
        {saveError ? (
          <Text
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#F43F5E",
              textAlign: "center",
            }}
          >
            {saveError}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 20,
        }}
      >
        <Pressable
          onPress={onSkipPhase}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 12, color: palette.mutedForeground }}>
            Skip the rest
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      {children}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  palette,
}: {
  label: string;
  onPress: () => void;
  palette: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: radius.lg,
        backgroundColor: palette.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: palette.primaryForeground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
