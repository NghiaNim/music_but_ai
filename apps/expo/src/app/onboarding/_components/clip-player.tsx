import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

import type { ClipReaction } from "@acme/validators";

import type { Palette } from "~/theme";
import { radius } from "~/theme";
import { getBaseUrl } from "~/utils/base-url";

export type ClipReactionDraft = ClipReaction;

interface ClipPlayerProps {
  clip: {
    id: string;
    composer: string;
    title: string;
    file: string;
  };
  /** 1-based for display; passed in from the parent. */
  index: number;
  total: number;
  onAdvance: (reaction: ClipReactionDraft) => void;
  /** True only on the very first clip — gates audio playback behind a tap. */
  requiresFirstTap: boolean;
  onFirstTapConsumed: () => void;
  palette: Palette;
}

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * One clip, fully self-contained (mirrors the web `ClipPlayer`). Owns its
 * own audio player instance via `useAudioPlayer` — the parent remounts this
 * component per clip (`key={clip.id}`) so each gets a fresh player.
 *
 * Deliberately doesn't show era/mood — bias-prevention per the onboarding
 * spec. Reaction is a 3-button tap row, not voice/text input.
 */
export function ClipPlayer({
  clip,
  index,
  total,
  onAdvance,
  requiresFirstTap,
  onFirstTapConsumed,
  palette,
}: ClipPlayerProps) {
  const source = useMemo(
    () => ({ uri: `${getBaseUrl()}${clip.file}` }),
    [clip.file],
  );
  const player = useAudioPlayer(source, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);

  const [hasStarted, setHasStarted] = useState(!requiresFirstTap);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [reaction, setReaction] = useState<ClipReactionDraft["reaction"]>(null);

  useEffect(() => {
    if (!hasStarted) return;
    void player.seekTo(0);
    player.play();
    // Only re-run when the clip changes / first tap flips hasStarted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  useEffect(() => {
    if (status.didJustFinish) setReachedEnd(true);
  }, [status.didJustFinish]);

  const handleFirstTap = () => {
    onFirstTapConsumed();
    setHasStarted(true);
  };

  const handlePauseToggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleReplay = () => {
    setReplayCount((c) => c + 1);
    setReachedEnd(false);
    void player.seekTo(0);
    player.play();
  };

  const progressMs = status.currentTime * 1000;
  const durationMs = status.duration * 1000;

  const buildReaction = (skipped: boolean): ClipReactionDraft => ({
    clipId: clip.id,
    listenedMs: Math.max(0, Math.round(progressMs)),
    clipDurationMs: Math.max(0, Math.round(durationMs)),
    skipped,
    replayed: replayCount > 0,
    reaction,
  });

  const handleSkip = () => {
    player.pause();
    onAdvance(buildReaction(true));
  };

  const handleNext = () => {
    player.pause();
    onAdvance(buildReaction(!reachedEnd));
  };

  const progressPct =
    durationMs > 0 ? Math.min(100, (progressMs / durationMs) * 100) : 0;

  return (
    <View style={{ width: "100%", alignItems: "center", gap: 24 }}>
      <Visualizer playing={status.playing} palette={palette} />

      <View style={{ gap: 4, alignItems: "center", paddingHorizontal: 8 }}>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: palette.foreground,
            textAlign: "center",
          }}
        >
          What does this make you feel?
        </Text>
        <Text style={{ fontSize: 13, color: palette.mutedForeground }}>
          Listen with fresh ears
        </Text>
      </View>

      <View style={{ width: "100%", maxWidth: 320 }}>
        <View
          style={{
            height: 6,
            width: "100%",
            borderRadius: 999,
            overflow: "hidden",
            backgroundColor: palette.border,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progressPct}%`,
              borderRadius: 999,
              backgroundColor: palette.emerald,
            }}
          />
        </View>
        <View
          style={{
            marginTop: 4,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 11, color: palette.mutedForeground }}>
            {formatTime(progressMs)}
          </Text>
          <Text style={{ fontSize: 11, color: palette.mutedForeground }}>
            {formatTime(durationMs)}
          </Text>
        </View>
      </View>

      {requiresFirstTap && !hasStarted ? (
        <View style={{ alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={handleFirstTap}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderRadius: radius.lg,
              backgroundColor: palette.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            <Ionicons name="play" size={18} color={palette.primaryForeground} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: palette.primaryForeground,
              }}
            >
              Start listening
            </Text>
          </Pressable>
          <Text
            style={{
              fontSize: 11,
              color: palette.mutedForeground,
              textAlign: "center",
            }}
          >
            We'll auto-play the rest. Tap any clip to pause.
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Pressable
              onPress={handlePauseToggle}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={status.playing ? "pause" : "play"}
                size={22}
                color={palette.foreground}
              />
            </Pressable>
            <Pressable
              onPress={handleReplay}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: palette.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="refresh" size={18} color={palette.foreground} />
            </Pressable>
          </View>

          <ReactionRow
            value={reaction}
            onChange={setReaction}
            palette={palette}
          />

          <View
            style={{
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 4,
            }}
          >
            <Pressable onPress={handleSkip} style={{ padding: 8 }}>
              <Text style={{ fontSize: 14, color: palette.mutedForeground }}>
                Skip
              </Text>
            </Pressable>
            <Pressable
              onPress={handleNext}
              style={{
                borderRadius: radius.lg,
                backgroundColor: palette.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: palette.primaryForeground,
                }}
              >
                {index === total ? "Finish" : "Next clip"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function ReactionRow({
  value,
  onChange,
  palette,
}: {
  value: ClipReactionDraft["reaction"];
  onChange: (next: ClipReactionDraft["reaction"]) => void;
  palette: Palette;
}) {
  const buttons: {
    key: NonNullable<ClipReactionDraft["reaction"]>;
    label: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
  }[] = [
    {
      key: "love",
      label: "Love it",
      activeBg: palette.emeraldSoft,
      activeText: palette.emeraldForeground,
      activeBorder: palette.emerald,
    },
    {
      key: "ok",
      label: "It's okay",
      activeBg: palette.secondary,
      activeText: palette.secondaryForeground,
      activeBorder: palette.mutedForeground,
    },
    {
      key: "not_for_me",
      label: "Not for me",
      activeBg: palette.amberSoft,
      activeText: palette.amberStrong,
      activeBorder: palette.amberStrong,
    },
  ];

  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 11, color: palette.mutedForeground }}>
        Optional — how does this land?
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {buttons.map((b) => {
          const selected = value === b.key;
          return (
            <Pressable
              key={b.key}
              onPress={() => onChange(selected ? null : b.key)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? b.activeBorder : palette.border,
                backgroundColor: selected ? b.activeBg : "transparent",
                paddingHorizontal: 12,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: selected ? b.activeText : palette.mutedForeground,
                }}
              >
                {b.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Visualizer({
  playing,
  palette,
}: {
  playing: boolean;
  palette: Palette;
}) {
  const heights = useMemo(
    () =>
      Array.from(
        { length: 9 },
        (_, i) => 20 + Math.sin((i + 1) * 0.7) * 30 + (i % 3) * 6,
      ),
    [],
  );
  const [animatedValues] = useState(() =>
    heights.map(() => new Animated.Value(0.4)),
  );

  useEffect(() => {
    if (!playing) {
      animatedValues.forEach((v) => v.setValue(0));
      return;
    }
    const loops = animatedValues.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 450 + i * 30,
            useNativeDriver: false,
          }),
          Animated.timing(v, {
            toValue: 0.3,
            duration: 450 + i * 30,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, animatedValues]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 6,
        height: 80,
      }}
    >
      {heights.map((h, i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            borderRadius: 999,
            backgroundColor: palette.emerald,
            opacity: 0.7,
            height: playing
              ? animatedValues[i]?.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, h],
                })
              : 8,
          }}
        />
      ))}
    </View>
  );
}
