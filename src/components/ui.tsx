import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ImageStyle,
  type ColorValue,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { C } from "../lib/theme";
import { useApp } from "../state/AppState";
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.ivory },
  body: {
    padding: 24,
    gap: 20,
    paddingBottom: 36,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 32, fontWeight: "600", color: C.ink, letterSpacing: -1 },
  h2: { fontSize: 22, fontWeight: "600", color: C.ink },
  text: { fontSize: 15, lineHeight: 23, color: C.muted },
  card: { padding: 20, borderRadius: 24, backgroundColor: C.white, gap: 12 },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
    color: C.ink,
    fontSize: 16,
  },
  label: { fontSize: 14, fontWeight: "600", color: C.ink, marginBottom: 8 },
  image: {
    height: 180,
    width: "100%",
    borderRadius: 18,
    backgroundColor: C.line,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 99,
    backgroundColor: C.white,
  },
  hr: { height: 1, backgroundColor: C.line },
  error: { color: C.error, fontSize: 14, lineHeight: 21 },
  price: { fontSize: 19, fontWeight: "600", color: C.ink },
});
export function Icon({
  name,
  size = 22,
  color = C.ink,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color?: ColorValue;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessible={false}
      aria-hidden={true}
      importantForAccessibility="no"
    />
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  loading = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 52,
        padding: 14,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: secondary ? C.white : C.navy,
        borderWidth: secondary ? 1 : 0,
        borderColor: C.line,
        opacity: disabled || loading ? 0.5 : pressed ? 0.75 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? C.navy : C.white} />
      ) : (
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: secondary ? C.ink : C.white,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  dark = false,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: dark ? C.card : C.white,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} color={dark ? C.white : C.ink} />
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.muted}
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}
export function Screen({
  children,
  dark = false,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  dark?: boolean;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const path = usePathname();
  const tab = ["/", "/points", "/profile", "/discover"].includes(path);
  return (
    <SafeAreaView
      edges={
        tab ? ["top", "left", "right"] : ["top", "bottom", "left", "right"]
      }
      style={[s.page, dark && { backgroundColor: C.deep }, style]}
    >
      <StatusBar style={dark ? "light" : "dark"} />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.body}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
export function Header({
  title,
  back = false,
}: {
  title: string;
  back?: boolean;
}) {
  const { cart } = useApp();
  return (
    <View style={s.between}>
      {back ? (
        <IconButton
          name="arrow-back"
          label="Volver"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
      ) : (
        <Image
          source={require("../../assets/brand/paseo-emblema.png")}
          style={{ width: 92, height: 46, tintColor: C.navy }}
          resizeMode="contain"
          accessibilityLabel="Paseo Aranjuez"
        />
      )}
      <Text style={{ fontSize: 16, fontWeight: "600", color: C.ink }}>
        {title}
      </Text>
      <IconButton
        name="bag-outline"
        label={`Bolsa, ${cart.reduce((n, l) => n + l.quantity, 0)} productos`}
        onPress={() => router.push("/cart")}
      />
    </View>
  );
}
export function State({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: unknown;
  empty?: string;
  onRetry?: () => void;
}) {
  if (loading)
    return (
      <View style={s.card}>
        <ActivityIndicator color={C.navy} />
        <Text style={s.text}>Cargando…</Text>
      </View>
    );
  if (error)
    return (
      <View style={s.card}>
        <Text accessibilityRole="alert" style={s.error}>
          {error instanceof Error
            ? error.message
            : "No pudimos cargar la información."}
        </Text>
        {onRetry && (
          <Button title="Volver a intentar" secondary onPress={onRetry} />
        )}
      </View>
    );
  return empty ? (
    <View style={s.card}>
      <Text style={s.text}>{empty}</Text>
    </View>
  ) : null;
}
export function MemberOnly({ children }: { children: React.ReactNode }) {
  const { session, ready } = useApp();
  if (!ready) return <State loading />;
  if (!session)
    return (
      <View style={s.card}>
        <Icon name="person-circle-outline" size={38} />
        <Text style={s.h2}>Tu Paseo, más personal</Text>
        <Text style={s.text}>
          Entra con tu cuenta de la web para ver tus puntos, pedidos y
          beneficios.
        </Text>
        <Button title="Iniciar sesión" onPress={() => router.push("/login")} />
      </View>
    );
  if (session.user.role !== "CUSTOMER")
    return (
      <View style={s.card}>
        <Text style={s.h2}>Esta app es para clientes</Text>
        <Text style={s.text}>
          Usa una cuenta de cliente para comprar y recibir puntos. Los paneles
          de administración y comercios siguen en la web.
        </Text>
        <Button title="Cambiar cuenta" onPress={() => router.push("/login")} />
      </View>
    );
  return <>{children}</>;
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.between}>
      <Text style={[s.h2, { flex: 1 }]}>{title}</Text>
      {action && onPress && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ minHeight: 48, justifyContent: "center" }}
        >
          <Text style={{ color: C.muted, fontSize: 14 }}>{action} →</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Photo({
  uri,
  style,
}: {
  uri?: string | null;
  style?: ImageStyle;
}) {
  const [failed, setFailed] = React.useState(false);
  return uri && !failed ? (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={[s.image, style]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        s.image,
        { alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Icon name="image-outline" size={36} color={C.muted} />
    </View>
  );
}
