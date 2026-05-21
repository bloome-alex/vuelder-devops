# Plantilla De Tests

## Casos Minimos

- Caso exitoso.
- Input invalido.
- Recurso inexistente.
- Error de dependencia externa.
- Validacion de permisos si aplica.

## Reglas

- Los tests unitarios no deben depender de Docker real, red real o MongoDB real.
- Usar mocks para repositories, comandos Docker y servicios externos.
- Los tests de integracion deben documentar requisitos de entorno.
