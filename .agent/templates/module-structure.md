# Plantilla De Estructura De Modulo

```text
/src/modules/{module}
/src/modules/{module}/interfaces
/src/modules/{module}/controllers/{Name}Controller.ts
/src/modules/{module}/services/{Name}Service.ts
/src/modules/{module}/models/{Name}Model.ts
/src/modules/{module}/schemas/{Name}Schema.ts
/src/modules/{module}/entities/{Name}Entity.ts
/src/modules/{module}/repositories/{Name}Repository.ts
/src/modules/{module}/middlewares/{name}.middleware.ts
/src/modules/{module}/routes/{name}.routes.ts
/src/modules/{module}/utils
```

## Dependencias Esperadas

```text
routes -> middlewares -> controller -> service -> repository -> model/schema
service -> dto/entity/utils
```
