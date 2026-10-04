import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import type { Store } from "../lib/types";
import { C } from "../lib/theme";
import { Icon, Photo } from "./ui";

export function StoreGrid({ stores }: { stores: Store[] }) {
  const { width, fontScale } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(
    Math.min(width, 760) - 48,
  );
  const columns =
    fontScale >= 1.4 || availableWidth < 280
      ? 1
      : availableWidth >= 620
        ? 3
        : 2;
  const cardWidth = Math.floor((availableWidth - (columns - 1) * 12) / columns);
  return (
    <View
      style={styles.grid}
      onLayout={({ nativeEvent }) =>
        setAvailableWidth(nativeEvent.layout.width)
      }
    >
      {stores.map((store) => {
        const category = store.directoryCategory || store.categoryName;
        return (
          <Pressable
            key={store.id}
            testID={`store-card-${store.id}`}
            accessibilityRole="button"
            accessibilityLabel={[store.name, category, store.floor]
              .filter(Boolean)
              .join(", ")}
            accessibilityHint="Abre la información y los productos de esta tienda"
            onPress={() => router.push(`/store/${store.id}`)}
            style={({ pressed }) => [
              styles.card,
              { width: cardWidth, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Photo
              uri={store.coverUrl}
              style={{
                height: Math.min(150, cardWidth * 0.64),
                borderRadius: 0,
              }}
            />
            <View style={styles.details}>
              <Text style={styles.name}>{store.name}</Text>
              {!!category && <Text style={styles.category}>{category}</Text>}
              {!!store.floor && (
                <View style={styles.location}>
                  <Icon name="location-outline" size={14} color={C.muted} />
                  <Text style={styles.floor}>{store.floor}</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { borderRadius: 16, overflow: "hidden", backgroundColor: C.white },
  details: { padding: 12, gap: 6, flex: 1 },
  name: { fontSize: 16, lineHeight: 21, fontWeight: "600", color: C.ink },
  category: { fontSize: 13, lineHeight: 18, color: C.muted },
  location: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 4,
  },
  floor: { fontSize: 13, lineHeight: 18, color: C.muted, flexShrink: 1 },
});
