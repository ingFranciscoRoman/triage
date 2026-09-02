import { Injectable } from "@nestjs/common";
import { healthResponseSchema, type HealthResponse } from "@triage/contracts";

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    // parse() en la salida, no solo en la entrada: el API tampoco confía en sí
    // mismo. Si alguien rompe el contrato desde este lado, revienta acá —
    // en el servidor, con stack trace— y no silenciosamente en el móvil.
    return healthResponseSchema.parse({
      status: "ok",
      message: "Triage API viva",
      timestamp: new Date().toISOString(),
    });
  }
}
