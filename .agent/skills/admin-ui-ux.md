# Skill: UI/UX Para ABM Administrativo

## Cuando Usarla

Usar esta skill cuando se construyan pantallas administrativas, formularios dinamicos, modales, tablas con acciones, tabs, toasts, confirmaciones o validaciones visuales.

## Principios

- Mantener el lenguaje visual existente del proyecto antes de inventar uno nuevo.
- Priorizar claridad operativa sobre decoracion.
- Cada accion destructiva debe tener confirmacion.
- Cada request iniciado por el usuario debe tener feedback visible.
- Cada error debe indicar que paso y permitir recuperacion.
- La UI debe funcionar en desktop y mobile.

## Layout De Pagina ABM

1. Header de seccion con titulo, descripcion y boton primario.
2. Panel principal con toolbar, resumen o buscador.
3. Tabla responsive con `table-wrap` u overflow horizontal en mobile.
4. Estado vacio cuando no hay datos.
5. Acciones por fila con botones explicitos.
6. Toasts posicionados sin tapar acciones principales.

## Formularios En Modal

- Modal con header, descripcion breve, cuerpo y footer.
- Formularios complejos separados en tabs.
- Footer con cancelar y accion primaria.
- Inputs con foco visible.
- Errores en bloque visible encima de la seccion o campo afectado.
- Botones deshabilitados durante requests.
- Cerrar modal solo despues de exito; mantener abierto si falla.

## Campos Dinamicos

- Cada fila dinamica debe tener inputs claros y boton `Quitar`.
- Permitir agregar filas sin perder valores ya escritos.
- Filtrar filas vacias antes de enviar si la seccion es opcional.
- Validar duplicados relevantes antes del request.
- En mobile, convertir la fila a una sola columna.

## Loadings

- Carga inicial: mostrar texto como `Cargando...` en summary o panel.
- Crear: `Crear` -> `Creando...`.
- Editar: `Guardar` -> `Guardando...`.
- Eliminar: `Eliminar` -> `Eliminando...`.
- Deshabilitar botones durante la accion.
- Restaurar texto original si falla.

## Confirmaciones

- Usar modal de confirmacion para acciones destructivas cuando ya hay sistema de modal.
- El mensaje debe incluir el nombre del recurso si esta disponible.
- Cancelar debe cerrar sin efectos secundarios.
- Confirmar debe ejecutar una sola vez aunque el usuario haga doble click.

## Toasts

- Exito: confirmar accion completada.
- Error: mostrar mensaje del backend si existe; si no, mensaje generico claro.
- No usar toasts como unica validacion de formulario; los errores de formulario deben quedar visibles dentro del modal.

## Validaciones Visuales

- Requeridos antes de enviar.
- Rangos numericos.
- Duplicados.
- Formatos basicos del dominio.
- Mensajes en espanol, cortos y accionables.
- No bloquear campos opcionales vacios.

## Accesibilidad Basica

- Usar `button type="button"` para acciones no submit.
- Usar `button type="submit"` solo para guardar formularios.
- Mantener contraste suficiente.
- No depender solo del color para comunicar error.
- Permitir cerrar modales con cancelar o click fuera si no hay cambios criticos pendientes.

## Criterios De Revision

- Todos los botones hacen algo visible al click.
- No hay acciones silenciosas.
- Los errores de red/backend se muestran.
- La tabla no rompe mobile.
- Los estados `loading`, `empty`, `success` y `error` estan contemplados.
