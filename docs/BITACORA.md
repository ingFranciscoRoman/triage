# Bitácora

Registro de qué costó más de lo esperado y por qué.

Esto **no es un changelog** — para eso está el historial de git, que ya cuenta
qué cambió. Acá va lo que un `git log` no cuenta: dónde se fue el tiempo, qué
trampa no estaba documentada, y qué decisión se tomó sin tener toda la
información.

Una entrada por sesión. Al cerrar cada fase, además, las preguntas de reflexión
del spec correspondiente.

---

## 2026-08-23 — F0, sesión 1: monorepo + API

**Objetivo:** T1–T4, T10, T11. El backend responde el contrato y el CI está en verde.
**Resultado:** cerrado. AC1, AC2, AC7 y AC9 verificados; AC8 pendiente de empujar a GitHub.

### Qué costó más de lo esperado

**1. Un build que compila perfecto y no arranca.**

`nest start --watch` reportó `Found 0 errors` y acto seguido node murió con
`Cannot find module dist/main`. Compilación exitosa, cero archivos emitidos.

La causa es la interacción de dos opciones que por separado son razonables:
`deleteOutDir: true` en `nest-cli.json` borra `dist/` en cada arranque, pero tsc
guarda su caché incremental en `apps/api/tsconfig.tsbuildinfo` — **fuera** de
`dist/`. La caché sobrevive al borrado, tsc compara contra ella, concluye que
todo está al día y no emite nada.

Lo caro no fue arreglarlo sino leerlo: el mensaje de éxito y el de error vienen
del mismo comando, con tres segundos de diferencia, y el que miente es el de
éxito. Solución: quitar `incremental`. En watch mode el estado vive en memoria,
así que no se pierde velocidad. Está comentado en `apps/api/tsconfig.json` para
que nadie lo vuelva a activar sin saber esto.

**2. Prettier marcando archivos enteros sin una sola diferencia real.**

`prettier --check` falló en los tres markdown que ya existían en el repo. El
diff mostraba el archivo completo como modificado. No había ningún cambio de
contenido: los archivos estaban en CRLF (Windows) y Prettier emite LF.

Confirmado con `diff --strip-trailing-cr`, que devolvió cero diferencias.

Se arregló en la raíz —`.gitattributes` con `* text=auto eol=lf`— y no
apagando la regla en Prettier. Importa porque el CI corre en Linux: sin esto,
el CI se pone rojo por algo que en la máquina local se ve bien, que es
exactamente el tipo de fallo que quema una sesión de 4h.

### Qué costó menos de lo esperado

- **pnpm workspaces.** El link de `@triage/contracts` al API funcionó sin
  configuración extra, y `pnpm -r build` respetó el orden topológico solo.
- **NestJS.** El scaffold manual (8 archivos) fue más rápido que correr
  `nest new` y borrar lo que sobra.

### Decisiones tomadas

| Decisión                                        | Motivo                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `health.service.ts` aunque el spec no lo dibuja | Regla 5 de CLAUDE.md: lógica fuera de los controllers. Es el patrón que F2 va a necesitar.                           |
| Zod 4 con `z.iso.datetime()`                    | La forma del spec era de Zod 3 y está deprecada. Spec corregido.                                                     |
| ESLint 10, no 9                                 | La 9 ya instalaba con aviso de deprecada. `typescript-eslint@8` declara soporte para la 10.                          |
| Scaffold manual de Nest en vez de `nest new`    | Evita lockfile propio, Jest y config duplicada que T3 mandaba borrar igual.                                          |
| Sin repository pattern                          | No hay datos todavía. Un repository sobre nada es una interfaz vacía.                                                |
| Commit raíz vacío en `main`                     | Sin commits, `main` es una rama no nacida: ramificar la habría movido en vez de copiarla, dejando el PR sin destino. |

### Pendiente de decidir

- **ADR-0002 — repository vs. Prisma directo en los services.** Se resuelve al
  abrir F1, cuando exista una query real contra la que discutir. Inclinación
  actual: empezar sin repository, porque Prisma ya es una capa de acceso a
  datos y el punto de sutura que F2/F3 van a necesitar está alrededor del
  cliente del LLM, no de la base.

### Trampas para agregar al §8 del spec

Ninguna de las dos de arriba estaba documentada. Las dos son de entorno
Windows + monorepo, no de React Native, así que la lista de §8 se quedó corta
en una categoría entera.

---

## Reflexión de cierre — F0

Las tres preguntas del §10 del spec se responden **al cerrar la fase**, no
ahora: la sesión 1 no tocó una sola línea de React Native, así que la primera
pregunta todavía no tiene respuesta honesta.

- [ ] ¿Qué concepto de React Native se sintió más ajeno viniendo de React web?
- [ ] ¿Dónde se fue realmente el tiempo?
- [ ] ¿Qué haría distinto en F1?
