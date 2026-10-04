import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Page, Store, Event, Promotion } from "../../lib/types";
import { C } from "../../lib/theme";
import { date } from "../../lib/format";
import { Button, Header, Photo, Screen, State, s } from "../../components/ui";
import { StoreGrid } from "../../components/StoreGrid";
export default function Discover() {
  const [mode, setMode] = useState("Tiendas"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const stores = useInfiniteQuery({
    queryKey: ["stores", query],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<Page<Store>>(
        `/establishments?size=20&page=${pageParam}&search=${encodeURIComponent(query)}`,
      ),
    getNextPageParam: (p) =>
      p.pagination.page + 1 < p.pagination.totalPages
        ? p.pagination.page + 1
        : undefined,
  });
  const events = useQuery({
    queryKey: ["events"],
    queryFn: () => api<Event[]>("/events"),
    enabled: mode === "Eventos",
  });
  const promos = useQuery({
    queryKey: ["promotions"],
    queryFn: () => api<Promotion[]>("/promotions"),
    enabled: mode === "Promociones",
  });
  return (
    <Screen>
      <Header title="Descubre el Paseo" />
      <Text style={s.title}>Lugares que inspiran.</Text>
      <Text style={s.text}>
        Tus marcas, nuevos planes y sabores por descubrir.
      </Text>
      <View style={[s.row, { flexWrap: "wrap" }]}>
        {["Tiendas", "Eventos", "Promociones"].map((m) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === m }}
            key={m}
            onPress={() => setMode(m)}
            style={[s.chip, mode === m && { backgroundColor: C.navy }]}
          >
            <Text style={{ color: mode === m ? C.white : C.ink }}>{m}</Text>
          </Pressable>
        ))}
      </View>
      {mode === "Tiendas" ? (
        <>
          <TextInput
            accessibilityLabel="Buscar tienda"
            style={s.input}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar establecimiento"
            returnKeyType="search"
            onSubmitEditing={() => setQuery(search)}
          />
          <Button
            secondary
            title="Buscar tiendas"
            onPress={() => setQuery(search)}
          />
          <State
            loading={stores.isPending}
            error={stores.error}
            onRetry={() => void stores.refetch()}
            empty={
              stores.data?.pages[0].data.length === 0
                ? "No encontramos tiendas con ese nombre."
                : undefined
            }
          />
          <StoreGrid
            stores={
              stores.data?.pages
                .flatMap((p) => p.data)
                .filter((t) => t.active) ?? []
            }
          />
          {stores.hasNextPage && (
            <Button
              title="Más establecimientos"
              loading={stores.isFetchingNextPage}
              onPress={() => void stores.fetchNextPage()}
            />
          )}
        </>
      ) : mode === "Eventos" ? (
        <>
          <State
            loading={events.isPending}
            error={events.error}
            onRetry={() => void events.refetch()}
            empty={
              events.data?.filter(
                (e) => e.active && new Date(e.endsAt) > new Date(),
              ).length === 0
                ? "No hay eventos vigentes publicados."
                : undefined
            }
          />
          {events.data
            ?.filter((e) => e.active && new Date(e.endsAt) > new Date())
            .map((e) => (
              <View key={e.id} style={s.card}>
                <Photo uri={e.imageUrl} />
                <Text style={s.text}>
                  {date(e.startsAt)} · {e.location}
                </Text>
                <Text style={s.h2}>{e.name}</Text>
                <Text style={s.text}>{e.description}</Text>
              </View>
            ))}
        </>
      ) : (
        <>
          <State
            loading={promos.isPending}
            error={promos.error}
            onRetry={() => void promos.refetch()}
            empty={
              promos.data?.filter(
                (p) => p.active && new Date(p.endsAt) > new Date(),
              ).length === 0
                ? "No hay promociones vigentes publicadas."
                : undefined
            }
          />
          {promos.data
            ?.filter((p) => p.active && new Date(p.endsAt) > new Date())
            .map((p) => (
              <View key={p.id} style={s.card}>
                <Photo uri={p.imageUrl} />
                <Text style={s.text}>
                  {p.establishmentName} · {p.discountLabel}
                </Text>
                <Text style={s.h2}>{p.name}</Text>
                <Text style={s.text}>{p.description}</Text>
                <Button
                  secondary
                  title="Consultar en la tienda"
                  onPress={() => router.push(`/store/${p.establishmentId}`)}
                />
              </View>
            ))}
        </>
      )}
    </Screen>
  );
}
