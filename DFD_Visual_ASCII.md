# 📐 DFD Visual ASCII - Taller Mecánico (Para Diagrama Gráfico)

## 1️⃣ ENTIDADES EXTERNAS (RECTÁNGULOS)
```
Estructura:
┌─────────────────┐
│   ENTIDAD EXT   │
│   (Rectángulo)  │
└─────────────────┘
```

### Actores Humanos:
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CLIENTE    │    │   MECÁNICO   │    │ ADMINISTRADOR│    │    CAJERO    │
│              │    │              │    │              │    │              │
│ (usuario)    │    │ (user role:  │    │ (user role:  │    │ (user role:  │
│              │    │  Mecánico)   │    │  Admin)      │    │  Cajero)     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Sistemas Externos:
```
┌──────────────────────┐         ┌──────────────────────┐
│  IONIC APP (MÓVIL)   │         │  BACKEND API REST    │
│  (Frontend)          │◄───────►│  (Node.js/Express)   │
│  - Angular 20        │ HTTP/   │  - Port 3000         │
│  - Capacitor Android │ HTTPS   │  - Sequelize ORM     │
└──────────────────────┘         └──────────────────────┘
           ▲
           │
           │ LocalStorage
           │
    ┌──────────────┐
    │ LocalStorage │
    │   (Browser)  │
    │ - token (JWT)│
    │ - currentUser│
    └──────────────┘
```

---

## 2️⃣ PROCESOS (CÍRCULOS - VERBOS)

```
Estructura:
      ↓ entrada
      │
   ◯ PROCESO ◯
      │
      ↓ salida
```

### Procesos Principales (Agrupados por dominio):

```
═══════════════════════════════════════════════════════════════
                    PROCESOS DE AUTENTICACIÓN
═══════════════════════════════════════════════════════════════

  Credenciales (email, password)
           │
           ▼
  ◯ Autenticar Usuario ◯  [POST /login]
           │
           ├─► ◯ Validar Password con bcrypt ◯
           │        │
           │        ▼ (búsqueda en DB)
           │
           └─► Generar JWT Token
           │
           ▼
  {token, user} + HTTP 200


═══════════════════════════════════════════════════════════════
                    PROCESOS DE CLIENTES
═══════════════════════════════════════════════════════════════

  {nombre, telefono, correo, direccion}
           │
           ▼
  ◯ Crear Cliente ◯  [POST /clients]  (Admin, Cajero)
           │
           ├─► ◯ Validar JWT ◯
           │
           ├─► ◯ Verificar Rol ◯
           │
           └─► ◯ Insertar en DB ◯
           │
           ▼
  Cliente creado {id, ...} + HTTP 201


═══════════════════════════════════════════════════════════════
                    PROCESOS DE PRESUPUESTOS
═══════════════════════════════════════════════════════════════

  Presupuesto: {ClientId, VehicleId, items[], descuento}
           │
           ▼
  ◯ Crear Presupuesto ◯  [POST /budgets]  (Admin, Cajero)
           │
           ├─► ◯ Calcular Totales ◯
           │   (subtotal, impuesto 16%, total)
           │
           └─► ◯ Almacenar en DB ◯ (estatus: pendiente)
           │
           ▼
  Budget {id, subtotal, impuesto, total, estatus='pendiente'}


  Luego: {budgetId, estatus: 'aprobado'}
           │
           ▼
  ◯ Cambiar Estatus a Aprobado ◯  [PUT /budgets/:id/status]
           │
           ├─► ◯ Validar transición ◯
           │
           ├─► ◯ Crear ServiceOrder ◯ (automática)
           │
           └─► ◯ Actualizar Budget ◯
           │
           ▼
  Budget {estatus='aprobado'} + ServiceOrder creada


═══════════════════════════════════════════════════════════════
                    PROCESOS DE ÓRDENES DE SERVICIO
═══════════════════════════════════════════════════════════════

  {BudgetId, descripcion, actividades[], mechanicIds[]}
           │
           ▼
  ◯ Crear Orden de Servicio ◯  [POST /service-orders]
           │
           ├─► ◯ Serializar Actividades ◯ (JSON string)
           │
           ├─► ◯ Asignar Mecánicos ◯ (tabla ServiceOrderMechanics)
           │
           └─► ◯ Guardar Orden ◯ (estatus: pendiente)
           │
           ▼
  ServiceOrder {id, estatus='pendiente', BudgetId, Mechanics[]}


  Luego: {orderId, estatus: 'en_proceso' → 'completada'}
           │
           ▼
  ◯ Cambiar Estatus Orden ◯  [PUT /service-orders/:id/status]
           │
           ├─► ◯ Validar transición ◯
           │
           └─► ◯ Actualizar estatus ◯
           │
           ▼
  ServiceOrder {estatus='completada'}


═══════════════════════════════════════════════════════════════
                    PROCESOS DE VENTAS (CRÍTICO - TRANSACCIONAL)
═══════════════════════════════════════════════════════════════

  Carrito: {items[{productId, cantidad, unitPrice}], clientId, descuento, metodoPago}
           │
           ▼
  ◯ Iniciar Transacción ◯
           │
           ├─► ◯ Validar Stock ◯
           │   (SELECT cantidad FROM Products para cada item)
           │   ✗ Falla: ROLLBACK
           │
           ├─► ◯ Calcular Totales ◯
           │   (subtotal, impuesto 16%, total)
           │
           ├─► ◯ Crear Venta ◯
           │   INSERT INTO Sales
           │
           ├─► Para cada item:
           │   ◯ Decrementar Stock ◯ + ◯ Crear InventoryMovement ◯
           │
           └─► ◯ Commit Transacción ◯
           │
           ▼
  Sale {id, total, itemsJson} + Products.cantidad actualizado


═══════════════════════════════════════════════════════════════
                    PROCESOS DE INVENTARIO
═══════════════════════════════════════════════════════════════

  {ProductId, tipo: 'ingreso'|'salida'|'ajuste', cantidad, motivo}
           │
           ▼
  ◯ Registrar Movimiento ◯  [POST /inventory/move]
           │
           ├─► ◯ Actualizar Stock ◯
           │   (cantidad +/- según tipo)
           │
           └─► ◯ Crear InventoryMovement ◯ (auditoría)
           │
           ▼
  Movement {id, tipo, cantidad, ProductId, createdAt}


═══════════════════════════════════════════════════════════════
                    PROCESOS DE REPORTES (SOLO LECTURA)
═══════════════════════════════════════════════════════════════

  ◯ Generar Reporte Inventario Bajo ◯  [GET /reports/inventory-low]
           │
           ├─► ◯ Query: productos con cantidad ≤ threshold ◯
           │
           ▼
  Array [Products...]

  ◯ Generar Reporte Ventas ◯  [GET /reports/sales-summary]
           │
           ├─► ◯ Agrupar por día ◯
           │
           ▼
  Array [{date, total, ventas}]

  ◯ Generar Reporte Productividad ◯  [GET /reports/productivity]
           │
           ├─► ◯ Contar órdenes completadas por mecánico ◯
           │
           ▼
  Array [{mechanicId, nombre, completadas}]
```

---

## 3️⃣ ALMACENES DE DATOS (LÍNEAS DOBLES)

```
Estructura:
╔═════════════════╗
║  ALMACÉN DATA   ║
╚═════════════════╝
```

### Base de Datos Principal:
```
╔════════════════════════════════════════════════════════════════════╗
║                     SQLite: taller.sqlite                         ║
║                                                                    ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            ║
║  │    Users     │  │   Clients    │  │  Vehicles    │            ║
║  │ (id, email,  │  │ (id, nombre, │  │ (id, placas, │            ║
║  │  password,   │  │  telefono)   │  │  marca, vin) │            ║
║  │  rol)        │  └──────────────┘  └──────────────┘            ║
║  └──────────────┘         │                  │                    ║
║                           └────────┬─────────┘                    ║
║                                    ▼                               ║
║                          ┌──────────────────┐                     ║
║                          │    Budgets       │                     ║
║                          │ (id, ClientId,   │                     ║
║                          │  VehicleId,      │                     ║
║                          │  items[JSON],    │                     ║
║                          │  subtotal,       │                     ║
║                          │  total, estatus) │                     ║
║                          └──────────────────┘                     ║
║                                    │                               ║
║                                    ▼                               ║
║                    ┌───────────────────────────┐                  ║
║                    │   ServiceOrders           │                  ║
║                    │ (id, BudgetId,            │                  ║
║                    │  actividades[JSON],       │                  ║
║                    │  estatus, total)          │                  ║
║                    └───────────────────────────┘                  ║
║                            │                                      ║
║                            ▼                                      ║
║              ┌──────────────────────────┐                         ║
║              │ ServiceOrderMechanics    │                         ║
║              │ (through table)          │                         ║
║              │ (ServiceOrderId, UserId) │                         ║
║              └──────────────────────────┘                         ║
║                            ▲                                      ║
║                            │                                      ║
║              ┌─────────────────────────┐                          ║
║              │ (relaciona a Users)     │                          ║
║              └─────────────────────────┘                          ║
║                                                                    ║
║  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐          ║
║  │  Products    │  │ Inventory      │  │    Sales     │          ║
║  │ (id, nombre, │  │ Movements      │  │ (id, fecha,  │          ║
║  │  cantidad,   │  │ (id, ProductId,│  │  total,      │          ║
║  │  precio*)    │  │  tipo, motivo) │  │  ClientId,   │          ║
║  └──────────────┘  └────────────────┘  │  items[JSON])│          ║
║         │                                └──────────────┘          ║
║         └──────────────────┬─────────────────────┘               ║
║                            │                                      ║
║                    (movimientos de                                ║
║                     inventario por venta)                         ║
║                                                                    ║
║  ┌──────────────┐  ┌──────────────┐                              ║
║  │    Staff     │  │   SequelizeMeta (internal)                 ║
║  │ (id, nombre, │  │   (migraciones)                             ║
║  │  especialidad)    └──────────────┘                             ║
║  └──────────────┘                                                ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### LocalStorage del Navegador:
```
╔═════════════════════════════════════════╗
║  LocalStorage (Browser - Cliente)       ║
║                                         ║
║  Clave: "token"                         ║
║  Valor: "eyJhbGc...[JWT Token]...QIQ"  ║
║                                         ║
║  Clave: "currentUser"                   ║
║  Valor: {                               ║
║    "id": 1,                             ║
║    "nombre": "Juan",                    ║
║    "email": "juan@example.com",         ║
║    "rol": "Cajero"                      ║
║  }                                      ║
║                                         ║
╚═════════════════════════════════════════╝
```

---

## 4️⃣ FLUJOS DE DATOS (FLECHAS UNIDIRECCIONALES)

```
Estructura de flujo:
[Origen]
    │ [Descripción del dato]
    ▼
[Destino]
```

### 4.1 Flujo de Autenticación Completo:
```
┌──────────────────┐
│  Ionic App UI    │
│  (Login Form)    │
└────────┬─────────┘
         │ [email, password - PLAINTEXT]
         ▼
  ◯ Login Process ◯
         │ [HTTP POST /login]
         ▼
┌──────────────────────────┐
│  API Backend             │
│  authMiddleware          │
└────────┬─────────────────┘
         │ [SELECT * FROM Users WHERE email]
         ▼
╔═════════════════════════╗
║  SQLite: Users Table    ║
╚────────┬────────────────┘
         │ [Found User]
         ▼
  ◯ Validate Password ◯
  (bcrypt compare)
         │ ✓ Match
         ▼
  ◯ Generate JWT ◯
         │ [Token signed with JWT_SECRET]
         ▼
┌──────────────────────────┐
│  Response: {token, user} │
│  HTTP 200                │
└────────┬─────────────────┘
         │ [JSON response]
         ▼
┌──────────────────┐
│  Frontend Ionic  │
│  auth.service.ts │
└────────┬─────────┘
         │ [localStorage.setItem('token', ...)]
         │ [localStorage.setItem('currentUser', ...)]
         ▼
╔═════════════════════════╗
║  Browser LocalStorage   ║
║  token + currentUser    ║
╚═════════════════════════╝
```

### 4.2 Flujo de Request Protegido:
```
┌──────────────────┐
│  Ionic App UI    │
│  (Clients List)  │
└────────┬─────────┘
         │ [GET /clients + Header: Authorization: Bearer <token>]
         ▼
┌──────────────────────────┐
│  API Backend             │
│  authMiddleware          │
└────────┬─────────────────┘
         │ [Extract token from header]
         │ [jwt.verify(token, JWT_SECRET)]
         ▼
╔═════════════════════════╗
║  SQLite: Users Table    ║
║  [SELECT * WHERE id=...]║
╚────────┬────────────────┘
         │ [User found]
         ▼
  ◯ Check Role ◯
  (permit middleware)
         │ ✓ Allowed
         ▼
  ◯ Business Logic ◯
  (GET /clients endpoint)
         │ [SELECT * FROM Clients]
         ▼
╔═════════════════════════╗
║  SQLite: Clients Table  ║
╚────────┬────────────────┘
         │ [Array of clients]
         ▼
┌──────────────────────────┐
│  Response: [clients]     │
│  HTTP 200                │
└────────┬─────────────────┘
         │ [JSON array]
         ▼
┌──────────────────┐
│  Frontend Ionic  │
│  clients.page.ts │
└────────┬─────────┘
         │ [*ngFor renderiza en UI]
         ▼
┌────────────────────────┐
│  Pantalla de Clientes  │
│  (renderizado)         │
└────────────────────────┘
```

### 4.3 Flujo de Venta (Transaccional - CRÍTICO):
```
┌────────────────────────┐
│ Ionic UI - Carrito     │
│ items[], clientId,     │
│ descuento, metodoPago  │
└────────┬───────────────┘
         │ [POST /sales + JWT]
         ▼
┌────────────────────────┐
│  API Backend           │
│  Iniciar Transacción   │
└────────┬───────────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
    ◯ Validar            ◯ Calcular
    Stock               Totales
    para cada item      (subtotal, tax,
         │              total)
         ▼              │
    ╔════════════════╗  │
    ║ Products Tbl   ║  │
    ║ (SELECT...     ║  │
    ║  FOR UPDATE)   ║  │
    ╚────┬───────────╝  │
         │              │
         ◄──────────────┘
         │ [Todos validados]
         ▼
  ◯ INSERT INTO Sales ◯
         │
         ▼
╔═════════════════════════╗
║  SQLite: Sales Table    ║
║  [INSERT new sale]      ║
╚────────┬────────────────┘
         │
         ├─────────────────────────────────────────┐
         │ Para cada item:                         │
         │                                         │
         ├─► ◯ UPDATE Products ◯                  │
         │   SET cantidad -= cantidad_vendida     │
         │   │                                     │
         │   ▼                                     │
         │  ╔═══════════════════════╗             │
         │  ║ Products Table Updated║             │
         │  ╚═══════════════════════╝             │
         │                                         │
         ├─► ◯ INSERT INTO InventoryMovement ◯   │
         │   (tipo='salida', motivo='Venta #...')│
         │   │                                     │
         │   ▼                                     │
         │  ╔════════════════════════════════════╗│
         │  ║ InventoryMovements Table           ║│
         │  ║ [INSERT movement record]           ║│
         │  ╚════════════════════════════════════╝│
         │                                         │
         └─────────────────────────────────────────┘
         │
         ▼
  ◯ Commit Transacción ◯
         │
         ▼
┌────────────────────────────┐
│  Response: {saleId, sale}  │
│  HTTP 201                  │
└────────┬───────────────────┘
         │ [JSON with sale details]
         ▼
┌──────────────────┐
│  Ionic App       │
│  sales.page.ts   │
└────────┬─────────┘
         │ [Actualiza lista de ventas]
         │ [Muestra recibo]
         ▼
┌───────────────────┐
│ Recibo en Pantalla│
└───────────────────┘

[Si hay ERROR en cualquier step:]
    ▼
  ◯ Rollback Transacción ◯
    │ [Revierte TODOS los cambios]
    │ [Sales NO se crea]
    │ [Stock NO cambia]
    │ [InventoryMovement NO se crea]
    ▼
  Response: HTTP 500 {error: '...'}
    │
    ▼
  Ionic UI muestra error
```

### 4.4 Flujo de Presupuesto → Aprobación → Orden:
```
┌────────────────────┐
│ Crear Presupuesto  │
│ {ClientId, items[]}│
└────────┬───────────┘
         │ [POST /budgets]
         ▼
╔═════════════════╗
║ Budget creado   ║
║ estatus=        ║
║ 'pendiente'     ║
╚─────────────────╝
         │
         │ [Administrador aprueba]
         │ [PUT /budgets/:id/status]
         │ {estatus: 'aprobado'}
         ▼
  ◯ Cambiar Estatus ◯
         │
         ├─► ◯ Crear ServiceOrder ◯ (automático)
         │        │
         │        ▼
         │   ╔═══════════════════════╗
         │   ║ ServiceOrder creada   ║
         │   ║ estatus='pendiente'   ║
         │   ║ BudgetId=<budget_id> ║
         │   ╚═══════════════════════╝
         │
         └─► ◯ Actualizar Budget ◯
                  │
                  ▼
         ╔═════════════════╗
         ║ Budget actualizado
         ║ estatus=        ║
         ║ 'aprobado'      ║
         ╚═════════════════╝
                  │
                  ▼
         Response: {budget, createdOrder}
```

---

## 5️⃣ LÍMITES DE CONFIANZA (LÍNEAS PUNTEADAS)

```
═══════════════════════════════════════════════════════════════════════════════════════

                              LÍMITE DE CONFIANZA #1
                            Dispositivo vs Red Pública
                                       
        ┌─────────────────────────────────────┐
        │  DISPOSITIVO MÓVIL (Usuario)        │         RED PÚBLICA
        │  (Menor Confianza)                  │    (HTTPS requerido)
        │                                     │     ────────────────
        │  • Ionic App (Angular)              │
        │  • LocalStorage (JS accesible)      │           ║
        │  • Variables en memoria             │           ║ [HTTP POST /login]
        │                                     │           ║ {email, password}
        │                                     │           ║
        │                                     │◄─────────►│
        │                                     │           ║
        │  • Token almacenado (XSS vulnerable)│           ║ [JWT en header]
        │  • User data en memoria             │           ║
        │                                     │           ║ [Respuestas JSON]
        └─────────────────────────────────────┘
                         │                                 ║
                         │                                 ║
                         │                           ┌─────▼──────────┐
                         │                           │  API Backend   │
                         │                           │  (Confiable)   │
                         └───────────────────────────►  Node.js:3000  │
                                                    │                 │
                                                    └────────┬────────┘
                                                             │
╔═════════════════════════════════════════════════════════════════════╗
║                                                                     ║
║              LÍMITE DE CONFIANZA #2
║           Backend API vs Base de Datos
║
║    ┌────────────────────┐         ┌──────────────────┐
║    │ API Backend        │ SQLite  │  SQLite Database │
║    │ (Confiable)        │ Queries │  (Máxima Conf.)  │
║    │                    │◄───────►│                  │
║    │ Validaciones:      │ ORM     │ • taller.sqlite  │
║    │ • Input sanitized  │ Protected│ • No acceso red │
║    │ • JWT verified     │ against  │ • Archivo local │
║    │ • Role checked     │ SQL inj. │ • Persistencia   │
║    │ • Transactions     │         │ • Auditoría      │
║    └────────────────────┘         └──────────────────┘
║
╚═════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════════════

                              LÍMITE DE CONFIANZA #3
                       Usuarios No Autenticados vs Protegidos
                       
        ┌─────────────────────────────┐      ┌─────────────────────────────┐
        │ Usuario SIN autenticar      │      │ Usuario CON autenticar      │
        │ (Menor Confianza)           │      │ (Mayor Confianza)           │
        │                             │      │                             │
        │ Endpoints públicos:         │      │ Endpoints protegidos:       │
        │ • POST /login               │◄──── │ • GET /clients              │
        │   └─► Retorna JWT ────────────────►│ • POST /budgets             │
        │                             │      │ • DELETE /service-orders    │
        │ • GET / (health check)      │      │ • GET /reports/*            │
        │                             │      │ • ... todos con authMW      │
        │                             │      │                             │
        │ VALIDACIÓN EN authMiddleware:      │ req.user.id + rol ✓         │
        │ 1. Header Authorization presente? │                             │
        │ 2. JWT válido (firma, exp)?       │                             │
        │ 3. Usuario existe en DB?          │                             │
        │                             │      │                             │
        │ ✗ Falla en cualquiera:      │      │ ✓ Todas cumplen:            │
        │   HTTP 401 Unauthorized     │      │   Acceso permitido          │
        └─────────────────────────────┘      └─────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                              LÍMITE DE CONFIANZA #4
                      Permisos por Rol (Autorización)
                       
        ┌─────────────────────────────┐      ┌─────────────────────────────┐
        │ Rol: CAJERO                 │      │ Rol: ADMINISTRADOR          │
        │ (Menor Confianza)           │      │ (Mayor Confianza)           │
        │                             │      │                             │
        │ Permisos:                   │      │ Permisos:                   │
        │ ✓ Crear clientes            │      │ ✓ Crear usuarios            │
        │ ✓ Crear presupuestos        │      │ ✓ Eliminar usuarios         │
        │ ✓ Procesar ventas           │      │ ✓ Crear/eliminar productos  │
        │ ✓ Registrar movimientos     │      │ ✓ Ver reportes              │
        │                             │      │ ✓ Cambiar estados           │
        │ ✗ Crear usuarios            │      │ ✓ TODO acceso               │
        │ ✗ Eliminar clientes         │      │                             │
        │ ✗ Ver reportes              │      │ permit(['Administrador'])   │
        │                             │      │                             │
        │ permit(['Administrador',    │      │ [Si rol NO está permitido:  │
        │         'Cajero'])          │      │  HTTP 403 Forbidden]        │
        │                             │      │                             │
        │ [Si Cajero intenta:         │      │                             │
        │  POST /register             │      │                             │
        │  → HTTP 403 Forbidden]      │      │                             │
        └─────────────────────────────┘      └─────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

                              LÍMITE DE CONFIANZA #5
                         Frontend (Cliente) vs Backend
                         
        ┌─────────────────────────────────────────┐
        │         CLIENTE (Menor Confianza)       │
        │                                         │
        │  Angular/Ionic (No verificable)        │
        │  └─ Código descargado en cliente       │
        │  └─ Vulnerable a JS injection          │
        │  └─ Acceso a DOM, localStorage         │
        │  └─ Validaciones pueden ser bypasseadas│
        │                                         │
        │  LocalStorage:                          │
        │  ├─ token (plaintext - XSS risk)       │
        │  ├─ currentUser (JSON visible)         │
        │  └─ Cualquier JS malicioso puede leer  │
        │                                         │
        └────────────┬────────────────────────────┘
                     │
                     │ HTTP/HTTPS Requests
                     │ + JWT Bearer Token
                     │ (HTTPS obligatorio)
                     ▼
        ┌──────────────────────────────────────────────┐
        │       BACKEND (Mayor Confianza)             │
        │                                              │
        │  Node.js/Express (Controlado)               │
        │  ├─ Código en servidor (no visible)         │
        │  ├─ Validaciones siempre ejecutadas         │
        │  ├─ Secretos no expuestos (JWT_SECRET)      │
        │  ├─ Lógica de negocio centralizada          │
        │  └─ Auditoría de operaciones                │
        │                                              │
        │  Validaciones en Backend:                   │
        │  ├─ 1. JWT verification                     │
        │  ├─ 2. Role verification (permit)           │
        │  ├─ 3. Business logic validation            │
        │  ├─ 4. Database constraints                 │
        │  └─ 5. Atomic transactions                  │
        │                                              │
        │  ┌──────────────────────────────────────┐  │
        │  │  SQLite Database (Máxima Confianza)  │  │
        │  │  • Persistencia segura                │  │
        │  │  • No acceso desde red                │  │
        │  │  • Constraints a nivel DB             │  │
        │  └──────────────────────────────────────┘  │
        └──────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════════════

CRITERIOS DE CRUCE DE LÍMITES:

Cuando los datos cruzan un LÍMITE DE CONFIANZA deben ser:
  ✓ Validados (¿formato correcto?)
  ✓ Sanitizados (¿sin caracteres maliciosos?)
  ✓ Autenticados (¿de una fuente conocida?)
  ✓ Autorizados (¿tiene permisos?)
  ✓ Encriptados (¿en tránsito?)
  ✓ Auditados (¿dejamos rastro?)
```

---

## 🔀 CONEXIONES ENTRE COMPONENTES

```
                           ┌─────────────────┐
                           │   CLIENTE APP   │
                           │ (Ionic/Angular) │
                           └────────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
              ◯ Pages        ◯ Services        ◯ Guards
          ├─ clients         ├─ api.service    ├─ auth.guard
          ├─ budgets         ├─ auth.service   └─ role.guard
          ├─ sales           └─ ...
          ├─ orders
          └─ ...
                    │
                    │ ApiService.http
                    │ (+Authorization header)
                    │
        ┌───────────┴────────────────────────┐
        │                                    │
        ▼                                    ▼
  ╔═════════════════════════════════════╗  ╔════════════════════╗
  ║  Backend API (Node.js/Express)      ║  ║ LocalStorage       ║
  ║  http://localhost:3000              ║  ║ Browser Storage    ║
  ║                                     ║  ╚════════════════════╝
  ║  Middleware Stack:                  ║
  ║  ├─ CORS                           ║
  ║  ├─ express.json()                 ║
  ║  ├─ authMiddleware (JWT verify)    ║
  ║  ├─ permit(roles)                  ║
  ║  └─ Route Handler (business logic) ║
  ║                                     ║
  ║  Routes:                            ║
  ║  ├─ /login (public)                ║
  ║  ├─ /register (admin only)         ║
  ║  ├─ /clients (CRUD)                ║
  ║  ├─ /budgets (CRUD + status)       ║
  ║  ├─ /service-orders (CRUD + assign)║
  ║  ├─ /sales (create + list + dates) ║
  ║  ├─ /products (CRUD)               ║
  ║  ├─ /inventory/move                ║
  ║  ├─ /staff (CRUD)                  ║
  ║  └─ /reports/* (analytics)         ║
  ║                                     ║
  ╚────────────────┬────────────────────╝
                   │
                   │ Sequelize ORM
                   │ (SQL queries)
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  ╔═════════════════╗   ╔═════════════════╗
  ║  Validations &  ║   ║ bcryptjs        ║
  ║  Transactions   ║   ║ (password hash) ║
  ║ (sequelize.     ║   ║                 ║
  ║  transaction()) ║   ║ jsonwebtoken    ║
  ║                 ║   ║ (JWT generation)║
  ╚────────┬────────╝   ╚────────┬────────╝
           │                     │
           └──────────┬──────────┘
                      │
                      ▼
           ╔══════════════════════════╗
           ║  SQLite Database         ║
           ║  (taller.sqlite)         ║
           ║                          ║
           ║  11 Tablas Relacionadas: ║
           ║  ├─ Users                ║
           ║  ├─ Clients              ║
           ║  ├─ Vehicles             ║
           ║  ├─ Budgets              ║
           ║  ├─ ServiceOrders        ║
           ║  ├─ ServiceOrderMechanics║
           ║  ├─ Products             ║
           ║  ├─ InventoryMovements   ║
           ║  ├─ Sales                ║
           ║  ├─ Staff                ║
           ║  └─ SequelizeMeta        ║
           ║                          ║
           ╚══════════════════════════╝
```

---

## 📊 TABLA RESUMEN PARA DIAGRAMACIÓN

| **Componente** | **Tipo** | **Símbolo** | **Cantidad** | **Roles/Funciones** |
|---|---|---|---|---|
| Actores humanos | Entidad | ▭ | 4 | Cliente, Mecánico, Admin, Cajero |
| Apps Externas | Entidad | ▭ | 1 | Frontend Ionic Mobile |
| Procesos | Círculo | ◯ | 15+ | Autenticar, Crear, Actualizar, Generar, Cambiar |
| Almacenes | Líneas dobles | ╠═╣ | 2 | SQLite DB + LocalStorage |
| Flujos | Flecha | → | 20+ | Credenciales, Datos, Transacciones, Reportes |
| Límites | Línea punteada | ┈┈ | 5 | Red, BD, Auth, Rol, Frontend-Backend |

---

**Guía completa para diagrama manual en herramientas como:**
- Lucidchart
- Draw.io
- Miro
- Visio
- PlantUML
- ArchiMate
- UML Component Diagrams

---

Generado: 28 de abril de 2026
Versión: 1.0
Contexto: Análisis STRIDE Threat Model para Taller Mecánico
