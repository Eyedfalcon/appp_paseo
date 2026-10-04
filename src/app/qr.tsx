import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useApp } from "../state/AppState";
import { Header, MemberOnly, Screen, State, s } from "../components/ui";
export default function Qr() {
  const { session } = useApp();
  const q = useQuery({
    queryKey: ["qr", session?.user.id],
    queryFn: () => api<{ payload: string; publicCode: string }>("/points/qr"),
    enabled: !!session,
  });
  return (
    <Screen>
      <Header title="Mi QR" back />
      <MemberOnly>
        <Text style={s.title}>Un Paseo muy tuyo.</Text>
        <Text style={s.text}>
          Muestra este código al personal para identificar tu cuenta y registrar
          tus compras o tu visita.
        </Text>
        <State
          loading={q.isPending}
          error={q.error}
          onRetry={() => void q.refetch()}
        />
        {q.data && (
          <View
            style={[
              s.card,
              { alignItems: "center", paddingVertical: 36, gap: 24 },
            ]}
          >
            <QRCode value={q.data.payload} size={220} />
            <Text selectable style={s.text}>
              {q.data.publicCode}
            </Text>
            <Text style={s.h2}>
              {session?.user.firstName} {session?.user.lastName}
            </Text>
            <Text style={[s.text, { textAlign: "center" }]}>
              Tu QR y tu tarjeta NFC comparten la misma cuenta y saldo.
            </Text>
          </View>
        )}
      </MemberOnly>
    </Screen>
  );
}
