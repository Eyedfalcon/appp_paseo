import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { post, setSession } from "../lib/api";
import type { Session } from "../lib/types";
import { Button, Field, Header, Screen, s } from "../components/ui";
import { C } from "../lib/theme";
export default function Login() {
  const [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [forgot, setForgot] = useState(false);
  async function submit() {
    if (busy) return;
    setError("");
    if (!email.trim() || (!forgot && !password)) {
      setError("Completa tu correo y contraseña.");
      return;
    }
    setBusy(true);
    try {
      if (forgot) {
        await post("/auth/forgot-password", { email: email.trim() });
        setError(
          "Si el correo está registrado, recibirás instrucciones cuando el servicio de correo esté habilitado.",
        );
        return;
      }
      const names = name.trim().split(/\s+/);
      if (register && (names.length < 2 || password.length < 12))
        throw Error(
          "Escribe nombre y apellido y una contraseña de al menos 12 caracteres.",
        );
      const session = await post<Session>(
        register ? "/auth/register" : "/auth/login",
        register
          ? {
              email: email.trim(),
              password,
              firstName: names[0],
              lastName: names.slice(1).join(" "),
              phone,
            }
          : { email: email.trim(), password },
      );
      await setSession(session);
      if (router.canGoBack()) router.back();
      else router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <Header title="Mi Paseo" back />
        <Image
          source={require("../../assets/brand/paseo-emblema.png")}
          style={{
            width: 170,
            height: 90,
            alignSelf: "center",
            tintColor: C.navy,
          }}
          resizeMode="contain"
        />
        <Text style={s.title}>
          {forgot
            ? "Recupera tu cuenta"
            : register
              ? "Tu Paseo empieza aquí."
              : "Qué bueno verte."}
        </Text>
        <Text style={s.text}>
          La misma cuenta, tus compras y todos tus puntos.
        </Text>
        {register && !forgot && (
          <>
            <Field
              label="Nombre y apellido"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}
        <Field
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        {!forgot && (
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={register ? "new-password" : "current-password"}
          />
        )}
        <View style={{ gap: 12 }}>
          {!!error && (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          )}
          <Button
            title={
              forgot
                ? "Enviar instrucciones"
                : register
                  ? "Crear mi cuenta"
                  : "Iniciar sesión"
            }
            loading={busy}
            onPress={() => void submit()}
          />
          <Button
            secondary
            title={
              forgot
                ? "Volver a iniciar sesión"
                : register
                  ? "Ya tengo una cuenta"
                  : "Crear una cuenta"
            }
            onPress={() => {
              setRegister(forgot ? false : !register);
              setForgot(false);
              setError("");
            }}
          />
          {!forgot && !register && (
            <Button
              secondary
              title="Olvidé mi contraseña"
              onPress={() => setForgot(true)}
            />
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}
