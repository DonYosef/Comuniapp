# Configuración de OpenAI para Chatbot

## Variables de Entorno Requeridas

Para que el chatbot funcione con OpenAI, necesitas configurar la siguiente variable de entorno:

### OPENAI_API_KEY

```bash
OPENAI_API_KEY=tu_api_key_de_openai_aqui
```

## Configuración en diferentes entornos

### Desarrollo Local

Agrega la variable al archivo `.env`:

```bash
OPENAI_API_KEY=sk-...
```

### Producción

Configura la variable en tu plataforma de despliegue:

#### Railway

```bash
railway variables set OPENAI_API_KEY=sk-...
```

#### Heroku

```bash
heroku config:set OPENAI_API_KEY=sk-...
```

#### Docker

```bash
docker run -e OPENAI_API_KEY=sk-... tu-imagen
```

## Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a "API Keys" en el menú
4. Haz clic en "Create new secret key"
5. Copia la clave generada
6. **IMPORTANTE**: Guárdala de forma segura, no se puede recuperar

## Configuración del Modelo

El chatbot está configurado para usar:

- **Modelo**: `gpt-3.5-turbo`
- **Max Tokens**: 500
- **Temperature**: 0.7

### Cambiar Modelo (Opcional)

Si quieres usar GPT-4, modifica en `chatbot.service.ts`:

```typescript
model: 'gpt-4', // En lugar de 'gpt-3.5-turbo'
```

## Costos Estimados

### GPT-3.5-turbo

- **Input**: ~$0.0015 por 1K tokens
- **Output**: ~$0.002 por 1K tokens

### Ejemplo de Costo

Para una comunidad con 100 usuarios activos:

- **Preguntas promedio por día**: 50
- **Tokens promedio por pregunta**: 200
- **Costo diario estimado**: ~$0.10
- **Costo mensual estimado**: ~$3.00

## Migración desde Hugging Face

### Variables a Remover

```bash
# Ya no necesarias
HF_TOKEN=...
```

### Variables a Agregar

```bash
OPENAI_API_KEY=sk-...
```

## Verificación de Configuración

Para verificar que la configuración funciona:

1. **Reinicia el servidor** después de agregar la variable
2. **Prueba el endpoint**: `GET /chatbot?q=hola`
3. **Revisa los logs** para confirmar que no hay errores de configuración

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"

- Verifica que la variable esté definida
- Reinicia el servidor
- Verifica que no haya espacios extra en la variable

### Error: "Invalid API key"

- Verifica que la API key sea correcta
- Asegúrate de que la cuenta tenga créditos
- Verifica que la API key no haya expirado

### Error: "Rate limit exceeded"

- El sistema tiene rate limiting integrado
- Se usan respuestas de fallback automáticamente
- Considera aumentar los límites si es necesario

## Monitoreo y Logs

El sistema registra:

- ✅ Requests exitosos
- ⚠️ Rate limiting activado
- ❌ Errores de API
- 📊 Uso de cache

Revisa los logs para monitorear el funcionamiento:

```bash
# En desarrollo
npm run start:dev

# En producción
docker logs tu-contenedor
```

## Seguridad

### Mejores Prácticas

- ✅ Nunca commitees la API key al repositorio
- ✅ Usa variables de entorno
- ✅ Rota las API keys periódicamente
- ✅ Monitorea el uso y costos
- ✅ Configura límites de gasto en OpenAI

### Límites Recomendados

- **Rate limiting**: 10 requests/minuto (configurado)
- **Cache TTL**: 5 minutos (configurado)
- **Max tokens**: 500 por respuesta (configurado)

## Soporte

Si tienes problemas:

1. Revisa los logs del servidor
2. Verifica la configuración de variables
3. Prueba la API key directamente con OpenAI
4. Contacta al equipo de desarrollo
