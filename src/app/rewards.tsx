import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post, ApiError } from "../lib/api";
import type { Page, Reward, Redemption, Balance } from "../lib/types";
import { useApp } from "../state/AppState";
import {
  Button,
  Header,
  MemberOnly,
  Photo,
  Screen,
  State,
  s,
} from "../components/ui";
export default function Rewards() {
  const { session } = useApp(),
    client = useQueryClient();
  const [selected, setSelected] = useState<Reward | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [uncertain, setUncertain] = useState(false);
  const q = useQuery({
    queryKey: ["rewards"],
    queryFn: () => api<Page<Reward>>("/points/rewards?size=100"),
  });
  const balance = useQuery({
    queryKey: ["balance", session?.user.id],
    queryFn: () => api<Balance>("/points/balance"),
    enabled: !!session,
  });
  async function redeem() {
    if (busy || uncertain || !selected) return;
    setBusy(true);
    try {
      await post<Redemption>("/points/rewards/redeem", {
        rewardId: selected.id,
      });
      void client.invalidateQueries({ queryKey: ["balance"] });
      void client.invalidateQueries({ queryKey: ["redemptions"] });
      void q.refetch();
      setSelected(null);
      router.push("/redemptions");
    } catch (e) {
      setError((e as Error).message);
      if (!(e instanceof ApiError) || e.status === 0 || e.status >= 500)
        setUncertain(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header title="Recompensas" back />
      <Text style={s.title}>Tus puntos se disfrutan.</Text>
      <State
        loading={q.isPending}
        error={q.error}
        onRetry={() => void q.refetch()}
        empty={
          q.data?.data.length === 0
            ? "Aún no hay recompensas publicadas."
            : undefined
        }
      />
      {selected ? (
        <View style={s.card}>
          <Text style={s.h2}>Confirmar canje</Text>
          <Text style={s.text}>
            Canjear {selected.name} descontará {selected.pointsRequired} puntos
            de tu saldo.
          </Text>
          {!!error && <Text style={s.error}>{error}</Text>}
          <Text style={s.text}>
            Si la conexión se interrumpe, revisa Mis recompensas antes de
            repetir el canje.
          </Text>
          <Button
            title={`Canjear por ${selected.pointsRequired} puntos`}
            loading={busy}
            disabled={uncertain}
            onPress={() => void redeem()}
          />
          <Button
            secondary
            title="Revisar mis recompensas"
            onPress={() => router.push("/redemptions")}
          />
          <Button
            secondary
            title="Cancelar"
            disabled={busy}
            onPress={() => {
              setSelected(null);
              setError("");
            }}
          />
        </View>
      ) : (
        q.data?.data
          .filter(
            (r) =>
              r.active && (!r.expiresAt || new Date(r.expiresAt) > new Date()),
          )
          .map((r) => (
            <View style={s.card} key={r.id}>
              <Photo uri={r.imageUrl} />
              <Text style={s.h2}>{r.name}</Text>
              <Text style={s.text}>{r.description}</Text>
              <Text style={s.price}>{r.pointsRequired} puntos</Text>
              <MemberOnly>
                <Button
                  title={
                    r.stock < 1
                      ? "Agotada"
                      : balance.data && balance.data.balance < r.pointsRequired
                        ? "Necesitas más puntos"
                        : "Elegir recompensa"
                  }
                  disabled={
                    r.stock < 1 ||
                    !balance.data ||
                    balance.data.balance < r.pointsRequired
                  }
                  onPress={() => {
                    setSelected(r);
                    setError(
                      uncertain
                        ? "Revisa tus canjes. No podemos confirmar el resultado de la solicitud anterior."
                        : "",
                    );
                  }}
                />
              </MemberOnly>
            </View>
          ))
      )}
    </Screen>
  );
}
