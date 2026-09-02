// Tipos de ambiente del proyecto móvil. Versionado a propósito.
//
// Expo genera `expo-env.d.ts` con esta misma referencia al arrancar, pero ese
// archivo está en .gitignore: en un checkout limpio (o sea, en el CI) no
// existe, y `tsc --noEmit` falla con TS2882 al ver `import "../global.css"`
// —la declaración de *.css vive en expo/types—. Declararlo aquí hace que el
// typecheck no dependa de haber corrido `expo start` antes.
/// <reference types="expo/types" />

// Los tipos de NativeWind (el `className` en componentes de RN) NO van aquí:
// NativeWind genera y mantiene `nativewind-env.d.ts` en cada corrida de Metro.
//
// Nota sobre tsconfig.json: no le pongas comentarios. Tanto Expo como
// NativeWind lo reescriben al arrancar Metro (añaden entradas a `include`) y
// en el proceso los borran. El alias "@/*" apunta a la raíz del paquete
// porque seguimos la estructura del spec (app/ y lib/), no el src/ que trae
// el template de SDK 57.
