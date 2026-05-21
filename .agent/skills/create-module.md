# Skill: Crear Un Modulo

## Cuando Usarla

Usar esta skill cuando se agregue una nueva capacidad funcional al proyecto.

## Objetivo

Crear un modulo coherente con la arquitectura Controller, Service, Repository, DTO, Entity, Model, Schema, Middleware y Route.

## Pasos

1. Definir el nombre del modulo en kebab-case.
2. Crear la carpeta `/src/modules/{module}`.
3. Crear subcarpetas: `interfaces`, `controllers`, `services`, `models`, `schemas`, `entities`, `repositories`, `middlewares`, `routes`, `utils`.
4. Crear DTOs para entradas y salidas relevantes.
5. Crear entity si existe concepto de dominio con invariantes.
6. Crear schema y model si requiere persistencia.
7. Crear repository para acceso a datos.
8. Crear service para reglas de negocio.
9. Crear controller para HTTP.
10. Crear route para endpoints y middlewares.
11. Agregar tests en `/tests`.
12. Documentar el modulo en `/docs`.

## Criterios

- Ninguna capa debe asumir responsabilidades de otra.
- El modulo debe poder evolucionar sin modificar otros modulos innecesariamente.
- Las rutas deben poder fusionarse mediante `/src/server/merge-routes.ts` cuando aplique.
