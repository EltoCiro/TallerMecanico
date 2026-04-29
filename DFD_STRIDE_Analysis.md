# 📊 Análisis de Diagrama de Flujo de Datos (DFD) - STRIDE Threat Model
## Proyecto: Taller Mecánico (Ionic + Node.js/Express + SQLite)

---

## 📋 1. ENTIDADES EXTERNAS (Rectángulos)
Actores y sistemas externos que interactúan con la aplicación.

### 1.1 Actores Humanos
| **Entidad Externa** | **Archivo/Módulo Representativo** | **Rol** | **Descripción** |
|---|---|---|---|
| 👤 **Cliente** | `src/app/login/login.page.ts` | Usuario final | Persona que solicita servicios de mantenimiento de vehículos |
| 🔧 **Mecánico** | `src/app/pages/service-orders/` | Usuario del sistema | Personal técnico que ejecuta órdenes de servicio |
| 👨‍💼 **Administrador** | `APIFInalV2/index.js` (middleware: `permit(['Administrador'])`) | Usuario privilegiado | Gestor de la operación completa del taller |
| 💳 **Cajero** | `api-actualizada/index.js` (roles ENUM) | Usuario de proceso | Responsable de transacciones y ventas |

### 1.2 Sistemas Externos
| **Entidad Externa** | **Archivo/Módulo Representativo** | **Tipo** | **Descripción** |
|---|---|---|---|
| 🌐 **Frontend Ionic App** | `src/app/app.component.ts`, `src/app/app.routes.ts` | Aplicación móvil | Interfaz de usuario en dispositivo móvil (Android vía Capacitor) |
| 🔌 **API Backend REST** | `api-actualizada/index.js`, `src/app/services/api.service.ts` | Servidor HTTP | Backend Node.js/Express que expone endpoints REST |
| 📱 **LocalStorage (Navegador)** | `src/app/services/auth.service.ts` | Almacenamiento local | Persistencia de sesión en dispositivo cliente |

---

## ⚙️ 2. PROCESOS (Círculos - Verbos)
Funciones principales, controladores y endpoints que transforman datos.

### 2.1 Procesos de Autenticación y Autorización
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| 🔐 **Autenticar Usuario** | `POST /login` (index.js:196) | `{ email, password }` | `{ token, user }` (JWT) | Público |
| ✍️ **Registrar Usuario** | `POST /register` (index.js:210) | `{ nombre, email, password, rol }` | Usuario creado con rol | Administrador |
| ✅ **Validar Token JWT** | `authMiddleware` (index.js:177) | JWT Bearer token | User object en `req.user` | Todos (autenticados) |
| 🛡️ **Verificar Permisos por Rol** | `permit(['rol1','rol2'])` (index.js:188) | User role en token | Acceso permitido/denegado | Según endpoint |

### 2.2 Procesos de Gestión de Clientes
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Cliente** | `POST /clients` (index.js:234) | `{ nombre, telefono, correo, direccion }` | Cliente creado (ID generado) | Admin, Cajero |
| 📖 **Listar Clientes** | `GET /clients` (index.js:244) | (ninguna) | Array de todos los clientes | Todos (autenticados) |
| 🔍 **Obtener Cliente** | `GET /clients/:id` (index.js:250) | `clientId` | Datos del cliente específico | Todos (autenticados) |
| ✏️ **Actualizar Cliente** | `PUT /clients/:id` (index.js:257) | `{ nombre, telefono, correo, direccion }` | Cliente actualizado | Admin, Cajero |
| 🗑️ **Eliminar Cliente** | `DELETE /clients/:id` (index.js:265) | `clientId` | Confirmación de eliminación | Admin |

### 2.3 Procesos de Gestión de Vehículos
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Vehículo** | `POST /vehicles` (index.js:273) | `{ placas, marca, modelo, anio, vin, ClientId }` | Vehículo creado | Admin, Cajero |
| 📖 **Listar Vehículos** | `GET /vehicles` (index.js:285) | (ninguna) | Array de vehículos | Todos (autenticados) |
| 🔍 **Obtener Vehículo** | `GET /vehicles/:id` (index.js:291) | `vehicleId` | Datos del vehículo | Todos (autenticados) |
| ✏️ **Actualizar Vehículo** | `PUT /vehicles/:id` (index.js:298) | `{ placas, marca, modelo, anio, vin }` | Vehículo actualizado | Admin, Cajero |
| 🗑️ **Eliminar Vehículo** | `DELETE /vehicles/:id` (index.js:306) | `vehicleId` | Confirmación de eliminación | Admin |

### 2.4 Procesos de Gestión de Presupuestos
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Presupuesto** | `POST /budgets` (index.js:390) | `{ ClientId, VehicleId, descripcion, items[], subtotal, impuesto, descuento, total }` | Presupuesto creado (estatus: pendiente) | Admin, Cajero |
| 📖 **Listar Presupuestos** | `GET /budgets` (index.js:410) | (ninguna) | Array de presupuestos con relaciones Client/Vehicle | Todos (autenticados) |
| 🔍 **Obtener Presupuesto** | `GET /budgets/:id` (index.js:419) | `budgetId` | Presupuesto con detalles | Todos (autenticados) |
| ✏️ **Actualizar Presupuesto** | `PUT /budgets/:id` (index.js:427) | `{ descripcion, items[], descuento }` | Presupuesto actualizado (recalcula totales) | Admin, Cajero |
| 🗑️ **Eliminar Presupuesto** | `DELETE /budgets/:id` (index.js:450) | `budgetId` | Confirmación de eliminación | Admin |
| 📊 **Cambiar Estatus Presupuesto** | `PUT /budgets/:id/status` (index.js:458) | `{ estatus: 'pendiente'\|'aprobado'\|'rechazado' }` | Presupuesto actualizado + Orden de Servicio creada (si aprobado) | Admin, Cajero |

### 2.5 Procesos de Órdenes de Servicio
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Orden** | `POST /service-orders` (index.js:475) | `{ BudgetId, descripcion, actividades[], assignedMechanicIds[], notas }` | Orden creada (estatus: pendiente) | Admin, Mecánico, Cajero |
| 📖 **Listar Órdenes** | `GET /service-orders` (index.js:490) | (ninguna) | Array de órdenes con Budget y Mechanics | Todos (autenticados) |
| 🔍 **Obtener Orden** | `GET /service-orders/:id` (index.js:497) | `orderId` | Orden con detalles y mecánicos asignados | Todos (autenticados) |
| ✏️ **Actualizar Orden** | `PUT /service-orders/:id` (index.js:505) | `{ descripcion, actividades[], notas, subtotal, impuesto, total }` | Orden actualizada | Admin, Mecánico |
| 🗑️ **Eliminar Orden** | `DELETE /service-orders/:id` (index.js:527) | `orderId` | Confirmación de eliminación | Admin |
| 📊 **Cambiar Estatus Orden** | `PUT /service-orders/:id/status` (index.js:535) | `{ estatus: 'pendiente'\|'en_proceso'\|'completada' }` | Orden con nuevo estatus | Admin, Mecánico |
| 👥 **Asignar Mecánicos** | `POST /service-orders/:id/assign` (index.js:548) | `{ mechanicIds[] }` | Asignación completada (tablaServiceOrderMechanics) | Admin |

### 2.6 Procesos de Gestión de Inventario
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Producto** | `POST /products` (index.js:318) | `{ nombreProducto, descripcion, cantidad, precioCosto, precioVenta, sku, minStockAlert }` | Producto creado | Admin |
| 📖 **Listar Productos** | `GET /products` (index.js:328) | (ninguna) | Array de productos | Todos (autenticados) |
| 🔍 **Obtener Producto** | `GET /products/:id` (index.js:336) | `productId` | Datos del producto | Todos (autenticados) |
| ✏️ **Actualizar Producto** | `PUT /products/:id` (index.js:343) | `{ nombreProducto, cantidad, precio* }` | Producto actualizado | Admin |
| 🗑️ **Eliminar Producto** | `DELETE /products/:id` (index.js:351) | `productId` | Confirmación de eliminación | Admin |
| 📦 **Registrar Movimiento Inventario** | `POST /inventory/move` (index.js:359) | `{ ProductId, tipo: 'ingreso'\|'salida'\|'ajuste', cantidad, motivo }` | InventoryMovement creado + Stock actualizado | Admin, Cajero |
| 📋 **Listar Movimientos** | `GET /inventory/movements` (index.js:380) | (sin filtros) | Array de movimientos de inventario | Admin |

### 2.7 Procesos de Ventas/Transacciones
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| 💰 **Procesar Venta Transaccional** | `POST /sales` (index.js:606) | `{ clientId, vehicleId, items[{productId, cantidad, unitPrice}], descuento, metodoPago }` | Sale creado + Stock decrementado + InventoryMovements + calcula impuestos (16%) | Admin, Cajero |
| 📋 **Listar Ventas / Filtrar por Rango** | `GET /sales?startDate=...&endDate=...` (index.js:655) | Query params fecha | Array de ventas + total agregado | Admin, Cajero |

### 2.8 Procesos de Generación de Reportes
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| 📊 **Reporte Inventario Bajo** | `GET /reports/inventory-low?threshold=5` (index.js:673) | `threshold` (default: 5) | Array de productos con cantidad ≤ threshold | Admin |
| 📈 **Reporte Resumen Ventas** | `GET /reports/sales-summary?startDate=...&endDate=...` (index.js:687) | Query params fecha | Array agrupado por día: `{ date, total, ventas }` | Admin |
| 👷 **Reporte Productividad Mecánicos** | `GET /reports/productivity` (index.js:705) | (ninguna) | Array: `{ mechanicId, nombre, completadas }` | Admin |

### 2.9 Procesos de Gestión de Personal/Staff
| **Proceso** | **Archivo/Endpoint** | **Entrada** | **Salida** | **Roles Permitidos** |
|---|---|---|---|---|
| ➕ **Crear Staff** | `POST /staff` (index.js:558) | `{ nombre, especialidad, horario }` | Staff creado | Admin |
| 📖 **Listar Staff** | `GET /staff` (index.js:570) | (ninguna) | Array de personal | Todos (autenticados) |
| 🔍 **Obtener Staff** | `GET /staff/:id` (index.js:577) | `staffId` | Datos del personal | Todos (autenticados) |
| ✏️ **Actualizar Staff** | `PUT /staff/:id` (index.js:585) | `{ nombre, especialidad, horario }` | Staff actualizado | Admin |
| 🗑️ **Eliminar Staff** | `DELETE /staff/:id` (index.js:593) | `staffId` | Confirmación de eliminación | Admin |

---

## 💾 3. ALMACENES DE DATOS (Líneas Dobles)
Dónde el sistema guarda información en reposo.

### 3.1 Base de Datos Principal
| **Almacén** | **Tecnología** | **Archivo** | **Tablas** | **Descripción** |
|---|---|---|---|---|
| 🗄️ **SQLite Taller** | SQLite 3 | `taller.sqlite` | 11 tablas | Base de datos relacional principal con toda la información transaccional y maestra |

**Detalles de Tablas:**

| **Tabla** | **Columnas Clave** | **Relaciones** | **Sensibilidad** |
|---|---|---|---|
| **Users** | id, nombre, email, password (hash bcrypt), rol (ENUM) | 1:N con ServiceOrder (Mechanics) | 🔴 CRÍTICA - credenciales |
| **Clients** | id, nombre, telefono, correo, direccion | 1:N Vehicles, 1:N Budgets | 🟡 ALTA - datos PII |
| **Vehicles** | id, placas, marca, modelo, anio, vin, ClientId | 1:N Budgets, 1:N ServiceOrders (implícito), belongs_to Client | 🟡 ALTA - datos vehículo |
| **Products** | id, nombreProducto, descripcion, cantidad, precioCosto, precioVenta, sku, minStockAlert | 1:N InventoryMovement | 🟡 MEDIA - datos comerciales |
| **InventoryMovements** | id, tipo (ENUM), cantidad, motivo, ProductId, createdAt | belongs_to Product | 🟡 MEDIA - auditoría de inventario |
| **Budgets** | id, descripcion, itemsJson (JSON string), subtotal, impuesto, descuento, total, estatus (ENUM), ClientId, VehicleId | 1:N ServiceOrder, belongs_to Client, belongs_to Vehicle | 🟡 ALTA - datos comerciales |
| **ServiceOrders** | id, descripcion, actividadesJson (JSON string), estatus (ENUM), notas, subtotal, impuesto, total, BudgetId | N:N User (through ServiceOrderMechanics), belongs_to Budget | 🟡 ALTA - datos operacionales |
| **ServiceOrderMechanics** | ServiceOrderId, UserId (through table) | M:N Users y ServiceOrders | 🟡 MEDIA - auditoría |
| **Staff** | id, nombre, especialidad, horario | Independiente | 🟡 MEDIA - RRHH |
| **Sales** | id, fecha, subtotal, impuesto, descuento, total, metodoPago (ENUM), itemsJson (JSON), ClientId, VehicleId, createdById | belongs_to Client, belongs_to Vehicle, belongs_to User | 🔴 CRÍTICA - transaccional/contable |
| **SequelizeMeta** | name, sequelize | Sistema Sequelize | 🟢 BAJA - control de migraciones |

### 3.2 Almacenamiento de Sesión (Navegador)
| **Almacén** | **Tecnología** | **Archivo** | **Datos** | **Descripción** |
|---|---|---|---|---|
| 🌐 **LocalStorage (Frontend)** | Browser LocalStorage | `src/app/services/auth.service.ts` | `token` (JWT), `currentUser` (JSON serializado) | Persistencia de sesión en dispositivo cliente |

**Detalles:**
- **Clave:** `token` → Valor: JWT Bearer token (formato: `header.payload.signature`)
- **Clave:** `currentUser` → Valor: `{ id, nombre, email, rol, telefono }` (JSON string)
- **Riesgos:** Token almacenado en plaintext, vulnerable a XSS

### 3.3 Logs del Sistema (Implícitos)
| **Almacén** | **Tecnología** | **Ubicación** | **Datos** | **Descripción** |
|---|---|---|---|---|
| 📝 **Console Logs** | console.log/error | Servidor Node.js stdout | Errores, SQL queries (logging: false en Sequelize) | Debugging, sin persistencia configurable |

---

## 🔀 4. FLUJOS DE DATOS (Flechas Unidireccionales)
Exactamente qué paquete de datos viaja entre componentes y en qué dirección.

### 4.1 Flujo de Autenticación
```
Cliente (App Ionic)
    ↓ [Credenciales: email, password]
API Backend: POST /login
    ↓ [Busca User en DB, valida bcrypt]
SQLite: Tabla Users (lookup)
    ↑ [User encontrado o error]
API Backend: Genera JWT
    ↓ [JWT Token + User metadata: {id, nombre, email, rol}]
LocalStorage (Frontend)
    → Almacena "token" y "currentUser"
```

### 4.2 Flujo de Autorización en Cada Request
```
Cliente (App Ionic)
    ↓ [HTTP Request + Header: Authorization: Bearer <JWT>]
API Backend: authMiddleware
    ↓ [Extrae token de header]
API Backend: jwt.verify(token, JWT_SECRET)
    ↓ [Busca User por payload.id]
SQLite: Tabla Users (lookup)
    ↑ [User encontrado]
API Backend: req.user = user object
    ↓ [Pasa a siguiente middleware/ruta]
API Backend: permit(['Administrador', 'Cajero'])
    ↓ [Valida req.user.rol contra lista permitida]
✓ Acceso permitido → ejecuta endpoint
✗ Acceso denegado (403) → rechaza request
```

### 4.3 Flujo de Creación de Cliente
```
Usuario (Admin/Cajero) en App Ionic
    ↓ [Formulario: nombre, telefono, correo, direccion]
ClientsPage Component
    ↓ [Llama ApiService.createClient(data)]
API Service (src/app/services/api.service.ts)
    ↓ [POST /clients + Headers: {Authorization, Content-Type}]
API Backend: POST /clients (index.js:234)
    ↓ [authMiddleware valida JWT]
    ↓ [permit(['Administrador','Cajero']) valida rol]
    ↓ [Cliente.create({nombre, telefono, correo, direccion})]
SQLite: INSERT INTO Clients (...)
    ↑ [Cliente creado con ID autogenerado]
API Backend: res.json(cliente)
    ↓ [JSON: {id, nombre, telefono, correo, direccion, createdAt, updatedAt}]
Frontend Ionic: recibe response
    → Actualiza lista de clientes en UI
    → Muestra confirmación al usuario
```

### 4.4 Flujo de Gestión de Presupuestos (Creación → Aprobación → Orden)
```
Usuario (Admin/Cajero)
    ↓ [Presupuesto: ClientId, VehicleId, items[], descuento]
API: POST /budgets
    ↓ [Crea Budget con estatus='pendiente']
SQLite: INSERT INTO Budgets
    ↑ [Budget guardado]

--- Cambio de estatus (Admin/Cajero aprueba) ---

Usuario
    ↓ [PUT /budgets/:id/status {estatus: 'aprobado'}]
API: Valida rol
    ↓ [if estatus === 'aprobado']
    ↓ [Crea ServiceOrder automáticamente]
SQLite: INSERT INTO ServiceOrders
    ↑ [Orden creada]
    ↓ [Respuesta: {budget, createdOrder}]
Frontend: Muestra orden creada
```

### 4.5 Flujo de Venta Transaccional (Crítico - Atomicidad)
```
Usuario (Cajero/Admin)
    ↓ [Carrito: items[{productId, cantidad, unitPrice}], descuento, metodoPago, clientId, vehicleId]
API: POST /sales
    ↓ [Inicia transacción Sequelize]
    ↓ [Valida stock de cada producto]
SQLite: SELECT cantidad FROM Products (lock: UPDATE)
    ↓ [Cálculos: subtotal, impuesto (16%), total]
    ↓ [INSERT INTO Sales (...)]
    ↓ [Para cada item: UPDATE Products SET cantidad = cantidad - cantidad_vendida]
    ↓ [INSERT INTO InventoryMovement (tipo='salida', ...)]
SQLite: COMMIT transacción
    ↑ [Éxito: Sale creada con ID]
    ↑ [Stock decrementado]
    ↑ [Movimientos registrados]
    ↓ [res.json({saleId, sale})]
Frontend: Muestra recibo/confirmación
    → Recalcula inventario si está en vista

[Si hay error en cualquier paso]
    ↓ [ROLLBACK - reversa todas las operaciones]
    ↓ [res.status(500).json({error: '...'})]
Frontend: Muestra error
```

### 4.6 Flujo de Asignación de Mecánicos a Orden
```
Usuario (Admin)
    ↓ [Orden ID + Lista de mechanicIds: [1, 3, 5]]
API: POST /service-orders/:id/assign
    ↓ [Busca ServiceOrder por ID]
SQLite: SELECT * FROM ServiceOrders WHERE id = :id
    ↓ [order.setMechanics(mechanicIds)]
    ↓ [Trunca tabla ServiceOrderMechanics WHERE ServiceOrderId = :id]
    ↓ [INSERT múltiples filas en ServiceOrderMechanics]
SQLite: 
    Row 1: (ServiceOrderId, UserId) = (5, 1)
    Row 2: (ServiceOrderId, UserId) = (5, 3)
    Row 3: (ServiceOrderId, UserId) = (5, 5)
    ↑ [Asignaciones creadas]
    ↓ [res.json({message: 'Mecánicos asignados'})]
Frontend: Actualiza UI con mecánicos asignados
```

### 4.7 Flujo de Movimiento de Inventario
```
Usuario (Admin/Cajero)
    ↓ [ProductId, tipo: 'ingreso'|'salida'|'ajuste', cantidad, motivo]
API: POST /inventory/move
    ↓ [Busca Product]
SQLite: SELECT * FROM Products WHERE id = :id (lock UPDATE)
    ↓ [Actualiza cantidad según tipo]
    ↓ [INSERT INTO InventoryMovement]
SQLite: 
    UPDATE Products SET cantidad = ...
    INSERT INTO InventoryMovement (tipo, cantidad, motivo, ProductId, ...)
    ↑ [Movimiento registrado]
    ↓ [res.json({message: '...', product})]
Frontend: Actualiza vistas de inventario
```

### 4.8 Flujo de Generación de Reportes
```
Usuario (Admin)
    ↓ [Solicita reporte: GET /reports/inventory-low?threshold=5]
API: GET /reports/inventory-low
    ↓ [SELECT * FROM Products WHERE cantidad <= threshold]
SQLite: Query con condición
    ↑ [Array de productos bajo stock]
    ↓ [res.json(productos)]
Frontend: Renderiza tabla/gráfico
    → Datos fluyen a componentes de reporte
```

### 4.9 Flujo de Lectura de Datos (GET típico)
```
Frontend Ionic (Dashboard, lista de clientes)
    ↓ [GET /clients (con JWT en header)]
API Backend
    ↓ [authMiddleware: valida JWT]
    ↓ [Client.findAll({ include: [...] })]
SQLite: SELECT * FROM Clients (con JOINs si corresponde)
    ↑ [Array de clientes]
    ↓ [res.json(clientes)]
Frontend: recibe JSON
    → Mapea a array de objetos Angular
    → *ngFor renderiza en template
```

---

## 🚨 5. LÍMITES DE CONFIANZA (Líneas Punteadas)
Fronteras lógicas donde datos cruzan de zonas de menor a mayor confianza.

### 5.1 Límite 1: Entre Dispositivo Cliente y Red
```
┌─────────────────────────────────────────────┐
│         ZONA DE MENOR CONFIANZA             │
│   Dispositivo Móvil del Usuario (Ionic)    │
│   • LocalStorage (accesible a JS)          │
│   • Variables en memoria de App             │
└──────────────┬──────────────────────────────┘
               │ LÍMITE DE CONFIANZA #1
               │ (Red HTTP/HTTPS)
               ↓
┌──────────────┴──────────────────────────────┐
│      ZONA DE CONFIANZA INTERMEDIA           │
│   Backend API (Node.js/Express)            │
│   • Servidor controlado por organización    │
│   • Validaciones de entrada/salida          │
└──────────────────────────────────────────────┘
```

**Datos que cruzan el límite:**
- Credenciales (email, password) en plain text dentro de POST /login → **RIESGO: HTTPS obligatorio**
- JWT Token en header Authorization (Bearer token)
- Datos de clientes, vehículos, presupuestos (JSON)

**Protecciones:**
- ✓ CORS habilitado en Express
- ✓ Content-Type: application/json validado
- ✓ JWT para cada request autenticado
- ⚠️ PENDIENTE: Validar HTTPS en producción

---

### 5.2 Límite 2: Entre Backend API y Base de Datos
```
┌──────────────────────────────────────────────┐
│      ZONA DE CONFIANZA INTERMEDIA           │
│   Backend API (Node.js/Express)             │
│   • Lógica de negocio                       │
│   • Validaciones                            │
└──────────────┬───────────────────────────────┘
               │ LÍMITE DE CONFIANZA #2
               │ (SQLite local)
               ↓
┌──────────────┴───────────────────────────────┐
│        ZONA DE MÁXIMA CONFIANZA             │
│   SQLite Database (taller.sqlite)           │
│   • Datos persistentes                       │
│   • Información confidencial                 │
│   • NO accesible desde frontend              │
└───────────────────────────────────────────────┘
```

**Datos que cruzan el límite:**
- Queries SQL (SELECT, INSERT, UPDATE, DELETE) vía Sequelize ORM
- Datos serializados (JSON en columnas de texto)
- Credenciales hasheadas (bcrypt)
- Información financiera/transaccional

**Protecciones:**
- ✓ Sequelize ORM previene SQL injection
- ✓ Bcryptjs hash para passwords (no plaintext)
- ✓ Transactions para operaciones críticas
- ✓ SQLite no está expuesto por red (archivo local)

---

### 5.3 Límite 3: Entre Usuario no Autenticado y Recursos Protegidos
```
┌──────────────────────────────────────────────┐
│    ZONA DE MENOR CONFIANZA                  │
│   Usuarios NO Autenticados                  │
│   • Sin JWT token                           │
│   • Acceso público limitado                 │
└──────────────┬───────────────────────────────┘
               │ LÍMITE DE CONFIANZA #3
               │ (authMiddleware)
               ↓
┌──────────────┴───────────────────────────────┐
│    ZONA DE MAYOR CONFIANZA                  │
│   Usuarios Autenticados (con JWT)           │
│   • Token validado                          │
│   • Acceso a recursos según rol             │
└───────────────────────────────────────────────┘
```

**Endpoints públicos (sin autenticación):**
- POST /login (retorna JWT)
- GET / (health check)

**Endpoints protegidos (requieren JWT):**
- Todos los demás (GET, POST, PUT, DELETE)

**Flujo de validación:**
```
Request → authMiddleware
    ↓ Header Authorization presente?
    ✗ No → 401 Unauthorized
    ↓ JWT válido (signature, expiración)?
    ✗ No → 401 Token inválido
    ↓ Usuario existe en DB?
    ✗ No → 401 Usuario no encontrado
    ✓ Sí → Prosigue a siguiente middleware/ruta
```

---

### 5.4 Límite 4: Entre Roles de Usuarios (Autorización)
```
┌──────────────────────────────────────────────┐
│    ZONA DE MENOR CONFIANZA                  │
│   Usuarios con Rol "Cajero"                 │
│   • Acceso limitado a operaciones            │
│   • No puede crear usuarios                  │
│   • No puede eliminar productos              │
└──────────────┬───────────────────────────────┘
               │ LÍMITE DE CONFIANZA #4
               │ (permit() middleware)
               ↓
┌──────────────┴───────────────────────────────┐
│    ZONA DE MAYOR CONFIANZA                  │
│   Usuario con Rol "Administrador"           │
│   • Acceso a todas operaciones              │
│   • Puede crear/eliminar usuarios            │
│   • Puede ver reportes completos             │
└───────────────────────────────────────────────┘
```

**Matriz de Control de Acceso (por endpoint):**

| Endpoint | Público | Cajero | Mecánico | Admin | Descripción |
|---|:---:|:---:|:---:|:---:|---|
| POST /login | ✓ | ✓ | ✓ | ✓ | Todos pueden autenticarse |
| POST /register | ✗ | ✗ | ✗ | ✓ | Solo Admin crea usuarios |
| GET /users | ✗ | ✗ | ✗ | ✓ | Solo Admin lista usuarios |
| POST /clients | ✗ | ✓ | ✗ | ✓ | Admin y Cajero |
| GET /clients | ✗ | ✓ | ✓ | ✓ | Todos (autenticados) |
| DELETE /clients | ✗ | ✗ | ✗ | ✓ | Solo Admin |
| POST /budgets | ✗ | ✓ | ✗ | ✓ | Admin y Cajero |
| POST /service-orders | ✗ | ✓ | ✓ | ✓ | Admin, Cajero, Mecánico |
| PUT /service-orders/:id | ✗ | ✗ | ✓ | ✓ | Admin y Mecánico |
| DELETE /service-orders/:id | ✗ | ✗ | ✗ | ✓ | Solo Admin |
| POST /sales | ✗ | ✓ | ✗ | ✓ | Admin y Cajero |
| GET /reports/* | ✗ | ✗ | ✗ | ✓ | Solo Admin |

**Validación de rol:**
```javascript
// En cada endpoint protegido:
permit(['Administrador', 'Cajero'])(req, res, next)
    ↓ if (!req.user) → 401 No autorizado
    ↓ if (!allowed.includes(req.user.rol)) → 403 Permiso denegado
    ✓ else → Prosigue
```

---

### 5.5 Límite 5: Frontend vs Backend (Separación de Confianza)
```
┌──────────────────────────────────────────────┐
│     DISPOSITIVO DEL USUARIO (CLIENTE)       │
│   ┌────────────────────────────────────────┐ │
│   │  Código Angular/Ionic (menos confiable) │ │
│   │  • Accesible a JS injections            │ │
│   │  • LocalStorage visible a XSS           │ │
│   └─────────────┬──────────────────────────┘ │
│                 │ API Service                 │
│                 ↓ HTTP/HTTPS                 │
│   ┌─────────────┬──────────────────────────┐ │
│   │ LocalStorage (token, currentUser)     │ │
│   │ • No debe contener datos sensibles    │ │
│   │ • Token vulnerable a XSS              │ │
│   └────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────┘
               │ RED (HTTPS)
               ↓
┌──────────────┴──────────────────────────────┐
│     SERVIDOR (BACKEND - CONFIABLE)          │
│   ┌────────────────────────────────────────┐ │
│   │  Express API (controlado, verificable) │ │
│   │  • Node.js en servidor seguro          │ │
│   │  • Validaciones en servidor            │ │
│   │  • Lógica de negocio protegida         │ │
│   └─────────────┬──────────────────────────┘ │
│                 │ SQL (Sequelize)            │
│                 ↓ Archivo local              │
│   ┌─────────────┬──────────────────────────┐ │
│   │  SQLite (taller.sqlite)                │ │
│   │  • Persistencia segura                 │ │
│   │  • No accesible públicamente            │ │
│   └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Riesgos en este límite:**
- 🔴 CRÍTICO: Token en LocalStorage vulnerable a XSS
- 🔴 CRÍTICO: Credenciales en POST /login en plaintext (requiere HTTPS)
- 🟡 ALTO: CORS permite acceso desde cualquier origen (revisar)
- 🟡 ALTO: Validaciones solo en servidor (correcto), pero frontend confía ciegamente

---

## 📌 RESUMEN DE LÍMITES DE CONFIANZA

| **Límite** | **De (Menor Confianza)** | **A (Mayor Confianza)** | **Datos Críticos** | **Protección** |
|---|---|---|---|---|
| **#1** | Dispositivo móvil | Red pública (HTTP/HTTPS) | Credenciales, JWT | ✓ HTTPS obligatorio |
| **#2** | Backend API | SQLite Local | Queries, contraseñas hasheadas | ✓ ORM Sequelize, bcrypt |
| **#3** | Usuario anónimo | Recursos autenticados | Token JWT | ✓ authMiddleware |
| **#4** | Rol Cajero | Rol Administrador | Datos operacionales | ✓ permit() middleware |
| **#5** | Frontend (Cliente) | Backend (Servidor) | Toda comunicación | ✓ API contracts, validaciones |

---

## 🔍 NOTAS IMPORTANTES PARA STRIDE

### Trust Boundaries Críticas para Threat Modeling:
1. **Entrada de datos no validada** desde el frontend → puede llevar a inyecciones
2. **Manejo de credenciales** en LocalStorage → XSS risk
3. **JWT sin expiración explícita** → posible token hijacking
4. **Transacciones sin rollback adecuado** → inconsistencia de datos
5. **SQL injection** (mitigado por Sequelize ORM)
6. **Acceso a datos privados** de otros usuarios (sin validación de propiedad)

### Flujos de Datos Sensibles:
- **Flujo de pagos/dinero** (POST /sales): dinero, totales, impuestos
- **Flujo de autenticación** (POST /login): credenciales, tokens
- **Flujo de auditoría** (InventoryMovements): quién hizo qué y cuándo
- **Flujo de reports** (GET /reports/*): datos agregados de todo el negocio

---

**Documento generado para análisis de ciberseguridad con metodología STRIDE**
**Fecha: 28 de abril de 2026**
**Versión: 1.0**
