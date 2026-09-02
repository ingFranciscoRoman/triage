import { healthResponseSchema, type HealthResponse } from "@triage/contracts";
import type { ZodType } from "zod";

// Si el API no contesta en este tiempo, nos rendimos. En un teléfono es
// imprescindible: si la IP es la equivocada o el firewall bloquea el puerto,
// fetch se queda colgado indefinidamente y la pantalla nunca sale de "cargando".
const REQUEST_TIMEOUT_MS = 8000;

// Expo NO lee esto en runtime. Babel sustituye literalmente la expresión
// `process.env.EXPO_PUBLIC_API_URL` por su valor al construir el bundle, así
// que un acceso dinámico (process.env[nombre]) devolvería undefined siempre.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Los errores se distinguen por causa, no por mensaje. La pantalla decide qué
 * mostrar según `kind`, sin tener que leer strings.
 */
export type ApiError =
  | { kind: "config"; message: string }
  | { kind: "network"; message: string }
  | { kind: "http"; status: number; message: string }
  | { kind: "contract"; message: string; issues: string[] };

/**
 * Devolvemos el error en vez de lanzarlo. Una excepción se puede olvidar de
 * atrapar; un `ApiResult` obliga a mirar `ok` antes de tocar `data`, y el
 * compilador no deja saltárselo. Es lo que hace que los tres estados de la UI
 * sean una consecuencia del tipo y no de la disciplina de quien escribe.
 */
export type ApiResult<T> =
  { ok: true; data: T } | { ok: false; error: ApiError };

async function fetchJson<T>(
  path: string,
  schema: ZodType<T>,
): Promise<ApiResult<T>> {
  if (!BASE_URL) {
    return {
      ok: false,
      error: {
        kind: "config",
        message:
          "Falta EXPO_PUBLIC_API_URL. Créala en apps/mobile/.env con la IP LAN de tu PC.",
      },
    };
  }

  // AbortController a mano en vez de AbortSignal.timeout(): el runtime de
  // React Native es Hermes, no un navegador, y su implementación de las APIs
  // web va por detrás. AbortController sí está; el helper estático no siempre.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
  } catch {
    // fetch solo lanza si la petición no llegó a completarse: DNS, conexión
    // rechazada, timeout. Un 404 o un 500 NO pasan por aquí.
    return {
      ok: false,
      error: {
        kind: "network",
        message: controller.signal.aborted
          ? `El API no respondió en ${REQUEST_TIMEOUT_MS / 1000}s (${BASE_URL}).`
          : `No se pudo contactar al API en ${BASE_URL}. ¿Está corriendo y estás en la misma WiFi?`,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        kind: "http",
        status: response.status,
        message: `El API respondió ${response.status}.`,
      },
    };
  }

  // `unknown` y no `any`: lo que viene por la red no tiene tipo hasta que Zod
  // lo valide. Tiparlo antes sería mentirle al compilador.
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        kind: "contract",
        message: "La respuesta del API no era JSON válido.",
        issues: [],
      },
    };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        kind: "contract",
        message: "La respuesta del API no cumple el contrato.",
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`,
        ),
      },
    };
  }

  return { ok: true, data: parsed.data };
}

export function getHealth(): Promise<ApiResult<HealthResponse>> {
  return fetchJson("/health", healthResponseSchema);
}
