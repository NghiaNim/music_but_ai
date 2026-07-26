import { View } from "react-native";

import type { Palette } from "~/theme";

export function ProgressPips({
  total,
  currentIndex,
  palette,
}: {
  total: number;
  currentIndex: number;
  palette: Palette;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < currentIndex
            ? "done"
            : i === currentIndex
              ? "current"
              : "upcoming";
        return (
          <View
            key={i}
            style={{
              height: 6,
              borderRadius: 999,
              width: state === "current" ? 40 : 24,
              backgroundColor:
                state === "upcoming" ? palette.border : palette.emerald,
              opacity: state === "done" ? 0.8 : 1,
            }}
          />
        );
      })}
    </View>
  );
}
