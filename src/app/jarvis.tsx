import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import { useQuery } from "@tanstack/react-query";
import { api, post } from "../lib/api";
import type { Conversation } from "../lib/types";
import { useApp } from "../state/AppState";
import {
  Button,
  Field,
  Header,
  MemberOnly,
  Screen,
  State,
  s,
} from "../components/ui";
import { C } from "../lib/theme";
export default function Jarvis() {
  const { session } = useApp();
  return <JarvisChat key={session?.user.id || "guest"} />;
}
function JarvisChat() {
  const { session } = useApp();
  const [id, setId] = useState<string>(),
    [messages, setMessages] = useState<{ role: string; content: string }[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [spoken, setSpoken] = useState(false);
  const generation = useRef(0),
    lock = useRef(false);
  const history = useQuery({
    queryKey: ["jarvis-conversations", session?.user.id],
    queryFn: () => api<Conversation[]>("/jarvis/conversations"),
    enabled: !!session,
  });
  useEffect(
    () => () => {
      generation.current++;
      void Speech.stop();
    },
    [],
  );

  async function send() {
    if (lock.current || !draft.trim()) return;
    lock.current = true;
    setBusy(true);
    setError("");
    const text = draft.trim(),
      version = generation.current;
    try {
      const response = await post<{ conversationId: string; answer: string }>(
        "/jarvis/chat",
        { conversationId: id, message: text },
      );
      if (version !== generation.current) return;
      setId(response.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: "USER", content: text },
        { role: "ASSISTANT", content: response.answer },
      ]);
      setDraft("");
      void history.refetch();
      if (spoken)
        Speech.speak(
          response.answer.replace(
            /https?:\/\/\S+|\/establecimientos\/\S+/g,
            "",
          ),
          { language: "es-BO" },
        );
    } catch (e) {
      if (version === generation.current)
        setError(
          (e as Error).message +
            " Revisa la conversación guardada antes de repetir el envío.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Header title="Jarvis Paseo" back />
        <MemberOnly>
          <View style={s.row}>
            <Image
              source={require("../../assets/brand/jarvis.png")}
              style={{ width: 66, height: 66 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={s.h2}>Tu Paseo, a una conversación.</Text>
              <Text style={s.text}>Un regalo, un café, un plan.</Text>
            </View>
          </View>
          <Button
            secondary
            title="Nueva conversación"
            disabled={busy}
            onPress={() => {
              generation.current++;
              setId(undefined);
              setMessages([]);
              setError("");
              void Speech.stop();
            }}
          />
          {!messages.length && (
            <>
              <State
                error={history.error}
                onRetry={() => void history.refetch()}
              />
              {history.data?.slice(0, 5).map((c) => (
                <Button
                  key={c.id}
                  secondary
                  title={c.title}
                  disabled={busy}
                  onPress={() => {
                    setId(c.id);
                    setMessages(c.messages);
                    setError("");
                  }}
                />
              ))}
            </>
          )}
          {messages.map((m, i) => (
            <View
              key={i}
              style={[
                s.card,
                { backgroundColor: m.role === "USER" ? C.navy : C.white },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: m.role === "USER" ? C.gold : C.muted,
                }}
              >
                {m.role === "USER" ? "Tú" : "Jarvis"}
              </Text>
              <Text
                selectable
                style={[s.text, { color: m.role === "USER" ? C.white : C.ink }]}
              >
                {m.content}
              </Text>
            </View>
          ))}
          {busy && <State loading />}
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <Field
            label="Mensaje para Jarvis"
            placeholder="¿Qué le podría regalar a mi papá?"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={2000}
          />
          <Button
            title="Enviar mensaje"
            loading={busy}
            disabled={!draft.trim()}
            onPress={() => void send()}
          />
          <Button
            secondary
            title={
              spoken
                ? "Desactivar lectura en voz alta"
                : "Escuchar respuestas con la voz del móvil"
            }
            onPress={() => {
              setSpoken(!spoken);
              void Speech.stop();
            }}
          />
          <Text style={s.text}>
            Jarvis consulta la información del Paseo. Si OpenAI está
            configurado, procesa tus mensajes para responder. Confirma
            disponibilidad con la tienda.
          </Text>
        </MemberOnly>
      </Screen>
    </KeyboardAvoidingView>
  );
}
