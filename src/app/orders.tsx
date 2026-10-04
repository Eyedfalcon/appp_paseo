import { Text, View } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, post } from "../lib/api";
import { useApp } from "../state/AppState";
import type { Order, Page } from "../lib/types";
import { date, money, orderState } from "../lib/format";
import { Button, Header, MemberOnly, Screen, State, s } from "../components/ui";
export default function Orders() {
  const { session } = useApp(),
    client = useQueryClient();
  const q = useQuery({
    queryKey: ["orders", session?.user.id],
    queryFn: () => api<Page<Order>>("/orders?size=100"),
    enabled: !!session,
    refetchInterval: 30000,
  });
  const arrived = useMutation({
    mutationFn: (id: string) => post(`/orders/${id}/customer-arrived`, {}),
    onSuccess: () => client.invalidateQueries({ queryKey: ["orders"] }),
  });
  return (
    <Screen>
      <Header title="Mis pedidos" back />
      <MemberOnly>
        <Text style={s.title}>Te espera en el Paseo.</Text>
        <State
          loading={q.isPending}
          error={q.error || arrived.error}
          onRetry={() => void q.refetch()}
          empty={
            q.data?.data.length === 0 ? "Aún no tienes pedidos." : undefined
          }
        />
        {q.data?.data.map((o) => (
          <View key={o.id} style={s.card}>
            <Text style={s.h2}>{o.establishmentName}</Text>
            <Text style={s.text}>
              {o.orderNumber} · {date(o.createdAt)}
            </Text>
            <Text style={s.price}>{orderState(o.orderStatus)}</Text>
            {o.items.map((l) => (
              <Text key={l.productId} style={s.text}>
                {l.quantity} × {l.productName}
              </Text>
            ))}
            <Text style={s.price}>{money(o.totalCentavos)}</Text>
            <Text style={s.text}>
              Pago:{" "}
              {o.paymentStatus === "PAID"
                ? "confirmado"
                : o.paymentStatus === "PENDING"
                  ? "pendiente de confirmar"
                  : o.paymentStatus}
            </Text>
            {["READY_FOR_PICKUP", "CUSTOMER_ARRIVED"].includes(
              o.orderStatus,
            ) && (
              <View style={{ gap: 12 }}>
                <Text style={s.text}>
                  Muestra estos datos solo al personal al recoger tu pedido.
                </Text>
                <Text selectable style={s.h2}>
                  {o.pickupCode} · PIN {o.pickupPin}
                </Text>
                {o.orderStatus === "READY_FOR_PICKUP" && (
                  <Button
                    title="Ya llegué a la tienda"
                    loading={arrived.isPending}
                    onPress={() => arrived.mutate(o.id)}
                  />
                )}
              </View>
            )}
          </View>
        ))}
        {q.data && q.data.pagination.totalPages > 1 && (
          <Text style={s.text}>Se muestran tus 100 pedidos más recientes.</Text>
        )}
      </MemberOnly>
    </Screen>
  );
}
