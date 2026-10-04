import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Product } from "../../lib/types";
import { money } from "../../lib/format";
import { useApp } from "../../state/AppState";
import { Button, Header, Photo, Screen, State, s } from "../../components/ui";
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { add } = useApp();
  const [notice, setNotice] = useState("");
  const q = useQuery({
    queryKey: ["product", id],
    queryFn: () => api<Product>(`/products/${encodeURIComponent(id)}`),
  });
  return (
    <Screen>
      <Header title="Tu próximo favorito" back />
      <State
        loading={q.isPending}
        error={q.error}
        onRetry={() => void q.refetch()}
      />
      {q.data && (
        <>
          <Photo uri={q.data.imageUrl} style={{ height: 340 }} />
          <Text style={s.text}>{q.data.establishmentName}</Text>
          <Text style={s.title}>{q.data.name}</Text>
          <Text style={s.price}>{money(q.data.priceCentavos)}</Text>
          <Text style={s.text}>{q.data.description}</Text>
          {q.data.features?.map((f) => (
            <Text key={f} style={s.text}>
              • {f}
            </Text>
          ))}
          <View style={s.card}>
            <Text style={s.h2}>Compra y recoge</Text>
            <Text style={s.text}>
              El comercio confirma tu pedido y el pago. Los puntos se registran
              cuando la compra está confirmada.
            </Text>
            <Button
              title="Añadir a mi bolsa"
              disabled={!q.data.available || q.data.stock < 1}
              onPress={() => setNotice(add(q.data!) ?? "Añadido a tu bolsa.")}
            />
            {!!notice && (
              <Text accessibilityRole="alert" style={s.text}>
                {notice}
              </Text>
            )}
            <Button
              title="Ver mi bolsa"
              secondary
              onPress={() => router.push("/cart")}
            />
          </View>
        </>
      )}
    </Screen>
  );
}
