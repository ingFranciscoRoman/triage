// Tipos de ambiente del proyecto móvil. Versionado a propósito.
//
// Expo genera `expo-env.d.ts` con la primera referencia al arrancar, pero ese
// archivo está en .gitignore: en un checkout limpio (o sea, en el CI) no
// existe, y `tsc --noEmit` falla con TS2882 al ver `import "../global.css"`.
// Declararlo aquí hace que el typecheck no dependa de haber corrido `expo start`.
/// <reference types="expo/types" />

// Enseña a TypeScript qué significa `className` en los componentes de RN.
/// <reference types="nativewind/types" />
