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

## 2026-09-01 — F0, sesión 2: el móvil

**Objetivo:** T5–T9 y T14. La app corre en un teléfono real y muestra datos del API.
**Resultado:** cerrado. AC3–AC6 verificados en un Android físico. Queda AC8.

### Qué costó más de lo esperado

**1. Una pantalla en blanco que no era culpa del código.**

La app cargaba en el teléfono y no pintaba nada. Blanco puro, sin texto, sin
error, sin nada en la terminal de Metro.

Se descartó por partes, con evidencia en cada paso: la red (el bundle bajaba),
el bundle (9 MB, HTTP 200, y contenía `"Consultando el API"`, `"Reintentar"` y
la IP ya sustituida), los assets de `app.json` (los siete existían), el babel
(`babel-preset-expo` inyecta worklets y reanimated solo, verificado en su
`build/index.js`) y el `_layout.tsx`.

La causa era **Expo Go desactualizado**. Trae compilado dentro el nativo de un
SDK concreto; el del teléfono no era el 57. Lo brutal es la asimetría: en iOS
Expo Go lo dice con una pantalla de error explícita, y en Android **se queda en
blanco sin decir nada**. El mismo fallo, un diagnóstico regalado y otro mudo.

Se resolvió instalando el APK de Expo Go para SDK 57.

**2. Un build verde sobre código que nunca se ejecutó.**

Al terminar T6 el bundle de Metro salía con el mismo hash que antes de escribir
`lib/api.ts`. Nada lo importaba todavía, así que Metro no lo incluía: el archivo
compilaba, linteaba y no existía para la app.

Se verificó de verdad importándolo temporalmente desde la pantalla: 1659 módulos
frente a 1577, y `ZodError` y `healthResponseSchema` presentes en el `.hbc`.
Después se revirtió.

La lección: **un build en verde no es una verificación**. Dice que lo que se
compiló compila, no que se haya compilado lo que crees.

**3. Un `.finally()` que congelaba la pantalla pasando typecheck y lint.**

El primer intento de T7 hacía `.then(...).catch(...).finally(() => setState({
status: "loading" }))`. `finally` corre siempre, también en el camino feliz, así
que la pantalla volvía a "cargando" justo después de recibir los datos y se
quedaba ahí para siempre.

Ni `tsc` ni ESLint dicen nada: es código perfectamente válido con la semántica
equivocada. El `.catch()` además estaba muerto —`getHealth()` no lanza nunca,
devuelve el fallo dentro del `ApiResult`—, que es precisamente el punto de haber
elegido resultados sobre excepciones.

**4. Dos veces apunté a la causa equivocada antes de mirar la evidencia.**

Vale la pena dejarlo escrito porque es lo que más se repitió:

- Ante el timeout, culpé al **firewall** —está en la lista de trampas del spec y
  el síntoma encajaba—. Al inspeccionar las reglas apareció una que permitía TCP
  3000 en cualquier perfil. Era DHCP: la IP había cambiado. Un
  `Test-NetConnection` de diez segundos lo habría dicho al principio.
- Ante la pantalla blanca, sospeché de `experiments.reactCompiler: true`. Era
  Expo Go. Si lo hubiera apagado antes de comprobar, "se arreglaba" al
  reinstalar Expo Go y quedaba un cambio injustificado en el proyecto más una
  conclusión falsa en esta bitácora.

En ambos casos la evidencia estaba a un comando de distancia. **La hipótesis
plausible que llega antes que la evidencia es cara**, porque hace perder el tiro
y contamina lo que se escribe después.

### Trampas de entorno, sin relación con React Native

- **Dependencia fantasma.** Metro no resolvía
  `react-native-css-interop/jsx-runtime`. NativeWind la usa pero no la expone, y
  pnpm no aplana `node_modules`. Se declaró explícitamente en el `package.json`
  del móvil.
- **Un `.d.ts` gitignorado que solo habría roto el CI.** `import "../global.css"`
  daba `TS2882`; la declaración de `*.css` vive en `expo/types`, alcanzable solo
  vía el `expo-env.d.ts` generado, que está en `.gitignore`. En local pasaba
  porque el archivo existía; en un checkout limpio no. Se versionó
  `apps/mobile/env.d.ts`.
- **Archivos que son de la máquina, no tuyos.** NativeWind regenera
  `nativewind-env.d.ts` y reescribe `tsconfig.json` en cada corrida de Metro
  (por eso depende de `comment-json`). Se intentó borrar uno y limpiar el otro;
  los dos volvieron. Se adaptó el `.prettierignore` en vez de pelear.
- **corepack no sabe ejecutar pnpm 12.** Se autoactualizó, escribió el
  `packageManager` nuevo y a partir de ahí ningún comando arrancaba:
  `Cannot find module .../bin/pnpm.cjs`. corepack lleva esa ruta hardcodeada y
  pnpm 12 pasó a ESM (`bin/pnpm.mjs`). Y aunque la ruta fuera correcta tampoco
  funcionaría: pnpm 12 es una reescritura en Rust cuyo binario llega por un
  `preinstall` que corepack no ejecuta. Se volvió a 11.12.0 —la versión del
  lockfile y de todos los commits— en vez de cambiar de gestor a mitad de fase.

### Qué costó menos de lo esperado

- **NativeWind.** Una vez resuelta la dependencia fantasma, `className` funcionó
  igual que Tailwind en web. La configuración es puntillosa pero es de una vez.
- **La unión discriminada para el estado de pantalla.** Hizo los tres estados
  del spec una consecuencia del tipo en vez de disciplina de quien escribe.

### Decisiones tomadas

| Decisión                                             | Motivo                                                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ApiResult<T>` en vez de excepciones                 | Una excepción se puede olvidar de atrapar; el resultado obliga a mirar `ok` antes de tocar `data`, y el compilador no deja saltárselo. |
| `AbortController` a mano, no `AbortSignal.timeout()` | El runtime es Hermes, no un navegador; el helper estático no siempre está.                                                             |
| `payload: unknown`, nunca `any`                      | Con `any` el error viaja hasta la pantalla; con `unknown` el compilador obliga a pasar por Zod.                                        |
| `pnpm dev` solo levanta el backend                   | `expo start` es interactivo: bajo `--parallel` ningún proceso controla stdin y Metro pierde `w`, `a`, `r`, `j`.                        |
| Volver a pnpm 11.12.0                                | Cambiar de gestor de paquetes a mitad de fase es scope creep, y pnpm 12 podría regenerar el lockfile que valida el CI.                 |

---

## Reflexión de cierre — F0

Las tres preguntas del §10 del spec. **Las responde el desarrollador**, no la
herramienta: el valor está en lo que él note, no en lo que yo deduzca.

- [x] **¿Qué concepto de React Native se sintió más ajeno viniendo de React web?**

  El maquetado: las etiquetas son distintas. La implementación de hooks es
  parecida, pero aún me falta práctica. Necesito practicar y aprender los
  conceptos, que también es importante.

- [x] **¿Dónde se fue realmente el tiempo?**

  En la implementación de la lógica. Me costó mucho. Necesito practicar.

- [x] **¿Qué haría distinto en F1?**

  Necesito recordar para poder aprender.
