import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/.expo/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Regla no negociable 4 de CLAUDE.md. Explícita aunque recommended ya la
      // active, para que quede claro que es una decisión y no un default.
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Los archivos de configuración de la app móvil (babel, metro, tailwind)
    // son CommonJS y corren en Node, no en el bundle de React Native. Sin
    // esto, ESLint los lee como módulos de navegador y marca `module`,
    // `require` y `__dirname` como variables no definidas.
    files: ["**/*.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Va al final: apaga las reglas de estilo que chocarían con Prettier.
  prettier,
);
