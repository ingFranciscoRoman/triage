import { Stack } from "expo-router";

// NativeWind necesita que la hoja de estilos se importe una sola vez, en la
// raíz del árbol. Metro la procesa con Tailwind y la convierte en estilos
// nativos; no es un <link> de CSS como en web.
import "../global.css";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
