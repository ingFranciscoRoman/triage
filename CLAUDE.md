# Triage

Asistente móvil de triage de correo. Clasifica correos de trabajo y muestra qué
requiere acción hoy.

**Este es un proyecto de aprendizaje.** El objetivo no es terminar rápido: es que
el desarrollador entienda cada decisión. Prefiere explicar el porqué antes que
generar volumen de código.

---

## Stack

| Capa      | Tecnología                                                        |
| --------- | ----------------------------------------------------------------- |
| Móvil     | Expo (managed), React Native, TypeScript, NativeWind, expo-router |
| API       | NestJS, TypeScript                                                |
| Datos     | Postgres + Prisma _(desde F1)_                                    |
| Contratos | Zod en `packages/contracts`                                       |
| Monorepo  | pnpm workspaces                                                   |

---

## Estructura

```
apps/api          NestJS — toda la lógica de negocio y de IA
apps/mobile       Expo — vista y estado de UI, nada más
packages/contracts  Esquemas Zod compartidos (fuente única de verdad)
docs/adr          Architecture Decision Records
docs/specs        Specs por fase
```

---

## Reglas no negociables

1. **Ninguna API key en `apps/mobile`.** Un bundle de RN se descompila. Toda
   credencial vive en el API. Sin excepciones, ni siquiera "temporalmente".
2. **Todo dato que cruza la frontera red se valida con Zod.** El móvil no confía
   en el API y el API no confía en el cliente.
3. **Los tipos se derivan de los esquemas Zod** (`z.infer`), no se declaran aparte.
   Una sola fuente de verdad.
4. **Sin `any`.** Si el tipo no sale, es señal de que el diseño está mal; se
   discute, no se silencia.
5. **La lógica de negocio no vive en componentes.** En el móvil: servicios en
   `lib/`. En el API: services de Nest, nunca en controllers.
6. **Nada se mergea con el CI en rojo.**

---

## Flujo de trabajo esperado

Este proyecto avanza en sesiones cortas (~4h semanales). Optimiza para eso:

1. **Plan mode primero.** Antes de escribir código, propón el plan y espera
   confirmación. En cambios de una línea no aplica; en todo lo demás sí.
2. **Un objetivo mergeable por sesión.** No dejes ramas a medias.
3. **Toda decisión de arquitectura genera un ADR** en `docs/adr/`.
4. **Al terminar una tarea:** ejecuta `pnpm typecheck` y `pnpm lint` antes de dar
   nada por listo.

---

## Cómo quiero que trabajes conmigo

- **Explica el porqué, no solo el qué.** Si eliges un patrón, di qué alternativa
  descartaste y por qué.
- **Señala cuando algo es específico de React Native** y no funciona igual que en
  React web. Vengo de React web, Laravel y Tailwind; asume ese contexto.
- **Si algo que pido es mala idea, dilo.** Prefiero fricción ahora que deuda después.
- **No generes archivos que no pedí.** Nada de "también te agregué X por si acaso".
- **No adelantes fases.** Si estamos en F0 y propones Prisma, es scope creep.
  Anótalo como idea futura y sigue.
- **En español.** Los identificadores de código en inglés, las explicaciones en español.

---

## Comandos

```bash
pnpm install              # desde la raíz
pnpm --filter api dev     # API en :3000
pnpm --filter mobile dev  # Expo dev server
pnpm typecheck            # todos los paquetes
pnpm lint
```

---

## Convenciones de código

**Nombres de archivo**

- Componentes RN: `PascalCase.tsx`
- Todo lo demás: `kebab-case.ts`
- Nest sigue su propia convención: `*.controller.ts`, `*.service.ts`, `*.module.ts`

**Commits** — Conventional Commits:

```
feat(mobile): pantalla de health con estados de carga y error
fix(api): CORS bloqueaba peticiones desde Expo Go
docs(adr): 0001 elección de Expo sobre RN CLI
chore(ci): workflow de typecheck y lint
```

**Imports** — orden: externos → `@triage/*` → relativos.

**Estados de UI** — toda vista que consume datos remotos maneja explícitamente
los tres estados: cargando, error, datos. No hay excepciones "porque es rápido".

---

## Estado actual

**Fase:** F0 — Vertical slice
**Spec:** `docs/specs/SPEC-F0-vertical-slice.md`

Roadmap: F0 slice → F1 ingesta de correo (OAuth + Prisma) → F2 clasificación con
LLM (structured outputs) → F3 evals → F4 producto y compuertas de seguridad.

**No hay IA en el proyecto hasta F2.** Si una propuesta involucra un LLM antes de
eso, está fuera de alcance.
