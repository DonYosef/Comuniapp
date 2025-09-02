# Infraestructura

Este directorio contiene la configuración de infraestructura para el proyecto Comuniapp.

## Servicios

### PostgreSQL
- **Puerto**: 5432
- **Usuario**: postgres
- **Contraseña**: postgres
- **Base de datos**: comuniapp

### Redis
- **Puerto**: 6379
- **Sin autenticación** (solo para desarrollo)

## Comandos

### Levantar servicios
```bash
docker compose -f infra/docker-compose.yml up -d
```

### Ver logs
```bash
docker compose -f infra/docker-compose.yml logs -f
```

### Detener servicios
```bash
docker compose -f infra/docker-compose.yml down
```

### Detener y eliminar volúmenes
```bash
docker compose -f infra/docker-compose.yml down -v
```
