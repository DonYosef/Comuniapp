const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para resolver problemas de rutas en Windows
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'jsx', 'js', 'ts', 'tsx'],
  blockList: [
    // Ignorar directorios de otras apps que no deberían ser observados
    /apps\/api\/dist\/.*/,
    /apps\/api\/node_modules\/.*/,
    /apps\/web\/dist\/.*/,
    /apps\/web\/\.next\/.*/,
    /apps\/web\/node_modules\/.*/,
  ],
};

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Configurar qué ignorar durante el watch
config.watchFolders =
  config.watchFolders?.filter((folder) => {
    // No observar directorios dist o apps/api
    return !folder.includes('dist') && !folder.includes('apps/api') && !folder.includes('apps/web');
  }) || [];

module.exports = config;
