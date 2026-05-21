# Skill: Gestion De Servicios Docker

## Cuando Usarla

Usar esta skill para funcionalidades relacionadas con Docker, Docker Compose, servicios desplegados, logs, variables de entorno o registry.

## Reglas De Seguridad

- Validar nombres de servicio, stack, registry, imagen y tags.
- No interpolar input de usuario directamente en comandos shell.
- No exponer secretos en respuestas o logs.
- Registrar eventos operativos sin incluir credenciales.
- Aplicar autorizacion en acciones de administracion.

## Flujo Recomendado

1. Crear DTOs para inputs operativos.
2. Validar datos en middleware o service.
3. Encapsular llamadas Docker en service o utility especifica.
4. Persistir estado o auditoria mediante repository si aplica.
5. Manejar errores de Docker con mensajes seguros.
6. Crear tests con mocks para no depender de Docker real.
7. Documentar comandos, variables y permisos requeridos.

## Casos Tipicos

- Listar servicios desplegados.
- Desplegar desde plantilla.
- Consultar logs.
- Consultar variables de entorno activas.
- Registrar o consultar registries Docker.
- Validar archivos Docker Compose.
