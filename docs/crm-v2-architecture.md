# EMPREX Flow CRM v2 — Architecture

## Core model
- profiles: authenticated team members (admin, setter, closer)
- contacts: people/companies
- pipeline_stages: configurable commercial stages
- deals: commercial opportunities linked to contacts
- activities: calls, WhatsApp, emails, meetings, notes and stage changes
- tasks: follow-ups with due date, priority and assignee
- services: configurable service catalog
- payments: partial/complete payments in USD
- clients: customers created from won deals
- loss_reasons: standardized lost-deal reasons
- sales_targets: goals per team member
- notifications: internal alerts
- audit_log: immutable business change history

## Authorization
Authorization is enforced in Supabase with RLS. UI visibility is secondary and must never be the only access-control layer.

### Roles
- admin: full CRM visibility and administration
- setter: only assigned/owned leads, follow-ups and permitted edits
- closer: deals assigned for closing, related contacts, activities and payments as permitted

## Pipeline
Default stages:
1. Nuevo
2. Contactado
3. Calificado
4. Reunión agendada
5. Reunión realizada
6. Propuesta enviada
7. Negociación
8. Ganado
9. Perdido

Winning a deal creates/links a client record while preserving the original deal and complete history.

## Integrations
- WhatsApp deep-link button from normalized international phone
- Future WhatsApp Business API support
- Google Calendar sync
- Email support
- CSV/Excel import/export
- No Meta Ads ingestion in v2
- No generic webhook platform integration in v2

## Migration principle
The legacy public.clientes table remains untouched until:
1. schema inspection is complete
2. v2 tables exist
3. legacy rows are migrated and verified
4. frontend is switched to v2
5. rollback path is confirmed
