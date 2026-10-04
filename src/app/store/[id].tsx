import { Linking, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Page, Product, Store } from "../../lib/types";
import { Button, Header, Photo, Screen, State, s } from "../../components/ui";
import { ProductCard } from "../../components/ProductCard";
export default function StorePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useQuery({
    queryKey: ["store", id],
    queryFn: () => api<Store>(`/establishments/${encodeURIComponent(id)}`),
  });
  const products = useQuery({
    queryKey: ["store-products", id],
    queryFn: () =>
      api<Page<Product>>(
        `/products?size=100&establishmentId=${encodeURIComponent(id)}`,
      ),
  });
  return (
    <Screen>
      <Header title="Directorio del Paseo" back />
      <State
        loading={store.isPending}
        error={store.error}
        onRetry={() => void store.refetch()}
      />
      {store.data && (
        <>
          <Photo uri={store.data.coverUrl} style={{ height: 260 }} />
          <Text style={s.title}>{store.data.name}</Text>
          <Text style={s.text}>{store.data.description}</Text>
          <View style={s.card}>
            <Text style={s.h2}>{store.data.floor}</Text>
            <Text style={s.text}>
              {store.data.hoursNote ||
                "Consulta el horario con el establecimiento antes de tu visita."}
            </Text>
            {store.data.phone && (
              <Button
                secondary
                title="Llamar al establecimiento"
                onPress={() =>
                  void Linking.openURL(
                    "tel:" + store.data!.phone!.replace(/[^+0-9]/g, ""),
                  )
                }
              />
            )}{" "}
            {store.data.whatsappUrl?.startsWith("https://") && (
              <Button
                secondary
                title="Consultar por WhatsApp"
                onPress={() => void Linking.openURL(store.data!.whatsappUrl!)}
              />
            )}
          </View>
          <Text style={s.h2}>Compra en esta tienda</Text>
          <State
            loading={products.isPending}
            error={products.error}
            onRetry={() => void products.refetch()}
            empty={
              products.data?.data.length === 0
                ? "Esta tienda todavía no publicó productos en PaseoYa."
                : undefined
            }
          />
          {products.data?.data.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </>
      )}
    </Screen>
  );
}
