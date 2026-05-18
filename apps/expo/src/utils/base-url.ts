import Constants from "expo-constants";

export const getBaseUrl = () => {
  if (__DEV__) {
    // On a physical device the Expo dev server is reachable via the machine's
    // LAN IP, not "localhost". Constants.expoConfig.hostUri is "192.168.x.x:PORT"
    // in that case and "localhost:PORT" on the simulator.
    const host = Constants.expoConfig?.hostUri?.split(":")[0] ?? "localhost";
    return `http://${host}:3000`;
  }

  const productionBaseUrl = process.env.EXPO_PUBLIC_AUTH_BASE_URL?.trim();
  if (!productionBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_AUTH_BASE_URL is required for non-development builds.",
    );
  }
  return productionBaseUrl.replace(/\/$/, "");
};
