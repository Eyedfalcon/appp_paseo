import { Text, View } from "react-native";
import { router } from "expo-router";
import { Header, Button, Screen, s } from "../components/ui";
export default function Benefits() {
  return (
    <Screen>
      <Header title="Paseo Points" back />
      <Text style={s.title}>Compra. Suma. Disfruta.</Text>
      {[
        [
          "Identifícate",
          "Usa tu QR personal o tu tarjeta NFC vinculada a la misma cuenta.",
        ],
        [
          "Tus compras suman",
          "Los pedidos de PaseoYa generan puntos al confirmarse el pago en el comercio, según la regla vigente. Crear un pedido no acredita puntos. También puedes escanear el QR de una compra emitido por el comercio.",
        ],
        [
          "Una visita, un punto",
          "En los lugares habilitados, el personal confirma tu visita. Recibes como máximo 1 punto al día por cuenta entre QR, NFC y etiqueta de entrada. El día cambia a medianoche en Bolivia.",
        ],
        [
          "Elige tu recompensa",
          "Consulta los canjes disponibles y sus puntos requeridos. Al confirmar un canje se descuenta el saldo y recibes un código para presentar en el comercio.",
        ],
      ].map(([title, body]) => (
        <View style={s.card} key={title}>
          <Text style={s.h2}>{title}</Text>
          <Text style={s.text}>{body}</Text>
        </View>
      ))}
      <Button title="Ver recompensas" onPress={() => router.push("/rewards")} />
    </Screen>
  );
}
