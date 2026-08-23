import { z } from "zod";

/**
 * Contrato de GET /health.
 *
 * Fuente única de verdad: el API construye su respuesta contra este esquema y
 * el móvil valida lo que recibe contra este mismo esquema. Si los dos lados
 * dejan de estar de acuerdo, el typecheck lo detecta antes que el runtime.
 */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  message: z.string(),
  timestamp: z.iso.datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
