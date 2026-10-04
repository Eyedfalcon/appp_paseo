import { test, expect } from "@playwright/test";
import { decodeNdefRecords, classifyPaseoTag } from "../src/lib/nfc-records";
const bytes = (s: string) => Array.from(new TextEncoder().encode(s));
const token = "a".repeat(32);
test("NFC Tools: decodifica texto UTF-8 sin el prefijo de idioma", () => {
  const raw = "PASEO-NFC:" + "b".repeat(43);
  const decoded = decodeNdefRecords([
    { tnf: 1, type: [0x54], payload: [2, ...bytes("en"), ...bytes(raw)] },
  ]);
  expect(decoded).toEqual([raw]);
  expect(classifyPaseoTag(decoded, "")).toEqual({ kind: "card" });
  // Reading a personal credential never creates a visit nor exposes its secret in the result.
  expect(classifyPaseoTag(decoded, "")).not.toHaveProperty("token");
});
test("NFC Tools: interpreta un registro URL con prefijo HTTPS comprimido", () => {
  const values = decodeNdefRecords([
    {
      tnf: 1,
      type: "U",
      payload: [4, ...bytes(`paseo.example/visita/${token}`)],
    },
  ]);
  expect(classifyPaseoTag(values, "https://paseo.example")).toEqual({
    kind: "visit",
    token,
  });
});
test("rechaza etiquetas ambiguas, dominios ajenos y números de serie", () => {
  expect(() =>
    classifyPaseoTag(
      [`paseoaranjuez://visita/${token}`, "PASEO-NFC:" + "b".repeat(43)],
      "",
    ),
  ).toThrow(/solo registro/);
  expect(() =>
    classifyPaseoTag(
      [`https://otro.example/visita/${token}`],
      "https://paseo.example",
    ),
  ).toThrow(/no contiene/);
  expect(() => classifyPaseoTag(["04:CE:8F:7A:D5:2A:81"], "")).toThrow();
});
test("rechaza texto truncado, UTF-16 y cargas excesivas", () => {
  for (const payload of [
    [2, 101],
    [0x82, 101, 110, 0, 65],
    Array(4097).fill(0),
  ])
    expect(() => decodeNdefRecords([{ tnf: 1, type: "T", payload }])).toThrow();
  expect(() =>
    classifyPaseoTag(
      decodeNdefRecords([{ tnf: 2, type: [0x54], payload: bytes("otro") }]),
      "",
    ),
  ).toThrow();
});
