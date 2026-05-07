# JETCompany OÜ — Estrategia de portfolio de juegos retro reimaginados

**Estado**: estrategia v0.1, mayo 2026.
**Para revisión de**: Julián.

---

## Visión general

El proyecto JETBALL (reimaginación 2026 de JezzBall) demostró que hay un nicho viable: **clásicos pre-2000 con polish 2026, mobile-first, monetizable**. Esta estrategia propone tratarlo como un **portfolio de 3-5 juegos** bajo JETCompany OÜ con:

- **Stack técnico común** (PWA + Capacitor + AdMob + Play Billing)
- **Branding consistente** ("JET-prefix" o sub-marca paraguas)
- **Cross-promotion entre apps** (referrals, bundle Premium)
- **Aprendizaje compartido**: cada lanzamiento informa al siguiente

---

## Candidatos identificados

| Juego original | Año | Reimaginación | Carpeta |
|---|---|---|---|
| **JezzBall** | 1992 | **JETBALL** ✅ en producción | `jettball-pwa/` |
| **Hover!** | 1995 | TBD (Hover, Glide, FlagDrift) | `Otros/Hover/` |
| **Pipe Mania / Pipe Dream** | 1989 | TBD (JETPipe, Floodline, Plumb) | `Otros/Piper/` |
| **SkiFree** | 1991 | TBD (JETSki, Avalanche, JETGlide) | `Otros/SkiFree/` |

Otros candidatos a futuro (por explorar):
- **Chip's Challenge** (1989) — puzzle game con keys/locks/teleports.
- **Lemmings** (1991) — guiar criaturas de A a B.
- **Tetris** (1984) — el rey, pero IP muy disputada por The Tetris Company.
- **Bomberman** (1983) — mecánica aún potente, IP de Konami.
- **Snake** — dominio público de facto, ya hay 1000 clones.
- **Pong** — dominio público, demasiado simple para monetizar solo.
- **Minesweeper** — ya saturado.
- **Solitaire** — saturado pero con espacio para versiones premium.

## Recomendación de orden de release

**Ranking por: monetization potential × time to market × fit con tu estilo:**

### 1. JETBALL (en curso) — Q3 2026
Ya está casi listo. Foco actual.

### 2. JETPipe (2do) — Q4 2026 / Q1 2027

**Por qué primero después de JETBALL**:
- **El género puzzle convierte mejor a Premium** (~3% vs ~2% en endless runner) — buen segundo bote.
- **Daily Puzzle mode** crea hábito diario tipo Wordle, **excelente retention**.
- **Touch es interfaz natural** del género, menos fricción de adaptación.
- **Saturación mayor pero con bajo polish floor** — es fácil destacar con quality.
- **Reusa todo el stack JETBALL** (PWA + Capacitor + assets neón).

### 3. JETSki / JETGlide (3ro) — Q2 2027

**Por qué tercero**:
- **Endless runner tiene ad revenue ALTO** — buen canal de monetización agresiva.
- **Pero la competencia (Subway, Alto's) es brutal** — necesitamos los aprendizajes de los dos lanzamientos previos.
- **Variedad de portfolio**: ya tendremos un puzzle (Pipe) y un grid action (JETBALL). Sumar un endless runner cubre el tercer género masivo.
- **Más esfuerzo de art** (8 biomes con villanos): mejor con learnings de Pipe.

### 4. JETHover (4to) — Q3-Q4 2027

**Por qué último**:
- **3D / 2.5D top-down con drift** es el más complicado de los 4 técnicamente.
- **Audiencia más nicho** (gen X nostálgicos) → menor mass-market potential.
- **Multiplayer es tentación** pero sumaría 3-6 meses de backend + infra.
- **Mejor cuando ya tengamos cashflow de los otros 3** para invertir en art.

### Roadmap visual

```
Q3 2026  Q4 2026  Q1 2027  Q2 2027  Q3 2027  Q4 2027
   │        │        │        │        │        │
   ├ JETBALL launch
   │        ├ JETPipe MVP
   │        │        ├ JETPipe launch
   │        │        │        ├ JETSki MVP
   │        │        │        │        ├ JETSki launch
   │        │        │        │        │        ├ JETHover MVP
   │        │        │        │        │        │
```

12-18 meses para los 4 lanzamientos. Realista si Julián trabaja focalizado + outsourceá art para algunos.

---

## Branding del portfolio

### Opción A: "JET" prefijo individual (recomendada)

Cada juego: JETBALL, JETPipe, JETSki, JETHover. Cada uno con su dominio (`jetball.net`, `jetpipe.net`, etc).

**Pros**: cada juego es discoverable por su nombre canónico. SEO independiente.
**Cons**: comprar 4 dominios (USD 40/año total). Ningún brand-umbrella visible.

### Opción B: "JET Arcade" como marca paraguas

Un único dominio `jetarcade.net` con sub-páginas por juego. Apps siguen separadas en stores pero comparten home web.

**Pros**: marca paraguas visible, cross-promotion natural, web única para mantener.
**Cons**: cada juego depende del SEO de la marca paraguas.

### Opción C: híbrido (la mejor en mi opinión)

- **Cada juego con su dominio** (`jetball.net`, etc.) para SEO/discovery.
- **`jetarcade.net`** como hub de portfolio (lista de juegos, sobre la empresa, blog dev).
- **Footer + about** de cada juego linkea a `jetarcade.net` + a los otros juegos.
- **App store listing**: developer name "JETCompany OÜ" o "JET Arcade" — define una vez.

---

## Stack técnico común

Una vez establecido en JETBALL, **reusar 100%**:

| Capa | Tecnología | Reuso |
|---|---|---|
| Wrap mobile | Capacitor + plugins AdMob/Billing | ~95% |
| Game engine HTML5 | Canvas/WebGL custom o Phaser | ~50% (lógica core distinta) |
| UI framework | Vanilla JS o framework liviano (Preact?) | ~80% |
| Audio | Howler.js o Web Audio API | ~100% |
| Analytics | Firebase | ~100% |
| Hosting | Hostinger | ~100% |
| Build / CI | Capacitor build scripts | ~100% |

**Eficiencia de reuso**: el segundo juego cuesta ~50-60% del esfuerzo del primero. El tercero ~40%. El cuarto ~30%. Esto justifica fuertemente pensar el portfolio desde ahora vs juego-a-juego.

## Premium bundle cross-portfolio (opcional, V2)

Una vez con 2-3 apps publicadas: ofrecer **JETCompany Premium** como sub única que desbloquea Premium en todos los juegos del portfolio. Argumento similar a Apple Arcade / Microsoft 365.

- Pricing tentativo: USD 4.99/mes, USD 39.99/año (vs USD 2.99/19.99 por app).
- **Driver de retention cross-app** — usuario que cae en un juego es retenido en los demás.
- **Solo viable cuando hay ≥3 apps live**.

## Riesgos de portfolio

1. **Dispersión**: trabajar en 4 juegos a la vez termina mal. Foco serial.
2. **Cannibalization**: si todos compiten por el mismo target audience (puzzle casual), cada uno divide la base.
3. **Una app fracasada arrastra brand**: si JETPipe es malo, afecta percepción de JETBALL. Mitigación: sólo lanzar cuando esté pulido.
4. **Cambios de plataforma**: Google/Apple cambian políticas constantemente. Diversificación de plataformas (Steam wrap eventual) es seguro.

## Decisiones críticas para que Julián tome ahora

- [ ] ¿Confirmás el orden propuesto (JETPipe → JETSki → JETHover)?
- [ ] Branding: ¿Opción A, B o C?
- [ ] ¿Hacemos los 4 con full polish o pivoteamos a "más juegos, polish menor" (estrategia opuesta)?
- [ ] Outsourcing de art / música: ¿presupuesto disponible? (cada juego ~USD 1000-3000 en assets profesionales).

---

## Apéndice: comparación rápida de los 3 candidatos siguientes

| Métrica | Pipe | Ski | Hover |
|---|---|---|---|
| Esfuerzo MVP (meses) | 2-3 | 2-2.5 | 2 |
| Saturación de mercado | Alta | MUY alta | Media |
| Diferenciación posible | Buena (daily, narrative) | Difícil (nicho neón) | Buena (top-down 2.5D + dual lúdico) |
| Conversion to Premium target | 3% | 2% | 2.5% |
| ARPDAU target | $0.05 | $0.06 | $0.04 |
| Audiencia primaria | Casual puzzlers | Endless-runner fans | Gen X nostálgicos |
| Touch fit | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Reuso JETBALL stack | ~90% | ~80% | ~70% |
| Risk de IP | Bajo | Bajo (no usar Yeti idéntico) | Bajo (Microsoft no protege) |
