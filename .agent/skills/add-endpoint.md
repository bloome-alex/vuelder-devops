# Skill: Agregar Un Endpoint

## Cuando Usarla

Usar esta skill cuando se agregue una nueva ruta HTTP a un modulo existente o nuevo.

## Pasos

1. Identificar el modulo propietario del endpoint.
2. Definir contrato de request y response mediante DTOs si corresponde.
3. Agregar validacion en middleware o capa equivalente.
4. Implementar regla de negocio en service.
5. Implementar persistencia en repository si se requiere.
6. Agregar metodo en controller.
7. Registrar endpoint en route.
8. Agregar tests del caso exitoso y errores esperados.
9. Documentar endpoint en `/docs`.

## Reglas

- No acceder a repository directamente desde route.
- No ejecutar comandos Docker directamente desde controller si existe logica de negocio alrededor.
- No devolver secretos ni variables sensibles completas sin autorizacion explicita.
