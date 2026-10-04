import { Text, View } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Movement, Page } from "../lib/types";
import { date } from "../lib/format";
import { useApp } from "../state/AppState";
import { Button, Header, MemberOnly, Screen, State, s } from "../components/ui";
export default function History() {
  const { session } = useApp();
  const q = useInfiniteQuery({
    queryKey: ["history-all", session?.user.id],
    initialPageParam: 0,
    enabled: !!session,
    queryFn: ({ pageParam }) =>
      api<Page<Movement>>(`/points/history?page=${pageParam}&size=30`),
    getNextPageParam: (p) =>
      p.pagination.page + 1 < p.pagination.totalPages
        ? p.pagination.page + 1
        : undefined,
  });
  return (
    <Screen>
      <Header title="Mis movimientos" back />
      <MemberOnly>
        <Text style={s.title}>Cada punto, su historia.</Text>
        <State
          loading={q.isPending}
          error={q.error}
          onRetry={() => void q.refetch()}
          empty={
            q.data?.pages[0].data.length === 0
              ? "Tus movimientos aparecerán aquí."
              : undefined
          }
        />
        {q.data?.pages
          .flatMap((p) => p.data)
          .map((m) => (
            <View style={s.card} key={m.id}>
              <View style={s.between}>
                <Text style={[s.text, { flex: 1 }]}>{m.description}</Text>
                <Text style={s.price}>
                  {m.points > 0 ? "+" : ""}
                  {m.points}
                </Text>
              </View>
              <Text style={s.text}>{date(m.createdAt)}</Text>
            </View>
          ))}
        {q.hasNextPage && (
          <Button
            secondary
            title="Ver más movimientos"
            loading={q.isFetchingNextPage}
            onPress={() => void q.fetchNextPage()}
          />
        )}
      </MemberOnly>
    </Screen>
  );
}
