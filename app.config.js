module.exports = ({ config }) => {
  if (process.env.EAS_BUILD === "true") {
    const api = process.env.EXPO_PUBLIC_API_URL || "";
    try {
      const url = new URL(api);
      if (
        url.protocol !== "https:" ||
        url.pathname.replace(/\/$/, "") !== "/api/v1"
      )
        throw new Error();
    } catch {
      throw new Error(
        "Configura EXPO_PUBLIC_API_URL con la URL HTTPS pública del backend terminada en /api/v1 antes de compilar la app.",
      );
    }
  }
  const nfcSetting = process.env.IOS_NFC_ENABLED ?? "true";
  if (!["true", "false"].includes(nfcSetting))
    throw new Error("IOS_NFC_ENABLED debe ser true o false.");
  const iosNfcEnabled = nfcSetting === "true";
  const team = process.env.APPLE_TEAM_ID?.trim();
  if (team && !/^[A-Z0-9]{10}$/.test(team))
    throw new Error(
      "APPLE_TEAM_ID debe ser el identificador de 10 caracteres de tu equipo Apple.",
    );
  return {
    ...config,
    extra: { ...config.extra, iosNfcEnabled },
    plugins: [
      ...(config.plugins || []),
      ["./plugins/withPaseoNfc", { iosEnabled: iosNfcEnabled }],
    ],
    ios: { ...config.ios, ...(team ? { appleTeamId: team } : {}) },
  };
};
