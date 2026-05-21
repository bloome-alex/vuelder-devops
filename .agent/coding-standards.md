# Estandares De Codigo

## TypeScript

- Usar TypeScript estricto siempre que la configuracion lo permita.
- Evitar `any`; si es inevitable, justificarlo con un comentario breve.
- Preferir interfaces para contratos y tipos para composiciones simples.
- Toda clase injectable debe tener su contrato expresado en una interface y cualquier cambio publico en la clase debe reflejarse en esa interface.
- Despues de modificar una clase injectable, revisar las clases que consumen su interface para asegurar compatibilidad de integracion.
- Usar clases para `Controller`, `Service`, `Repository`, `Entity` y `Server`.
- Mantener nombres descriptivos y consistentes.

## Convenciones De Nombres

- Controllers: `{Name}Controller.ts`
- Services: `{Name}Service.ts`
- Repositories: `{Name}Repository.ts`
- Entities: `{Name}Entity.ts`
- DTOs: `{Action}{Name}Dto.ts`
- Models: `{Name}Model.ts`
- Schemas: `{Name}Schema.ts`
- Routes: `{name}.routes.ts`
- Middlewares: `{name}.middleware.ts`
- Tests: `{name}.test.ts`

## Express

- Controllers no deben construir dependencias pesadas dentro de cada request.
- Usar middlewares para validacion, autenticacion y manejo de errores.
- Responder con codigos HTTP correctos.
- No devolver stack traces ni detalles internos en respuestas publicas.

## MongoDB

- Aislar persistencia en repositories.
- Usar Mongoose para definir schemas, models y acceso a MongoDB.
- Definir indices cuando haya consultas frecuentes.
- No exponer `_id`, `__v` u otros campos internos si el contrato publico no los requiere.
- Validar ObjectId u otros identificadores antes de consultar.

## Zod

- Usar Zod para validar request bodies, query params y path parameters.
- Mantener schemas de validacion cerca del modulo que los consume.
- Transformar errores de validacion en respuestas HTTP claras y sin detalles internos.

## Docker Y Sistema Operativo

- Nunca ejecutar comandos con input no validado.
- Preferir APIs, wrappers seguros o argumentos escapados.
- No imprimir secretos en logs.
- Separar configuraciones por entorno.
- Documentar variables de entorno requeridas.

## Seguridad

- Validar entradas de usuario.
- Sanitizar datos usados en comandos, rutas o consultas.
- No almacenar secretos en repositorio.
- Minimizar informacion sensible en logs.
- Aplicar autorizacion en endpoints de administracion.

## Tests

- Agregar tests unitarios para services y repositories cuando sea posible.
- Agregar tests unitarios para cada componente desarrollado.
- Agregar tests de integracion para componentes que dependan de otros services, repositories, clientes externos, base de datos, filesystem, Docker, red o infraestructura equivalente.
- Agregar tests de integracion para rutas criticas.
- Mockear Docker, filesystem, red y base de datos cuando el test unitario no deba tocar infraestructura real.
- Cubrir errores esperados, casos vacios y casos exitosos.

## Documentacion

- Cada modulo importante debe tener documentacion en `/docs`.
- Documentar endpoints, variables de entorno, flujos Docker y decisiones relevantes.
- Cada skill debe explicar cuando usarla y que pasos seguir.
