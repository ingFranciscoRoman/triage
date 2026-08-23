import { Text, View } from "react-native";

// Pantalla provisional de T5: solo demuestra que el bundle arranca y que las
// clases de NativeWind se aplican. Los tres estados (cargando / error / datos)
// llegan en T7, contra el endpoint real.
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-slate-900 px-6">
      <Text className="text-3xl font-bold text-slate-50">Triage</Text>
      <Text className="text-center text-slate-400">
        Si este texto se ve centrado y con color, NativeWind está funcionando.
      </Text>
    </View>
  );
}
