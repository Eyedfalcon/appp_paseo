import { useCallback, useRef, useState } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { post, WEB_URL } from "../lib/api";
import { visitToken, money } from "../lib/format";
import type { Receipt } from "../lib/types";
import { Button, Field, Header, MemberOnly, Screen, s } from "../components/ui";
import { isNfcEnabled } from "../lib/nfc";
import { useNfcReader } from "../hooks/useNfcReader";
export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [camera, setCamera] = useState(false),
    [code, setCode] = useState(""),
    [receipt, setReceipt] = useState<Receipt | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [credit, setCredit] = useState<{
      points: number;
      balance: number;
      alreadyProcessed: boolean;
    } | null>(null);
  const [personalCard, setPersonalCard] = useState(false);
  const nfc = useNfcReader(WEB_URL, (tag) => {
    setCode("");
    setReceipt(null);
    setCredit(null);
    setError("");
    if (tag.kind === "visit") {
      setPersonalCard(false);
      router.push(`/visita/${tag.token}`);
    } else setPersonalCard(true);
  });
  const lock = useRef(false),
    client = useQueryClient();
  useFocusEffect(useCallback(() => () => setCamera(false), []));
  async function inspect(raw: string) {
    if (lock.current || nfc.reading) return;
    lock.current = true;
    setCamera(false);
    setBusy(true);
    setError("");
    setReceipt(null);
    setCredit(null);
    setCode(raw);
    try {
      const token = visitToken(raw, WEB_URL);
      if (token) {
        router.push(`/visita/${token}`);
        return;
      }
      setReceipt(
        await post<Receipt>("/loyalty/purchases/preview", { code: raw.trim() }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function claim() {
    if (lock.current || nfc.reading) return;
    lock.current = true;
    setBusy(true);
    try {
      setCredit(await post("/loyalty/purchases/claim", { code: code.trim() }));
      void client.invalidateQueries({ queryKey: ["balance"] });
      void client.invalidateQueries({ queryKey: ["history"] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <Screen>
      <Header title="Ganar puntos" back />
      <MemberOnly>
        <Text style={s.title}>Escanea. Suma.</Text>
        <Text style={s.text}>
          Escanea el QR de compra emitido por el comercio o el enlace de una
          etiqueta de visita.
        </Text>
        {isNfcEnabled ? (
          <Button
            secondary
            title={
              nfc.reading ? "Acerca el teléfono a la etiqueta…" : "Leer NFC"
            }
            loading={nfc.reading}
            disabled={busy}
            onPress={() => {
              setCamera(false);
              setPersonalCard(false);
              setReceipt(null);
              setCredit(null);
              setError("");
              void nfc.read();
            }}
          />
        ) : (
          <Text style={s.text}>
            Usa el QR para identificar tu compra o registrar tu visita.
          </Text>
        )}
        {nfc.reading && (
          <Button secondary title="Cancelar lectura NFC" onPress={nfc.cancel} />
        )}
        {!!nfc.error && (
          <Text accessibilityRole="alert" style={s.error}>
            {nfc.error}
          </Text>
        )}
        {personalCard && (
          <View style={s.card}>
            <Text style={s.h2}>Registro de tarjeta leído</Text>
            <Text style={s.text}>
              Esta tarjeta sirve para identificar al cliente en caja. Su lectura
              no confirma la vinculación ni concede puntos. El personal verifica
              la cuenta y registra la compra o visita.
            </Text>
            <Button
              secondary
              title="Ver mis tarjetas vinculadas"
              onPress={() => router.push("/cards")}
            />
          </View>
        )}
        {camera && permission?.granted ? (
          <View style={{ height: 300, borderRadius: 24, overflow: "hidden" }}>
            <CameraView
              style={{ flex: 1 }}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={({ data }) => void inspect(data)}
            />
          </View>
        ) : (
          <Button
            title="Abrir cámara"
            disabled={busy || nfc.reading}
            onPress={() => {
              void (async () => {
                const result = permission?.granted
                  ? permission
                  : await requestPermission();
                if (result.granted) setCamera(true);
                else
                  setError(
                    "Permite la cámara en los ajustes del teléfono o pega el código debajo.",
                  );
              })();
            }}
          />
        )}
        {camera && (
          <Button
            secondary
            title="Cerrar cámara"
            onPress={() => setCamera(false)}
          />
        )}
        <Field
          label="Código o enlace"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setReceipt(null);
            setCredit(null);
          }}
          autoCapitalize="none"
          editable={!busy && !nfc.reading}
        />
        <Button
          title="Consultar código"
          disabled={!code.trim() || nfc.reading}
          loading={busy}
          onPress={() => void inspect(code)}
        />
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {receipt && !credit && (
          <View style={s.card}>
            <Text style={s.h2}>{receipt.storeName}</Text>
            <Text style={s.text}>
              Compra {receipt.receiptNumber} · {money(receipt.amountCentavos)}
            </Text>
            <Text style={s.price}>{receipt.points} puntos</Text>
            <Button
              title="Añadir puntos a mi cuenta"
              disabled={nfc.reading}
              loading={busy}
              onPress={() => void claim()}
            />
          </View>
        )}
        {credit && (
          <View style={s.card}>
            <Text style={s.h2}>
              {credit.alreadyProcessed
                ? "Esta compra ya estaba registrada"
                : `Sumaste ${credit.points} puntos`}
            </Text>
            <Text style={s.text}>Saldo: {credit.balance} puntos.</Text>
            <Button
              title="Ver mis puntos"
              onPress={() => router.replace("/points")}
            />
          </View>
        )}
      </MemberOnly>
    </Screen>
  );
}
