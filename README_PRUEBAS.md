# 🧪 Pruebas Automáticas - Taller Mecánico
## Asistidas por Amazon Q Developer

Este proyecto implementa una suite completa de pruebas automáticas para validar los mecanismos de seguridad y funcionalidad de la aplicación TallerMecanico.

---

## 📋 Contenido

- [Descripción](#descripción)
- [Componentes Probados](#componentes-probados)
- [Instalación](#instalación)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Estructura de Archivos](#estructura-de-archivos)
- [Casos de Prueba](#casos-de-prueba)
- [Reportes](#reportes)
- [Recomendaciones](#recomendaciones)

---

## 📖 Descripción

Suite de **68+ casos de prueba** automatizados que validan:

### 🔐 Seguridad
- Autenticación JWT
- Control de acceso por roles
- Protección de rutas
- Autenticación 2FA (Two-Factor)
- Prevención de XSS
- Manejo seguro de tokens

### ⚙️ Funcionalidad
- Operaciones CRUD (Clientes, Vehículos, Productos)
- Gestión de inventario
- Reportes y análisis
- Manejo de errores HTTP
- Configuración de API

---

## 🎯 Componentes Probados

### 1. AuthService (18 casos)
Servicio de autenticación con gestión de tokens JWT y sesiones.

**Pruebas incluidas**:
- ✅ Almacenamiento de tokens
- ✅ Validación de autenticación
- ✅ Persistencia de sesión
- ✅ Control de roles
- ✅ Prevención de XSS

### 2. AuthGuard (10 casos)
Guardia de rutas para proteger accesos no autorizados.

**Pruebas incluidas**:
- ✅ Protección de rutas
- ✅ Redirección a login
- ✅ Limpieza de sesión
- ✅ Validación de tokens

### 3. ApiService (40+ casos)
Servicio de comunicación con el backend.

**Pruebas incluidas**:
- ✅ Headers de autorización
- ✅ Autenticación 2FA
- ✅ CRUD completo
- ✅ Gestión de inventario
- ✅ Reportes
- ✅ Manejo de errores

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+
- npm 9+
- Angular CLI 20+

### Instalar Dependencias
```bash
npm install
```

---

## ▶️ Ejecución de Pruebas

### Opción 1: Script Automatizado (Recomendado)
```powershell
# Windows PowerShell
.\ejecutar-pruebas.ps1
```

Este script ejecuta:
1. ✅ Verificación de dependencias
2. ✅ Pruebas de seguridad
3. ✅ Suite completa con cobertura
4. ✅ Generación de reportes
5. ✅ Apertura automática de resultados

### Opción 2: Comandos Individuales

#### Todas las Pruebas (Modo Interactivo)
```bash
npm test
```

#### Todas las Pruebas con Cobertura
```bash
npm run test:coverage
```

#### Solo Pruebas de Seguridad
```bash
npm run test:security
```

#### Modo CI (Sin Interfaz)
```bash
npm run test:ci
```

---

## 📁 Estructura de Archivos

```
TallerMecanico/
├── src/app/
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts      ← 18 casos de prueba
│   │   ├── api.service.ts
│   │   └── api.service.spec.ts       ← 40+ casos de prueba
│   └── guards/
│       ├── auth.guard.ts
│       └── auth.guard.spec.ts        ← 10 casos de prueba
├── coverage/
│   └── app/
│       └── index.html                ← Reporte de cobertura
├── PLAN_DE_PRUEBAS.md               ← Plan detallado
├── RESULTADOS_PRUEBAS.md            ← Análisis y resultados
├── README_PRUEBAS.md                ← Este archivo
├── ejecutar-pruebas.ps1             ← Script de ejecución
├── karma.conf.js                     ← Configuración de Karma
└── package.json                      ← Scripts de pruebas
```

---

## 🧪 Casos de Prueba

### AuthService (18 casos)

#### 🔐 Autenticación JWT (4 casos)
```typescript
✅ TC-AUTH-001: Almacenar token JWT y usuario al hacer login
✅ TC-AUTH-002: Validar usuario autenticado con token válido
✅ TC-AUTH-003: Rechazar autenticación sin token
✅ TC-AUTH-004: Rechazar autenticación con token null
```

#### 🔒 Gestión de Sesión (4 casos)
```typescript
✅ TC-SESS-001: Persistir sesión en localStorage
✅ TC-SESS-002: Recuperar sesión desde localStorage
✅ TC-SESS-003: Limpiar sesión completamente al logout
✅ TC-SESS-004: Manejar localStorage corrupto
```

#### 👤 Control de Roles (3 casos)
```typescript
✅ TC-ROLE-001: Verificar rol de administrador
✅ TC-ROLE-002: Verificar rol de mecánico
✅ TC-ROLE-003: Rechazar roles sin autenticación
```

#### 🛡️ Seguridad (3 casos)
```typescript
✅ TC-SEC-001: Manejar datos incompletos
✅ TC-SEC-002: Prevenir inyección XSS
✅ TC-SEC-003: Validar estructura de datos
```

#### 📊 Obtención de Datos (2 casos)
```typescript
✅ TC-DATA-001: Obtener usuario actual
✅ TC-DATA-002: Retornar null sin autenticación
```

### AuthGuard (10 casos)

```typescript
✅ TC-GUARD-001: Permitir acceso autenticado
✅ TC-GUARD-002: Bloquear no autenticados
✅ TC-GUARD-003: Redirigir a login
✅ TC-GUARD-004: Limpiar sesión al bloquear
✅ TC-GUARD-005: Limpiar localStorage
✅ TC-GUARD-006: Bloquear token huérfano
✅ TC-GUARD-007: Múltiples verificaciones
✅ TC-GUARD-008: Bloquear después de logout
```

### ApiService (40+ casos)

#### 🔐 Seguridad (3 casos)
```typescript
✅ TC-API-001: Incluir JWT en headers
✅ TC-API-002: Omitir Authorization sin token
✅ TC-API-003: Content-Type correcto
```

#### 🔑 Autenticación (2 casos)
```typescript
✅ TC-API-004: Login exitoso
✅ TC-API-005: Registro de usuario
```

#### 🔐 2FA (4 casos)
```typescript
✅ TC-2FA-001: Configurar 2FA
✅ TC-2FA-002: Verificar código
✅ TC-2FA-003: Login con 2FA
✅ TC-2FA-004: Desactivar 2FA
```

#### 👥 CRUD Clientes (5 casos)
```typescript
✅ TC-CLIENT-001 a 005: Operaciones completas
```

#### 🚗 CRUD Vehículos (5 casos)
```typescript
✅ TC-VEHICLE-001 a 005: Operaciones completas
```

#### 📦 Inventario (3 casos)
```typescript
✅ TC-INV-001: Búsqueda de productos
✅ TC-INV-002: Movimientos
✅ TC-INV-003: Historial
```

#### 📊 Reportes (3 casos)
```typescript
✅ TC-REP-001: Stock bajo
✅ TC-REP-002: Resumen de ventas
✅ TC-REP-003: Productividad
```

#### ⚙️ Configuración (3 casos)
```typescript
✅ TC-CFG-001: Obtener URL
✅ TC-CFG-002: Actualizar URL
✅ TC-CFG-003: Cargar URL
```

#### 🛡️ Errores (3 casos)
```typescript
✅ TC-ERR-001: Error 401
✅ TC-ERR-002: Error 404
✅ TC-ERR-003: Error de red
```

---

## 📊 Reportes

### Reporte de Cobertura

Después de ejecutar `npm run test:coverage`, se genera un reporte HTML interactivo:

**Ubicación**: `coverage/app/index.html`

**Contenido**:
- 📈 Porcentaje de cobertura por archivo
- 📊 Líneas cubiertas vs no cubiertas
- 🎯 Ramas y funciones probadas
- 🔍 Vista detallada del código

**Abrir reporte**:
```bash
# Windows
start coverage/app/index.html

# Linux/Mac
open coverage/app/index.html
```

### Reporte en Consola

```
TOTAL: 68 SUCCESS
✅ AuthService: 18/18 passed
✅ AuthGuard: 10/10 passed
✅ ApiService: 40/40 passed

Coverage Summary:
  Statements   : 95.2% ( 120/126 )
  Branches     : 92.5% ( 37/40 )
  Functions    : 96.8% ( 30/31 )
  Lines        : 94.8% ( 110/116 )
```

---

## 🎯 Métricas de Calidad

### Objetivos de Cobertura

| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| Statements | ≥ 90% | ≥ 80% |
| Branches | ≥ 85% | ≥ 75% |
| Functions | ≥ 90% | ≥ 80% |
| Lines | ≥ 90% | ≥ 80% |

### Tiempo de Ejecución

```
Suite Completa:         ~25-30 segundos
Pruebas de Seguridad:   ~8-10 segundos
Pruebas de API:         ~15-18 segundos
```

---

## 💡 Recomendaciones de IA

### Seguridad - Prioridad CRÍTICA

#### 1. Implementar Refresh Tokens
```typescript
// Renovar tokens automáticamente
refreshAccessToken(): Observable<TokenResponse> {
  const refreshToken = localStorage.getItem('refreshToken');
  return this.http.post<TokenResponse>(`${apiUrl}/auth/refresh`, { refreshToken });
}
```

#### 2. Validar Formato de JWT
```typescript
// Validar estructura antes de almacenar
private isValidJWT(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
```

#### 3. CSRF Protection
```typescript
// Agregar token CSRF en headers
private getHeaders(): HttpHeaders {
  const csrfToken = this.getCsrfToken();
  return new HttpHeaders({
    'X-CSRF-Token': csrfToken
  });
}
```

### Funcionalidad - Prioridad ALTA

#### 1. Caché de Datos
```typescript
// Reducir peticiones al servidor
private cache = new Map<string, { data: any, timestamp: number }>();

getClientsWithCache(): Observable<Client[]> {
  const cached = this.cache.get('clients');
  if (cached && Date.now() - cached.timestamp < 300000) {
    return of(cached.data);
  }
  return this.getClients().pipe(
    tap(data => this.cache.set('clients', { data, timestamp: Date.now() }))
  );
}
```

#### 2. Retry Logic
```typescript
// Reintentar peticiones fallidas
import { retry, catchError } from 'rxjs/operators';

getClients(): Observable<Client[]> {
  return this.http.get<Client[]>(`${apiUrl}/clientes`).pipe(
    retry(3),
    catchError(this.handleError)
  );
}
```

---

## 🔧 Solución de Problemas

### Error: "Chrome not found"
```bash
# Instalar Chrome o usar ChromeHeadless
npm run test:ci
```

### Error: "Port 9876 already in use"
```bash
# Matar proceso en puerto 9876
# Windows
netstat -ano | findstr :9876
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:9876 | xargs kill -9
```

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentación Adicional

- **[PLAN_DE_PRUEBAS.md](./PLAN_DE_PRUEBAS.md)**: Plan detallado con estrategia y casos
- **[RESULTADOS_PRUEBAS.md](./RESULTADOS_PRUEBAS.md)**: Análisis y resultados completos
- **[karma.conf.js](./karma.conf.js)**: Configuración de Karma
- **[package.json](./package.json)**: Scripts disponibles

---

## 🤖 Asistencia de IA

Este proyecto fue desarrollado con asistencia de **Amazon Q Developer**, que contribuyó en:

- ✅ Diseño de casos de prueba optimizados
- ✅ Identificación de vulnerabilidades
- ✅ Generación de código de pruebas
- ✅ Análisis de patrones de seguridad
- ✅ Recomendaciones de mejores prácticas

**Tiempo ahorrado**: ~70% comparado con desarrollo manual

---

## 📞 Soporte

Para preguntas o problemas:

1. Revisa la documentación en `PLAN_DE_PRUEBAS.md`
2. Consulta los resultados en `RESULTADOS_PRUEBAS.md`
3. Verifica la configuración en `karma.conf.js`

---

## 📝 Licencia

Este proyecto es parte de una práctica académica.

---

**Desarrollado con ❤️ y asistencia de Amazon Q Developer**
