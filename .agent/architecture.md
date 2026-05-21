# Arquitectura Del Proyecto

## Estructura Raiz Esperada

```text
/.agent
/docs
/src
/tests
/scripts
```

## Estructura De Codigo Fuente

```text
/src/public
/src/interfaces
/src/utils
/src/server/Server.ts
/src/database/DatabaseConnection.ts
/src/utils/RouterMerger.ts
/src/modules
```

## Estructura De Modulo

Cada modulo debe representar un dominio funcional y respetar esta estructura:

```text
/src/modules/{module}
/src/modules/{module}/interfaces
/src/modules/{module}/controllers
/src/modules/{module}/services
/src/modules/{module}/models
/src/modules/{module}/schemas
/src/modules/{module}/entities
/src/modules/{module}/repositories
/src/modules/{module}/middlewares
/src/modules/{module}/routes
/src/modules/{module}/utils
```

## Responsabilidades Por Capa

### Controller

- Recibe requests HTTP.
- Extrae parametros, query, body y contexto.
- Invoca services.
- Devuelve respuestas HTTP.
- No contiene reglas de negocio complejas.
- No accede directamente a MongoDB ni Docker.

### Service

- Contiene reglas de negocio.
- Orquesta repositories, utilidades y servicios externos.
- Valida reglas del dominio.
- No conoce detalles HTTP.

### Repository

- Encapsula acceso a datos.
- Usa models/schemas para persistencia.
- No contiene reglas de negocio.
- Expone metodos claros como `findById`, `findAll`, `create`, `update`, `delete` o equivalentes del dominio.

### Entity

- Representa conceptos del dominio.
- Debe mantener invariantes simples del negocio.
- No debe depender de Express ni de MongoDB.

### DTO

- Define contratos de entrada y salida.
- Debe usarse para crear, actualizar o responder datos cuando el contrato no sea trivial.
- Debe evitar filtrar campos internos o sensibles.

### Schema Y Model

- Definen estructura de persistencia.
- Deben estar separados de entidades cuando haya logica de dominio.
- Deben incluir indices necesarios para consultas frecuentes.

### Middleware

- Encapsula responsabilidades transversales.
- Validacion, autenticacion, autorizacion, auditoria, manejo de errores o carga de contexto.

### Route

- Declara endpoints.
- Aplica middlewares.
- Conecta rutas con controllers.

## Modulos Sugeridos Del Dominio DevOps

- `docker-registries`: gestion de registries Docker.
- `service-templates`: plantillas de servicios.
- `deployed-services`: servicios desplegados.
- `deployments`: despliegues automaticos.
- `service-logs`: consulta y streaming de logs.
- `environment-variables`: variables de entorno activas.
- `docker-compose`: gestion de archivos y stacks Compose.
- `auth`: autenticacion y autorizacion si aplica.

## Flujo De Dependencias

Las dependencias deben ir en esta direccion:

## Validaciones

- Toda entrada debe ser validada antes de procesarse.
- Usar schemas de Zod o DTOs para validar request bodies, query params y path parameters.
- Las validaciones deben ser explícitas y dar mensajes de error claros.
- No confiar en datos del cliente sin validación previa.
- Las validaciones de dominio deben estar en services o entities, no en controllers.

### Server

- El servidor debe validar que todas las dependencias requeridas estén inyectadas antes de iniciar.
- Validar que el puerto sea un número válido y esté en rango (1-65535).
- Validar que las rutas estén configuradas antes de iniciar el servidor.

```text
Route -> Middleware -> Controller -> Service -> Repository -> Model/Schema
Service -> Entity/DTO/Utils
```

No se deben crear dependencias inversas. Un repository no debe importar controllers, routes ni services.
