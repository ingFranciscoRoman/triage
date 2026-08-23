# SPEC F0 — Vertical Slice

**Proyecto:** Triage
**Fase:** F0
**Duración estimada:** 2 sesiones (~8h)
**Estado:** Pendiente

---

## 1. Objetivo

Establecer el esqueleto del monorepo y demostrar comunicación end-to-end entre el
móvil y el API, corriendo en un dispositivo físico.

**Criterio de éxito en una frase:**

> Abro la app en mi teléfono real y veo un texto que vino de mi backend NestJS.

---

## 2. Por qué esta fase existe

La fricción de setup es el mayor riesgo de un proyecto de 4h semanales. F0 la
concentra toda al principio, mientras la motivación está alta y no hay lógica de
negocio compitiendo por atención.

Al terminar F0 tienes un ciclo de feedback funcionando. Todo lo que venga después
es incremental.

---

## 3. Alcance

### Dentro

- Monorepo pnpm workspaces con `apps/api`, `apps/mobile`, `packages/contracts`
- NestJS con un endpoint `GET /health`
- Expo + React Native + NativeWind con una pantalla que consume ese endpoint
- Un esquema Zod compartido entre ambos lados
- CI en GitHub Actions: install, typecheck, lint, build
- `CLAUDE.md` en la raíz
- ADR-0001 documentando la elección de Expo

### Explícitamente FUERA

Esto no es una lista de "después"; es una lista de "si aparece, es scope creep":

- Postgres / Prisma → F1
- OAuth / Gmail → F1
- Cualquier llamada a un LLM → F2
- Autenticación de usuarios → F1
- Navegación multi-pantalla → F1
- Tests unitarios → F1 (en F0 basta con que compile y linte)
- Semgrep / gitleaks → F4
- Deploy a producción → F4

---

## 4. Estructura objetivo

```
triage/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── health/
│   │   │       ├── health.controller.ts
│   │   │       └── health.module.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── app/
│       │   └── index.tsx
│       ├── lib/
│       │   └── api.ts
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── contracts/
│       ├── src/
│       │   ├── index.ts
│       │   └── health.ts
│       └── package.json
├── .github/workflows/ci.yml
├── docs/adr/0001-expo-sobre-rn-cli.md
├── CLAUDE.md
├── pnpm-workspace.yaml
└── package.json
```

---

## 5. Contrato compartido

En `packages/contracts/src/health.ts`:

```ts
import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  message: z.string(),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
```

> **Nota de versión.** El proyecto usa Zod 4, donde los validadores de formato
> ISO viven en el namespace `z.iso`. La forma de Zod 3 —`z.string().datetime()`—
> sigue funcionando pero está deprecada; no la uses en código nuevo.

**Regla que se establece aquí y aplica a todo el proyecto:**
el móvil valida con Zod toda respuesta del API antes de usarla. No se confía en
`response.json()` a ciegas. Esta es la disciplina que después hace posible F2.

---

## 6. Criterios de aceptación

| #   | Criterio                                          | Cómo se verifica                                                          |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| AC1 | `pnpm install` funciona desde la raíz             | Ejecutar en clon limpio                                                   |
| AC2 | `pnpm --filter api dev` levanta Nest en :3000     | `curl localhost:3000/health` devuelve el JSON del contrato                |
| AC3 | La app corre en teléfono físico vía Expo Go       | Escanear QR, app carga                                                    |
| AC4 | La pantalla muestra el `message` del API          | Cambiar el texto en el backend y ver el cambio en el móvil                |
| AC5 | La respuesta se valida con `healthResponseSchema` | Romper el schema a propósito → la app muestra estado de error, no crashea |
| AC6 | Hay estado de carga y estado de error visibles    | Apagar el API → la app muestra error legible                              |
| AC7 | `pnpm typecheck` y `pnpm lint` pasan en verde     | CI                                                                        |
| AC8 | El CI corre en cada push a `main` y en PRs        | Ver el check en GitHub                                                    |
| AC9 | Existen `CLAUDE.md` y `docs/adr/0001-*.md`        | Revisión manual                                                           |

---

## 7. Tareas

Cada una debería caber en una sentada. Marca al terminar.

- [ ] T1 — Inicializar repo, `pnpm-workspace.yaml`, `.gitignore`, `package.json` raíz con scripts `dev`, `lint`, `typecheck`
- [ ] T2 — `packages/contracts` con Zod y el schema de health
- [ ] T3 — `nest new api`, quitar el boilerplate sobrante, crear `HealthModule` que responda según el contrato
- [ ] T4 — Habilitar CORS en el API para desarrollo local
- [ ] T5 — `create-expo-app` con TypeScript + expo-router, instalar NativeWind
- [ ] T6 — `lib/api.ts`: fetch + validación Zod + tipos de error
- [ ] T7 — Pantalla `index.tsx` con los tres estados: cargando / error / datos
- [ ] T8 — Configurar `EXPO_PUBLIC_API_URL` vía variable de entorno (no hardcodear la IP)
- [ ] T9 — Probar en teléfono físico
- [ ] T10 — ESLint + Prettier compartidos en la raíz
- [ ] T11 — `.github/workflows/ci.yml`
- [ ] T12 — `CLAUDE.md`
- [ ] T13 — ADR-0001
- [ ] T14 — README con instrucciones de arranque

---

## 8. Trampas conocidas

Documentadas de antemano para que no te cuesten una sesión entera:

**La IP de red local.** `localhost` desde el teléfono apunta al teléfono, no a tu
máquina. Necesitas la IP LAN de tu PC (ej. `192.168.1.42`). Ponla en
`EXPO_PUBLIC_API_URL`, no hardcodeada. El teléfono y el PC deben estar en la misma
red WiFi.

**Nest escuchando solo en localhost.** Por defecto puede no aceptar conexiones
externas. Usa `app.listen(3000, '0.0.0.0')`.

**Firewall de Windows/macOS.** Suele bloquear el puerto 3000 la primera vez.
Si el fetch falla y `curl` local sí funciona, es esto.

**NativeWind requiere config extra.** `babel.config.js`, `metro.config.js` y
`global.css`. Sigue la guía oficial de la versión que instales; cambió entre v2 y v4.

**Los workspaces de pnpm con Metro.** El bundler de RN necesita config para
resolver paquetes del monorepo. Si `@triage/contracts` no resuelve desde el móvil,
es esto.

---

## 9. Definition of Done

- [ ] Los 9 criterios de aceptación se cumplen
- [ ] CI en verde
- [ ] Mergeado a `main` (sin ramas a medias al cerrar la semana)
- [ ] ADR escrito
- [ ] Anotado en `docs/BITACORA.md`: qué costó más de lo esperado y por qué

---

## 10. Reflexión al cerrar

Responder en la bitácora, en 3 o 4 líneas:

1. ¿Qué concepto de React Native se sintió más ajeno viniendo de React web?
2. ¿Dónde se fue realmente el tiempo?
3. ¿Qué haría distinto en F1?
