import { Text, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Notice } from "../lib/types";
import { useApp } from "../state/AppState";
import { Button, Header, MemberOnly, Screen, State, s } from "../components/ui";
import { date } from "../lib/format";
export default function Notifications() {
  const { session } = useApp();
  const q = useQuery({
    queryKey: ["notifications", session?.user.id],
    queryFn: () => api<Notice[]>("/notifications"),
    enabled: !!session,
  });
  const read = useMutation({
    mutationFn: () => api("/notifications/read", { method: "PATCH" }),
    onSuccess: () => q.refetch(),
  });
  return (
    <Screen>
      <Header title="Notificaciones" back />
      <MemberOnly>
        <State
          loading={q.isPending}
          error={q.error || read.error}
          onRetry={() => void q.refetch()}
          empty={q.data?.length === 0 ? "No tienes notificaciones." : undefined}
        />
        {!!q.data?.some((n) => !n.read) && (
          <Button
            secondary
            title="Marcar todas como leídas"
            loading={read.isPending}
            onPress={() => read.mutate()}
          />
        )}{" "}
        {q.data?.map((n) => (
          <View key={n.id} style={s.card}>
            <Text style={s.h2}>
              {n.title}
              {!n.read ? " · Nueva" : ""}
            </Text>
            <Text style={s.text}>{n.description}</Text>
            <Text style={s.text}>{date(n.date)}</Text>
          </View>
        ))}
      </MemberOnly>
    </Screen>
  );
}
