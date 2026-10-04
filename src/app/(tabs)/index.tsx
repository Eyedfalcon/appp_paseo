import { useState } from "react";
import { FlatList, Pressable, Text, View, TextInput } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { api } from "../../lib/api";
import type { Page, Product } from "../../lib/types";
import { C } from "../../lib/theme";
import { Header, Icon, Screen, Section, State, s } from "../../components/ui";
import { ProductCard } from "../../components/ProductCard";
export default function Shop() {
  const [draft, setDraft] = useState(""),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("");
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api<{ id: string; name: string }[]>("/marketplace/categories"),
  });
  const products = useInfiniteQuery({
    queryKey: ["products", search, category],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      api<Page<Product>>(
        `/products?page=${pageParam}&size=20&search=${encodeURIComponent(search)}${category ? "&categoryId=" + encodeURIComponent(category) : ""}`,
      ),
    getNextPageParam: (last) =>
      last.pagination.page + 1 < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
  });
  const items =
    products.data?.pages.flatMap((p) => p.data).filter((p) => p.available) ??
    [];
  return (
    <Screen scroll={false}>
      <FlatList
        data={items}
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={[s.body, { gap: 16 }]}
        columnWrapperStyle={{ gap: 12 }}
        refreshing={products.isRefetching}
        onRefresh={() => void products.refetch()}
        onEndReached={() => {
          if (products.hasNextPage && !products.isFetchingNextPage)
            void products.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <Header title="PaseoYa" />
            <View style={s.between}>
              <View>
                <Text style={s.text}>Todo lo que te gusta.</Text>
                <Text style={s.title}>En un solo Paseo.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Conversar con Jarvis"
                onPress={() => router.push("/jarvis")}
                style={{ padding: 12 }}
              >
                <Icon name="sparkles" color={C.blue} />
              </Pressable>
            </View>
            <View style={[s.row, s.input]}>
              <Icon name="search-outline" />
              <TextInput
                style={{ flex: 1, fontSize: 16, color: C.ink, minHeight: 32 }}
                accessibilityLabel="Buscar productos"
                placeholder="Encuentra tu próximo favorito"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => setSearch(draft.trim())}
                returnKeyType="search"
              />
              <Pressable
                onPress={() => setSearch(draft.trim())}
                accessibilityRole="button"
                accessibilityLabel="Buscar"
                style={{ padding: 10 }}
              >
                <Icon name="arrow-forward" />
              </Pressable>
            </View>
            <LinearGradient
              colors={[C.navy, C.blue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 20, borderRadius: 24, gap: 6 }}
            >
              <Text style={{ fontSize: 24, color: C.white, fontWeight: "500" }}>
                Compras que suman.
              </Text>
              <Text
                style={{ color: C.lightText, fontSize: 14, lineHeight: 21 }}
              >
                Paseo Points cuando el comercio confirma tu compra.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/points")}
                style={{ minHeight: 48, justifyContent: "center" }}
              >
                <Text style={{ color: C.gold, fontWeight: "600" }}>
                  Descubre Paseo Points →
                </Text>
              </Pressable>
            </LinearGradient>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: "", name: "Todo" }, ...(categories.data ?? [])]}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === item.id }}
                  onPress={() => setCategory(item.id)}
                  style={[
                    s.chip,
                    category === item.id && { backgroundColor: C.navy },
                  ]}
                >
                  <Text
                    style={{ color: category === item.id ? C.white : C.ink }}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
            <Section
              title={
                search ? `Resultados para “${search}”` : "Elige algo para ti"
              }
            />
            <State
              error={products.error}
              onRetry={() => void products.refetch()}
            />
          </View>
        }
        ListEmptyComponent={
          <State
            loading={products.isPending}
            empty={
              !products.isPending && !products.error
                ? "No hay productos disponibles con estos filtros."
                : undefined
            }
          />
        }
        ListFooterComponent={
          products.isFetchingNextPage ? <State loading /> : null
        }
        renderItem={({ item }) => <ProductCard product={item} />}
      />
    </Screen>
  );
}
