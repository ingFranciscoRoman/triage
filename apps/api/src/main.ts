import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // CORS abierto: en F0 el único consumidor es el móvil en desarrollo.
  // React Native no aplica la política de mismo origen, pero Expo Web sí,
  // así que sin esto la app deja de funcionar en cuanto la abres en el navegador.
  // Esto se cierra a orígenes concretos en F4.
  app.enableCors({ origin: true });

  // 0.0.0.0 en vez de localhost: si Nest solo escucha en la interfaz de
  // loopback, el teléfono físico no lo alcanza aunque esté en la misma WiFi.
  await app.listen(PORT, "0.0.0.0");
}

void bootstrap();
