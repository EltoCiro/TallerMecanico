# ⚡ QUICK START - DFD STRIDE Taller Mecánico (1 Página)

## 📊 DIAGRAMA VISUAL EN 1 MINUTO

```
                    ┌─────────────────────┐
                    │ 4 ACTORES USUARIOS  │
                    │ Cliente, Mecánico   │
                    │ Admin, Cajero       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  IONIC APP MÓVIL    │
                    │  + LocalStorage     │
                    │ (JWT Token + User)  │
                    └──────────┬──────────┘
         ┈┈┈┈┈┈┈┈┈┈ LÍMITE 1: RED ┈┈┈┈┈┈┈┈┈┈
                    (HTTPS requerido)
                    ┌──────────▼──────────┐
                    │  BACKEND API REST   │
                    │  Node.js/Express    │
                    │                     │
                    │ ⚙️ Autenticar      │
                    │ ⚙️ Verificar Rol   │
                    │ ⚙️ Gestionar CRUD  │
                    │ ⚙️ Procesar Venta  │
                    │ ⚙️ Reportes        │
                    └──────────┬──────────┘
         ┈┈┈┈┈┈┈┈┈┈ LÍMITE 2: LOCAL ┈┈┈┈┈┈┈┈┈┈
                    (ORM Protegido)
                    ┌──────────▼──────────┐
                    │  SQLite Database    │
                    │                     │
                    │ 11 Tablas:          │
                    │ • Users (hashed)    │
                    │ • Clients           │
                    │ • Vehicles          │
                    │ • Budgets           │
                    │ • ServiceOrders     │
                    │ • Sales ⭐          │
                    │ • Products          │
                    │ • InventoryMvt      │
                    │ • Staff             │
                    │ + 2 más...          │
                    └─────────────────────┘
```

---

## 🔐 3 ZONAS DE CONFIANZA

| Zona | Color | Control | Riesgo |
|---|---|---|---|
| 🌐 CLIENTE | Azul | Usuario | XSS, Credenciales |
| 🔌 BACKEND | Naranja | Empresa | Tampering datos |
| 🗄️ BD | Púrpura | Sistema | Información sensible |

---

## 5️⃣ COMPONENTES CLAVE

### 1. 👤 Entidades Externas (Actores)
- **Cliente:** Solicita servicios
- **Mecánico:** Ejecuta órdenes (rol: Mecánico)
- **Cajero:** Procesa ventas (rol: Cajero)
- **Administrador:** Control total (rol: Admin)

### 2. ⚙️ Procesos (30+)
- **Autenticar:** email+password → JWT Token
- **CRUD:** Clientes, Vehículos, Productos, Presupuestos, Órdenes
- **Venta:** Validar stock → Insert → Update stock → Commit ⭐
- **Reportes:** Inventario bajo, Ventas día, Productividad

### 3. 🗄️ Almacenes de Datos
- **SQLite:** 11 tablas relacionadas
- **LocalStorage:** token (JWT) + currentUser (JSON)

### 4. 🔀 Flujos de Datos
- **Autenticación:** Credenciales → JWT
- **Operaciones:** JWT Header → Backend → DB
- **Respuestas:** JSON → App → UI

### 5. 🚨 Límites de Confianza
- **#1 Dispositivo ↔ Red:** HTTPS obligatorio
- **#2 Backend ↔ DB:** ORM + Transactions
- **#3 Anónimo ↔ Auth:** JWT validation
- **#4 Rol Cajero ↔ Admin:** Role checking
- **#5 Frontend ↔ Backend:** Server-side validation

---

## 📋 FLUJO DE VENTA (Caso Típico)

```
1. Cajero selecciona cliente + vehículo + productos en app
2. Click "Procesar Venta" → POST /sales + JWT

[Backend:]
3. authMiddleware: valida JWT ✓
4. permit(['Cajero','Admin']): verifica rol ✓
5. Inicia transacción SQL
6. Valida stock: SELECT cantidad FROM products (para cada item)
7. Cálculos: subtotal = 150, impuesto = 24, total = 74
8. INSERT INTO Sales (date, total, cliente_id, items)
9. UPDATE Products SET cantidad = cantidad - qty_vendida
10. INSERT INTO InventoryMovement (tipo='salida', cantidad, motivo)
11. COMMIT (guarda TODO)

[Frontend:]
12. Recibe respuesta: {saleId, sale}
13. Muestra recibo en pantalla

[Si falla en paso 6-10:]
→ ROLLBACK (revierte todo)
→ HTTP 400/500 con error
→ Stock NO cambia, venta NO se crea
```

---

## 🔴 RIESGOS STRIDE (Top 5)

| # | Riesgo | Componente | Solución |
|---|---|---|---|
| 🔴1 | **Spoofing** | POST /login plaintext | HTTPS obligatorio |
| 🔴2 | **Tampering** | JWT en localStorage | HttpOnly cookies |
| 🔴3 | **Elevation** | Token roba rol | Expiración corta (1h) |
| 🟡4 | **Info Disclosure** | Reports solo admin? | Validar rol en backend |
| 🟡5 | **DoS** | Venta sin rollback | Ya implementado (ACID) |

---

## ✅ VALIDACIÓN RÁPIDA

```
¿Tiene? ✓
[ ] Autenticación JWT
[ ] Autorizaciónpor rol (4 roles distintos)
[ ] Venta transaccional (ACID)
[ ] Operaciones CRUD
[ ] Base de datos relacional
[ ] Auditoría de cambios
[ ] Límites de confianza
[ ] Flujos etiquetados

Si todo ✓ → ¡DFD válido!
```

---

## 🎯 MENSAJE DE 30 SEGUNDOS

> "Usuarios autenticados con JWT acceden a un backend REST que valida su rol antes de dejarlos operar. Los datos van a SQLite. Lo crítico es procesar ventas: transacción ACID que valida stock, crea venta, decrementa stock, registra movimiento, y revierte TODO si falla."

---

## 📁 DOCUMENTOS DEL PROYECTO

| Archivo | Usa para... |
|---|---|
| **MERMAID_CODIGO.md** | Copiar código para Mermaid Live |
| **DFD_Mermaid_Resumen.md** | Código + Explicación detallada |
| **EXPLICACION_BREVE.md** | Script de presentación (2 min) |
| **DFD_STRIDE_Analysis.md** | Análisis técnico completo |
| **DFD_Visual_ASCII.md** | ASCII diagrams referencia |
| **DFD_CHECKLIST.md** | Checklist diagramación manual |
| **QUICK_START.md** | ← TÚ ESTÁS AQUÍ (esta página) |

---

## 🚀 PRÓXIMOS PASOS

1. **Copia código Mermaid** desde MERMAID_CODIGO.md
2. **Pega en** https://mermaid.live
3. **Exporta a PNG** y comparte
4. **Lee EXPLICACION_BREVE.md** para presentación

**Hecho en:** 28 de abril de 2026  
**Proyecto:** Taller Mecánico STRIDE DFD Analysis
