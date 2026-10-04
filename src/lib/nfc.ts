import type { PaseoTag } from "./nfc-records";
export const isNfcEnabled = true;
export async function readPaseoNfc(_origin: string): Promise<PaseoTag | null> {
  throw Error(
    "La lectura NFC necesita la app instalada en un teléfono compatible. Usa el QR en la vista web.",
  );
}
export async function cancelPaseoNfc(): Promise<void> {}
