# Módulo de Gestión de Residentes

## 📋 Descripción

Módulo completo de administración de residentes para la aplicación Comuniapp. Permite a los administradores gestionar de forma integral toda la información de los residentes de la comunidad.

## 🎯 Funcionalidades Principales

### ✅ Gestión Completa de Residentes

- **Crear** nuevos residentes con información completa
- **Visualizar** detalles de residentes existentes
- **Editar** información de residentes
- **Eliminar** residentes con confirmación

### 📊 Dashboard y Estadísticas

- Estadísticas en tiempo real (Total, Activos, Pendientes, Propietarios, Inquilinos)
- Filtros avanzados por nombre, estado, rol y edificio
- Búsqueda en tiempo real
- Tabla responsive con información clave

### 👤 Información Personal

- Datos básicos (nombre, apellidos, email, teléfono)
- Información de vivienda (apartamento, edificio)
- Estado del residente (activo, inactivo, pendiente)
- Rol (propietario, inquilino, invitado)
- Fechas de ingreso y salida
- Notas adicionales

### 🚨 Contactos de Emergencia

- Información completa del contacto de emergencia
- Relación con el residente
- Teléfono de contacto

### 🚗 Gestión de Vehículos

- Múltiples vehículos por residente
- Información detallada (marca, modelo, año, color, matrícula)
- Asignación de plazas de aparcamiento
- Añadir/eliminar vehículos dinámicamente

### 🐕 Gestión de Mascotas

- Múltiples mascotas por residente
- Tipos: perro, gato, ave, pez, otros
- Información de raza, peso, estado de vacunación
- Notas específicas por mascota
- Añadir/eliminar mascotas dinámicamente

### 📤 Exportación de Datos

- Exportar a CSV con todos los datos
- Exportar a JSON para integración con otros sistemas
- Filtros aplicados a la exportación

## 🎨 Interfaz de Usuario

### Diseño Responsivo

- Adaptable a dispositivos móviles, tablets y desktop
- Sidebar colapsable en móvil
- Tablas con scroll horizontal en dispositivos pequeños

### Modo Oscuro/Claro

- Soporte completo para ambos temas
- Transiciones suaves entre modos
- Persistencia de preferencias

### Accesibilidad

- Etiquetas aria apropiadas
- Navegación por teclado
- Contraste adecuado en ambos modos
- Tooltips informativos

## 🔧 Arquitectura Técnica

### Componentes

```
src/app/dashboard/residentes/
├── page.tsx                 # Página principal con tabla y filtros
└── README.md               # Documentación del módulo

src/components/residents/
├── ResidentModal.tsx       # Modal completo con tabs para CRUD
└── ExportButton.tsx        # Componente de exportación

src/types/
└── resident.ts             # Tipos TypeScript

src/data/
└── residents.ts            # Datos de ejemplo
```

### Tipos de Datos

- **Resident**: Información completa del residente
- **Vehicle**: Datos de vehículos
- **Pet**: Información de mascotas
- **ResidentFilters**: Filtros de búsqueda

### Estado de la Aplicación

- Estado local con React hooks
- Operaciones CRUD en memoria
- Filtros reactivos con useMemo

## 📱 Funcionalidades por Pantalla

### Vista Principal

- **Estadísticas**: 5 tarjetas con métricas clave
- **Filtros**: Búsqueda, estado, rol, edificio
- **Tabla**: Lista paginada con acciones
- **Acciones**: Ver, editar, eliminar por fila
- **Botones**: Crear nuevo, exportar datos

### Modal de Residente

- **4 Tabs**: Personal, Contacto, Vehículos, Mascotas
- **Modos**: Ver (solo lectura), Editar, Crear
- **Validación**: Campos requeridos marcados
- **Dinamismo**: Añadir/quitar vehículos y mascotas

## 🚀 Casos de Uso

### Administrador de Comunidad

1. **Registro de nuevo residente**
   - Crear perfil completo
   - Asignar apartamento y estado
   - Registrar contacto de emergencia

2. **Gestión de mudanzas**
   - Cambiar estado a inactivo
   - Establecer fecha de salida
   - Actualizar información

3. **Control de vehículos**
   - Asignar plazas de aparcamiento
   - Gestionar múltiples vehículos
   - Control de matrículas

4. **Registro de mascotas**
   - Control de vacunaciones
   - Información para emergencias
   - Cumplimiento de normativas

5. **Reportes y exportación**
   - Generar listados para juntas
   - Exportar datos para contabilidad
   - Backup de información

## 🔮 Futuras Mejoras

### Funcionalidades Planificadas

- [ ] Integración con base de datos real
- [ ] Carga masiva desde Excel/CSV
- [ ] Historial de cambios por residente
- [ ] Notificaciones automáticas
- [ ] Integración con sistema de pagos
- [ ] Generación de reportes PDF
- [ ] API REST para móvil
- [ ] Sistema de permisos por rol

### Mejoras de UX

- [ ] Paginación de tabla
- [ ] Ordenamiento por columnas
- [ ] Filtros avanzados con fechas
- [ ] Vista de tarjetas alternativa
- [ ] Búsqueda por código QR
- [ ] Fotos de residentes y mascotas

## 🛠️ Desarrollo

### Comandos

```bash
# Levantar servidor de desarrollo
cd apps/web
npx next@latest dev

# Verificar tipos
npx tsc --noEmit

# Linting
npx eslint src/
```

### Testing

```bash
# Ejecutar tests (cuando se implementen)
npm test

# Coverage
npm run test:coverage
```

## 📄 Licencia

Parte del proyecto Comuniapp - Sistema de gestión de comunidades.
