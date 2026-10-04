import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Page, Redemption } from "../lib/types";
import { useApp } from "../state/AppState";
import { Header, MemberOnly, Screen, State, s } from "../components/ui";
export default function Redemptions() {
  const { session } = useApp();
  const q = useQuery({
    queryKey: ["redemptions", session?.user.id],
    queryFn: () => api<Page<Redemption>>("/points/redemptions?size=100"),
    enabled: !!session,
  });
  return (
    <Screen>
      <Header title="Mis recompensas" back />
      <MemberOnly>
        <State
          loading={q.isPending}
          error={q.error}
          onRetry={() => void q.refetch()}
          empty={
            q.data?.data.length === 0
              ? "Todavía no has canjeado recompensas."
              : undefined
          }
        />
        {q.data?.data.map((r) => (
          <View key={r.id} style={s.card}>
            <Text style={s.h2}>{r.rewardName}</Text>
            <Text style={s.text}>
              {r.pointsSpent} puntos ·{" "}
              {r.status === "PENDING"
                ? "Pendiente de uso"
                : r.status === "USED"
                  ? "Utilizada"
                  : r.status}
            </Text>
            {r.status === "PENDING" && (
              <View style={{ alignItems: "center", gap: 16, padding: 16 }}>
                <QRCode value={r.code} size={180} />
                <Text selectable style={s.price}>
                  {r.code}
                </Text>
                <Text style={s.text}>
                  Muestra el código al personal para utilizar tu recompensa.
                </Text>
              </View>
            )}
          </View>
        ))}
      </MemberOnly>
    </Screen>
  );
}
