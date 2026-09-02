# Triage

Asistente móvil de triage de correo. Clasifica correos de trabajo y muestra qué
requiere acción hoy.

**Fase actual: F0 — vertical slice.** Hoy la app hace una sola cosa: pide
`GET /health` al API y muestra la respuesta. No hay base de datos, ni correo, ni
IA. El objetivo de F0 es que la tubería completa —móvil, red, API, contrato
compartido— funcione de punta a punta en un teléfono real.

---

## Requisitos

|          |                                                                           |
| -------- | ------------------------------------------------------------------------- |
| Node     | >= 22                                                                     |
| pnpm     | 11.12.0 (lo fija `packageManager`; con corepack no hace falta instalarlo) |
| Expo Go  | **la versión que soporta SDK 57** — ver [Expo Go](#expo-go)               |
| Teléfono | En la **misma red WiFi** que el PC                                        |

---

## Arranque

```bash
pnpm install
```

Copia la plantilla de entorno y pon la IP de tu PC:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Para averiguar tu IP de red local:

```bash
# Windows (PowerShell)
Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi"

# macOS
ipconfig getifaddr en0

# Linux
hostname -I
```

Edita `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

Luego, **dos terminales**:

```bash
# Terminal 1 — backend
pnpm dev          # contracts (tsc --watch) + api en :3000

# Terminal 2 — móvil
pnpm dev:mobile   # Metro en :8081
```

En la terminal de Metro: escanea el QR con Expo Go, o pulsa `a` para el emulador
de Android, `i` para el simulador de iOS, `w` para el navegador.

Comprobación rápida de que el API responde:

```bash
curl http://localhost:3000/health
# {"status":"ok","message":"Triage API viva","timestamp":"..."}
```

### Por qué el móvil va en su propia terminal

`expo start` no es solo un servidor: es una interfaz que escucha el teclado. Si
los tres procesos comparten terminal, ninguno controla stdin y Metro pierde sus
atajos (`w`, `a`, `r`, `j`). Por eso `pnpm dev` levanta solo el backend.

---

## Comandos

```bash
pnpm dev            # contracts + api en watch
pnpm dev:mobile     # Expo / Metro
pnpm build          # compila todos los paquetes en orden topológico
pnpm typecheck      # tsc --noEmit en cada paquete
pnpm lint           # ESLint
pnpm format         # Prettier --write
pnpm format:check   # lo que valida el CI
```

Antes de dar cualquier cosa por lista: `pnpm typecheck && pnpm lint`.

---

## Estructura

```
apps/api              NestJS — toda la lógica de negocio y de IA
apps/mobile           Expo — vista y estado de UI, nada más
packages/contracts    Esquemas Zod compartidos (fuente única de verdad)
docs/adr              Architecture Decision Records
docs/specs            Specs por fase
docs/BITACORA.md      Qué costó más de lo esperado y por qué
```

El contrato vive en `packages/contracts` y lo importan **los dos** lados. El API
valida su respuesta a la salida; el móvil la valida a la entrada. Ninguno confía
en el otro — es la regla que hace posible F2.

Las reglas no negociables del proyecto están en [`CLAUDE.md`](CLAUDE.md).

---

## Expo Go

**Este proyecto usa Expo SDK 57.** Expo Go no es un contenedor genérico: trae
compilado dentro el código nativo de un SDK concreto. Un Expo Go de un SDK
anterior no puede correr este proyecto.

| Plataforma | Síntoma si la versión no coincide                                           |
| ---------- | --------------------------------------------------------------------------- |
| iOS        | Pantalla de error: _"Project is incompatible with this version of Expo Go"_ |
| Android    | **Pantalla en blanco, sin ningún mensaje**                                  |

El caso de Android es el que hace perder tiempo, porque parece un error de tu
código. Si la app carga en blanco y el bundle se descargó sin errores, sospecha
primero de la versión de Expo Go.

Actualiza desde la tienda. Si la tienda no ofrece la versión que necesitas
—suele pasar en iOS antiguo, porque Expo sube el mínimo de iOS con el tiempo—
descarga el APK correspondiente al SDK desde
[expo.dev/go](https://expo.dev/go), o usa el emulador.

---

## Cuando algo falla

**La app da timeout de 8 segundos.** Casi siempre la IP del `.env` ya no es la
tuya: la asigna el router por DHCP y cambia sola. Vuelve a comprobarla.

El tiempo del fallo te dice de qué lado mirar:

| Síntoma               | Causa                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| Falla **al instante** | El PC responde, pero no hay nada escuchando en el 3000. El API está caído. |
| **Se cuelga** 8s      | Nadie contesta en esa dirección. IP equivocada, otra red, o firewall.      |

**Cambiaste el `.env` y no pasa nada.** Babel sustituye `EXPO_PUBLIC_API_URL` en
tiempo de build, no en runtime. Hay que reiniciar Metro limpiando caché:

```bash
pnpm dev:mobile --clear
```

**El teléfono no carga el bundle.** Son dos conexiones distintas: el **8081**
para descargar el JavaScript y el **3000** para hablar con el API. Si el bundle
no baja, el problema es el 8081, no tu código.

**El firewall.** La primera vez, Windows suele pedir permiso para abrir el
puerto 3000. Si el `curl` local funciona y desde el teléfono no, revisa que
exista la regla de entrada.

---

## Documentación

- [`docs/specs/SPEC-F0-vertical-slice.md`](docs/specs/SPEC-F0-vertical-slice.md) — alcance y criterios de aceptación de la fase actual
- [`docs/adr/`](docs/adr) — decisiones de arquitectura y por qué se descartaron las alternativas
- [`docs/BITACORA.md`](docs/BITACORA.md) — las trampas que ya costaron tiempo, para no repetirlas
