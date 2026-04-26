declare module "@expo/vector-icons" {
  import type { ComponentType } from "react";

  export const Ionicons: ComponentType<{
    name: string;
    size?: number;
    color?: string;
  }>;
}
