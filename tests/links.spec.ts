import { test, expect } from "@playwright/test";
import { visitToken, money } from "../src/lib/format";
const token = "a".repeat(32);
test("los enlaces de visita requieren el dominio propio o esquema de la app", () => {
  expect(
    visitToken(
      `https://paseo.example/visita/${token}`,
      "https://paseo.example",
    ),
  ).toBe(token);
  expect(visitToken(`paseoaranjuez://visita/${token}`, "")).toBe(token);
  for (const value of [
    `https://evil.example/visita/${token}`,
    `https://paseo.example.evil.example/visita/${token}`,
    `https://paseo.example/visita/short`,
    "PASEO-NFC:otro",
    "javascript:alert(1)",
  ])
    expect(visitToken(value, "https://paseo.example")).toBeNull();
  expect(visitToken(`https://paseo.example/visita/${token}`, "")).toBeNull();
});
test("los precios se convierten desde centavos sin multiplicar el importe", () => {
  expect(money(28900)).toBe("Bs 289,00");
  expect(money(85)).toBe("Bs 0,85");
});
