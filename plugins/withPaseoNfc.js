const { withEntitlementsPlist, withInfoPlist } = require("expo/config-plugins");
const withNfc = require("react-native-nfc-manager/app.plugin.js");

module.exports = function withPaseoNfc(config, { iosEnabled = true } = {}) {
  const applyNfc = (value) =>
    withNfc(value, {
      nfcPermission:
        "Permite leer las etiquetas de visita y tarjetas de Paseo Aranjuez.",
      includeNdefEntitlement: false,
    });
  if (iosEnabled) return applyNfc(config);
  // Remove stale values too when switching an existing native project to Personal Team.
  config = withEntitlementsPlist(config, (mod) => {
    delete mod.modResults["com.apple.developer.nfc.readersession.formats"];
    return mod;
  });
  config = withInfoPlist(config, (mod) => {
    delete mod.modResults.NFCReaderUsageDescription;
    delete mod.modResults[
      "com.apple.developer.nfc.readersession.iso7816.select-identifiers"
    ];
    delete mod.modResults[
      "com.apple.developer.nfc.readersession.felica.systemcodes"
    ];
    return mod;
  });
  // Expo executes later-registered mods first: strip iOS values after the library adds them.
  return applyNfc(config);
};
