# SPEC F1a — Bandeja con datos simulados

**Proyecto:** Triage
**Fase:** F1a (primera mitad de F1)
**Duración estimada:** 2 sesiones (~8h)
**Estado:** No iniciada

> **Quién escribe el código.** Esta fase la implementa el desarrollador. El
> agente explica, revisa y señala trampas; no genera las pantallas. Es una
> decisión deliberada: la reflexión de cierre de F0 dice que lo que falta es
> práctica, y la práctica no se delega.

---

## 1. Objetivo

Que la app tenga su forma real —bandeja y detalle— con datos que llegan del API
pero son inventados. Sin base de datos y sin OAuth.

**Criterio de éxito en una frase:**

> Abro la app en mi teléfono, veo la bandeja del día, toco un correo y veo su
> detalle. Todos los datos vinieron del API.

---

## 2. Por qué esta fase existe

F1 en el roadmap original era "ingesta de correo: OAuth + Prisma". Al cerrar F0
las tres respuestas de la reflexión apuntaban a lo mismo: falta práctica de React
Native. F1 tal cual es la fase con **menos** React Native de todo el roadmap —es
casi toda backend—, así que se parte en dos y la mitad de UI va primero.

Hay una segunda razón, y es de diseño, no de pedagogía: **el contrato del correo
se define aquí, antes de que exista un esquema de base de datos.** Si Prisma va
primero, el contrato acaba siendo un reflejo de las tablas en vez de lo que la
pantalla necesita. Al revés, F1b tiene que amoldarse a un contrato que ya
demostró servir. Es la dirección correcta de la dependencia.

El coste: OAuth se aplaza y no se vuelve más fácil por esperar. Se acepta.

---

## 3. Alcance

### Dentro

- Contrato Zod del correo en `packages/contracts` (lista y detalle)
- `GET /emails` y `GET /emails/:id` en el API, con datos fijos en memoria
- Navegación de dos pantallas con expo-router: bandeja → detalle
- Lista con `FlatList`
- Los cuatro estados en la bandeja: cargando, error, **vacía**, con datos
- Los tres estados en el detalle, más el 404 cuando el id no existe

### Explícitamente FUERA

- Postgres / Prisma → F1b
- OAuth / Gmail → F1b
- Cualquier llamada a un LLM → F2
- Autenticación de usuarios → F1b
- Marcar como leído, archivar, o cualquier escritura → no hay dónde guardarlo
- Búsqueda, filtros, paginación → F1b o más tarde
- Tests unitarios → **F1b, a propósito.** Montar Jest en un monorepo pnpm es
  media sesión de configuración, y F0 ya enseñó lo que cuesta la fricción de
  setup. Van con F1b, donde además habrá lógica que valga la pena testear.

---

## 4. Estructura objetivo

Solo lo que cambia respecto de F0:

```
apps/
├── api/src/
│   └── emails/
│       ├── emails.controller.ts
│       ├── emails.service.ts
│       ├── emails.module.ts
│       └── emails.fixture.ts      ← los datos inventados, aislados
└── mobile/
    ├── app/
    │   ├── _layout.tsx            ← ya existe; aquí se configura el Stack
    │   ├── index.tsx              ← pasa de "health" a bandeja
    │   └── email/
    │       └── [id].tsx           ← ruta dinámica: pantalla de detalle
    ├── components/                ← nueva carpeta
    │   └── EmailListItem.tsx
    └── lib/
        └── api.ts                 ← se le añaden getEmails() y getEmail(id)

packages/contracts/src/
└── email.ts
```

`emails.fixture.ts` va en un archivo aparte por una razón concreta: en F1b se
borra entero y se sustituye por Prisma. Si los datos están incrustados en el
service, ese cambio toca lógica; si están aislados, es borrar un archivo.

---

## 5. Contrato compartido

La forma exacta la decide el desarrollador. Esta es la propuesta de partida y
las dos decisiones que hay detrás:

```ts
export const emailSchema = z.object({
  id: z.string(),
  from: z.object({ name: z.string(), address: z.email() }),
  subject: z.string(),
  snippet: z.string(),
  receivedAt: z.iso.datetime(),
  isRead: z.boolean(),
});

export const emailDetailSchema = emailSchema.extend({ body: z.string() });

export const emailListResponseSchema = z.object({
  emails: z.array(emailSchema),
});
```

**Por qué la lista va envuelta en un objeto y no es un array desnudo.** Un
`[...]` en la raíz no tiene dónde crecer: el día que haga falta paginación o un
contador hay que romper el contrato y tocar los dos lados. Un objeto admite
campos nuevos sin romper a nadie.

**Por qué lista y detalle son esquemas distintos.** La lista lleva `snippet`, el
detalle lleva `body` completo. Mandar el cuerpo de cincuenta correos para pintar
cincuenta líneas de dos renglones es tráfico tirado, y en un teléfono con datos
móviles se nota. `extend()` deja explícito que el detalle es la lista más algo,
sin duplicar campos.

---

## 6. Criterios de aceptación

| #   | Criterio                                                | Cómo se verifica                                                |
| --- | ------------------------------------------------------- | --------------------------------------------------------------- |
| AC1 | `GET /emails` devuelve datos que cumplen el contrato    | `curl localhost:3000/emails`                                    |
| AC2 | `GET /emails/:id` devuelve el detalle, y 404 si no está | `curl` con un id bueno y con uno inventado                      |
| AC3 | La bandeja lista los correos en el teléfono             | Escanear QR, ver la lista                                       |
| AC4 | Tocar un correo abre su detalle                         | Navegar y volver con el gesto del sistema                       |
| AC5 | La bandeja maneja los cuatro estados                    | Apagar el API → error; devolver `emails: []` → estado vacío     |
| AC6 | El detalle maneja el 404 sin crashear                   | Navegar a mano a `/email/no-existe`                             |
| AC7 | Toda respuesta se valida con Zod antes de usarse        | Romper el contrato en el API a propósito → la app muestra error |
| AC8 | `pnpm typecheck` y `pnpm lint` pasan, CI en verde       | CI                                                              |

---

## 7. Tareas

- [ ] T1 — `packages/contracts/src/email.ts` con los tres esquemas, exportado desde `index.ts`
- [ ] T2 — `emails.fixture.ts`: entre 5 y 8 correos inventados, alguno sin leer
- [ ] T3 — `EmailsModule` + service + controller con los dos endpoints
- [ ] T4 — El 404: devolver el error correcto cuando el id no existe
- [ ] T5 — `getEmails()` y `getEmail(id)` en `lib/api.ts`, reutilizando `fetchJson`
- [ ] T6 — `EmailListItem.tsx`: cómo se ve un correo en la lista
- [ ] T7 — Bandeja con `FlatList` y los cuatro estados
- [ ] T8 — `app/email/[id].tsx`: pantalla de detalle
- [ ] T9 — Configurar el `Stack` en `_layout.tsx`: títulos y botón de volver
- [ ] T10 — Anotar en `docs/BITACORA.md` lo que costó y por qué

---

## 8. Trampas conocidas

Escritas de antemano. Casi todas son cosas que en React web no existen.

**Texto suelto revienta.** En React Native todo string tiene que ir dentro de un
`<Text>`. Un `{email.subject}` colgando directo dentro de un `<View>` no es un
descuido de estilo: es un error en tiempo de ejecución. Es probablemente el error
número uno viniendo de web.

**`FlatList`, no `.map()`.** En web se mapea un array a `<li>` y ya. En un
teléfono, pintar toda la lista de golpe cuesta memoria y arranque. `FlatList`
solo monta lo que se ve y recicla filas al hacer scroll. Necesita `keyExtractor`
—el equivalente de `key`, pero como prop de la lista, no del hijo—.

**No hay `<a href>`.** La navegación de expo-router es por sistema de archivos,
como Next: `app/email/[id].tsx` crea la ruta `/email/:id`. Se navega con `<Link>`
o con `router.push()`. `app/_layout.tsx` es el análogo del layout de Next.

**`useLocalSearchParams` siempre devuelve texto.** El `id` de la URL llega como
`string` (o `string[]`, si la ruta se repite). No confíes en el tipo que te
imaginas: valídalo. Es exactamente la misma disciplina que ya aplicas a las
respuestas del API, pero en un sitio donde es fácil olvidarla.

**`Pressable`, no `onClick`.** Y no hay `:hover`: en un teléfono no hay puntero.
El feedback táctil se hace con el estado `pressed` o con `active:` en NativeWind
—ya lo usaste en el botón de reintentar de F0—.

**El notch y la barra de estado.** Sin `react-native-safe-area-context` —ya está
instalado— el contenido se mete debajo del reloj y de la barra de gestos. En web
esto sencillamente no existe.

**Fechas.** Antes de usar `Intl.DateTimeFormat` o `toLocaleDateString`,
compruébalo en el teléfono, no en Expo Web. Hermes no es un navegador y su
soporte de `Intl` depende de cómo se compiló. Si no funciona, formatear a mano es
aceptable en F1a; una librería de fechas es una decisión que merece pensarse.

**El estado vacío es un estado, no un caso raro.** Una lista vacía y una lista
que aún no llegó se ven igual si no las distingues: pantalla en blanco. Son
cosas distintas y el usuario tiene que poder notarlo. Por eso aquí son cuatro
estados y no tres.

---

## 9. Definition of Done

- [ ] Los 8 criterios de aceptación se cumplen
- [ ] CI en verde
- [ ] Mergeado a `main`
- [ ] `CLAUDE.md` actualizado: la sección "Estado actual" apunta a F1b
- [ ] Anotado en `docs/BITACORA.md`: qué costó más de lo esperado y por qué
- [ ] ¿Hizo falta algún ADR? Si se eligió librería de fechas o de estado, sí

---

## 10. Reflexión al cerrar

Responder en la bitácora, en 3 o 4 líneas:

1. ¿Qué se sintió distinto al escribir tú el código en vez de leerlo?
2. ¿Qué concepto de React Native tuviste que buscar más de una vez?
3. ¿El contrato que definiste en T1 aguantó hasta T8, o tuviste que cambiarlo?
