# 🤖 Mejoras del Chatbot - Sistema Basado en Roles

## 📋 Resumen de Mejoras Implementadas

Se ha mejorado significativamente el chatbot de Comuniapp para proporcionar respuestas personalizadas según el tipo de usuario (residente, conserje, administrador) y sus permisos específicos.

## 🎯 Características Principales

### 1. **Dos Endpoints Diferentes**

- **`GET /chatbot`** - Chatbot público (sin autenticación)
- **`GET /chatbot/auth`** - Chatbot autenticado con contexto de usuario

### 2. **Respuestas Personalizadas por Rol**

#### 🏠 **RESIDENTE**

- **Acceso limitado**: Solo sus propias unidades y datos relacionados
- **Información específica**:
  - Espacios comunes de su comunidad
  - Avisos de su comunidad
  - Gastos comunes de su comunidad
  - Visitantes de sus unidades únicamente
  - Encomiendas de sus unidades únicamente
- **Permisos**: `VIEW_OWN_UNIT`, `VIEW_OWN_EXPENSES`, `MANAGE_OWN_PROFILE`, `VIEW_ANNOUNCEMENTS`, `MANAGE_OWN_VISITORS`

#### 🏢 **CONSERJE**

- **Acceso amplio**: Todos los datos de su comunidad
- **Información específica**:
  - Espacios comunes de su comunidad (con gestión de reservas)
  - Avisos de su comunidad
  - Gastos comunes de su comunidad
  - Todos los visitantes de su comunidad
  - Todas las encomiendas de su comunidad
- **Permisos**: `MANAGE_VISITORS`, `MANAGE_PARCELS`, `MANAGE_RESERVATIONS`, `VIEW_COMMUNITY_ANNOUNCEMENTS`

#### 👨‍💼 **ADMINISTRADOR DE COMUNIDAD**

- **Acceso completo**: Toda la información de sus comunidades
- **Información específica**:
  - Espacios comunes de sus comunidades administradas
  - Avisos de sus comunidades administradas
  - Gastos comunes de sus comunidades administradas
  - Visitantes de sus comunidades administradas
  - Encomiendas de sus comunidades administradas
- **Permisos**: `MANAGE_COMMUNITY`, `MANAGE_COMMUNITY_USERS`, `MANAGE_COMMUNITY_UNITS`, `MANAGE_COMMUNITY_EXPENSES`, `VIEW_COMMUNITY_REPORTS`

#### 🔧 **SUPER_ADMIN**

- **Acceso total**: Todo el sistema
- **Información específica**: Todos los datos de todas las comunidades
- **Permisos**: `MANAGE_ALL_ORGANIZATIONS`, `MANAGE_ALL_USERS`, `VIEW_SYSTEM_METRICS`

## 🔧 Implementación Técnica

### Nuevos Métodos Implementados

#### 1. **`processQuestionWithUserContext(question, user)`**

- Procesa preguntas con contexto del usuario autenticado
- Determina el rol del usuario y ajusta las respuestas
- Filtra datos según permisos del usuario

#### 2. **Métodos Específicos por Tipo de Usuario**

- `getCommonSpacesInfoForUser(userInfo, userRoles)`
- `getCommunityAnnouncementsForUser(userInfo, userRoles)`
- `getCommonExpensesInfoForUser(userInfo, userRoles)`
- `getVisitorsInfoForUser(userInfo, userRoles)`
- `getParcelsInfoForUser(userInfo, userRoles)`

#### 3. **Métodos de Contexto**

- `getUserContextInfo(user)` - Obtiene información detallada del usuario
- `getUserContextForAI(userInfo, userRoles)` - Genera contexto para IA
- `getUserRoleDisplayName(userRoles)` - Convierte roles a nombres legibles

### Filtrado de Datos por Rol

#### **Super Admin**

```typescript
// Ve todos los datos sin restricciones
whereClause = { isActive: true };
```

#### **Community Admin**

```typescript
// Ve datos de sus comunidades administradas
const communityIds = userInfo?.communityAdmins?.map((ca) => ca.community.id) || [];
whereClause.communityId = { in: communityIds };
```

#### **Concierge**

```typescript
// Ve datos de su comunidad
const communityId = userInfo?.userUnits?.[0]?.unit?.community?.id;
whereClause.communityId = communityId;
```

#### **Resident**

```typescript
// Ve solo datos de sus unidades
const unitIds = userInfo?.userUnits?.map((uu) => uu.unit.id) || [];
whereClause.unitId = { in: unitIds };
```

## 🎨 Mejoras en la Experiencia de Usuario

### 1. **Respuestas Contextualizadas**

- Cada respuesta incluye el rol del usuario
- Muestra el contexto (comunidad/unidades) del usuario
- Proporciona información adicional específica para cada rol

### 2. **Información Adicional Personalizada**

- **Conserje**: Instrucciones sobre gestión de reservas y visitantes
- **Residente**: Información sobre cómo reservar espacios y contactar conserje
- **Admin**: Enlaces a paneles de administración y gestión

### 3. **IA Contextualizada**

- El modelo de IA recibe información del usuario actual
- Respuestas personalizadas según permisos y contexto
- Sugerencias específicas para cada tipo de usuario

## 📊 Ejemplos de Respuestas

### Residente preguntando sobre "visitantes"

```
👥 **ÚLTIMOS VISITANTES REGISTRADOS**
👤 **Vista de:** Residente
🏢 **Contexto:** sus unidades
════════════════════════════════════════════════════

📝 **Juan Pérez**
   🏠 Unidad: 101 - Torre Central
   👤 Anfitrión: María González
   📅 Llegada: 15/01/2024 14:30
   📋 Propósito: Personal
   📊 Estado: Registrado
   📞 Teléfono: +1234567890

💡 **Información adicional:**
• Puedes registrar visitantes para tus unidades
• Los visitantes deben registrarse antes de la visita
```

### Conserje preguntando sobre "visitantes"

```
👥 **ÚLTIMOS VISITANTES REGISTRADOS**
👤 **Vista de:** Conserje
🏢 **Contexto:** su comunidad (Torre Central)
════════════════════════════════════════════════════

📝 **Juan Pérez**
   🏠 Unidad: 101 - Torre Central
   👤 Anfitrión: María González
   📅 Llegada: 15/01/2024 14:30
   📋 Propósito: Personal
   📊 Estado: Registrado
   📞 Teléfono: +1234567890

💡 **Información adicional:**
• Como conserje, puedes gestionar el registro de visitantes
• Verifica la identificación de los visitantes al ingresar
• Mantén actualizado el estado de las visitas
```

## 🔒 Seguridad y Privacidad

### 1. **Respeto de Permisos**

- Cada usuario solo ve los datos que tiene permisos para acceder
- Filtrado automático según roles y contexto
- No exposición de información sensible

### 2. **Validación de Acceso**

- Verificación de autenticación en endpoint `/auth`
- Validación de roles y permisos
- Manejo seguro de información del usuario

## 🚀 Uso del Sistema Mejorado

### Para Desarrolladores Frontend

#### Endpoint Público

```javascript
// Chatbot sin autenticación
const response = await fetch('/api/chatbot?q=espacios comunes');
```

#### Endpoint Autenticado

```javascript
// Chatbot con contexto de usuario
const response = await fetch('/api/chatbot/auth?q=visitantes', {
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});
```

### Para Usuarios

1. **Residentes**: Obtienen información específica de su comunidad y unidades
2. **Conserjes**: Acceso completo a datos de su comunidad con instrucciones de gestión
3. **Administradores**: Vista completa de sus comunidades con enlaces a gestión
4. **Super Admins**: Acceso total al sistema

## 📈 Beneficios de las Mejoras

1. **Experiencia Personalizada**: Cada usuario ve información relevante para su rol
2. **Seguridad Mejorada**: Respeto automático de permisos y accesos
3. **Eficiencia Operativa**: Información contextual y acciones específicas por rol
4. **Escalabilidad**: Sistema preparado para múltiples comunidades y usuarios
5. **Mantenibilidad**: Código organizado y bien documentado

## 🔄 Próximos Pasos Sugeridos

1. **Testing**: Probar con diferentes tipos de usuarios
2. **Métricas**: Implementar analytics de uso por rol
3. **Optimización**: Mejorar rendimiento de consultas complejas
4. **Funcionalidades**: Agregar más comandos específicos por rol
5. **Integración**: Conectar con otros módulos del sistema

---

_Documentación generada automáticamente - Comuniapp Chatbot v2.0_
