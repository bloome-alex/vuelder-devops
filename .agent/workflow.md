# Flujo De Trabajo Obligatorio

## Antes De Programar

1. Revisar `.agent/instructions.md`.
2. Revisar `.agent/architecture.md`.
3. Inspeccionar archivos existentes relacionados.
4. Identificar el modulo correcto o crear uno siguiendo la estructura definida.

## Durante La Implementacion

1. Crear o actualizar DTOs, entities, schemas, models, repositories, services, controllers, middlewares y routes segun corresponda.
2. Mantener la logica de negocio en services.
3. Mantener persistencia en repositories.
4. Mantener HTTP en controllers y routes.
5. Validar entradas antes de usar datos en base de datos, Docker, filesystem o comandos del sistema.
6. Si se modifica una clase injectable, actualizar su interface y revisar las clases que la consumen para evitar rupturas de integracion.
7. Evitar cambios globales innecesarios.

## Despues De Programar

1. Agregar o actualizar tests.
2. Confirmar que cada componente desarrollado tenga test unitario.
3. Agregar test de integracion cuando el componente dependa de otras clases, servicios, repositories, clientes externos o infraestructura.
4. Agregar o actualizar documentacion en `/docs`.
5. Agregar o actualizar skills en `.agent/skills` si la tarea genero una practica repetible.
6. Ejecutar verificaciones disponibles: tests, lint, typecheck o build.
7. Informar cambios realizados y verificaciones ejecutadas.

## Cuando Crear Una Skill

Crear una skill si el cambio ensena un procedimiento que se repetira, por ejemplo:

- Crear un nuevo modulo.
- Agregar un endpoint completo.
- Integrar un servicio Docker.
- Agregar una plantilla Docker Compose.
- Implementar gestion de logs.
- Agregar despliegue automatizado.

## Cuando Crear Un Script

Crear un script si una tarea es grande, repetible o propensa a errores manuales, por ejemplo:

- Generar estructura de modulo.
- Validar plantillas Docker Compose.
- Sincronizar servicios desplegados.
- Ejecutar health checks.
- Preparar entornos de test.
