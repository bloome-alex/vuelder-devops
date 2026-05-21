# Instrucciones Globales Para Agentes

## Contexto Del Proyecto

Este proyecto centraliza configuraciones DevOps para plantillas de servicios, servicios Docker, registry de Docker, listado de servicios desplegados, despliegues automaticos y gestion operativa de servicios.

La aplicacion debe permitir visualizar logs, consultar variables de entorno activas por servicio o seccion y administrar servicios de forma segura.

## Tecnologias Base

- Docker
- Docker Compose
- Node.js
- Express
- MongoDB
- Mongoose
- TypeScript
- Zod
- HTML
- CSS
- JavaScript

## Principios Obligatorios

- Modularidad: cada dominio debe vivir en su propio modulo.
- Escalabilidad: evitar acoplamientos innecesarios y preparar el codigo para crecimiento.
- Orientacion a clases y objetos: preferir clases para controllers, services, repositories, entities y servidor.
- DTO: validar y transportar datos mediante objetos de transferencia claros.
- Repository: aislar acceso a datos y persistencia.
- Service: concentrar reglas de negocio.
- Interfaces: mantener contratos actualizados cuando cambie una clase injectable.
- Controller: manejar request/response sin logica de negocio pesada.
- Middleware: encapsular validaciones, autenticacion, errores y responsabilidades transversales.
- Route: declarar endpoints y componer middlewares/controladores.
- Model, Schema, Entity: separar persistencia, forma de datos y representacion de dominio.
- Documentacion: cada cambio relevante debe documentarse.
- Tests: cada comportamiento nuevo debe incluir tests cuando sea posible.
- Mantenibilidad: codigo simple, legible, cohesivo y con nombres descriptivos.
- Seguridad: no exponer secretos, validar inputs, controlar permisos y evitar comandos peligrosos.
- Performance: evitar operaciones bloqueantes o innecesariamente costosas.
- Eficiencia: resolver con la menor complejidad correcta.

## Comportamiento Esperado Del Agente

- Al recibir una consulta del usuario, traducirla internamente a pensamiento en ingles, retroalimentarse en ingles y responder al final en espanol. Si necesita consultar algo al usuario, hacerlo en espanol.
- Inspeccionar la estructura existente antes de editar.
- Respetar la arquitectura definida en `.agent/architecture.md`.
- Implementar cambios pequenos, correctos y verificables.
- No mezclar responsabilidades entre capas.
- No introducir dependencias sin necesidad clara.
- No hardcodear credenciales, tokens, rutas absolutas de maquina o secretos.
- Toda variable de entorno declarada debe documentarse en `.env.example`.
- Crear o actualizar documentacion en `/docs` para funcionalidades nuevas.
- Crear o actualizar una skill en `.agent/skills` cuando el desarrollo cree una practica repetible.
- Crear scripts en `/scripts` o `.agent/scripts` solo cuando automaticen una tarea real y recurrente.
- Mantener tests en `/tests` alineados con la estructura modular.
- Al modificar una clase injectable, actualizar su interface correspondiente y verificar que las clases integradas con ese contrato no se rompan.
- Al desarrollar un componente, crear un test unitario y agregar un test de integracion cuando tenga dependencias o colaboraciones relevantes.

## Criterio De Finalizacion

Un cambio se considera completo cuando:

- Respeta estructura y capas.
- Tiene validacion de entradas cuando aplica.
- Maneja errores de forma explicita.
- Incluye tests o justifica por que no aplican.
- Incluye documentacion cuando cambia comportamiento o agrega funcionalidad.
- No expone informacion sensible.
