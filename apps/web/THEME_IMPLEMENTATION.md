# 🎨 Implementación del Sistema de Temas

## Archivos Modificados

### 1. `tailwind.config.ts`

**Cambio crítico**: Se agregó `darkMode: 'class'` para habilitar el modo oscuro basado en clases.

```typescript
darkMode: 'class', // Habilita el modo oscuro basado en clase
```

**¿Por qué era necesario?**: Sin esta configuración, Tailwind solo responde a la preferencia del sistema operativo (`prefers-color-scheme`), no a las clases CSS. Esto impedía que el cambio manual de tema funcionara.

### 2. `app/layout.tsx`

**Cambio crítico**: Se agregó un script inline en el `<head>` que se ejecuta ANTES del renderizado de React.

```tsx
<head>
  <script dangerouslySetInnerHTML={{...}}>
    // Script que aplica el tema inmediatamente desde localStorage
  </script>
</head>
```

**¿Por qué era necesario?**:

- Previene el "flash" de contenido con tema incorrecto al cargar la página
- Aplica el tema al elemento `<html>` antes de que React se monte
- Sincroniza el estado inicial con localStorage

### 3. `hooks/useTheme.tsx`

**Mejoras realizadas**:

- Función `getInitialResolvedTheme()` para leer el tema actual del DOM
- Sincronización correcta entre el script de inicialización y el estado de React
- Guards de seguridad para SSR (`typeof window === 'undefined'`)

## 📋 Cómo Probar

### Prueba Básica

1. Abre la aplicación en tu navegador
2. Haz clic en el botón de tema en el Header (icono de luna/sol)
3. Verifica que:
   - El fondo cambia de blanco a gris oscuro (y viceversa)
   - El texto cambia de color apropiadamente
   - Los componentes respetan los colores del tema
   - El icono cambia entre luna (☾) y sol (☀)

### Prueba de Persistencia

1. Cambia el tema a oscuro
2. Recarga la página (F5)
3. El tema oscuro debe permanecer activo

### Prueba de DevTools

1. Abre DevTools (F12)
2. Ve a la consola y ejecuta:

```javascript
// Ver el tema actual guardado
localStorage.getItem('comuniapp-theme');

// Ver las clases del elemento HTML
document.documentElement.classList;

// Cambiar tema manualmente
localStorage.setItem('comuniapp-theme', 'dark');
location.reload();
```

### Verificar en Diferentes Componentes

Visita diferentes secciones de la aplicación:

- Dashboard principal
- Residentes
- Comunidades
- Gastos comunes

Todos deben respetar el tema seleccionado.

## 🔧 Cómo Usar en Nuevos Componentes

```tsx
'use client';

import { useTheme } from '@/hooks/useTheme';

export default function MiComponente() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-gray-800">
      <p className="text-gray-900 dark:text-gray-100">Tema actual: {resolvedTheme}</p>
      <button onClick={toggleTheme}>Cambiar tema</button>
    </div>
  );
}
```

## 🐛 Troubleshooting

### El tema no cambia visualmente

1. Verifica que `tailwind.config.ts` tenga `darkMode: 'class'`
2. Asegúrate de usar clases `dark:*` de Tailwind
3. Verifica en DevTools que el elemento `<html>` tenga la clase `dark` o `light`

### El tema no persiste al recargar

1. Verifica que localStorage esté habilitado en tu navegador
2. Abre DevTools → Application → Local Storage
3. Busca la clave `comuniapp-theme`

### Flash de contenido al cargar

1. Verifica que el script en `layout.tsx` esté en el `<head>`
2. Asegúrate que `suppressHydrationWarning` esté en el elemento `<html>`

## 📚 Estructura del Sistema

```
Inicialización:
1. Script inline (layout.tsx) → Lee localStorage → Aplica clase al <html>
2. React se monta
3. ThemeProvider → Lee localStorage → Sincroniza estado
4. useTheme hook → Proporciona funciones de control

Cambio de Tema:
1. Usuario hace clic en botón
2. toggleTheme() se ejecuta
3. Hook actualiza estado y DOM
4. Se guarda en localStorage
5. CSS de Tailwind aplica estilos
```

## ✅ Checklist de Funcionalidades

- [x] Cambio manual de tema (light/dark)
- [x] Persistencia en localStorage
- [x] Sin flash de contenido al cargar
- [x] Detección de preferencia del sistema (modo 'system')
- [x] Transiciones suaves entre temas
- [x] Accesibilidad (aria-label, title)
- [x] TypeScript con tipado completo
- [x] SSR-safe (Next.js App Router)
- [x] Iconos visuales (luna/sol)

## 🎯 Próximas Mejoras (Opcionales)

- [ ] Dropdown con 3 opciones: Light / Dark / System
- [ ] Animación de transición del icono
- [ ] Sincronización de tema por usuario en backend
- [ ] Selector de colores de acento
- [ ] Modo de alto contraste
