import { visitToken } from "./format";
export type NdefRecordInput = {
  tnf: number;
  type: number[] | string;
  payload: number[];
};
export type PaseoTag = { kind: "visit"; token: string } | { kind: "card" };
// Accept only Paseo NDEF Text/URI records. Chip serial numbers never identify an account.
export function decodeNdefRecords(records: NdefRecordInput[]): string[] {
  if (records.length > 16)
    throw Error("La etiqueta contiene demasiados registros.");
  return records.flatMap((r) => {
    if (r.tnf !== 1 || r.type.length !== 1 || !r.payload.length) return [];
    if (r.payload.length > 4096)
      throw Error("El contenido de la etiqueta es demasiado largo.");
    const decode = (bytes: number[]) =>
      new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
    if (r.type[0] === 0x54 || r.type === "T") {
      const status = r.payload[0],
        languageSize = status & 0x3f;
      if (status & 0xc0 || languageSize + 1 >= r.payload.length)
        throw Error("Graba el registro de texto en UTF-8 desde NFC Tools.");
      return [decode(r.payload.slice(1 + languageSize)).trim()];
    }
    if (r.type[0] === 0x55 || r.type === "U") {
      const prefixes: Record<number, string> = {
        0: "",
        1: "http://www.",
        2: "https://www.",
        3: "http://",
        4: "https://",
      };
      const prefix = prefixes[r.payload[0]];
      return prefix === undefined ? [] : [prefix + decode(r.payload.slice(1))];
    }
    return [];
  });
}
export function classifyPaseoTag(
  values: string[],
  publicOrigin: string,
): PaseoTag {
  const unique = [...new Set(values.filter(Boolean))];
  if (unique.length !== 1)
    throw Error("Usa una etiqueta con un solo registro de Paseo.");
  const token = visitToken(unique[0], publicOrigin);
  if (token) return { kind: "visit", token };
  if (/^PASEO-NFC:[A-Za-z0-9_-]{43}$/.test(unique[0])) return { kind: "card" };
  throw Error(
    "Esta etiqueta no contiene un enlace de visita de Paseo reconocido. Comprueba el enlace grabado y el dominio configurado.",
  );
}
