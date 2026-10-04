import { useState } from "react";
import { Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api, post } from "../lib/api";
import { useApp } from "../state/AppState";
import { Button, Header, MemberOnly, Screen, State, s } from "../components/ui";
type Card = { id: string; displayCode: string; status: string };
export default function Cards() {
  const { session } = useApp();
  const q = useQuery({
    queryKey: ["cards", session?.user.id],
    queryFn: () =>
      api<{ cards: Card[] }>("/loyalty/me").then((account) => account.cards),
    enabled: !!session,
  });
  const [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Screen>
      <Header title="Mi tarjeta NFC" back />
      <MemberOnly>
        <Text style={s.text}>
          Tu tarjeta física y tu QR identifican la misma cuenta. Solicita la
          vinculación de una tarjeta al personal.
        </Text>
        <State
          loading={q.isPending}
          error={q.error}
          onRetry={() => void q.refetch()}
          empty={
            q.data?.length === 0 ? "No tienes tarjetas vinculadas." : undefined
          }
        />
        {q.data?.map((c) => (
          <View key={c.id} style={s.card}>
            <Text style={s.h2}>{c.displayCode}</Text>
            <Text style={s.text}>
              {c.status === "ACTIVE" ? "Activa" : c.status}
            </Text>
            {c.status === "ACTIVE" &&
              (selected === c.id ? (
                <>
                  <Text style={s.text}>
                    Al reportarla como perdida ya no podrá usarse para
                    identificarte. Tu QR y tus puntos se conservan.
                  </Text>
                  <Button
                    title="Confirmar pérdida"
                    loading={busy}
                    onPress={() => {
                      setBusy(true);
                      void post(`/loyalty/cards/${c.id}/report-lost`, {
                        reason: "Tarjeta perdida, reportada desde la app",
                      })
                        .then(() => {
                          setSelected("");
                          void q.refetch();
                        })
                        .catch((e) => setError(e.message))
                        .finally(() => setBusy(false));
                    }}
                  />
                  <Button
                    secondary
                    title="Cancelar"
                    disabled={busy}
                    onPress={() => setSelected("")}
                  />
                </>
              ) : (
                <Button
                  secondary
                  title="Reportar pérdida"
                  onPress={() => setSelected(c.id)}
                />
              ))}
          </View>
        ))}
        {!!error && <Text style={s.error}>{error}</Text>}
      </MemberOnly>
    </Screen>
  );
}
