import { Platform } from "react-native";
import Constants from "expo-constants";
import {
  classifyPaseoTag,
  decodeNdefRecords,
  type PaseoTag,
} from "./nfc-records";
export const isNfcEnabled =
  Platform.OS !== "ios" || Constants.expoConfig?.extra?.iosNfcEnabled !== false;
let generation = 0,
  reading = false;
let manager: typeof import("react-native-nfc-manager").default | undefined;
export async function cancelPaseoNfc() {
  generation++;
  if (manager) await manager.cancelTechnologyRequest().catch(() => {});
}
export async function readPaseoNfc(origin: string): Promise<PaseoTag | null> {
  if (!isNfcEnabled)
    throw Error(
      "Esta versión de iPhone usa QR. La lectura NFC no está habilitada.",
    );
  if (reading) throw Error("Ya hay una lectura NFC en curso.");
  if (Constants.appOwnership === "expo")
    throw Error(
      "Instala la versión nativa de Paseo; Expo Go no incluye el lector NFC.",
    );
  reading = true;
  const session = ++generation;
  let native: typeof import("react-native-nfc-manager") | undefined;
  try {
    const module = await import("react-native-nfc-manager");
    native = module;
    manager = module.default;
    if (session !== generation) return null;
    if (!(await manager.isSupported()))
      throw Error(
        "Este dispositivo no permite leer etiquetas NFC. Puedes usar el QR.",
      );
    await manager.start();
    if (Platform.OS === "android" && !(await manager.isEnabled()))
      throw Error(
        "Activa NFC en los ajustes de tu teléfono y vuelve a intentarlo.",
      );
    if (session !== generation) return null;
    await manager.requestTechnology(module.NfcTech.Ndef, {
      alertMessage:
        "Acerca la parte superior del iPhone a la etiqueta de Paseo.",
    });
    if (session !== generation) return null;
    const tag = await manager.getTag();
    if (session !== generation) return null;
    return classifyPaseoTag(decodeNdefRecords(tag?.ndefMessage ?? []), origin);
  } catch (error) {
    if (session !== generation) return null;
    // The library normalizes Core NFC and Android cancellation errors.
    if (native && error instanceof native.NfcError.UserCancel) return null;
    throw error instanceof Error
      ? error
      : Error("No pudimos leer la etiqueta. Acerca el teléfono de nuevo.");
  } finally {
    if (manager) await manager.cancelTechnologyRequest().catch(() => {});
    reading = false;
  }
}
