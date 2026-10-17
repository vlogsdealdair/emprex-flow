# Prospección EMPREX

## Instalación

Aplicar `prospection.sql` una vez en una base nueva (ya incluye el endurecimiento de correo). En EMPREX se aplicaron las migraciones `prospection_workspace_mvp` y `prospection_mailbox_hardening`. No ejecutar ambas fuentes de SQL de nuevo. Desplegar la Edge Function `prospection` con `verify_jwt=true`. El frontend añade Prospección a Admin y Setter; Closer y Technical Partner quedan excluidos por RLS y RPC.

La interfaz cubre prospectos manuales, búsqueda investigada con fuentes, campañas, plantillas, score comercial, análisis web basado en evidencia pública, propuesta de mensaje, bandeja de aprobación, fecha de envío, respuestas, seguimientos, reuniones, conversión idempotente a Leads, métricas de ventas ganadas/revenue y logs. Los prospectos se ordenan por respuesta y score. Cada seguimiento necesita un borrador y aprobación propios. Las métricas son acumuladas, no atribuyen una venta a partir de una apertura o clic. No se implementó tracking de aperturas ni clics.

## Conectar Google desde cero

1. Abrir https://console.cloud.google.com/ con `emprexagencia@gmail.com`. Crear un proyecto específico, por ejemplo **EMPREX CRM**, sin habilitar facturación de pago por defecto.
2. Habilitar **Gmail API**. Configurar Google Auth Platform, datos de marca, audiencia y permisos. Para pruebas privadas, añadir únicamente la cuenta remitente como usuario de prueba.
3. Crear un cliente OAuth web. Para una conexión inicial manual controlada, usar el OAuth Playground oficial con credenciales propias y registrar `https://developers.google.com/oauthplayground` como URI de retorno. No usar credenciales compartidas del Playground para una conexión duradera.
4. Solicitar solo `https://www.googleapis.com/auth/gmail.send` y `https://www.googleapis.com/auth/gmail.readonly`, con acceso offline. La lectura es necesaria para detener seguimientos al recibir respuestas y verificar el remitente. El código consulta identificadores, no almacena cuerpos de respuestas. Google puede exigir verificación para un lanzamiento más amplio. Las autorizaciones en modo de prueba pueden expirar: revisar las reglas actuales de Google antes de activar automatización continua.
5. La persona titular completa la autorización en Google. Copiar el ID de cliente, secreto y refresh token directamente a **Supabase → Edge Functions → Secrets** como `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`. Nunca ponerlos en GitHub, variables `VITE_`, chats, capturas, prospectos o plantillas.
6. En https://aistudio.google.com/ crear una clave del mismo proyecto o de uno dedicado. Aceptación de condiciones y facturación, si se requieren, corresponden al titular. Guardar como `GEMINI_API_KEY` en Secrets. Modelo inicial editable: `gemini-3.8-flash`, verificado en la documentación al implementar. No habilitar facturación ni hacer búsquedas de pago sin decisión del titular.
7. En CRM → Prospección → Control → Comprobar conexión Gmail. Debe confirmar exactamente `emprexagencia@gmail.com`. Hacer una auditoría de un sitio público autorizado y revisar fuentes, score, límites y mensaje propuesto.
8. Configurar el programador con `prospection-scheduler.sql`: requiere extensiones Cron, pg_net y Vault en Supabase. Guardar en Vault `emprex_project_url` y `emprex_service_role_key` directamente en el panel, sin exponer valores. Este último es secreto de servidor con acceso privilegiado; no copiarlo al navegador ni al chat. El job llama una función protegida; su rol de servicio solo acepta la acción `dispatch`.
9. Después de verificar el job, guardar `PROSPECTION_SCHEDULER_READY=true` en Secrets. Esta bandera por sí sola no enciende envíos. En CRM el administrador debe habilitar explícitamente la cola aprobada. La instalación mantiene `sending_enabled=false`.
10. Antes de usar prospectos reales, realizar una prueba con destinatario autorizado: borrador → aprobación → hora válida → envío → respuesta → cancelación de seguimiento. No se hizo ningún envío real durante la implementación. No declarar completada esta prueba hasta tener evidencia de Gmail y de la cola.

## Reglas de envío y recuperación

- Límite global diario, horario de Ecuador continental, lunes a viernes y campaña activa. Cada worker reserva como máximo un correo; un candado transaccional evita superar la cuota con workers concurrentes.
- Se comprueba la bandeja antes de cada envío. Una respuesta de esa dirección detiene el contacto conservadoramente, aunque pertenezca a otro hilo. La consulta incluye spam/papelera para evitar insistir tras una respuesta. Un fallo al consultar Gmail bloquea el envío.
- No contactar, descarte o reunión cancelan borradores, pendientes y aprobados. El usuario administrador puede retirar una exclusión, pero los correos cancelados no se reactivan.
- Los cambios de texto invalidan la aprobación. No se permite editar un envío en curso. Solo un administrador activo puede aprobar y habilitar la cola; el remitente se valida contra Google.
- Timeout/error después de iniciar la petición a Gmail: estado **Revisar envío**, sin reintento automático. Revisar Gmail por `rfc822msgid:<UUID@emprex-flow.vercel.app>` antes de decidir recuperación. Las reservas interrumpidas durante más de diez minutos también requieren revisión. No se promete entrega, lectura ni envío exactamente una vez.
- Si no empezó la petición, se registra **Error** y puede corregirse como un nuevo borrador. Nunca convertir un resultado incierto en un nuevo envío automático.
- Entre la última comprobación y la aceptación de Gmail puede ocurrir una respuesta o exclusión simultánea; ningún sistema externo ofrece una transacción conjunta con Postgres. Se detienen las acciones posteriores, sin prometer retirar un mensaje ya aceptado.
- Las alertas de respuesta, aprobación pendiente y seguimiento se consultan en las vistas y el historial. El correo de resumen diario y las alertas Discord no se añadieron en esta entrega.

## Verificación

`npm run build`; `npm run test:production`; lint de los archivos nuevos; navegador con fixtures en escritorio/móvil. Pruebas Postgres aisladas cubren límites por rol, acceso directo, deduplicación, aprobación, invalidación al editar, bloqueo al responder, exclusión global y conversión idempotente. Pruebas del backend cubren bloqueo sin conexión, roles, validación MIME y fallo de lectura de Gmail. La conexión real a Google y la ejecución programada están pendientes hasta que el titular autorice Google y configure los secretos.

Fuentes: https://developers.google.com/identity/protocols/oauth2/web-server ; https://developers.google.com/workspace/gmail/api/guides/sending ; https://supabase.com/docs/guides/functions/schedule-functions ; https://ai.google.dev/gemini-api/docs/models

