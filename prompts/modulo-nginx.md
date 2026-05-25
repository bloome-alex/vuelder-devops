# Plan: Módulo Nginx

## Objetivo

Agregar una nueva sección "nginx" que permita administrar dominios y su vinculación con servicios desplegados, generando automáticamente la configuración de nginx para cada dominio.

## Requisitos Funcionales

- [ ] Alta de dominios
- [ ] Baja de dominios
- [ ] Listar dominios existentes
- [ ] Vincular dominio con un servicio desplegado
- [ ] Desvincular dominio de servicio
- [ ] Generar automáticamente configuración nginx al vincular
- [ ] Recargar nginx para aplicar cambios
- [ ] Ver estado de nginx
- [ ] Aplicar certbot a un dominio específico

## Especificación Técnica

### Estructura del Módulo

```
src/modules/nginx/
├── controllers/NginxController.ts
├── interfaces/NginxInterface.ts
├── routes/NginxRoute.ts
├── schemas/NginxSchema.ts
└── services/NginxService.ts
```

### Estructura de Datos (MongoDB)

**Schema: NginxDomain**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `_id` | ObjectId | ID automático |
| `domain` | String | Dominio completo ingresado por usuario (ej: `api.midominio.com`) |
| `serviceId` | ObjectId | Referencia al servicio vinculado (opcional) |
| `port` | Number | Puerto del contenedor al que redirige |
| `sslEnabled` | Boolean | Indica si SSL está habilitado |
| `createdAt` | Date | Fecha de creación |
| `updatedAt` | Date | Fecha de actualización |

**Restricciones:**
- `domain` debe ser único

### Rutas de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/nginx/domains` | Listar todos los dominios |
| GET | `/nginx/domains/:id` | Obtener un dominio específico |
| POST | `/nginx/domains` | Crear un nuevo dominio |
| PUT | `/nginx/domains/:id` | Actualizar dominio (vincular/desvincular servicio) |
| DELETE | `/nginx/domains/:id` | Eliminar dominio |
| POST | `/nginx/domains/:id/ssl` | Aplicar certbot al dominio |
| GET | `/nginx/status` | Ver estado de nginx |
| POST | `/nginx/reload` | Recargar configuración de nginx |

### Generación de Configuración Nginx

**Ubicación de archivos:**
- Configuraciones: `/etc/nginx/sites-available/`
- Symlinks activos: `/etc/nginx/sites-enabled/`

**Nombre del archivo:**
`/etc/nginx/sites-available/{domain}` (reemplazando `.` por `_` en el nombre del archivo)

**Formato de configuración (HTTP):**

```nginx
server {
    listen 80;
    server_name {domain};

    location / {
        proxy_pass http://127.0.0.1:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Formato de configuración (HTTPS, después de certbot):**

```nginx
server {
    listen 80;
    server_name {domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name {domain};

    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:{port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Integración con Módulo Servicios

- NginxService inyecta `servicesService` para:
- Listar servicios desplegados disponibles para vincular
- Obtener los puertos de un servicio desplegado
- Validar que el servicio existe al vincular

### Flujos Principales

**Crear dominio:**
1. Usuario ingresa dominio (ej: `api.midominio.com`)
2. Validaciones: dominio no existe, formato válido
3. Se guarda en MongoDB
4. Sin servicio vinculado → solo se crea archivo básico HTTP (redirect a https vacío o proxy placeholder)

**Vincular dominio con servicio:**
1. Usuario selecciona dominio y servicio desplegado
2. Se obtiene el `hostPort` del servicio
3. Se genera config nginx con proxy_pass a `127.0.0.1:{hostPort}`
4. Se crea symlink en `/etc/nginx/sites-enabled/`
5. Se recarga nginx
6. Se actualiza registro en MongoDB

**Eliminar dominio:**
1. Se elimina archivo de configuración
2. Se elimina symlink
3. Se recarga nginx
4. Se elimina registro de MongoDB

**Aplicar certbot:**
1. Ejecutar `certbot --nginx -d {domain} --non-interactive --agree-tos -m admin@{domain}`
2. Actualizar campo `sslEnabled` en MongoDB

**Recargar nginx:**
1. Ejecutar `nginx -t` para validar config
2. Si válido, ejecutar `nginx -s reload`

### Frontend

```
src/public/js/
├── components/nginxPageComponent.js
└── services/nginxService.js
```

**Componente nginxPageComponent.js:**
- Tabla listando dominios con columns: Dominio, Servicio Vinculado, SSL, Acciones
- Modal para crear/editar dominio (seleccionar servicio desplegado para vincular)
- Botones de acciones: Editar, Eliminar, Aplicar SSL, Recargar nginx
- Sección de estado de nginx con botón de reload

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NGINX_SITES_AVAILABLE` | `/etc/nginx/sites-available/` | Ruta configs |
| `NGINX_SITES_ENABLED` | `/etc/nginx/sites-enabled/` | Ruta symlinks |
| `MONGODB_URI` | - | URI de MongoDB (ya existe) |

## Dependencias a Instalar

- Ninguna nueva (se usa child_process para comandos de sistema)

## Tareas de Implementación

1. Crear estructura de carpetas `src/modules/nginx/`
2. Crear schema `NginxSchema.ts`
3. Crear interfaces `NginxInterface.ts`
4. Crear servicio `NginxService.ts`
5. Crear controlador `NginxController.ts`
6. Crear rutas `NginxRoute.ts`
7. Registrar módulo en `index.ts`
8. Crear frontend `nginxService.js`
9. Crear frontend `nginxPageComponent.js`
10. Agregar ruta hash `#nginx` en `app.js`
11. Agregar item en sidebar