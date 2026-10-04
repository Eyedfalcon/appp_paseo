import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Photo, s } from "./ui";
import { C } from "../lib/theme";
import { money } from "../lib/format";
import type { Product } from "../lib/types";
export function ProductCard({ product }: { product: Product }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${money(product.priceCentavos)}`}
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => ({
        flex: 1,
        padding: 8,
        borderRadius: 22,
        backgroundColor: C.white,
        opacity: pressed ? 0.8 : 1,
        gap: 8,
      })}
    >
      <Photo uri={product.imageUrl} style={{ height: 160 }} />
      <View style={{ padding: 6, gap: 6 }}>
        <Text
          style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}
          numberOfLines={1}
        >
          {product.establishmentName?.toUpperCase()}
        </Text>
        <Text
          style={{ color: C.ink, fontSize: 15, fontWeight: "500" }}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        <Text style={s.price}>{money(product.priceCentavos)}</Text>
        <Text style={{ fontSize: 12, color: C.muted }}>
          {product.stock > 0 ? "Recoge en el Paseo" : "Sin existencias"}
        </Text>
      </View>
    </Pressable>
  );
}
