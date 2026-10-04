import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post } from "../../lib/api";
import type { Visit } from "../../lib/types";
import { useApp } from "../../state/AppState";
import {
  Button,
  Header,
  MemberOnly,
  Screen,
  State,
  s,
} from "../../components/ui";
export default function VisitPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session } = useApp();
  return <VisitDetail key={`${token}:${session?.user.id || "guest"}`} />;
}
function VisitDetail() {
  const { token } = useLocalSearchParams<{ token: string }>(),
    { session } = useApp(),
    client = useQueryClient();
  const [request, setRequest] = useState<Visit | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const status = useQuery({
    queryKey: ["visit-request", request?.id, session?.user.id],
    queryFn: () => api<Visit>(`/loyalty/visits/requests/${request!.id}`),
    enabled: !!request && !!session,
    refetchInterval: (q) => (q.state.data?.status === "PENDING" ? 3000 : false),
  });
  const current = status.data ?? request;
  useEffect(() => {
    if (current?.status === "CONFIRMED") {
      void client.invalidateQueries({ queryKey: ["balance"] });
      void client.invalidateQueries({ queryKey: ["visit-status"] });
    }
  }, [current?.status, client]);
  return (
    <Screen>
      <Header title="Tu visita" back />
      <MemberOnly>
        <Text style={s.title}>Un punto por estar aquí.</Text>
        <Text style={s.text}>
          Genera la solicitud y muestra el QR al personal para confirmar tu
          presencia. El límite es 1 punto diario por cuenta.
        </Text>
        <State error={status.error} onRetry={() => void status.refetch()} />
        {!!error && <Text style={s.error}>{error}</Text>}
        {(!current || current.status === "EXPIRED") && (
          <Button
            title="Generar solicitud de visita"
            loading={busy}
            onPress={() => {
              setBusy(true);
              setError("");
              void post<Visit>("/loyalty/visits/tag", { token })
                .then(setRequest)
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          />
        )}
        {current?.status === "PENDING" && (
          <View style={[s.card, { alignItems: "center", gap: 20 }]}>
            <Text style={s.h2}>{current.establishmentName}</Text>
            <QRCode value={current.code} size={210} />
            <Text selectable style={s.text}>
              {current.code}
            </Text>
            <Text style={s.text}>Esperando confirmación del personal…</Text>
          </View>
        )}
        {current?.status === "CONFIRMED" && (
          <View style={s.card}>
            <Text style={s.h2}>
              {current.credit?.alreadyProcessed
                ? "Tu punto de hoy ya estaba registrado."
                : "Visita confirmada: +1 punto."}
            </Text>
            <Text style={s.text}>Saldo: {current.credit?.balance} puntos.</Text>
          </View>
        )}
      </MemberOnly>
    </Screen>
  );
}
