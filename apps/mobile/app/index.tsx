import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { HealthResponse } from "@triage/contracts";

import { getHealth, type ApiError } from "../lib/api";

type ScreenState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; data: HealthResponse };

/**
 * Qué hacer ante cada tipo de fallo. Vive fuera del componente porque no
 * depende de props ni de estado: dado un error, siempre devuelve lo mismo.
 *
 * El switch es exhaustivo y TypeScript lo sabe: si mañana añades un `kind`
 * nuevo a ApiError y olvidas cubrirlo aquí, el typecheck falla.
 */
function hintFor(error: ApiError): string {
  switch (error.kind) {
    case "config":
      return "Copia .env.example a .env y reinicia Metro con --clear.";
    case "network":
      return "¿Está corriendo `pnpm --filter api dev`? El teléfono y el PC deben estar en la misma WiFi.";
    case "http":
      return `El API está vivo pero devolvió ${error.status}. Revisa su terminal.`;
    case "contract":
      return error.issues.length > 0
        ? `Campos que fallaron: ${error.issues.join(", ")}`
        : "La respuesta no tenía la forma esperada.";
  }
}

export default function Index() {
  const [state, setState] = useState<ScreenState>({ status: "loading" });

  // Cambiar este número vuelve a disparar el efecto. Es la forma limpia de
  // hacer un "reintentar" sin duplicar la lógica de carga fuera del efecto.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    // En desarrollo, Strict Mode monta el componente dos veces a propósito.
    // Sin esta bandera, la respuesta de la petición abandonada puede llegar
    // tarde y pisar a la buena.
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });

      // getHealth() no lanza nunca: devuelve el fallo dentro del resultado.
      // Por eso aquí no hay try/catch ni .catch() — ese es el pago de que
      // lib/api.ts trabaje con ApiResult en vez de con excepciones.
      const result = await getHealth();
      if (cancelled) return;

      setState(
        result.ok
          ? { status: "ready", data: result.data }
          : { status: "error", error: result.error },
      );
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-slate-900 px-6">
      <Text className="text-3xl font-bold text-slate-50">Triage</Text>

      {state.status === "loading" && (
        <>
          <ActivityIndicator size="large" color="#94a3b8" />
          <Text className="text-slate-400">Consultando el API…</Text>
        </>
      )}

      {state.status === "error" && (
        <View className="items-center gap-2">
          <Text className="text-center text-lg font-semibold text-red-400">
            {state.error.message}
          </Text>
          <Text className="text-center text-sm text-slate-500">
            {hintFor(state.error)}
          </Text>
        </View>
      )}

      {state.status === "ready" && (
        <View className="items-center gap-1">
          <Text className="text-center text-xl text-slate-50">
            {state.data.message}
          </Text>
          <Text className="text-xs text-slate-500">{state.data.timestamp}</Text>
        </View>
      )}

      {state.status !== "loading" && (
        <Pressable
          onPress={() => setReloadToken((n) => n + 1)}
          className="mt-2 rounded-lg bg-slate-700 px-5 py-3 active:bg-slate-600"
        >
          <Text className="font-semibold text-slate-50">Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}
