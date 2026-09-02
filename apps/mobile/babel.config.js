module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: "nativewind" es lo que hace que className funcione en
      // componentes de React Native. Sin esto, className es una prop que nadie
      // lee y los estilos simplemente no aparecen — sin ningún error.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
