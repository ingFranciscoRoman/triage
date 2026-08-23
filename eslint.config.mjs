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
  // Va al final: apaga las reglas de estilo que chocarían con Prettier.
  prettier,
);
