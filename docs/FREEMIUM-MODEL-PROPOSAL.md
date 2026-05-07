# JET//BALL — Propuesta de modelo freemium

**Estado:** propuesta inicial, mayo 2026
**Autor:** Claude para JETCompany OÜ
**Para revisión de:** Julián

---

## Resumen ejecutivo

JETBALL tiene **8 modos** (Clásico, Contrarreloj, Extremo, Zen, Supervivencia, Espacio, Océano, Mondrian). Eso es mucha superficie de juego — más que la mayoría de los free-to-play arcade. El mejor uso de esa abundancia es como **palanca de conversión a Premium**, no regalar todo.

**Modelo recomendado: 3 modos free + 5 Premium + ad-supported tier.**

---

## Tier Free

- **Modos disponibles:** Clásico, Contrarreloj, Zen.
  - Clásico: el modo "core" del género, hook obvio.
  - Contrarreloj: variante competitiva que crea retención (leaderboards futuros).
  - Zen: relajación, atrae demografía no-gamer (sleep / chill audience).
- **Anuncios:**
  - **Banner ad** abajo en menú principal (no durante gameplay).
  - **Interstitial ad** después de cada 3 partidas perdidas. Nunca en victoria — no quemar el momento de placer.
  - **Rewarded video opcional**: "ver ad para revivir" o "ver ad para desbloquear modo Premium por 1 partida". Esto último es clave — es el principal driver de conversión.
- **Sin gating duro:** el jugador free puede jugar indefinidamente los 3 modos sin pagar.

## Tier Premium

- **Modos extra:** Extremo, Supervivencia, Espacio, Océano, Mondrian.
- **Sin anuncios** en toda la app.
- **Skins exclusivos** (de las paredes, bola, partículas) — visual differentiator que también funciona como flex social.
- **Cloud save** (sync de progreso entre dispositivos vía Google Play Games Services o Firebase).
- **Acceso temprano** a futuros modos.

### Pricing

Para Argentina/LATAM y Europa son rangos distintos. Play Console permite tiered pricing por país.

| Plan | Tier 1 (US/UE) | Tier 2 (LATAM/AR) | Comisión Google |
|---|---|---|---|
| **Mensual** | USD 2.99 | USD 0.99 | 30% |
| **Anual** | USD 19.99 | USD 6.99 | 15% (post-renovación) |
| **Lifetime IAP one-time** | USD 14.99 | USD 4.99 | 30% |

> **Nota Google Play Billing:** suscripciones bajan a **15% de comisión después de los 12 meses** que un usuario ha estado suscripto continuamente. Lifetime IAP siempre 30%. Ergo, optimizar para retención >12 meses cuesta menos que vender lifetime.

### Trial

- **3 días free trial** del Premium al instalar.
- Si el jugador se engancha con Espacio o Mondrian (los más vistosos), la conversión a sub es alta.

---

## KPIs a monitorear post-launch

| Métrica | Target inicial | Cómo medir |
|---|---|---|
| **D1 retention** | >25% | Firebase Analytics |
| **D7 retention** | >10% | Firebase Analytics |
| **ARPDAU** (avg revenue per daily active user) | >USD 0.05 | Mix de ads + IAP / DAU |
| **Conversion a Premium (free→paid)** | >2% | Play Console + Firebase |
| **Trial-to-paid conversion** | >30% | Play Console |
| **Churn mensual sub** | <15% | Play Console |

Si conversión <1% en primer mes: revisar pricing o gating.
Si churn >25% mensual: el contenido Premium no justifica el precio — sumar más modos o features.

---

## Arquitectura técnica para soportarlo

Esto **requiere migrar de TWA puro a Capacitor** (ver doc separado `ANALYSIS-TWA-vs-CAPACITOR.md`). Razones:

1. **AdMob nativo** vs AdSense web: 3-5x mejor CPM.
2. **Google Play Billing nativo** integrado en la app, no via web checkout.
3. **Server-side validation de subs** vía Google Play Developer API (evita fraudes de jugador trucho que cancela y sigue jugando).
4. **Account binding** opcional: el jugador puede iniciar sesión con Google → su sub queda atada al account, recuperable en otros dispositivos.

Sin migración a Capacitor, el modelo freemium sería precario:
- Las "subs" serían en realidad cobros web vía Stripe/Paddle, sin integración con Play Store → Play rechaza apps que monetizan fuera del Play Billing salvo casos específicos.
- AdSense web tiene CPM bajo y peor fill rate que AdMob.

---

## Roadmap sugerido del modelo

| Fase | Cuándo | Qué |
|---|---|---|
| **MVP (mes 0)** | Lanzamiento Play Store | 3 modos free, 5 Premium, sub mensual + anual. Sin lifetime, sin skins. Sin trial. |
| **V1.1 (mes 1-2)** | Post-launch | Agregar trial 3 días + rewarded ad para "preview" de modos premium. |
| **V1.2 (mes 3-4)** | Optimization | Agregar skins, cloud save, lifetime IAP. |
| **V2 (mes 6+)** | Expansión | Modo competitivo online (leaderboards), eventos temporales (modo navideño etc.), nuevos modos Premium. |

---

## Riesgos

1. **Política Play Store sobre suscripciones**: Google requiere que la app entregue valor "sustancial" en el tier free. Las recientes guidelines (2024+) penalizan apps free que solo muestran teasers detrás de paywall. Tener 3 modos free completos cubre esto.
2. **GDPR / consent ads**: si servimos AdMob a usuarios EU sin consent management correcto, multas. Capacitor tiene plugin oficial UMP (User Messaging Platform) de Google que resuelve.
3. **Competencia**: el género JezzBall tiene apps gratis sin restricción (BzzzWall, etc.). El diferenciador tiene que ser el polish visual + variedad de modos. Si no hay diferencia perceptible, conversión cae a 0.
4. **Concentración de revenue**: si dependés solo de Play Store, una suspensión de cuenta (cosa que pasa por errores de billing o reportes falsos) corta ingresos. Mitigar publicando también en App Store en mes 6.

---

## Decisiones que necesito de Julián

- [ ] Confirmar split free/premium: ¿son los 3 modos elegidos los correctos?
- [ ] ¿Trial 3 días desde el inicio o agregarlo en V1.1?
- [ ] ¿Lifetime IAP desde MVP o solo subs?
- [ ] Países donde aplicar Tier 2 pricing (LATAM): ¿solo AR o también Brasil, México, Colombia, Chile?
- [ ] ¿Tienes leaderboards/cloud save en mente para post-MVP, o no es prioridad?
