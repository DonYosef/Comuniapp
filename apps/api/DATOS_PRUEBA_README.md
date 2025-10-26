# 📊 Datos de Prueba - Comuniapp

## 🎯 Resumen de Datos Creados

Se han creado **2 comunidades completas** con todos los datos necesarios para probar el sistema de avisos y funcionalidades de Comuniapp.

### 🏢 Comunidades Creadas

#### 1. **Residencial Los Pinos**

- **Tipo**: Condominio
- **Unidades**: 60 unidades (6 pisos × 10 unidades)
- **Dirección**: Av. Principal 123, Col. Centro, Ciudad de México
- **Email**: admin@lospinos.com
- **Teléfono**: +52 55 1234 5678

#### 2. **Torres del Sol**

- **Tipo**: Edificio
- **Unidades**: 80 unidades (8 pisos × 10 unidades)
- **Dirección**: Calle del Sol 456, Col. Norte, Ciudad de México
- **Email**: admin@torresdelsol.com
- **Teléfono**: +52 55 9876 5432

### 👨‍💼 Administradores de Comunidad

| Nombre         | Email                            | Comunidad             | Teléfono         |
| -------------- | -------------------------------- | --------------------- | ---------------- |
| María González | admin.lospinos@comuniapp.com     | Residencial Los Pinos | +52 55 1111 1111 |
| Roberto Silva  | admin.torresdelsol@comuniapp.com | Torres del Sol        | +52 55 8888 8888 |

### 👥 Residentes (14 total)

#### Residencial Los Pinos (6 residentes)

| Nombre           | Email                      | Unidad | Teléfono         |
| ---------------- | -------------------------- | ------ | ---------------- |
| Carlos Rodríguez | carlos.rodriguez@email.com | 101    | +52 55 2222 2222 |
| Ana Martínez     | ana.martinez@email.com     | 102    | +52 55 3333 3333 |
| Luis García      | luis.garcia@email.com      | 201    | +52 55 4444 4444 |
| Sofia López      | sofia.lopez@email.com      | 202    | +52 55 5555 5555 |
| Miguel Hernández | miguel.hernandez@email.com | 301    | +52 55 6666 6666 |
| Elena Ruiz       | elena.ruiz@email.com       | 302    | +52 55 7777 7777 |

#### Torres del Sol (8 residentes)

| Nombre            | Email                       | Unidad | Teléfono         |
| ----------------- | --------------------------- | ------ | ---------------- |
| Patricia Morales  | patricia.morales@email.com  | 101    | +52 55 9999 9999 |
| Fernando Castro   | fernando.castro@email.com   | 102    | +52 55 0000 0000 |
| Isabel Vargas     | isabel.vargas@email.com     | 201    | +52 55 1111 2222 |
| Diego Mendoza     | diego.mendoza@email.com     | 202    | +52 55 3333 4444 |
| Carmen Flores     | carmen.flores@email.com     | 301    | +52 55 5555 6666 |
| Alejandro Torres  | alejandro.torres@email.com  | 302    | +52 55 7777 8888 |
| Valentina Jiménez | valentina.jimenez@email.com | 401    | +52 55 9999 0000 |
| Ricardo Navarro   | ricardo.navarro@email.com   | 402    | +52 55 1111 3333 |

### 🏊 Espacios Comunes

#### Residencial Los Pinos (6 espacios)

- **Piscina** - Piscina comunitaria con área de descanso
- **Gimnasio** - Gimnasio equipado con máquinas modernas
- **Salón de Eventos** - Salón para celebraciones y reuniones
- **Cancha de Tenis** - Cancha de tenis con superficie profesional
- **Parque Infantil** - Área de juegos para niños
- **Terraza Panorámica** - Terraza con vista panorámica

#### Torres del Sol (8 espacios)

- **Piscina Olímpica** - Piscina de tamaño olímpico con jacuzzi
- **Centro de Fitness** - Gimnasio completo con entrenador personal
- **Salón de Usos Múltiples** - Salón para eventos y reuniones
- **Cancha de Fútbol** - Cancha de fútbol 7 con césped sintético
- **Biblioteca Comunitaria** - Espacio de lectura y estudio
- **Sala de Juegos** - Sala con mesa de billar y ping pong
- **Área de Barbacoa** - Zona de asados con parrillas
- **Spa y Sauna** - Área de relajación con sauna

### 📢 Avisos de Ejemplo

Se han creado **6 avisos** (3 por comunidad) con diferentes tipos:

#### Residencial Los Pinos

1. **Bienvenida a la Comunidad** (General)
2. **Mantenimiento de Piscina** (Mantenimiento)
3. **Reunión de Copropietarios** (General)

#### Torres del Sol

1. **Bienvenida a la Comunidad** (General)
2. **Mantenimiento de Piscina** (Mantenimiento)
3. **Reunión de Copropietarios** (General)

## 🔑 Credenciales de Acceso

**Contraseña para todos los usuarios**: `123456`

### Para Administradores

- **admin.lospinos@comuniapp.com** / 123456
- **admin.torresdelsol@comuniapp.com** / 123456

### Para Residentes (ejemplos)

- **carlos.rodriguez@email.com** / 123456
- **ana.martinez@email.com** / 123456
- **patricia.morales@email.com** / 123456
- **fernando.castro@email.com** / 123456

## 🚀 Cómo Probar el Sistema

### 1. **Iniciar el Backend**

```bash
cd apps/api
npm run start:dev
```

### 2. **Iniciar el Frontend**

```bash
cd apps/web
npm run dev
```

### 3. **Probar como Administrador**

1. Ve a `http://localhost:3000/login`
2. Inicia sesión con cualquier administrador
3. Verás el enlace "Avisos" en el sidebar
4. Haz clic en "Avisos" para gestionar avisos
5. Puedes crear, editar y eliminar avisos

### 4. **Probar como Residente**

1. Inicia sesión con cualquier residente
2. Los avisos aparecerán en el dashboard principal
3. Los residentes pueden ver los avisos pero no gestionarlos

## 📋 Funcionalidades Disponibles

### Para Administradores

- ✅ Crear avisos para su comunidad
- ✅ Editar avisos existentes
- ✅ Eliminar avisos
- ✅ Ver todos los avisos de su comunidad
- ✅ Filtrar por tipo de aviso
- ✅ Gestionar espacios comunes
- ✅ Ver residentes de su comunidad

### Para Residentes

- ✅ Ver avisos de su comunidad
- ✅ Filtrar avisos por tipo
- ✅ Ver información de espacios comunes
- ✅ Reservar espacios comunes (si está implementado)

## 🛠️ Scripts Disponibles

### Crear Datos de Prueba

```bash
cd apps/api
npx ts-node prisma/seed-test-communities.ts
```

### Verificar Datos Creados

```bash
cd apps/api
npx ts-node prisma/verify-test-data.ts
```

### Limpiar Base de Datos (Opcional)

```bash
cd apps/api
npx prisma migrate reset
```

## 📊 Estadísticas de Datos

- **🏢 Comunidades**: 2
- **👨‍💼 Administradores**: 2
- **👥 Residentes**: 14
- **🏠 Unidades**: 140
- **🏊 Espacios comunes**: 14
- **📢 Avisos**: 6
- **⏰ Horarios configurados**: 98 (7 días × 14 espacios)

## 🔧 Notas Técnicas

- Todos los espacios comunes tienen horarios configurados para los 7 días de la semana
- Los horarios son de 6:00 AM a 10:00 PM de lunes a viernes
- Los horarios son de 8:00 AM a 8:00 PM los sábados y domingos
- Todas las contraseñas están hasheadas con bcrypt
- Los usuarios tienen roles asignados correctamente
- Las unidades están asignadas a los residentes correspondientes

## 🎯 Próximos Pasos

1. **Probar el sistema de avisos** con los datos creados
2. **Verificar la funcionalidad** de creación, edición y eliminación
3. **Probar con diferentes tipos de usuarios** (admin vs residente)
4. **Verificar la responsividad** en diferentes dispositivos
5. **Probar el sistema de temas** (claro/oscuro)

---

**¡Los datos de prueba están listos para usar!** 🎉
