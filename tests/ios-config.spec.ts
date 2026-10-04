/// <reference types="node" />
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

for (const enabled of [false, true]) {
  test(`configuración iOS NFC=${enabled} conserva QR y NFC Android`, () => {
    const output = execFileSync(
      process.execPath,
      ["node_modules/expo/bin/cli", "config", "--type", "introspect", "--json"],
      {
        env: { ...process.env, IOS_NFC_ENABLED: String(enabled) },
        encoding: "utf8",
        timeout: 25000,
      },
    );
    const config = JSON.parse(output);
    const ios = config._internal.modResults.ios;
    expect(config.extra.iosNfcEnabled).toBe(enabled);
    expect(
      ios.entitlements["com.apple.developer.nfc.readersession.formats"],
    ).toEqual(enabled ? ["TAG"] : undefined);
    expect(Boolean(ios.infoPlist.NFCReaderUsageDescription)).toBe(enabled);
    expect(ios.infoPlist.NSCameraUsageDescription).toBeTruthy();
    const android = config._internal.modResults.android.manifest.manifest;
    expect(
      android["uses-permission"].some(
        (p: { $: Record<string, string> }) =>
          p.$["android:name"] === "android.permission.NFC" &&
          p.$["tools:node"] !== "remove",
      ),
    ).toBe(true);
  });
}
