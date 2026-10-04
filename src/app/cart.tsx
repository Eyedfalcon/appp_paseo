import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { Order } from "../lib/types";
import { money } from "../lib/format";
import { useApp } from "../state/AppState";
import {
  Button,
  Header,
  IconButton,
  MemberOnly,
  Photo,
  Screen,
  s,
} from "../components/ui";
export default function Cart() {
  const { cart, setCart, session, uncertain, setUncertain } = useApp(),
    client = useQueryClient();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function checkout() {
    if (lock.current || uncertain || !session || !cart.length) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          establishmentId: cart[0].product.establishmentId,
          items: cart.map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
          buyerName: `${session.user.firstName} ${session.user.lastName}`,
          buyerEmail: session.user.email,
          buyerPhone: session.user.phone,
        }),
      });
      setCart([]);
      void client.invalidateQueries({ queryKey: ["orders"] });
      void client.invalidateQueries({ queryKey: ["products"] });
      router.replace({ pathname: "/orders", params: { selected: order.id } });
    } catch (e) {
      if (!(e instanceof ApiError) || e.status === 0 || e.status >= 500)
        setUncertain(true);
      setError((e as Error).message);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <Screen>
      <Header title="Mi bolsa" back />
      <Text style={s.title}>Un buen hallazgo.</Text>
      {cart.length === 0 ? (
        <View style={s.card}>
          <Text style={s.text}>
            Tu bolsa está vacía. Descubre algo que te guste en PaseoYa.
          </Text>
          <Button
            title="Explorar productos"
            onPress={() => router.replace("/")}
          />
        </View>
      ) : (
        <>
          <Text style={s.text}>
            {cart[0].product.establishmentName} · Retiro en tienda
          </Text>
          {cart.map((l) => (
            <View key={l.product.id} style={s.card}>
              <View style={s.row}>
                <Photo
                  uri={l.product.imageUrl}
                  style={{ width: 88, height: 88 }}
                />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={s.h2}>{l.product.name}</Text>
                  <Text style={s.price}>
                    {money(l.product.priceCentavos * l.quantity)}
                  </Text>
                </View>
              </View>
              <View style={s.between}>
                <IconButton
                  name="remove"
                  label={`Quitar una unidad de ${l.product.name}`}
                  onPress={() => {
                    if (!busy && !uncertain)
                      setCart((prev) =>
                        prev
                          .map((x) =>
                            x.product.id === l.product.id
                              ? { ...x, quantity: x.quantity - 1 }
                              : x,
                          )
                          .filter((x) => x.quantity > 0),
                      );
                  }}
                />
                <Text style={s.text}>{l.quantity} unidades</Text>
                <IconButton
                  name="add"
                  label={`Añadir una unidad de ${l.product.name}`}
                  onPress={() => {
                    if (!busy && !uncertain)
                      setCart((prev) =>
                        prev.map((x) =>
                          x.product.id === l.product.id
                            ? {
                                ...x,
                                quantity: Math.min(
                                  x.product.stock,
                                  x.quantity + 1,
                                ),
                              }
                            : x,
                        ),
                      );
                  }}
                />
              </View>
            </View>
          ))}
          <View style={s.between}>
            <Text style={s.h2}>Total estimado</Text>
            <Text style={s.price}>
              {money(
                cart.reduce(
                  (n, l) => n + l.product.priceCentavos * l.quantity,
                  0,
                ),
              )}
            </Text>
          </View>
          <Text style={s.text}>
            El servidor confirma precio y existencias al enviar. El pago se
            coordina con la tienda; este paso crea el pedido. Los puntos se
            acreditan cuando el comercio confirma el pago.
          </Text>
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          {uncertain ? (
            <View style={s.card}>
              <Text style={s.text}>
                No sabemos si el pedido llegó a guardarse. Revisa Mis pedidos
                antes de volver a comprar para evitar duplicados.
              </Text>
              <Button
                title="Revisar mis pedidos"
                onPress={() => router.push("/orders")}
              />
              <Button
                secondary
                title="Ya revisé: vaciar esta bolsa"
                onPress={() => {
                  setCart([]);
                  setUncertain(false);
                }}
              />
            </View>
          ) : (
            <MemberOnly>
              <Button
                title="Confirmar pedido para recoger"
                loading={busy}
                onPress={() => void checkout()}
              />
            </MemberOnly>
          )}
        </>
      )}
    </Screen>
  );
}
