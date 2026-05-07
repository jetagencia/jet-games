# Política de Privacidad — JET//BALL

**Última actualización:** [PENDIENTE — fecha de publicación]
**Versión:** 1.0 (DRAFT — pendiente de revisión legal)

> ⚠️ **IMPORTANTE — ESTO ES UN DRAFT.** Antes de publicar esta política en producción y referenciarla desde Google Play Console / AdMob:
> 1. Hacela revisar por un abogado con experiencia en GDPR + Estonia + apps móviles.
> 2. Confirmá si necesitás Data Protection Officer (DPO) — depende de volumen de datos.
> 3. Confirmá los SDK exactos integrados (AdMob, Firebase, Play Billing, Google Sign-In) y completá la sección de "Third Parties" según los SDKs reales.
> 4. Si servís usuarios de California: agregá sección CCPA. Si servís usuarios de Brasil: agregá LGPD.

---

## 1. Identidad del Responsable

**Responsable del tratamiento de datos:**

JETCompany OÜ
Registry code: 17127779
VAT EU: EE102828779
Domicilio legal: Sepapaja tn 6, 15551 Tallinn, Harju Maakond, Estonia
Email de contacto: privacy@jetball.net (o el email que configures)

JETCompany OÜ ("nosotros", "nos", "nuestra empresa") es responsable del tratamiento de los datos personales de los usuarios ("vos", "el usuario") que interactúan con la aplicación móvil JET//BALL ("la aplicación", "el juego") y con el sitio web jetball.net.

## 2. Datos que recopilamos

### 2.1 Datos que vos nos das directamente

- **Cuenta de Google** (opcional, solo si iniciás sesión): email, nombre de usuario, identificador único de Google.
- **Datos de pago para suscripciones**: NO los procesamos directamente. Google Play Billing maneja toda la información de pago. Recibimos solamente confirmación de la transacción y el plan asociado a tu cuenta.
- **Comunicaciones por email**: si nos contactás voluntariamente, guardamos el email y el mensaje.

### 2.2 Datos recopilados automáticamente

- **Identificadores del dispositivo**: Advertising ID (Google Advertising ID en Android), instance ID de Firebase.
- **Información técnica del dispositivo**: modelo, sistema operativo y versión, idioma, zona horaria, resolución de pantalla, conexión de red (wifi / móvil), dirección IP aproximada.
- **Datos de uso**: modos de juego abiertos, tiempo jugado, niveles completados, fallos, duración de sesión, frecuencia de apertura, eventos de conversión (ej: clic en "Premium").
- **Datos de anuncios**: para personalización (con tu consentimiento) y medición de rendimiento.
- **Datos de fallos / errores**: stack traces de crashes anonimizados (Firebase Crashlytics).

### 2.3 Datos que **no** recopilamos

- No recopilamos nombre completo, dirección física, teléfono, ni datos sensibles según el Art. 9 GDPR (origen étnico, salud, orientación sexual, etc.).
- No recopilamos información de contactos, archivos, fotos ni grabaciones de audio/video.

## 3. Bases legales del tratamiento (GDPR)

| Tratamiento | Base legal |
|---|---|
| Funcionalidad core del juego (sesiones, progresión, estadísticas) | Ejecución del contrato (Art. 6.1.b GDPR) |
| Anuncios personalizados | Consentimiento explícito (Art. 6.1.a GDPR) |
| Anuncios no personalizados (contextual) | Interés legítimo (Art. 6.1.f GDPR) |
| Suscripciones y pagos | Ejecución del contrato (Art. 6.1.b GDPR) |
| Crash reporting y mejora del producto | Interés legítimo (Art. 6.1.f GDPR) |
| Comunicaciones de marketing | Consentimiento explícito (opt-in) |
| Cumplimiento de obligaciones legales (fiscales, etc.) | Obligación legal (Art. 6.1.c GDPR) |

## 4. Terceros con los que compartimos datos

JET//BALL integra los siguientes servicios de terceros, cada uno con su propia política de privacidad:

### 4.1 Google AdMob (anuncios)
**Datos compartidos:** Advertising ID, IP aproximada, datos de interacción con anuncios.
**Finalidad:** Servir anuncios personalizados o contextuales según consentimiento.
**Política:** https://policies.google.com/technologies/ads

### 4.2 Google Play Billing (suscripciones)
**Datos compartidos:** identificador de transacción, información de la cuenta de Google asociada al pago.
**Finalidad:** Procesar pagos de suscripciones y verificar status.
**Política:** https://policies.google.com/privacy

### 4.3 Firebase Analytics + Crashlytics (Google)
**Datos compartidos:** instance ID, eventos de uso, crash reports.
**Finalidad:** Analítica de producto y diagnóstico de bugs.
**Política:** https://firebase.google.com/support/privacy

### 4.4 Google Sign-In (opcional)
**Datos compartidos:** identificador único, email, nombre del usuario.
**Finalidad:** Login con cuenta Google si el usuario lo elige.

### 4.5 Hostinger (hosting web)
**Datos compartidos:** logs de acceso al sitio web (IP, user agent, timestamp).
**Finalidad:** Funcionamiento del sitio jetball.net.

JET//BALL **no vende** datos personales a terceros con fines comerciales propios. Las transferencias arriba son procesadores de datos por cuenta nuestra.

## 5. Transferencias internacionales

Algunos de los servicios usados (Google) pueden transferir datos a Estados Unidos. Estas transferencias se amparan en el **EU-U.S. Data Privacy Framework** (vigente desde julio 2023) o en **Cláusulas Contractuales Tipo (SCC)** aprobadas por la Comisión Europea, según corresponda.

## 6. Retención

| Tipo de dato | Duración |
|---|---|
| Datos de cuenta (si iniciaste sesión con Google) | Hasta que solicites baja de cuenta + 30 días de margen |
| Datos de transacciones | 7 años (obligación legal Estonia) |
| Logs técnicos | 90 días |
| Datos de Firebase Analytics | Default 14 meses (configurable) |
| Crash reports | 90 días |
| Datos de anuncios (impresiones, clics) | Según política de AdMob (~13 meses) |

## 7. Tus derechos (GDPR / EU)

Podés ejercer los siguientes derechos contactando a privacy@jetball.net:

- **Acceso** (Art. 15): recibir copia de tus datos.
- **Rectificación** (Art. 16): corregir datos incorrectos.
- **Supresión / "Right to be forgotten"** (Art. 17).
- **Limitación** del tratamiento (Art. 18).
- **Portabilidad** de datos (Art. 20).
- **Oposición** al tratamiento (Art. 21), incluyendo opt-out de marketing.
- **No ser objeto de decisiones automatizadas** (Art. 22).
- **Retirar el consentimiento** en cualquier momento (Art. 7.3) — no afecta licitud previa.
- **Reclamar ante la autoridad de control**: en Estonia es Andmekaitse Inspektsioon (https://www.aki.ee).

Respondemos en menos de 30 días naturales.

## 8. Privacidad infantil

JET//BALL no está dirigido a menores de 13 años. No recopilamos conscientemente datos de menores. Si descubrimos que un menor de 13 años nos dio datos sin consentimiento parental, los eliminamos. Si sos padre/madre/tutor y creés que tu hijo nos dio datos, escribinos a privacy@jetball.net.

(Sección COPPA si servimos US: requiere parental consent verificable para <13.)

## 9. Cookies y tecnologías similares

El sitio jetball.net puede usar:
- **Cookies estrictamente necesarias**: para el funcionamiento del sitio.
- **Cookies analíticas**: solo con consentimiento.
- **Cookies de publicidad**: solo con consentimiento.

Podés gestionar tu consentimiento en cualquier momento desde el banner de cookies (mostrado en primera visita y accesible desde el footer).

En la app móvil, el equivalente es el "User Messaging Platform" (UMP) de Google que se muestra al primer inicio para usuarios EU.

## 10. Seguridad

Aplicamos medidas técnicas y organizativas razonables:
- HTTPS obligatorio en todas las comunicaciones.
- Almacenamiento de pagos delegado completamente a Google Play Billing.
- Acceso restringido a sistemas administrativos.
- Sin almacenamiento de contraseñas (no manejamos contraseñas — login con Google).

## 11. Modificaciones

Podemos actualizar esta política. Si los cambios son materiales, notificamos por email (si tenemos tu email) y mostramos un banner en la app antes de aplicar. Última actualización al inicio de este documento.

## 12. Contacto

JETCompany OÜ
Sepapaja tn 6, 15551 Tallinn, Estonia
privacy@jetball.net
