# Módulo de Vehículos - Taller Mecánico

## 📁 Ubicación
`src/app/pages/vehicles/`

## 📋 Descripción
Módulo completo standalone de Ionic Angular para la gestión de vehículos en una aplicación de taller mecánico.

## ✅ Características Implementadas

### 1. CRUD Completo
- ✅ **Crear** vehículo con asignación a cliente
- ✅ **Listar** todos los vehículos con información del cliente
- ✅ **Editar** vehículo existente
- ✅ **Eliminar** vehículo con confirmación

### 2. Campos del Vehículo
- **Marca** (requerido)
- **Modelo** (requerido)
- **Año** (requerido, validado entre 1900-2026)
- **Placas** (opcional)
- **VIN** (opcional)
- **Cliente asignado** (requerido, dropdown con todos los clientes)

### 3. Funcionalidades de Búsqueda y Filtrado
- 🔍 Búsqueda en tiempo real por:
  - Marca
  - Modelo
  - Placas
  - VIN
  - Nombre del cliente
- 🎯 Filtro por cliente específico
- 🔄 Debounce de 300ms en búsqueda

### 4. Vistas Disponibles
- 📱 **Vista de Tarjetas** (por defecto)
  - Información completa del vehículo
  - Datos del cliente
  - Badge con cantidad de servicios
  - Botones de acción (Historial, Editar, Eliminar)
- 📋 **Vista de Lista**
  - Formato compacto
  - Ion-item-sliding con opciones deslizables
  - Información resumida

### 5. Historial de Servicios
- 📊 Ver historial completo de servicios por vehículo
- 🏷️ Badge con cantidad de servicios realizados
- 📅 Fecha, estatus y total de cada servicio
- ⚠️ Alerta cuando no hay servicios registrados

### 6. UI/UX Moderna
- **Componentes Ionic**:
  - IonSearchbar con animación
  - IonSegment para alternar vistas
  - IonSelect para selección de cliente
  - IonModal para formularios
  - IonFab para acción rápida de agregar
  - IonItemSliding para opciones contextuales
  - IonChip para mostrar año
  - IonBadge para conteo de servicios
  - IonRefresher para pull-to-refresh
  - IonSkeletonText para loading states

### 7. Validaciones Completas
- ✅ Marca obligatoria (no vacía)
- ✅ Modelo obligatorio (no vacío)
- ✅ Año obligatorio y en rango válido (1900-2026)
- ✅ Cliente obligatorio
- ✅ Mensajes de error descriptivos
- ✅ Confirmación antes de eliminar

### 8. Sistema de Permisos
- 👨‍💼 **Admin**: CRUD completo
- 💼 **Cajero**: CRUD completo
- 🔧 **Mecánico**: Solo lectura (no puede crear, editar ni eliminar)

### 9. Características Adicionales
- 🔄 Pull-to-refresh para recargar datos
- ⏳ Skeleton loading durante carga inicial
- 📱 Diseño responsive (móvil, tablet, desktop)
- 🌙 Soporte para modo oscuro
- ✨ Animaciones suaves (fadeInUp)
- 🎨 Estado vacío con mensaje y acción
- 🔔 Toasts informativos para feedback
- 🗺️ Mapas internos para búsqueda optimizada (clientMap, serviceCountMap)

## 🏗️ Arquitectura

### Componente Standalone
```typescript
@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [CommonModule, FormsModule, ...IonicComponents]
})
```

### Servicios Utilizados
- `ApiService`: Comunicación con backend
- `AuthService`: Gestión de permisos y autenticación
- `AlertController`: Confirmaciones
- `ToastController`: Notificaciones
- `ModalController`: Modales

### Modelos
- `Vehicle`: Datos del vehículo
- `Client`: Información del cliente
- `ServiceOrder`: Historial de servicios

## 🎯 APIs Utilizadas

```typescript
// Vehículos
apiService.getVehicles()
apiService.createVehicle(vehicle)
apiService.updateVehicle(id, vehicle)
apiService.deleteVehicle(id)

// Clientes (para dropdown)
apiService.getClients()

// Órdenes de servicio (para historial)
apiService.getServiceOrders()
```

## 📱 Uso del Módulo

### 1. Agregar a las Rutas
```typescript
// app.routes.ts
{
  path: 'vehicles',
  loadComponent: () => import('./pages/vehicles/vehicles.page').then(m => m.VehiclesPage)
}
```

### 2. Agregar al Menú
```html
<ion-item routerLink="/vehicles" routerDirection="root">
  <ion-icon slot="start" name="car"></ion-icon>
  <ion-label>Vehículos</ion-label>
</ion-item>
```

## 🎨 Estilos

### Variables CSS Personalizables
```scss
--ion-color-primary
--ion-color-danger
--ion-color-warning
--ion-color-success
--ion-color-medium
```

### Breakpoints Responsive
- Móvil: < 768px (1 columna)
- Tablet: ≥ 768px (grid adaptativo)
- Desktop: ≥ 1024px (grid optimizado)

## 🧪 Testing

Se incluyen pruebas unitarias básicas para:
- ✅ Creación del componente
- ✅ Validación de formularios
- ✅ Filtrado de vehículos
- ✅ Sistema de permisos
- ✅ Gestión de modales
- ✅ Mapas de datos (clientes, servicios)

### Ejecutar Tests
```bash
npm test -- --include='**/vehicles.page.spec.ts'
```

## 📦 Dependencias

```json
{
  "@ionic/angular": "^8.x",
  "@angular/common": "^18.x",
  "@angular/core": "^18.x",
  "ionicons": "^7.x"
}
```

## 🔧 Configuración del Backend

Asegúrate de que tu API tenga los siguientes endpoints:

```
GET    /vehicles          - Obtener todos los vehículos
GET    /vehicles/:id      - Obtener un vehículo
POST   /vehicles          - Crear vehículo
PUT    /vehicles/:id      - Actualizar vehículo
DELETE /vehicles/:id      - Eliminar vehículo
GET    /clients           - Obtener clientes
GET    /service-orders    - Obtener órdenes de servicio
```

## 🚀 Características Técnicas Destacadas

### 1. Optimización de Rendimiento
- Carga paralela de datos (Promise.all)
- Mapas para búsqueda O(1)
- Debounce en búsqueda
- Lazy loading del módulo

### 2. Experiencia de Usuario
- Feedback inmediato con toasts
- Confirmaciones antes de acciones destructivas
- Loading states durante operaciones async
- Empty states informativos
- Animaciones suaves

### 3. Accesibilidad
- Labels descriptivos
- Mensajes de error claros
- Navegación por teclado
- Contraste adecuado

### 4. Mantenibilidad
- Código modular y bien organizado
- Comentarios descriptivos
- Separación de responsabilidades
- Tipado fuerte con TypeScript

## 📝 Notas Importantes

1. **Permisos**: El módulo verifica automáticamente los permisos del usuario al cargar
2. **Validaciones**: Todas las validaciones se ejecutan antes de enviar al servidor
3. **Cliente Requerido**: Todo vehículo debe estar asignado a un cliente
4. **Historial**: El historial de servicios se carga dinámicamente al solicitarlo
5. **Responsive**: El diseño se adapta automáticamente a diferentes tamaños de pantalla

## 🐛 Solución de Problemas

### El módulo no carga
- Verifica que las rutas estén configuradas correctamente
- Asegúrate de que ApiService y AuthService estén disponibles

### Los datos no se muestran
- Verifica la conexión con el backend
- Revisa la consola para errores de CORS
- Confirma que el token de autenticación sea válido

### Los permisos no funcionan
- Verifica que AuthService.getCurrentUser() retorne el usuario correctamente
- Confirma que el rol del usuario sea 'Admin', 'Cajero' o 'Mecánico'

## 📄 Licencia

Este módulo es parte de la aplicación Taller Mecánico.

---

**Desarrollado con ❤️ usando Ionic Angular + Standalone Components**
