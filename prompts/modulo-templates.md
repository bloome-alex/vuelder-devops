# Creación de modulo

- nombre: templates
- ruta: /templates
- controlador: TemplatesController
- servicio: TemplatesService
- schema: TemplateSchema

---

# Dependencias

- mongoose

---

# Estructura del modulo

```txt
src/modules/templates/
├── controllers/
│   └── TemplatesController.ts
├── services/
│   └── TemplatesService.ts
├── interfaces/
│   ├── TemplateInterface.ts
│   ├── TemplateEnvironmentInterface.ts
│   ├── TemplatePortInterface.ts
│   ├── TemplateVolumeInterface.ts
│   └── TemplateHealthcheckInterface.ts
├── schemas/
│   └── TemplateSchema.ts
├── routes/
│   └── TemplatesRoute.ts
└── utils/
    └── GenerateCompose.ts
```

---

# Modelo de plantilla

```ts
interface Template {
  id: string; // mongoose ObjectId

  name: string; // nombre amigable
  description?: string; // descripción opcional

  image: string; // imagen sin tags para poder acceder a los tags.

  environment: TemplateEnvironment[];
  ports: TemplatePort[];
  volumes: TemplateVolume[];

  createdAt: Date;
  updatedAt: Date;
}
```

---

# Interfaces auxiliares

## Environment

```ts
interface TemplateEnvironment {
  key: string; // nombre de la variable de entorno
  value?: string; // valor de la variable de entorno
  defaultValue?: string; // valor por defecto
  required: boolean; // si es requerida
  secret: boolean; // si es secreto
}
```

## Ports

```ts
interface TemplatePort {
  hostPort: number; // puerto en el host
  containerPort: number; // puerto en el contenedor
  protocol: 'tcp' | 'udp'; // protocolo
}
```

## Volumes

```ts
interface TemplateVolume {
  source: string; // ruta en el host
  target: string; // ruta en el contenedor
  readOnly: boolean; // si es de solo lectura
}
```

---

# Endpoints

## GET /templates

Retorna todas las plantillas registradas.

## GET /templates/:id

Retorna una plantilla específica.

## POST /templates

Crea una nueva plantilla.

## PUT /templates/:id

Actualiza una plantilla existente.

## DELETE /templates/:id

Elimina una plantilla.

---

# Objetivos

- Crear un modulo que permita gestionar plantillas completas de servicios docker.
- Permitir configurar imágenes docker reutilizables para la creación de servicios a partir de estas plantillas.
- Permitir configurar:
  - variables de entorno
  - puertos
  - volúmenes
- Las plantillas deben ser reutilizables para la creación de servicios.
- Cada Clase (controller, service, route, schema) debe ser injectable y registrada al exponer la ruta para añadirla en el index.ts
- El modulo debe seguir arquitectura desacoplada basada en:
  - controllers
  - services
  - interfaces
  - schemas
  - routes
  - utils
- Validar correctamente los datos antes de crear o actualizar una plantilla.
- Utilizar el servicio de images para obtener las imagenes disponibles en el combo seleccionable y para poder buscar la imagen a usar.
- Al final de la creación del modulo, se debe añadir la ruta al index.ts

---

# Frontend

## Objetivo

Crear un ABM completo para administrar plantillas de servicios docker desde interfaz web.

---

# Funcionalidades frontend

## Listado de plantillas

- Mostrar todas las plantillas disponibles.
- Mostrar:
  - nombre
  - imagen
  - tag
  - cantidad de puertos
  - cantidad de variables
  - fecha de creación
- Permitir:
  - editar
  - eliminar
  - duplicar plantilla

---

## Crear plantilla

Formulario avanzado con:

- Información general
- Imagen docker
- Variables de entorno dinámicas
- Puertos dinámicos
- Volúmenes dinámicos

---

## Editar plantilla

- Cargar datos automáticamente.
- Permitir edición completa.
- Validar campos antes de guardar.

---

## Eliminar plantilla

- Confirmación antes de eliminar.
- Eliminación fisica a nivel base de datos.

---

# Validaciones frontend

- Nombre requerido.
- Imagen requerida.
- Puertos válidos.
- No permitir puertos duplicados.

---

# UI/UX

- Formularios dinámicos.
- Inputs reutilizables.
- Tabs para separar configuraciones.
- Confirmaciones modales.
- Toasts de éxito y error.
- Loader durante requests.
- Validaciones visuales.