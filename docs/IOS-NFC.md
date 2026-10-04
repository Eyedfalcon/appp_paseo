# Paseo para iPhone: instalación y NFC

La misma app sirve para Android e iPhone. Ejecuta los comandos desde la raíz de este repositorio. Antes de abrir Xcode, ejecuta `cp .env.example .env`, `npm ci` y `npm run prebuild:ios` para generar el workspace.

**Configuración actual: cuenta gratuita, QR habilitado y lector NFC desactivado en iOS.** Ve al apartado «Probar con una cuenta gratuita». Los pasos de capacidad NFC corresponden a la futura versión firmada con un equipo de pago.

## 1. Preparar Xcode y la firma

1. Conecta un iPhone al Mac por cable, desbloquéalo y acepta **Confiar**.
2. En Xcode → Settings → Accounts, comprueba tu cuenta de Apple Developer.
3. Abre `ios/PaseoAranjuez.xcworkspace` desde esta carpeta. Usa el workspace, que incluye las dependencias instaladas.
4. Selecciona el proyecto **PaseoAranjuez**, el target del mismo nombre y **Signing & Capabilities**.
5. Activa **Automatically manage signing** y elige tu equipo en **Team**. El identificador previsto es `com.softcraft.paseoaranjuez`; debe estar disponible en tu equipo.
6. Si Xcode indica que falta un certificado, créalo desde Settings → Accounts → tu equipo → Manage Certificates → Apple Development. Deja que Xcode genere el perfil de desarrollo para tu iPhone.
7. Comprueba la capacidad **Near Field Communication Tag Reading**. El plugin ya genera el permiso de lectura NFC y el entitlement `TAG`.
8. Selecciona tu iPhone como destino. Activa **Modo de desarrollador** en Ajustes → Privacidad y seguridad del teléfono si lo solicita.

Puedes guardar el Team ID en `APPLE_TEAM_ID` dentro de `.env` antes de ejecutar `npm run prebuild:ios`, para que la selección sobreviva a una regeneración. No es la contraseña de Apple. Los certificados y claves de firma permanecen fuera del repositorio.

Si Xcode solo muestra **Personal Team**, la cuenta está conectada, pero el equipo de una membresía activa del Apple Developer Program todavía no está disponible. Ese equipo personal no permite firmar la capacidad NFC. Comprueba que has iniciado sesión con la cuenta de la membresía y que esta aparece activa en Apple Developer. [Capacidades según la membresía](https://developer.apple.com/help/account/reference/supported-capabilities-ios/).

## 2. Conectar con el backend

Para pruebas, conecta Mac e iPhone al mismo Wi-Fi. Crea `.env` a partir de `.env.example` y configura:

```dotenv
EXPO_PUBLIC_API_URL=http://IP-DEL-MAC:8080/api/v1
EXPO_PUBLIC_WEB_URL=https://DOMINIO-PUBLICO-DE-PASEO
APPLE_TEAM_ID=TU_TEAM_ID
```

Sustituye los valores; deja vacíos dominio y Team ID si aún no los vas a configurar. En un teléfono físico, `localhost` y `10.0.2.2` no apuntan al Mac. El backend debe aceptar conexiones de la red local. Permite a la app acceder a la red local cuando iOS lo solicite.

Ejecuta `npm start -- --dev-client`, pulsa Run en Xcode y abre el servidor de desarrollo desde la app. También puedes usar `npm run ios` para compilar e instalar eligiendo el dispositivo. Tras cambiar variables, reinicia el servidor.

Para distribución, utiliza la API pública HTTPS y configura las variables en EAS. `npm run build:ios` prepara una compilación de producción; la publicación y TestFlight requieren la configuración y firma de tu equipo. Nunca pongas claves del backend en variables `EXPO_PUBLIC_*`.

## 3. Probar una etiqueta de visita

1. En el panel web de administrador, prepara un punto de visita y copia su enlace vigente.
2. En NFC Tools: **Escribir → Añadir un registro → URL/URI**. Pega ese enlace, guarda y pulsa **Escribir**. Acerca tu NTAG215 y espera la confirmación.
3. En NFC Tools → **Leer**, verifica que el enlace completo coincide.
4. En Paseo, inicia sesión como cliente y entra en **Puntos → Ganar → Leer NFC**.
5. Acerca la parte superior del iPhone a la etiqueta y mantenla quieta hasta que cierre el lector.
6. La app abre la visita. Solicita el punto y presenta el código al personal para que confirme tu presencia.
7. Comprueba el movimiento en Puntos. El backend aplica **1 punto por visita al día por cuenta**, compartido entre QR y NFC. Abrir o leer la etiqueta por sí solo no suma puntos.

La app acepta enlaces `/visita/TOKEN` del origen configurado en `EXPO_PUBLIC_WEB_URL`. Sin dominio público, puedes grabar `paseoaranjuez://visita/TOKEN` para la lectura desde el botón NFC de la app instalada, usando el token real del enlace del administrador. No inventes ni cambies el token.

## 4. Probar la tarjeta personal

Mantén en la tarjeta el registro de Texto completo `PASEO-NFC:…` generado por el administrador. En NFC Tools se graba como **Texto**, sin incluir `Texto:`, idioma, valor bruto ni bytes hexadecimales.

El lector de la app reconoce ese tipo de registro y explica su uso en caja. No muestra datos de otra persona, no vincula cuentas ni acredita puntos. La verificación y vinculación de la tarjeta continúan en el panel administrativo. El cliente consulta sus propias tarjetas en Mi perfil.

Una tarjeta personal y una etiqueta fija de visita tienen funciones distintas. Para probar la visita utiliza otra etiqueta y evita sobrescribir una tarjeta personal ya entregada.

## 5. Acercar el iPhone y abrir Paseo sin entrar primero a la app

El lector integrado ya está preparado. La apertura desde una etiqueta fuera de la app queda pendiente del dominio definitivo:

1. Grabar un único registro URL HTTPS con el enlace público de visita.
2. Configurar `ios.associatedDomains` con `applinks:TU-DOMINIO` en la configuración Expo.
3. Publicar el archivo `/.well-known/apple-app-site-association` en ese dominio, con el App ID de tu equipo (`TEAM_ID.com.softcraft.paseoaranjuez`) y las rutas `/visita/*`.
4. Regenerar e instalar una compilación firmada con esa capacidad y probar el enlace en el iPhone.

En iPhone compatible, iOS puede mostrar una notificación al detectar la etiqueta; al tocarla abre el enlace y, con Universal Links configurado, la app instalada. Depende del estado del dispositivo. El registro de texto `PASEO-NFC:…` no es un enlace para este flujo.

## Alcance y validación

- Requiere iPhone compatible con Core NFC e iOS 16.4 o posterior para esta versión de Expo. NFC no funciona en el simulador ni en Expo Go.
- La app lee NDEF; NFC Tools sigue grabando las etiquetas. No convierte al iPhone en una tarjeta NFC ni añade pases a Apple Wallet.
- El lector cancela la sesión al salir, permite cancelar manualmente y rechaza enlaces de otros dominios y etiquetas ambiguas.
- La dependencia NFC está fijada en `4.0.0-beta.10`, compatible con la nueva arquitectura usada por el proyecto; validar con tus NTAG215 antes de publicar.
- Las pruebas automatizadas validan registros, enlaces y flujos con API interceptada. No reemplazan la prueba física de lectura, firma e instalación.

Referencias: [Core NFC de Apple](https://developer.apple.com/documentation/corenfc), [Universal Links en Expo](https://docs.expo.dev/linking/ios-universal-links/), [compilación local con Expo](https://docs.expo.dev/guides/local-app-development/).

## Probar con una cuenta gratuita

La configuración local ahora tiene `IOS_NFC_ENABLED=false`. Se elimina la capacidad NFC del proyecto iOS y el escáner ofrece QR. Android conserva su lector NFC. PaseoYa, perfil, saldo, compras y puntos siguen conectados al mismo backend.

1. En el iPhone, activa **Ajustes → Privacidad y seguridad → Modo de desarrollador**, reinicia y confirma.
2. Conecta y desbloquea el iPhone, acepta Confiar si aparece.
3. Abre `ios/PaseoAranjuez.xcworkspace` (no el archivo `.xcodeproj`).
4. En Signing & Capabilities, selecciona tu Personal Team y firma automática. El permiso NFC ya no debe aparecer.
5. Selecciona el iPhone como destino y pulsa Run. Xcode debe registrar el dispositivo y generar el perfil de desarrollo.
6. Mantén el servidor de desarrollo abierto con `npm start -- --dev-client`. Configura la API con la IP del Mac como explica el apartado de conexión.

Los avisos de scripts de Hermes y Expo indican que sus tareas se ejecutan en cada compilación; no son el error de firma. No hace falta cambiar los ajustes recomendados ni editar Pods para resolverlo.

### Activar NFC después

Con un equipo habilitado para NFC, cambia en `.env`:

```dotenv
IOS_NFC_ENABLED=true
APPLE_TEAM_ID=TU_TEAM_ID
```

Ejecuta `npm run prebuild:ios` y reinstala la app firmada. Un cambio de JavaScript por sí solo no añade permisos a una app ya instalada. Antes de regenerar, cierra el workspace de Xcode; Expo puede regenerar los archivos nativos.

La prueba automatizada de configuración comprueba ambos modos: el modo gratuito elimina el permiso NFC iOS y conserva cámara/QR; el modo NFC genera `TAG`. Ambos conservan el permiso NFC de Android.

## Instalación realizada en el iPhone 16 Pro Max

Se compiló y firmó una versión **Release** de Paseo (`com.softcraft.paseoaranjuez`) y se instaló en el iPhone de Juan. Incluye el bundle de la interfaz y usa `https://apiaranjuez.softcraftbol.com/api/v1`; no necesita Metro ni el Mac para cargar la aplicación. Necesita conexión a internet para los datos.

La versión instalada utiliza QR y no solicita NFC. El perfil actual de la cuenta gratuita vence el **10 de octubre de 2026 a las 20:41, hora de Bolivia**. Tras su vencimiento habrá que volver a firmar e instalar. Esta instalación es para pruebas personales; no es una publicación en App Store o TestFlight.
