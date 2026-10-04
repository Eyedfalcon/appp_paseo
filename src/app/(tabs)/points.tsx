import { Image, Pressable, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import { api } from "../../lib/api";
import type { Balance, Movement, Page, Rule, Store } from "../../lib/types";
import { C } from "../../lib/theme";
import { date, tierName } from "../../lib/format";
import { useApp } from "../../state/AppState";
import {
  Icon,
  IconButton,
  MemberOnly,
  Photo,
  Screen,
  State,
  s,
} from "../../components/ui";
export default function Points() {
  const { session } = useApp();
  const enabled = session?.user.role === "CUSTOMER";
  const balance = useQuery({
    queryKey: ["balance", session?.user.id],
    queryFn: () => api<Balance>("/points/balance"),
    enabled,
  });
  const history = useQuery({
    queryKey: ["history", session?.user.id],
    queryFn: () => api<Page<Movement>>("/points/history?size=3"),
    enabled,
  });
  const rule = useQuery({
    queryKey: ["points-rule"],
    queryFn: () => api<Rule>("/points/rules/active"),
    enabled,
  });
  const visit = useQuery({
    queryKey: ["visit-status", session?.user.id],
    queryFn: () =>
      api<{ enabled: boolean; awardedToday: boolean }>("/loyalty/visits/me"),
    enabled,
  });
  const stores = useQuery({
    queryKey: ["point-stores"],
    queryFn: () => api<Page<Store>>("/establishments?size=8"),
  });
  const { refetch: refreshBalance } = balance,
    { refetch: refreshHistory } = history,
    { refetch: refreshVisit } = visit;
  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void refreshBalance();
        void refreshHistory();
        void refreshVisit();
      }
    }, [enabled, refreshBalance, refreshHistory, refreshVisit]),
  );
  const actions = [
    { name: "add" as const, label: "Ganar", path: "/scan" as const },
    {
      name: "gift-outline" as const,
      label: "Canjear",
      path: "/rewards" as const,
    },
    {
      name: "diamond-outline" as const,
      label: "Beneficios",
      path: "/benefits" as const,
    },
    {
      name: "time-outline" as const,
      label: "Historial",
      path: "/history" as const,
    },
  ];
  return (
    <Screen dark>
      <View style={s.between}>
        <Pressable
          onPress={() => router.push("/profile")}
          accessibilityRole="button"
          accessibilityLabel="Mi perfil"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: C.card,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: C.white, fontWeight: "600" }}>
            {session?.user.firstName?.slice(0, 1) || "PA"}
          </Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: C.white }}>
          Paseo Points
        </Text>
        <IconButton
          dark
          name="qr-code-outline"
          label="Mi QR personal"
          onPress={() => router.push("/qr")}
        />
      </View>
      <MemberOnly>
        <LinearGradient
          colors={[C.blue, C.navy, C.deep]}
          style={{
            borderRadius: 32,
            paddingVertical: 34,
            paddingHorizontal: 20,
            alignItems: "center",
            gap: 14,
          }}
        >
          <Image
            source={require("../../../assets/brand/paseo-emblema.png")}
            style={{
              position: "absolute",
              width: 240,
              height: 180,
              top: 20,
              opacity: 0.07,
            }}
            resizeMode="contain"
          />
          <Text style={{ color: C.gold, fontSize: 15 }}>
            {tierName(balance.data?.tier)}
          </Text>
          <View style={[s.row, { gap: 10 }]}>
            <Icon name="sparkles" size={30} color={C.gold} />
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{
                fontSize: 76,
                fontWeight: "600",
                letterSpacing: -3,
                color: C.white,
              }}
            >
              {balance.data?.balance.toLocaleString("es-BO") ?? "—"}
            </Text>
          </View>
          <Text style={{ color: C.lightText, fontSize: 16 }}>
            Tus Paseo Points
          </Text>
          <Text
            style={{
              color: C.lightText,
              fontSize: 14,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            {rule.data
              ? `${rule.data.rate * rule.data.multiplier} ${rule.data.rate * rule.data.multiplier === 1 ? "punto" : "puntos"} por Bs 1 en compras elegibles${rule.data.bonus ? ` · bono de ${rule.data.bonus} puntos` : ""}.`
              : "Consulta cómo suman tus compras confirmadas."}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/benefits")}
            style={{
              borderRadius: 99,
              paddingHorizontal: 20,
              paddingVertical: 14,
              backgroundColor: C.card,
            }}
          >
            <Text style={{ color: C.gold, fontWeight: "600" }}>
              Cómo funcionan →
            </Text>
          </Pressable>
        </LinearGradient>
        <State
          loading={balance.isPending}
          error={balance.error}
          onRetry={() => void balance.refetch()}
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {actions.map((a) => (
            <Pressable
              accessibilityRole="button"
              key={a.label}
              accessibilityLabel={a.label}
              onPress={() => router.push(a.path)}
              style={({ pressed }) => ({
                flex: 1,
                alignItems: "center",
                gap: 10,
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: C.card,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={a.name} color={C.gold} size={26} />
              </View>
              <Text
                style={{ fontSize: 13, color: C.white, textAlign: "center" }}
              >
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/scan")}
          style={[s.card, { backgroundColor: C.card, marginTop: 10 }]}
        >
          <View style={s.between}>
            <Icon name="scan-outline" color={C.gold} size={28} />
            <Icon name="arrow-forward" color={C.lightText} />
          </View>
          <Text style={{ fontSize: 22, color: C.white, fontWeight: "500" }}>
            Cada visita cuenta.
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: C.lightText }}>
            {visit.data?.awardedToday
              ? "Tu punto de hoy ya está registrado. Vuelve mañana para sumar otra visita."
              : visit.data?.enabled
                ? "1 punto por visita al día. Escanea la etiqueta del Paseo y confirma tu presencia con el personal."
                : "Consulta con el personal la disponibilidad del punto por visita."}
          </Text>
        </Pressable>
        <View style={[s.card, { backgroundColor: C.card }]}>
          <View style={s.between}>
            <Text style={{ fontSize: 19, color: C.white }}>
              Tus movimientos
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver todos los movimientos"
              onPress={() => router.push("/history")}
              style={{ padding: 12 }}
            >
              <Icon name="arrow-forward" color={C.lightText} />
            </Pressable>
          </View>
          <State
            loading={history.isPending}
            error={history.error}
            onRetry={() => void history.refetch()}
          />
          {history.data?.data.map((m) => (
            <View key={m.id} style={[s.between, { paddingVertical: 12 }]}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: C.white, fontSize: 15 }}>
                  {m.description}
                </Text>
                <Text style={{ color: C.lightText, fontSize: 12 }}>
                  {date(m.createdAt)}
                </Text>
              </View>
              <Text style={{ color: C.gold, fontWeight: "600", fontSize: 16 }}>
                {m.points > 0 ? "+" : ""}
                {m.points}
              </Text>
            </View>
          ))}
          {history.data?.data.length === 0 && (
            <Text style={{ color: C.lightText, lineHeight: 22 }}>
              Aquí aparecerán los puntos de tus compras, visitas y canjes.
            </Text>
          )}
        </View>
      </MemberOnly>
      <View style={[s.card, { backgroundColor: C.card }]}>
        <Text style={{ fontSize: 21, color: C.white }}>
          Las marcas del Paseo
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {stores.data?.data
            .filter((t) => t.active)
            .map((t) => (
              <Pressable
                key={t.id}
                accessibilityRole="button"
                onPress={() => router.push(`/store/${t.id}`)}
                style={{ width: "28%", alignItems: "center", gap: 8 }}
              >
                <Photo
                  uri={t.logoUrl || t.coverUrl}
                  style={{ width: 62, height: 62, borderRadius: 31 }}
                />
                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 12,
                    color: C.lightText,
                    textAlign: "center",
                  }}
                >
                  {t.name}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>
      <Text style={{ fontSize: 12, color: C.lightText, textAlign: "center" }}>
        Tu saldo se comparte con Mi Paseo en la web.
      </Text>
    </Screen>
  );
}
