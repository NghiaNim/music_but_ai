export const getBaseUrl = () => {
  if (__DEV__) {
    return "http://localhost:3000";
  }

  const productionBaseUrl = process.env.EXPO_PUBLIC_AUTH_BASE_URL?.trim();
  if (!productionBaseUrl) {
    throw new Error(
      "EXPO_PUBLIC_AUTH_BASE_URL is required for non-development builds.",
    );
  }
  return productionBaseUrl.replace(/\/$/, "");
};
