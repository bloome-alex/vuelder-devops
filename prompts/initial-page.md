# Pagina inicial

- nombre: public
- path: src/public
- archivo: index.html

## Dependencias
- express

## Ruta
- GET /
sin /api, ruta indicada para las paginas.

## Tecnologías
- HTML
- CSS
- JavaScript

## Estructura
- src/public/index.html
- src/public/css/style.css
- src/public/js/main.js

## Principios
- Modular
- Orientado a objetos
- Separación de responsabilidades
- Single Responsibility Principle
- Open/Closed Principle
- Liskov Substitution Principle
- Interface Segregation Principle
- Dependency Inversion Principle
- Dependencias inyectables

## Consideraciones
- No debe haber lógica de negocio en la página
- Solo debe haber código que se encargue de la presentación

## Objetivo
- Una pagina con navbar y menu preparados para agregar secciones.
- Una sección "Imagenes" que conecte con la ruta /api/images y muestre las imagenes de docker en formato tabla.