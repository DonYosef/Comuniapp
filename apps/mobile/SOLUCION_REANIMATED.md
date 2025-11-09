# Solución: Error "Cannot read property 'Drawer' of undefined"

## Problema

Después de agregar `react-native-reanimated` y `@react-navigation/drawer`, aparece el error:

```
ERROR [TypeError: Cannot read property 'Drawer' of undefined]
```

## Solución

### 1. Verificar configuración de Babel

El archivo `babel.config.js` debe tener el plugin de Reanimated como **último plugin**:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // Debe ser el último
  };
};
```

### 2. Verificar imports en `app/_layout.tsx`

El archivo debe importar los módulos nativos al inicio:

```typescript
import 'react-native-gesture-handler';
import 'react-native-reanimated'; // Importar para inicializar el módulo nativo
import { Stack } from 'expo-router';
// ... resto de imports
```

### 3. Reiniciar el servidor con caché limpia

**IMPORTANTE**: Después de agregar el plugin de Babel, debes reiniciar el servidor con caché limpia:

```bash
# Detener el servidor actual (Ctrl+C)

# Reiniciar con caché limpia
cd apps/mobile
pnpm start --clear

# O si usas npm
npm start -- --clear
```

### 4. Si el problema persiste

1. **Limpiar caché de Metro completamente**:

   ```bash
   cd apps/mobile
   pnpm start --clear
   ```

2. **Limpiar caché de node_modules** (si es necesario):

   ```bash
   cd apps/mobile
   rm -rf node_modules
   pnpm install
   ```

3. **Verificar que las dependencias estén instaladas**:
   ```bash
   cd apps/mobile
   pnpm list react-native-reanimated react-native-gesture-handler @react-navigation/drawer
   ```

### 5. Para desarrollo en Android

Si estás usando Android, después de reiniciar el servidor, es posible que necesites reconstruir la app:

```bash
# Limpiar build de Android
cd apps/mobile
npx expo run:android --clear
```

### 6. Verificar que el plugin esté funcionando

El plugin de Reanimated debe procesar el código. Si ves errores relacionados con `worklet`, significa que el plugin no está funcionando correctamente.

## Notas importantes

- El plugin `react-native-reanimated/plugin` **DEBE ser el último** en la lista de plugins de Babel
- El import de `react-native-reanimated` debe estar **antes** de cualquier código que lo use
- Siempre reinicia el servidor con `--clear` después de cambiar `babel.config.js`
- En Expo, no necesitas hacer `pod install` o rebuild nativo, pero sí necesitas reiniciar con caché limpia

## Verificación

Después de seguir estos pasos, el Drawer debería funcionar correctamente sin errores.
