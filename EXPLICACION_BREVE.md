# 🎯 EXPLICACIÓN BREVE - DFD STRIDE Taller Mecánico
## Script de Presentación (60 segundos - 2 minutos)

---

## 📌 VERSIÓN ULTRA-BREVE (30 segundos)

> **"El sistema Taller Mecánico es una aplicación móvil (Ionic) conectada a un backend (Node.js) que gestiona clientes, vehículos, presupuestos, órdenes de servicio, inventario y ventas. Usa autenticación JWT y SQLite local. Los datos fluyen desde la app → Backend API → Base de Datos en tres capas de confianza creciente."**

---

## 🎤 VERSIÓN COMPLETA (2 minutos - Con Pausa entre Puntos)

### Intro (15 segundos)
> "Este es el Diagrama de Flujo de Datos (DFD) del sistema Taller Mecánico, aplicado con la metodología STRIDE de modelado de amenazas. Vamos a identificar cómo fluye la información y dónde están los riesgos de seguridad."

### Punto 1: Actores (15 segundos)
> "En el lado izquierdo vemos a los **4 actores principales**: el Cliente, el Mecánico, el Administrador y el Cajero. Cada uno con roles distintos dentro del sistema. Todos interactúan a través de una **app Ionic en su dispositivo móvil**."

### Punto 2: Autenticación (20 segundos)
> "Cuando un usuario inicia sesión, envía **email y password** al backend. El backend valida contra la tabla Users con bcrypt, devuelve un **JWT Token** y lo guarda en LocalStorage del navegador. De aquí en adelante, **TODOS los requests llevan ese token en el header Authorization**. Es nuestro primera línea de defensa contra acceso no autorizado. **⚠️ RIESGO:** Las credenciales viajan en plaintext si no usamos HTTPS."

### Punto 3: Control de Acceso (15 segundos)
> "Una vez autenticado, el backend valida el rol del usuario contra una lista de roles permitidos para cada endpoint. Ejemplo: solo el **Admin puede crear usuarios o ver reportes**, pero el **Cajero SÍ puede procesar ventas**. Si el rol no tiene permisos, recibe error 403 Forbidden."

### Punto 4: Operaciones de Datos (15 segundos)
> "El sistema maneja 5 dominios principales: **Gestión de Clientes y Vehículos** (CRUD estándar), **Presupuestos** (que generan automáticamente Órdenes de Servicio cuando se aprueban), **Órdenes de Servicio** (con asignación de mecánicos), e **Inventario** (con movimientos auditados)."

### Punto 5: Venta Transaccional ⭐ (20 segundos)
> "La operación más crítica es **Procesar Venta** 🔴. Es transaccional: primero valida que hay stock, luego crea la venta, decrementa el stock, registra el movimiento en la auditoría, **y si algo falla en cualquier paso, revierte TODO (ROLLBACK)**. Esto previene inconsistencias como vender sin stock. Calcula automáticamente subtotal + impuesto (16%) - descuento."

### Punto 6: Almacenamiento (10 segundos)
> "Todos los datos van a **SQLite local** con **11 tablas relacionadas**. El backend usa ORM (Sequelize) que protege contra SQL injection. Los datos sensibles como contraseñas están hasheados con bcrypt, no en plaintext."

### Punto 7: Límites de Confianza (20 segundos)
> "Hay **5 límites de confianza críticos**: 
> 1. **Dispositivo ↔ Red** (token JWT + HTTPS obligatorio)
> 2. **Backend ↔ Base de Datos** (ORM protege SQL injection)
> 3. **Anónimo ↔ Autenticado** (authMiddleware valida JWT)
> 4. **Rol Cajero ↔ Admin** (permit() verifica permisos)
> 5. **Frontend ↔ Backend** (validaciones SIEMPRE en servidor)

> Los colores representan niveles de confianza: azul claro (cliente) < naranja (backend) < púrpura (base de datos)."

### Conclusión (15 segundos)
> "En resumen: **Autenticación → Autorización → Operación → Persistencia**. El sistema es robusto, pero requiere endurecimiento en producción: HTTPS obligatorio, expiración de tokens, validación de propiedad de datos, y auditoría de cambios."

---

## 📊 RESUMEN EN TABLA (Para Presentación Visual)

| **Capa** | **Componente** | **Tecnología** | **Riesgo STRIDE** |
|---|---|---|---|
| **Cliente** | Ionic App + LocalStorage | Angular 20 + Browser Storage | XSS, Tampering de token |
| **Red** | HTTP/HTTPS | Transmisión de datos | Credentials en plaintext |
| **Backend** | Node.js/Express + Middleware | JWT, bcrypt, Sequelize | Role bypass, tampering datos |
| **BD** | SQLite + 11 tablas | ORM protegido | Information disclosure |
| **Crítica** | Procesar Venta | Transacciones ACID | Tampering montos, DoS |

---

## 🎓 RESPUESTAS A PREGUNTAS FRECUENTES

### P: "¿Por qué 3 zonas de confianza?"
**R:** Porque cada frontera representa un cambio en quién controla el código/datos:
- **Zona Cliente:** Control del usuario (potencialmente comprometido)
- **Zona Backend:** Control de la empresa (verificable, auditable)
- **Zona DB:** Persistencia (máxima protección)

### P: "¿Cuál es el flujo de una venta?"
**R:** 
1. Cajero selecciona productos en la app
2. POST /sales + JWT al backend
3. Backend valida rol = Cajero ✓
4. Backend valida stock (SELECT Products)
5. Si OK: INSERT Sale, UPDATE Products, INSERT InventoryMovement, COMMIT
6. Si falla: ROLLBACK (no hay cambios)
7. Frontend recibe confirmación → muestra recibo

### P: "¿Qué pasa si alguien roba el JWT Token?"
**R:** Con ese token puede hacer TODO lo que ese usuario puede hacer (spoofing). Por eso:
- HTTPS obligatorio (encripta token en tránsito)
- Tokens con expiración corta (1 hora típico)
- Refresh tokens para renovar sin re-autenticar
- Logout limpia el token del localStorage

### P: "¿Por qué LocalStorage es arriesgado?"
**R:** Cualquier JS malicioso en la página (XSS attack) puede leer el token. Alternativas:
- HttpOnly cookies (mejor, pero más complejo)
- SessionStorage (expira al cerrar navegador)
- IndexedDB encriptado

### P: "¿Quién ve qué datos?"
**R:** 
- **Cliente:** Solo sus datos (clientes, vehículos, presupuestos propios)
- **Mecánico:** Sus órdenes asignadas
- **Cajero:** Clientes, vehículos, presupuestos, ventas, inventario
- **Admin:** TODO + puede crear/eliminar usuarios + ver reportes

### P: "¿Cómo previene el sistema SQL Injection?"
**R:** Usa Sequelize ORM que sanitiza queries automáticamente. Nunca concatena strings SQL con entrada de usuario.

---

## 🎬 SCRIPT VISUAL (Apunta al Diagrama)

```
[Mostrar diagrama completo]

"Aquí vemos el flujo completo:

1. Los cuatro ACTORES (izquierda) interactúan con
2. La APP IONIC (arriba) que envía HTTP requests a
3. El BACKEND API (centro), donde un middleware chain valida:
   - ¿Tiene JWT válido? (authMiddleware)
   - ¿Su rol está permitido? (permit middleware)
   - Si pasa: ejecuta la operación
4. Los datos van a la BASE DE DATOS (abajo en púrpura)
5. Las OPERACIONES CRÍTICAS (rojo) como venta usan TRANSACCIONES

Los FLUJOS (flechas) muestran EXACTAMENTE qué datos viajan:
- credenciales → JWT
- JWT + HTTP request → Backend
- CRUD operations → SQLite
- COMMIT/ROLLBACK si falla

Los LÍMITES (líneas discontinuas) separan zonas de confianza.
"
```

---

## 💼 ENTREGABLES PARA CLIENTE

**Si presentas esto a un cliente, entrégale:**

1. ✅ Este documento con la explicación breve
2. ✅ El diagrama Mermaid (renderizado o exportado a PNG)
3. ✅ DFD_STRIDE_Analysis.md (detalle técnico, solo si lo pide)
4. ✅ Recomendaciones STRIDE (lo que sigue en seguridad)

**Tiempo recomendado de presentación:** 2-3 minutos máximo

---

## 🔒 CONCLUSIÓN EJECUTIVA

> **"El sistema es arquitectónicamente sólido con capas de seguridad: JWT, RBAC, ORM y transacciones ACID. Para producción necesita HTTPS, expiración de tokens y validación de propiedad de datos. Los riesgos principales están en el cliente (XSS del token) y en transmisión (credenciales plaintext)."**

---

*Documento generado: 28 de abril de 2026*  
*Contexto: Modelado STRIDE para Taller Mecánico*
