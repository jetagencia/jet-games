# JET//BALL — Análisis: TWA vs Capacitor para monetización

**Estado:** análisis técnico, mayo 2026
**Autor:** Claude para JETCompany OÜ
**Decisión a tomar:** ¿seguimos con TWA (Trusted Web Activity vía Bubblewrap) o migramos a Capacitor para el wrap Android?

---

## TL;DR

**Recomendación firme: migrar a Capacitor.**

TWA fue una buena elección para sideload + prueba técnica. Para monetización seria con AdMob + Play Billing + GDPR consent + cloud save, **TWA tiene techo bajo**. Capacitor no es más complejo, y el upside de revenue es 3-5x.

---

## Cómo difieren

### TWA (lo que tenés ahora)

- El APK es un wrapper finísimo (~1.3 MB) que abre tu sitio web `jetball.net` en un Chrome Custom Tab fullscreen.
- El juego corre **dentro del browser**, indistinguible para el usuario, pero técnicamente sigue siendo una página web.
- **Updates instantáneos**: cambias el `index.html` en Hostinger y todos los usuarios tienen la nueva versión sin reinstalar.
- **Lo bueno**: simplísimo de mantener. Single source of truth (la web).
- **Lo malo**: el juego es una página web. No hay APIs nativas Android.

### Capacitor

- Capacitor empaqueta tu HTML/CSS/JS como **assets locales** dentro del APK (1-3 MB de zip extra).
- El juego corre en un WebView Android, pero con **bridge a JS** hacia código nativo Java/Kotlin.
- **Plugins oficiales** para AdMob, Google Play Billing, Push Notifications, Filesystem, Camera, etc.
- **Updates**: dos opciones — (a) rebuild + nuevo APK + Play Store update flow (lento pero estándar), o (b) Capacitor Live Updates / cápsulas via codepush (descarga JS bundle nuevo sin reinstalar — mismo benefit de TWA).
- **Lo bueno**: tenés el ecosistema Android entero disponible.
- **Lo malo**: hay que rebuild + republish para cambios en el shell. Pero los cambios en el JS pueden hacerse via Live Updates si lo configurás.

---

## Comparación punto por punto

| Feature | TWA | Capacitor | Ganador |
|---|---|---|---|
| **Tamaño APK** | ~1-2 MB | ~3-6 MB | TWA (marginal) |
| **Tiempo de build** | ~3-5 min Gradle | ~5-10 min Gradle | TWA |
| **Updates dinámicos** | Instantáneo (es web) | Live Updates (3rd-party) o Play update | TWA |
| **AdMob (ads nativas)** | ❌ NO. Solo AdSense web. | ✅ Plugin oficial `@capacitor-community/admob` | **Capacitor** |
| **Play Billing (subs)** | ❌ NO. Solo billing web. Play Store **prohíbe** apps que vendan contenido digital fuera de Play Billing. | ✅ Plugin oficial `@capacitor-community/in-app-purchases` | **Capacitor** |
| **Cloud save / Google Sign-In** | ❌ Solo via OAuth web | ✅ Plugin oficial Google Auth | **Capacitor** |
| **Push notifications** | ❌ Web push solo | ✅ FCM nativo | **Capacitor** |
| **GDPR consent UMP** | ❌ Solo consent web (manual) | ✅ Plugin UMP de Google | **Capacitor** |
| **Crash reporting nativo** | ❌ | ✅ Firebase Crashlytics plugin | **Capacitor** |
| **Vibración / hapticos** | ⚠️ Web Vibration API (limitado en iOS) | ✅ Haptics plugin | **Capacitor** |
| **Performance** | Idéntico (mismo WebView) | Idéntico (mismo WebView) | empate |
| **Funciona iOS también** | ❌ TWA es Android-only. iOS necesitaría otra cosa (PWABuilder, Capacitor, etc.) | ✅ Capacitor wrap iOS también con mínimos cambios | **Capacitor** |
| **Steam wrap futuro** | No aplica directo, hay que armar Tauri/Electron aparte | Mismo código JS reusable en Tauri (ya scaffolado) | empate |

**Score ad-hoc**: Capacitor 8 / TWA 2 / empates 2.

---

## Costo de migración

**Tiempo estimado: 1-2 días de trabajo.**

Pasos:
1. `npm install @capacitor/core @capacitor/cli @capacitor/android` (ya tenés `@capacitor/cli` y `@capacitor/ios` en `package.json`).
2. `npx cap init "JET//BALL" "net.jetball.app"`.
3. Configurar `capacitor.config.json`: webDir = "." (donde está index.html), bundleId = net.jetball.app.
4. `npx cap add android`.
5. Adaptar `index.html` para que las llamadas a Service Worker no rompan dentro de WebView (Capacitor tiene su propio sistema de assets).
6. Instalar plugins:
   - `@capacitor-community/admob` → ads
   - `@capacitor-community/in-app-purchases` o `cordova-plugin-purchase` → billing
   - `@capacitor/google-auth` → login
   - `@capacitor-community/admob` con UMP → consent EU
7. Adaptar el JS del juego para llamar a los plugins en los puntos correctos:
   - Banner ad: en menú principal
   - Interstitial: cada 3 partidas perdidas (free tier)
   - Rewarded: en botones "Ver ad para revivir" / "Probar modo Premium"
   - Sub upsell: botón "Premium" en menú → flow de Play Billing
8. `npx cap sync android` y `npx cap open android` para abrir Android Studio.
9. Build → APK firmado con tu keystore actual. Usás el mismo `android.keystore` y misma SHA-256.
10. Test en device real.

**Lo bueno: tu `package.json` ya tiene Capacitor scaffolding parcial** (para iOS). Reutilizable.

---

## Híbrido: TWA primero, Capacitor V2

Una opción intermedia:

- **MVP en Play Store con TWA** (lo que ya casi tenés): subís sin monetización seria. Solo AdSense web, link a Stripe checkout para "donar" en lugar de subscribirse.
- **V2 con Capacitor + AdMob + Play Billing** después.

**Por qué NO recomiendo este path:**

1. La cuenta nueva de Play tiene 14 días de closed testing obligatorio. Conviene gastar ese tiempo construyendo la versión Capacitor, no la TWA "interim".
2. AdSense web en TWA da CPM ~USD 0.50-1.50 (muy bajo). Vas a generar peanuts.
3. Stripe/Paddle externo violaría las guidelines de Google si la app es para entregar contenido digital — Google **prohíbe explícitamente** apps que vendan contenido digital fuera de Play Billing (fuera de excepciones específicas como "prensa").
4. Migrar de TWA a Capacitor más adelante implica que los usuarios actuales hacen "update" y de repente la app es nueva. Mejor lanzar derecho como Capacitor.

---

## Decisión recomendada

**Migrar a Capacitor antes de subir a Play Store.**

Esto agrega 1-2 días al timeline pero:
- El primer release ya es monetizable.
- La arquitectura sirve también para iOS (cuando tengas Mac/MacInCloud).
- El código JS es 99% el mismo, no tirás trabajo previo.

**Lo único de TWA que sigue valiendo:** el sideload APK que estás por generar para test personal. Eso lo hacés esta semana, prueba que el juego anda en Android, y después lo descartás cuando arme el wrap Capacitor.

---

## Lo que necesito de Julián para arrancar Capacitor

- [ ] Confirmación de que avanzamos con esta migración (sí o no).
- [ ] ¿Querés que arranque yo la migración acá mismo (modificar package.json, crear capacitor.config, instalar plugins)? O preferís que documente los pasos y los ejecutás vos en Windows.
- [ ] ¿AdMob mediation necesario? (sumar AppLovin/Unity Ads para mejor fill rate). MVP no lo necesita; lo agregamos en V1.1 si los CPMs son bajos.
- [ ] Account ID de AdMob: tendrás que crear cuenta en https://admob.google.com bajo la misma cuenta de Google que use Play Console.
