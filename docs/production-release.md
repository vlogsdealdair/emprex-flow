# Portal del socio técnico

## Estado de esta entrega

El usuario autorizó aplicar la migración, actualizar el repositorio existente y
publicar en EMPREX Flow. Supabase ya tiene el rol `technical_partner`, el módulo
Producción y admin-tools actualizado, con autenticación JWT obligatoria.
La interfaz se publica desde la rama principal del repositorio existente.
La cuenta real del socio no se crea hasta recibir sus datos exactos.

## Comportamiento

- Admin conserva ventas, precios públicos, comisiones, usuarios y configuración.
- Socio técnico solo ve proyectos asignados y los campos operativos del cliente.
- Deal ganado crea cliente y un proyecto independiente, una vez por deal.
- Admin asigna socio y completa alcance; las notas comerciales no se exponen.
- El socio propone costo, días calendario y complejidad. Admin aprueba costo y
  fecha comprometida. La estimación queda bloqueada.
- Extras tienen aprobación independiente. Resolverlos bloquea el proyecto y la
  solicitud para evitar doble aprobación o pagos simultáneos superiores al saldo.
- Margen = precio real del deal − honorarios aprobados − costos adicionales −
  comisiones registradas en el CRM. No se recalculan ni modifican reglas.
- Pagos son honorarios internos, distintos de los cobros al cliente.
- Ganancias del panel = honorarios aprobados acumulados; pendiente = aprobado
  menos pagado. Puntualidad usa la fecha comprometida guardada al entregar.
- Materiales completos y diseño aprobado son requisitos de desarrollo.
- Archivos en bucket privado, con permiso por proyecto y enlaces de 60 segundos.
- No se crea ninguna cuenta de socio sin sus datos exactos.

## Orden de aplicación

1. Verificar copia de seguridad y registrar inventario actual de servicios,
   reglas de comisiones, políticas y versión de admin-tools.
2. Aplicar `docs/technical-partner-role.sql` en una transacción independiente
   (ya aplicado en el proyecto actual; es idempotente).
3. Aplicar `docs/production.sql` como migración `production_technical_portal`.
   Incluye tablas, permisos, endpoints, trigger y proyectos para ventas ya ganadas.
   No se debe volver a aplicar si ya consta en el historial de migraciones.
4. Publicar `supabase/functions/admin-tools/index.ts`, conservando JWT obligatorio.
5. Volver a revisar advisors y probar con sesiones admin, socio y comercial.
6. Publicar la interfaz en el proyecto Vercel existente `emprex-flow`.
7. Admin crea el usuario desde Configuración → Crear usuario → Socio técnico.
   Faltan nombre completo, correo y contraseña exactos; no se inventan.

## Validación

`npm ci`, `npm run build`, `npm run test:production`.
La prueba usa PostgreSQL embebido (PGlite) con un esquema mínimo compatible,
identidades ficticias y roles Postgres reales. Verifica creación idempotente,
aprobaciones, sobrepagos, cálculo financiero, acceso cruzado, bloqueo comercial,
archivos privados, usuarios inactivos y llamadas anónimas.
Esta validación aislada no sustituye la prueba de sesiones contra Supabase y
el sitio publicado después de aplicar la migración autorizada.

También se verificó la interfaz en Chrome con respuestas ficticias: menú del
socio sin Finanzas ni Configuración, estimación aprobada no editable, envío del
payload de extras, vista de escritorio y móvil, sin errores de JavaScript.
Las capturas de demostración no representan una cuenta real ni datos reales.

## Reversión

Revertir primero la interfaz y admin-tools a sus versiones anteriores. No borrar
tablas ni pagos de producción para revertir una interfaz. Conservar el nuevo enum
y los registros; cualquier reversión de permisos debe revisarse frente al estado
actual de las cuentas técnicas antes de aplicarla.

