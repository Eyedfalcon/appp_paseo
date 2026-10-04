# Paseo Aranjuez · Android e iPhone

App de clientes para Android e iOS, desarrollada con un único código. React Native, Expo SDK 57, TypeScript y Expo Router. Usa las cuentas y la API del backend existente; no contiene un catálogo ni saldos de demostración.

## Qué incluye

- **PaseoYa:** catálogo con búsqueda y categorías, ficha de producto, existencias, bolsa de una tienda, pedido para retiro, historial de pedidos, código/PIN de recogida y aviso de llegada.
- **Puntos:** saldo y nivel, regla vigente, movimientos, QR personal, recompensas, canjes y solicitud de punto por visita. Diseño inspirado en las referencias: saldo protagonista, acciones rápidas y tarjetas sobre azul marino con acentos champán.
- **Descubrir:** directorio con tarjetas compactas en dos columnas (tres en pantallas amplias), ficha de tiendas, productos por comercio, eventos y promociones vigentes.
- **Mi perfil:** acceso, registro, recuperación mediante el backend, edición de datos, notificaciones, tarjetas NFC vinculadas y reporte de pérdida.
- **Jarvis:** conversación con el backend, historial compartido y lectura opcional con la voz del teléfono.

Los paneles de administración y comercios continúan en la web. La app está enfocada en el cliente que compra y recibe puntos.

## Backend público

La app usa `https://apiaranjuez.softcraftbol.com/api/v1`, configurado en `.env`, `.env.example` y los perfiles de EAS. No necesita que el backend del Mac esté encendido. Las cuentas deben existir en ese servidor; las sesiones de la base local pueden requerir cerrar sesión y volver a entrar. La versión Development Build necesita Metro. La versión Release instalada en el iPhone 16 Pro Max incluye la interfaz y funciona sin el Mac, con internet.

## Probar ahora

Requiere Node 22.13 o superior y el backend levantado.

```sh
cp .env.example .env
npm ci
npm run web -- --port 5183
```

Abre `http://localhost:5183`. La vista web de desarrollo usa un proxy local hacia `localhost:8080`; permite revisar la interfaz sin modificar el CORS del backend. La sesión de esta vista se conserva solo en memoria. El proxy no se incluye en el APK.

### En un teléfono con la app de desarrollo

1. Instala la compilación nativa de desarrollo: `npm run android` o `npm run ios`. NFC requiere esta compilación; no funciona en Expo Go.
2. Conecta el teléfono y la computadora al mismo Wi-Fi.
3. Copia `.env.example` a `.env`.
4. Cambia `EXPO_PUBLIC_API_URL` por `http://IP-DE-LA-COMPUTADORA:8080/api/v1`. `localhost` en el teléfono apunta al propio teléfono.
5. Ejecuta `npm start -- --dev-client` y abre la app instalada.
6. Entra con la misma cuenta de cliente que usas en la web.

Para el emulador Android, la dirección predeterminada de desarrollo es `http://10.0.2.2:8080/api/v1`. La API debe ser accesible desde el dispositivo. Si se cambia `.env`, reinicia Expo.

La cámara pide permiso al abrir el escáner; también puedes pegar un código. No se solicita acceso al micrófono: esta versión lee las respuestas de Jarvis, pero no incorpora conversación de voz continua.

## Crear un APK instalable

Ya están preparados el identificador `com.softcraft.paseoaranjuez`, el icono y los perfiles de compilación en `eas.json`.

1. Despliega el backend con HTTPS.
2. Inicia sesión en Expo: `npx eas-cli@latest login`.
3. Vincula el proyecto: `npx eas-cli@latest init`.
4. En el entorno **preview** de EAS, configura `EXPO_PUBLIC_API_URL=https://TU-BACKEND/api/v1` y, cuando exista, `EXPO_PUBLIC_WEB_URL=https://TU-WEB`.
5. Ejecuta `npm run build:apk`. El perfil preview produce un APK para instalación interna.
6. Descarga el APK que devuelva EAS e instálalo en el dispositivo de pruebas.

Para Google Play, configura las mismas variables en el entorno **production** y ejecuta `npm run build:production`: produce un AAB. La publicación, la cuenta de Play Console, la firma y la ficha de privacidad requieren configuración del propietario. No se ha publicado la app ni creado una ficha de tienda.

La compilación en EAS falla con un mensaje claro si falta la URL HTTPS del backend. Las variables `EXPO_PUBLIC_*` son públicas: nunca pongas claves de OpenAI, ElevenLabs, JWT ni credenciales de base de datos aquí.

Alternativa local: instala Android Studio/SDK y Java 21, configura el emulador o un teléfono con depuración USB y ejecuta `npm run android`. Expo genera el proyecto nativo mediante prebuild. No edites a mano `android/` dentro de este proyecto; cambia `app.json`, `app.config.js` o los plugins.

## Compras y puntos

- Confirmar una bolsa **crea el pedido**. No realiza un cobro con tarjeta ni acredita puntos por sí solo.
- El comercio confirma el pago desde el panel web. El backend calcula y acredita los puntos con la regla vigente.
- El precio y las existencias se validan en el servidor. La bolsa es temporal y admite una tienda por pedido; se conserva al pasar de invitado a cliente y se vacía al cerrar sesión o cambiar de usuario.
- Ante un resultado incierto al enviar un pedido, la app bloquea un segundo envío y pide revisar Mis pedidos. El endpoint de pedidos del backend todavía no ofrece claves de idempotencia; no debe repetirse una operación incierta sin comprobarla.
- Canjear una recompensa requiere confirmación y descuenta puntos en el servidor. El código se muestra en Mis recompensas para presentarlo al personal.
- La visita genera una solicitud; el personal confirma la presencia. El backend aplica el límite de **1 punto por día y cuenta**, compartido entre QR y NFC, según la hora de Bolivia.

## NFC y enlaces de visita

La app muestra las tarjetas ya vinculadas en el backend y permite reportar su pérdida. La emisión y vinculación siguen en el panel de administración.

El escáner admite los QR de compra y los enlaces de visita del dominio configurado en `EXPO_PUBLIC_WEB_URL`. También está preparada la ruta `paseoaranjuez://visita/TOKEN` para una app instalada. Escanear o abrir el enlace no acredita puntos automáticamente: el cliente genera una solicitud que confirma el personal.

El botón **Leer NFC**, en Puntos → Ganar, lee registros NDEF de texto y URL en Android e iPhone compatibles. Reconoce etiquetas de visita y registros personales `PASEO-NFC:`. Leer una tarjeta personal no confirma su vinculación ni acredita puntos. La lectura se cancela al salir de la pantalla o pasar la app al fondo. NFC Tools sigue siendo la herramienta para grabar etiquetas. Para que los enlaces HTTPS de las etiquetas abran directamente la app hay que configurar Android App Links y `assetlinks.json`, y Universal Links/AASA en iOS cuando se conozcan el dominio y la firma definitiva. Mientras tanto, esos enlaces abren la web o pueden escanearse dentro de la app.

## iPhone y Xcode

Consulta [Instalar y probar NFC en iPhone](docs/IOS-NFC.md). El proyecto se genera con `npm run prebuild:ios`; abre `ios/PaseoAranjuez.xcworkspace`. Para la cuenta gratuita, `.env` usa `IOS_NFC_ENABLED=false`: se instala con QR y sin solicitar la capacidad NFC. Con un equipo de pago, cambia a `true`, regenera iOS y reinstala para probar NFC. El simulador no lee etiquetas.

`react-native-nfc-manager` está fijado en `4.0.0-beta.10` para la nueva arquitectura de React Native. Requiere validación física antes de publicar. El parche de `expo-constants` en `patches/` corrige dos rutas sin comillas para compilar en carpetas con espacios; se aplica automáticamente al instalar dependencias. `plugins/withIosPaths.js` corrige también la ruta del paso de empaquetado generado por Expo.

## Servicios existentes

Jarvis utiliza la configuración que tenga el backend. La lectura actual usa la voz instalada en el teléfono; no activa ElevenLabs ni OpenAI. Los correos de recuperación dependen del proveedor configurado en el backend. Las notificaciones se consultan al abrir la pantalla; no hay notificaciones push del sistema en esta versión.

## Validación

```sh
npm run typecheck
npm run lint
npm test
npm run export:android
npx expo-doctor
```

- TypeScript y ESLint correctos.
- **18 pruebas aprobadas** de interfaz, enlaces y contratos de API en navegador móvil: bolsa, acceso, puntos, QR, notificaciones, confirmación de canje, bloqueo de pedidos inciertos y tamaños de 360/390/768 px.
- Pruebas de precios y validación de enlaces de visita.
- Catálogo real comprobado contra el backend local; las pruebas que simulan compras y canjes interceptan la API y **no escriben datos de pruebas en PostgreSQL**.
- Bundles Android e iOS generados. Compilación nativa iOS Debug para dispositivo completada con Xcode 27, sin firma (`CODE_SIGNING_ALLOWED=NO`). Prebuild Android completado. Expo Doctor: 20/21 comprobaciones; React Native Directory todavía marca NFC como no probado en la nueva arquitectura. Se conserva el aviso y se utiliza la versión 4 beta del módulo.
- Pendiente: validación física de los flujos iOS, APK firmado y pruebas físicas de cámara, voz, NFC, teclado, almacenamiento seguro y recogida en Android. No hay SDK Android local ni sesión de EAS disponible en este equipo.
- `npm audit` detecta avisos en dependencias transitivas del SDK/herramientas. No se forzó una bajada de Expo/React Native para ocultarlos. Revisar actualizaciones compatibles antes de publicar en producción.

## Estructura

```text
src/app/(tabs)/     PaseoYa, Puntos, Descubrir y Perfil
src/app/           Acceso, bolsa, pedidos, recompensas, QR, visita y Jarvis
src/components/    Controles compartidos y tarjetas de producto
src/lib/           API, contratos, formato y colores
src/state/         Sesión, caché y bolsa
assets/brand/      Logo e imagen de Jarvis
tests/            Pruebas aisladas de interfaz y enlaces
```

Los secretos de sesión se guardan con SecureStore en Android e iOS. La caché privada se limpia al cambiar de cuenta. No se modifica el frontend web ni se crean tablas nuevas para esta app.
