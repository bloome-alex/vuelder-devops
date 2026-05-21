# Skill: Crear ABM Completo

## Cuando Usarla

Usar esta skill cuando se solicite crear o extender un ABM, CRUD, panel administrativo, listado con acciones, formulario de alta, edicion o eliminacion fisica de datos.

## Objetivo

Replicar el formato de modulo administrativo usado en el proyecto: backend modular, endpoints REST, validaciones consistentes, frontend integrado al layout, estados de carga, confirmaciones, toasts y validaciones visuales.

## Flujo Obligatorio

1. Revisar `.agent/instructions.md`, `.agent/architecture.md` y `.agent/workflow.md`.
2. Inspeccionar un modulo existente similar antes de crear archivos nuevos.
3. Definir dominio, ruta base, controller, service, schema/model, interfaces y route.
4. Crear estructura en `/src/modules/{module}` respetando las carpetas existentes del proyecto.
5. Registrar dependencias con patron injectable `inject/get` cuando el proyecto lo use.
6. Registrar la ruta en `index.ts` o en el agregador de rutas vigente.
7. Crear servicio frontend en `/src/public/js/services/{module}Service.js` para encapsular requests HTTP.
8. Crear componente de pagina en `/src/public/js/components/{module}PageComponent.js`.
9. Integrar navegacion si el ABM debe ser accesible desde sidebar/hash/router.
10. Agregar estilos necesarios en `/src/public/css/styles.css` sin romper el lenguaje visual existente.
11. Ejecutar `npm run typecheck` y `npm run build` si estan disponibles.

## Backend

- Exponer endpoints REST basicos: `GET /{route}`, `GET /{route}/:id`, `POST /{route}`, `PUT /{route}/:id`, `DELETE /{route}/:id`.
- Controller: solo request/response, status codes y conversion de errores a JSON.
- Service: reglas de negocio, validaciones de dominio, normalizacion de payloads y orquestacion de dependencias.
- Schema/model: persistencia, timestamps, indices necesarios y serializacion limpia de `id`.
- Interface: contratos de entidad, payload y service actualizados.
- Route: declarar endpoints y resolver controller por inyeccion.
- DELETE debe realizar eliminacion fisica solo si el requerimiento lo indica.
- Si se usa Mongoose con `toJSON`, asegurar que el frontend reciba `id`; si se usa `_id`, el frontend debe tener fallback explicito.

## Frontend

- La pagina ABM debe incluir listado, crear, editar, eliminar y duplicar cuando aplique.
- El listado debe mostrar campos clave del dominio, contadores utiles y fecha de creacion/actualizacion si existe.
- Las acciones de fila deben usar `button type="button"` para evitar submits accidentales.
- Usar delegacion de eventos o listeners explicitos, pero verificar que cada boton tenga un identificador valido.
- El servicio HTTP debe centralizar manejo de errores y parseo de respuestas `204`.
- No mezclar fetch directo dentro de renderizado si existe service dedicado.
- Evitar recargar toda la pagina; refrescar estado/listado despues de crear, actualizar o eliminar.

## Formularios

- Usar modal o panel consistente con la UI existente.
- Separar formularios complejos en tabs: informacion general, configuraciones dinamicas y secciones avanzadas.
- Los campos dinamicos deben permitir agregar y quitar filas.
- Leer el formulario en una funcion dedicada como `readForm`.
- Validar en una funcion dedicada como `validate{Entity}`.
- Mostrar errores visuales dentro del formulario antes de enviar.
- Si el backend devuelve error, mostrarlo en el formulario y reactivar el boton.
- El boton principal debe tener loading: `Crear` -> `Creando...`, `Guardar` -> `Guardando...`.
- Deshabilitar el boton durante el request para evitar doble envio.

## Eliminacion

- El boton eliminar debe abrir una confirmacion propia o confirmacion explicita del navegador.
- Preferir modal de confirmacion propio si el ABM ya usa modales.
- El boton de confirmacion debe tener loading: `Eliminar` -> `Eliminando...`.
- Deshabilitar el boton mientras corre el request.
- En exito, cerrar modal, refrescar listado y mostrar toast.
- En error, mantener el modal abierto, reactivar boton y mostrar toast o mensaje visible.

## Validaciones Minimas

- Campos requeridos del dominio.
- Tipos numericos y rangos validos.
- Duplicados en colecciones dinamicas.
- IDs validos antes de operar.
- No confiar solo en frontend: repetir validaciones importantes en service/backend.
- Mensajes claros y accionables en espanol.

## UI/UX Obligatoria

- Loader o texto de carga durante requests iniciales.
- Loading en botones de create/update/delete.
- Toast de exito y error.
- Confirmacion antes de eliminar.
- Estados vacios descriptivos.
- Diseño responsive para desktop y mobile.
- Inputs reutilizables o markup consistente si no existe sistema de componentes.
- No introducir estilos genericos que rompan paginas existentes.

## Checklist De Finalizacion

- Endpoints funcionando y registrados.
- Frontend integrado y navegable.
- Crear, editar, eliminar y duplicar probados a nivel de flujo de codigo.
- Loading en botones principales.
- Validaciones frontend y backend.
- Toasts y confirmaciones.
- Typecheck/build ejecutados.
- Documentacion o skill actualizada si aparece un patron nuevo.
