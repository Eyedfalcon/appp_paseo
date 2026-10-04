import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { api, logout, setSession, currentSession } from "../../lib/api";
import type { User } from "../../lib/types";
import { useApp } from "../../state/AppState";
import {
  Button,
  Field,
  Header,
  Icon,
  MemberOnly,
  Screen,
  s,
} from "../../components/ui";
import { C } from "../../lib/theme";
export default function Profile() {
  const { session } = useApp();
  const [name, setName] = useState(""),
    [last, setLast] = useState(""),
    [phone, setPhone] = useState(""),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const links = [
    ["receipt-outline", "Mis pedidos", "/orders"],
    ["qr-code-outline", "Mi QR personal", "/qr"],
    ["gift-outline", "Mis recompensas", "/redemptions"],
    ["card-outline", "Mi tarjeta NFC", "/cards"],
    ["notifications-outline", "Notificaciones", "/notifications"],
    ["sparkles-outline", "Conversa con Jarvis", "/jarvis"],
  ] as const;
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const user = await api<User>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: name.trim(),
          lastName: last.trim(),
          phone,
        }),
      });
      const current = currentSession();
      if (current) await setSession({ ...current, user });
      setEditing(false);
      setMessage("Tu perfil está actualizado.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Header title="Mi perfil" />
      <MemberOnly>
        <View style={[s.card, { alignItems: "center", paddingVertical: 30 }]}>
          <View
            style={{
              height: 80,
              width: 80,
              borderRadius: 40,
              backgroundColor: C.navy,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 30, color: C.gold }}>
              {session?.user.firstName[0]}
              {session?.user.lastName[0]}
            </Text>
          </View>
          <Text style={s.h2}>
            {session?.user.firstName} {session?.user.lastName}
          </Text>
          <Text style={s.text}>{session?.user.email}</Text>
          <Button
            secondary
            title={editing ? "Cancelar edición" : "Editar mi perfil"}
            onPress={() => {
              setName(session?.user.firstName || "");
              setLast(session?.user.lastName || "");
              setPhone(session?.user.phone || "");
              setEditing(!editing);
            }}
          />
        </View>
        {editing && (
          <View style={s.card}>
            <Field label="Nombre" value={name} onChangeText={setName} />
            <Field label="Apellido" value={last} onChangeText={setLast} />
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Button
              title="Guardar cambios"
              loading={busy}
              disabled={!name.trim() || !last.trim()}
              onPress={() => void save()}
            />
          </View>
        )}
        {!!message && (
          <Text accessibilityRole="alert" style={s.text}>
            {message}
          </Text>
        )}
        <View style={s.card}>
          {links.map(([icon, title, path]) => (
            <Pressable
              key={path}
              accessibilityRole="button"
              onPress={() => router.push(path)}
              style={({ pressed }) => [
                s.between,
                { minHeight: 58, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <View style={s.row}>
                <Icon name={icon} />
                <Text style={{ fontSize: 16, color: C.ink }}>{title}</Text>
              </View>
              <Icon name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      </MemberOnly>
      {session && (
        <Button secondary title="Cerrar sesión" onPress={() => void logout()} />
      )}
      <Text style={[s.text, { textAlign: "center", fontSize: 12 }]}>
        Paseo Aranjuez · Cochabamba, Bolivia
      </Text>
    </Screen>
  );
}
