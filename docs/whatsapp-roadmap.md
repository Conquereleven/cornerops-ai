# WhatsApp Business Roadmap

## Estado Sprint 6

Existe un adapter sin credenciales reales:

- `GET /api/webhooks/whatsapp` para verificación o estado placeholder.
- `POST /api/webhooks/whatsapp` para normalizar mensajes y enviarlos al
  orquestador.
- `src/adapters/whatsappAdapter.js` convierte payloads de Meta a `/api/chat`.

El endpoint devuelve el payload de salida esperado, pero todavía no realiza la
llamada externa a Meta.

## Flujo futuro

1. Meta envía el webhook.
2. Se valida firma con `WHATSAPP_WEBHOOK_SECRET`.
3. El adapter extrae `from`, texto y `wamid`.
4. `wamid` se usa como `requestId` para idempotencia.
5. El número del remitente se usa como `userId`.
6. Se recupera o crea `conversationId`.
7. `/api/chat` ejecuta el worker y persiste mensajes.
8. El adapter envía la respuesta mediante Graph API.
9. Se registran entrega, errores y handoff humano.

## Variables futuras

```env
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_WEBHOOK_SECRET=
```

## Requisitos antes de producción

- Validar firma HMAC del webhook.
- Responder a Meta rápidamente y procesar en cola.
- Cifrar tokens en el proveedor de secretos.
- Manejar mensajes duplicados, imágenes, audio y estados de entrega.
- Añadir consentimiento, retención y políticas de privacidad.
- Definir plantillas aprobadas para mensajes iniciados por la empresa.
