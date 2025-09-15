-- Script de inicialización para PostgreSQL
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor

-- Crear la base de datos si no existe
CREATE DATABASE comuniapp;

-- Conectar a la base de datos
\c comuniapp;

-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Comentario de inicialización
COMMENT ON DATABASE comuniapp IS 'Base de datos para la aplicación Comuniapp';
