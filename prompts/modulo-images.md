# Creación de modulo

- nombre: images
- ruta: /images
- controlador: ImagesController
- servicio: ImagesService

## Configuración

- Variables de entorno:
  - DOCKER_REGISTRY_URL

## Dependencias
- dockerode

## Estructura del modulo

```
src/modules/images/
├── controllers/
│   └── ImagesController.ts
├── services/
│   └── ImagesService.ts
├── interfaces/
│   └── ImagesInterface.ts
└── routes/
    └── ImagesRoute.ts
```

## Endpoints

- GET /images - Retorna un array con repositorios y cada imagen que tiene cada repositorio

## Objetivos
- Crear un modulo que permita listar los repositorios y las imagenes que tiene cada repositorio desde el registry de docker.
- Cada Clase (controller, service y route) debe ser injectable y registrada al exponer la ruta para añadirla en el index.ts
- Al final de la creación del modulo, se debe añadir la ruta al index.ts