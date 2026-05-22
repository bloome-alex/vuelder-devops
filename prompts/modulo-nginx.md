## Modulo nginx

# Objetivo
Necesito que agregues una nueva sección que se llame nginx. Debe tener la posibilidad de cargar abms de dominios y vinculación con servicios que se encuentren desplegados. Esto debe automáticamente crear la configuración de nginx para ese dominio y servicio (utilizando su puerto). 

# Consideraciones
- Debe poder dar de alta dominios.
- Debe poder dar de baja dominios.
- Debe tener la posibilidad de recargar nginx para que se apliquen los cambios.
- Debe tener la posibilidad de ver el estado de nginx.
- Debe poder aplicar certbot al dominio.
- El modulo debe estar integrado con el modulo de servicios para poder vincular los dominios con los servicios.