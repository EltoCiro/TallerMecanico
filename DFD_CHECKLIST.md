# ✅ CHECKLIST RÁPIDO - DFD STRIDE Taller Mecánico
## Para usar mientras diagramas en Lucidchart/Draw.io

---

## 🟦 1. ENTIDADES EXTERNAS (RECTÁNGULOS) - Colocar al borde del diagrama

```
[ ] CLIENTE (User en navegador/app)
[ ] MECÁNICO (User - rol: Mecánico)
[ ] ADMINISTRADOR (User - rol: Admin)
[ ] CAJERO (User - rol: Cajero)
[ ] FRONTEND IONIC APP (Dispositivo móvil)
[ ] BACKEND API REST (Node.js:3000)
[ ] LocalStorage del Navegador (Persistencia cliente)
```

---

## ⭕ 2. PROCESOS (CÍRCULOS) - Distribuir en el diagrama

### Autenticación (Arriba del diagrama)
```
[ ] ◯ Autenticar Usuario (POST /login)
[ ] ◯ Registrar Usuario (POST /register)
[ ] ◯ Validar Token JWT (authMiddleware)
[ ] ◯ Verificar Rol (permit middleware)
```

### Gestión de Clientes (Lado izquierdo)
```
[ ] ◯ Crear Cliente (POST /clients)
[ ] ◯ Listar Clientes (GET /clients)
[ ] ◯ Actualizar Cliente (PUT /clients/:id)
[ ] ◯ Eliminar Cliente (DELETE /clients/:id)
```

### Gestión de Vehículos (Lado izquierdo, bajo clientes)
```
[ ] ◯ Crear Vehículo (POST /vehicles)
[ ] ◯ Listar Vehículos (GET /vehicles)
[ ] ◯ Actualizar Vehículo (PUT /vehicles/:id)
[ ] ◯ Eliminar Vehículo (DELETE /vehicles/:id)
```

### Gestión de Presupuestos (Centro-arriba)
```
[ ] ◯ Crear Presupuesto (POST /budgets)
[ ] ◯ Listar Presupuestos (GET /budgets)
[ ] ◯ Actualizar Presupuesto (PUT /budgets/:id)
[ ] ◯ Cambiar Estatus Presupuesto (PUT /budgets/:id/status)
[ ] ◯ Eliminar Presupuesto (DELETE /budgets/:id)
```

### Gestión de Órdenes de Servicio (Centro)
```
[ ] ◯ Crear Orden (POST /service-orders)
[ ] ◯ Listar Órdenes (GET /service-orders)
[ ] ◯ Actualizar Orden (PUT /service-orders/:id)
[ ] ◯ Cambiar Estatus Orden (PUT /service-orders/:id/status)
[ ] ◯ Asignar Mecánicos (POST /service-orders/:id/assign)
[ ] ◯ Eliminar Orden (DELETE /service-orders/:id)
```

### Gestión de Inventario (Lado derecho-arriba)
```
[ ] ◯ Crear Producto (POST /products)
[ ] ◯ Listar Productos (GET /products)
[ ] ◯ Actualizar Producto (PUT /products/:id)
[ ] ◯ Registrar Movimiento (POST /inventory/move)
[ ] ◯ Listar Movimientos (GET /inventory/movements)
[ ] ◯ Eliminar Producto (DELETE /products/:id)
```

### Gestión de Ventas (Centro-derecha - TRANSACCIONAL)
```
[ ] ◯ Procesar Venta (POST /sales) ⭐ CRÍTICO - Transaccional
[ ] ◯ Listar Ventas Filtradas (GET /sales)
```

### Gestión de Staff/Personal (Lado derecho-abajo)
```
[ ] ◯ Crear Staff (POST /staff)
[ ] ◯ Listar Staff (GET /staff)
[ ] ◯ Actualizar Staff (PUT /staff/:id)
[ ] ◯ Eliminar Staff (DELETE /staff/:id)
```

### Generación de Reportes (Abajo del diagrama)
```
[ ] ◯ Reporte Inventario Bajo (GET /reports/inventory-low)
[ ] ◯ Reporte Ventas Diarias (GET /reports/sales-summary)
[ ] ◯ Reporte Productividad Mecánicos (GET /reports/productivity)
```

---

## 🗄️ 3. ALMACENES DE DATOS (LÍNEAS DOBLES) - Abajo/Centro

```
╔═════════════════════╗
[ ] ║ SQLite Database     ║  (taller.sqlite)
    ║                     ║
    ║ Tablas:             ║
    ║ [ ] Users           ║
    ║ [ ] Clients         ║
    ║ [ ] Vehicles        ║
    ║ [ ] Budgets         ║
    ║ [ ] ServiceOrders   ║
    ║ [ ] ServiceOrder    ║
    ║     Mechanics       ║
    ║ [ ] Products        ║
    ║ [ ] InventoryMvt    ║
    ║ [ ] Sales           ║
    ║ [ ] Staff           ║
    ║ [ ] SequelizeMeta   ║
    ║                     ║
    ╚═════════════════════╝

╔═════════════════════╗
[ ] ║ LocalStorage        ║
    ║ (Browser Client)    ║
    ║                     ║
    ║ Datos:              ║
    ║ [ ] "token"         ║
    ║ [ ] "currentUser"   ║
    ║                     ║
    ╚═════════════════════╝
```

---

## 🔀 4. FLUJOS DE DATOS (FLECHAS ETIQUETADAS)

### De Cliente a Backend
```
[ ] Credenciales (email, password) → API /login
[ ] JWT en Header (Authorization: Bearer <token>) → Todos los endpoints autenticados
[ ] Datos de Cliente → POST /clients
[ ] Datos de Vehículo → POST /vehicles
[ ] Datos de Presupuesto → POST /budgets
[ ] Datos de Orden → POST /service-orders
[ ] Carrito (items[], clientId, descuento) → POST /sales
```

### De Backend a Cliente
```
[ ] Token JWT + User metadata ← POST /login
[ ] Array de Clientes ← GET /clients
[ ] Cliente específico ← GET /clients/:id
[ ] Array de Presupuestos ← GET /budgets
[ ] Array de Órdenes ← GET /service-orders
[ ] Array de Productos ← GET /products
[ ] Confirmación venta ← POST /sales
[ ] Array de reportes ← GET /reports/*
```

### De Backend a Base de Datos
```
[ ] INSERT/SELECT/UPDATE/DELETE Users ← → Users table
[ ] INSERT/SELECT/UPDATE/DELETE Clients ← → Clients table
[ ] INSERT/SELECT/UPDATE/DELETE Budgets ← → Budgets table
[ ] SELECT/UPDATE Products (validar stock) ← → Products table
[ ] INSERT InventoryMovement ← → InventoryMovements table
[ ] INSERT Sale ← → Sales table
[ ] SELECT ← → ServiceOrders table
```

### De Cliente a LocalStorage
```
[ ] Token JWT → localStorage.setItem('token')
[ ] User JSON → localStorage.setItem('currentUser')
```

### De LocalStorage a Backend (en cada request)
```
[ ] Token del localStorage → Header Authorization
```

---

## 🚨 5. LÍMITES DE CONFIANZA (LÍNEAS PUNTEADAS)

### Límite #1: Dispositivo Cliente ↔ Red Pública
```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[ ] Dibujar línea punteada vertical

LADO IZQUIERDO (Menor Confianza):
[ ] CLIENTE + IONIC APP + LocalStorage

LADO DERECHO (Mayor Confianza):
[ ] BACKEND API

ETIQUETA: "Network / HTTPS"
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

### Límite #2: Backend API ↔ Base de Datos
```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[ ] Dibujar línea punteada vertical

LADO IZQUIERDO (Intermedio):
[ ] BACKEND API

LADO DERECHO (Máxima Confianza):
[ ] SQLite Database

ETIQUETA: "Local Filesystem / ORM Protected"
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

### Límite #3: No Autenticado ↔ Autenticado
```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[ ] Dibujar línea punteada horizontal en el nivel de Backend

ARRIBA (Público):
[ ] POST /login
[ ] GET /

ABAJO (Protegido - requiere JWT):
[ ] Todos los otros endpoints

ETIQUETA: "authMiddleware / JWT Required"
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

### Límite #4: Rol Cajero ↔ Rol Admin
```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[ ] Dibujar línea punteada dentro del Backend

LADO IZQUIERDO (Menor Confianza - Cajero):
[ ] Crear/Actualizar clientes
[ ] Crear presupuestos
[ ] Procesar ventas
[ ] Registrar movimientos

LADO DERECHO (Mayor Confianza - Admin):
[ ] Todo lo anterior +
[ ] Crear/eliminar usuarios
[ ] Ver reportes
[ ] Eliminar clientes
[ ] Cambiar estados

ETIQUETA: "permit() Middleware / Role-Based"
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

### Límite #5: Frontend ↔ Backend (General)
```
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
[ ] Dibujar línea punteada grande alrededor

LADO IZQUIERDO (Menos Confiable):
[ ] CLIENTE
[ ] IONIC APP
[ ] LocalStorage
[ ] Código Angular (no verificable)

LADO DERECHO (Más Confiable):
[ ] BACKEND API
[ ] SQLite Database
[ ] Código Node.js (controlado)
[ ] Validaciones del servidor

ETIQUETA: "Trust Boundary / Server Trust Anchor"
┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
```

---

## 🎨 RECOMENDACIONES DE COLORES

| Componente | Color Sugerido | Razón |
|---|---|---|
| Entidades Externas | Azul claro | Entrada al sistema |
| Procesos | Verde | Transformaciones |
| Almacenes | Naranja | Persistencia |
| Flujos de Datos | Negro → Rojo | Normal → Sensitivo |
| Límite de Confianza | Rojo punteado | Crítico |
| Zona Pública | Verde claro | Acceso bajo |
| Zona Autenticada | Amarillo | Acceso medio |
| Zona Admin | Rojo oscuro | Máximo acceso |

---

## 📊 DISPOSICIÓN RECOMENDADA EN DIAGRAMA

```
                    ┌─────────────────────┐
                    │  CLIENTE / USUARIO  │
                    │ (Dispositivo Móvil) │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┴────────────────────┐
          │                                         │
    ┌─────▼──────┐                         ┌───────▼─────┐
    │   Ionic    │                         │ LocalStorage│
    │    App     │                         │             │
    └─────┬──────┘                         └────────┬────┘
          │                                         │
          └────────────┬────────────────────────────┘
                       │
     ┈┈┈┈┈┈┈┈┈┈ LÍMITE #1: RED PÚBLICA ┈┈┈┈┈┈┈┈┈┈
                       │
        ┌──────────────▼──────────────┐
        │   BACKEND API (Express)     │
        │   Puerto 3000               │
        │                             │
        ├─ ◯ authMiddleware           │
        ├─ ◯ permit()                 │
        ├─ Routes:                    │
        │  ├─ /login (público)        │
        │  ├─ /clients                │
        │  ├─ /vehicles               │
        │  ├─ /budgets                │
        │  ├─ /service-orders         │
        │  ├─ /sales ⭐               │
        │  ├─ /products               │
        │  ├─ /reports                │
        │  └─ /staff                  │
        │                             │
        └─────────────┬───────────────┘
                      │
     ┈┈┈┈┈┈┈┈┈┈ LÍMITE #2: ARCHIVO LOCAL ┈┈┈┈┈┈┈┈┈┈
                      │
        ┌─────────────▼────────────────┐
        │   SQLite Database            │
        │   taller.sqlite              │
        │                              │
        │  11 tablas relacionadas      │
        │  [Ver checklist sección 3]   │
        │                              │
        └──────────────────────────────┘
```

---

## ⚠️ ELEMENTOS CRÍTICOS PARA STRIDE

```
[ ] MARCAR CON ★ los siguientes:
    
    ★ POST /login (Spoofing - credenciales en plaintext)
    ★ JWT Token (Tampering - token en localStorage)
    ★ SQLite Database (Information Disclosure - datos en reposo)
    ★ POST /sales (Repudiation - transacción crítica)
    ★ POST /sales (Tampering - montos, impuestos, descuentos)
    ★ /reports/* (Information Disclosure - acceso admin)
    ★ DELETE endpoints (Denial of Service - eliminaciones)
    ★ Role bypass risk (Elevation of Privilege)
    ★ LocalStorage XSS (Elevation of Privilege)
    ★ Transacciones sin rollback (Denial of Service - inconsistencia)
```

---

## 📝 NOTAS FINALES

**Usar esta estructura:**
1. Copiar este checklist a tu herramienta de diagrama (Lucidchart, Draw.io)
2. Marcar ✓ cada elemento conforme lo dibujes
3. Mantener distancias visuales para claridad
4. Usar colores consistentes
5. Agrupar procesos por dominio (gestión, transacciones, reportes)
6. Las líneas punteadas siempre en rojo
7. Flujos sensitivos en rojo también

**Documentos de referencia:**
- `DFD_STRIDE_Analysis.md` - Análisis detallado
- `DFD_Visual_ASCII.md` - Ejemplos visuales ASCII

**Próximo paso después del diagrama:**
→ Análisis STRIDE completo (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
