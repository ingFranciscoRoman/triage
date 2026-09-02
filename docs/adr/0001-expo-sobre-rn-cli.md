# ADR-0001 — Expo sobre React Native CLI

- **Fecha:** 2026-08-23
- **Estado:** Aceptada
- **Fase:** F0

---

## Contexto

Necesitamos elegir cómo inicializar la app móvil. Las dos opciones reales son
Expo (managed workflow) y React Native CLI (bare workflow).

Restricciones que pesan en esta decisión:

- El desarrollador tiene ~4h semanales. El tiempo es el recurso más escaso.
- Viene de React web; React Native ya es curva de aprendizaje suficiente por sí solo.
- No hay experiencia previa con Xcode ni con la cadena de build de Gradle.
- El objetivo primario es aprender React Native, no configurar toolchains nativas.
- En fases futuras (Ruta B, control parental) sí harán falta módulos nativos.

---

## Decisión

Usar **Expo con managed workflow**.

---

## Motivos

1. **Setup en minutos, no en sesiones.** RN CLI exige Android Studio, JDK, SDKs y
   —para iOS— macOS con Xcode y CocoaPods. Con 4h semanales, eso puede consumir
   dos sesiones completas antes de escribir una línea de producto.
2. **Expo Go permite probar en teléfono físico sin compilar.** Ciclo de feedback
   de segundos, que es exactamente lo que necesita un proyecto de ritmo lento.
3. **EAS Build compila en la nube.** Elimina la dependencia de tener una Mac para
   iOS, que de otro modo sería un bloqueante duro.
4. **La curva se concentra donde importa.** El aprendizaje se enfoca en el modelo
   de layout, `FlatList`, navegación y el ciclo de vida de RN — no en Gradle.
5. **`expo-router` da routing basado en archivos**, un modelo ya familiar.

---

## Alternativas consideradas

**React Native CLI (bare).** Descartada para F0. Da control total sobre el código
nativo, pero ese control no se necesita todavía y su costo de setup es alto justo
cuando la motivación es más frágil.

**Expo con prebuild / dev client.** No se descarta: es el camino de salida. Cuando
haga falta código nativo propio, `expo prebuild` genera las carpetas `ios/` y
`android/` y se recupera el control total sin migrar de framework.

---

## Consecuencias

**Positivas**

- F0 arranca en una sesión en vez de tres.
- El desarrollo se prueba en dispositivo real desde el día uno.
- No se requiere macOS para llegar a iOS.

**Negativas / aceptadas**

- Expo Go no soporta módulos nativos arbitrarios. Cuando haga falta uno, hay que
  pasar a development build.
- El bundle final es algo mayor que en bare RN. Irrelevante para uso personal.
- Se depende del ciclo de releases de Expo para versiones nuevas de RN.

**Señales de que hay que revisar esta decisión**

- Se necesita una librería nativa sin soporte en Expo.
- Se llega a la Ruta B (control parental), que requiere Swift y Kotlin propios.

En ambos casos la salida es `expo prebuild`, no reescribir el proyecto.
