import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import {
  COMPLETED_KEY,
  countCompletedInModule,
  MODULES,
  parseCompletedUnits,
} from "@acme/validators";

import tonTonAvatar from "../../../assets/ton-ton.png";

const MODULE_CARD_COLORS: Record<string, { bgLight: string; bgDark: string }> =
  {
    instruments: { bgLight: "#FFFBEB", bgDark: "rgba(180,83,9,0.15)" },
    basics: { bgLight: "#F5F3FF", bgDark: "rgba(109,40,217,0.15)" },
    etiquette: { bgLight: "#FDF2F8", bgDark: "rgba(190,24,93,0.15)" },
    legends: { bgLight: "#ECFDF5", bgDark: "rgba(16,185,129,0.15)" },
    performances: { bgLight: "#EFF6FF", bgDark: "rgba(29,78,216,0.15)" },
    listening: { bgLight: "#FFF7ED", bgDark: "rgba(194,65,12,0.15)" },
  };

export default function LearnScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const [completedByModule, setCompletedByModule] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    let mounted = true;
    const loadProgress = async () => {
      const raw = await SecureStore.getItemAsync(COMPLETED_KEY);
      if (!mounted) return;
      const completed = parseCompletedUnits(raw);
      const next: Record<string, number> = {};
      for (const module of MODULES) {
        next[module.slug] = countCompletedInModule(completed, module.slug);
      }
      setCompletedByModule(next);
    };
    void loadProgress();
    return () => {
      mounted = false;
    };
  }, []);

  const bg = isDark ? "#111111" : "#FFFAEF";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const border = isDark ? "#2D2D2D" : "#E5E7EB";
  const textPrimary = isDark ? "#F9FAFB" : "#111827";
  const textMuted = "#6B7280";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: textPrimary }}>
            Learn
          </Text>
          <Text style={{ fontSize: 14, color: textMuted, marginTop: 4 }}>
            Bite-sized modules &amp; quizzes — earn points as you go
          </Text>
        </View>

        {/* Module grid — 2-column */}
        <View
          style={{
            paddingHorizontal: 16,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {MODULES.map((mod) => (
            <Pressable
              key={mod.slug}
              onPress={() => {
                /* Coming soon — no module page in Expo yet */
                router.push(`/learn/${mod.slug}`);
              }}
              style={{
                width: "47%",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                backgroundColor: cardBg,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {/* Icon panel */}
              <View
                style={{
                  aspectRatio: 4 / 3,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark
                    ? (MODULE_CARD_COLORS[mod.slug]?.bgDark ??
                      "rgba(120,53,15,0.15)")
                    : (MODULE_CARD_COLORS[mod.slug]?.bgLight ?? "#FFFBEB"),
                }}
              >
                <Text style={{ fontSize: 44 }}>{mod.cardIcon}</Text>
              </View>
              {/* Content */}
              <View style={{ padding: 12 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: textPrimary,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {mod.title}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: textMuted,
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                  numberOfLines={2}
                >
                  {mod.description}
                </Text>
                {/* Progress bar (always 0 on mobile for now) */}
                <View style={{ marginTop: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "600",
                        color: textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Progress
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: "#B45309",
                      }}
                    >
                      {completedByModule[mod.slug] ?? 0}/{mod.units.length}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: isDark ? "#2D2D2D" : "#E5E7EB",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((completedByModule[mod.slug] ?? 0) /
                              mod.units.length) *
                              100,
                          ),
                        )}%`,
                        borderRadius: 999,
                        backgroundColor: "#F59E0B",
                      }}
                    />
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Ton Ton CTA */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/(tabs)/chat",
              params: { mode: "discovery" },
            })
          }
          style={{
            marginHorizontal: 16,
            marginTop: 24,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: cardBg,
            padding: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: "#F5E6DC",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <Image
                source={tonTonAvatar}
                style={{ width: 68, height: 68 }}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: textPrimary }}
              >
                Have a question?
              </Text>
              <Text style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                Ask Ton Ton anything about classical or jazz music
              </Text>
            </View>
            <Text style={{ color: "#9CA3AF", fontSize: 18 }}>›</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
