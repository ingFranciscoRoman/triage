const path = require("node:path");

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// --- Configuración de monorepo -------------------------------------------
// Metro solo vigila la carpeta del proyecto. Sin esto, editar
// packages/contracts no dispara recarga y, peor, el bundler ni siquiera
// encuentra el paquete.
config.watchFolders = [workspaceRoot];

// pnpm no aplana node_modules: cada paquete ve solo sus dependencias
// declaradas, y las reales viven en .pnpm/. Metro necesita saber en qué
// carpetas buscar, en orden.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Nota: NO ponemos disableHierarchicalLookup = true. Es la receta habitual en
// monorepos de npm/yarn, pero con pnpm rompe: el linker aislado depende
// justamente de la búsqueda jerárquica por node_modules anidados.

module.exports = withNativeWind(config, { input: "./global.css" });
