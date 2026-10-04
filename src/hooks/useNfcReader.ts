import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { readPaseoNfc, cancelPaseoNfc } from "../lib/nfc";
import type { PaseoTag } from "../lib/nfc-records";
export function useNfcReader(origin: string, onRead: (tag: PaseoTag) => void) {
  const [reading, setReading] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0),
    busy = useRef(false);
  const cancel = useCallback(() => {
    generation.current++;
    busy.current = false;
    setReading(false);
    void cancelPaseoNfc();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "background") cancel();
      });
      return () => {
        subscription.remove();
        cancel();
      };
    }, [cancel]),
  );
  const read = async () => {
    if (busy.current) return;
    busy.current = true;
    setReading(true);
    setError("");
    const current = ++generation.current;
    try {
      const tag = await readPaseoNfc(origin);
      if (current === generation.current && tag) onRead(tag);
    } catch (e) {
      if (current === generation.current)
        setError(
          e instanceof Error ? e.message : "No pudimos leer la etiqueta.",
        );
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setReading(false);
      }
    }
  };
  return { reading, error, read, cancel };
}
