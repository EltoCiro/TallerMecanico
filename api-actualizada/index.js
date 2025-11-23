// index.js - API completa Taller Mecánico (actualizada con CRUD completo)
// Dependencias: express cors sequelize sqlite3 bcryptjs jsonwebtoken
// Instalación:
// npm install express cors sequelize sqlite3 bcryptjs jsonwebtoken

const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------------
// Configuración SQLite/Sequelize
// ---------------------------
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'taller.sqlite',
  logging: false
});

// ---------------------------
// Constantes (cambiar en producción)
// ---------------------------
const JWT_SECRET = 'CAMBIA_POR_UN_SECRETO_MUY_FUERTE';

// ---------------------------
// Modelos
// ---------------------------

// Usuario (roles)
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true }},
  password: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM('Administrador','Mecánico','Cajero'), allowNull: false }
});

// Cliente
const Client = sequelize.define('Client', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING },
  correo: { type: DataTypes.STRING },
  direccion: { type: DataTypes.STRING }
});

// Vehículo
const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  placas: { type: DataTypes.STRING },
  marca: { type: DataTypes.STRING },
  modelo: { type: DataTypes.STRING },
  anio: { type: DataTypes.INTEGER },
  vin: { type: DataTypes.STRING }
});

// Producto
const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombreProducto: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  precioCosto: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  precioVenta: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  sku: { type: DataTypes.STRING },
  minStockAlert: { type: DataTypes.INTEGER, defaultValue: 5 }
});

// Movimientos de inventario
const InventoryMovement = sequelize.define('InventoryMovement', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  tipo: { type: DataTypes.ENUM('ingreso','salida','ajuste'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  motivo: { type: DataTypes.STRING }
});

// Presupuesto
const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  descripcion: { type: DataTypes.TEXT },
  itemsJson: { type: DataTypes.TEXT }, // JSON string: [{type, descripcion, cantidad, unitPrice}]
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  descuento: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  estatus: { type: DataTypes.ENUM('pendiente','aprobado','rechazado'), defaultValue: 'pendiente' }
});

// Orden de servicio
const ServiceOrder = sequelize.define('ServiceOrder', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  descripcion: { type: DataTypes.TEXT },
  actividadesJson: { type: DataTypes.TEXT }, // JSON string: [{descripcion, mechanicId, minutos}]
  estatus: { type: DataTypes.ENUM('pendiente','en_proceso','completada'), defaultValue: 'pendiente' },
  notas: { type: DataTypes.TEXT },
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 }
});

// Staff (información adicional del personal si se desea mantener separado)
const Staff = sequelize.define('Staff', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING },
  especialidad: { type: DataTypes.STRING },
  horario: { type: DataTypes.STRING }
});

// Venta / Nota de venta
const Sale = sequelize.define('Sale', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  descuento: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  metodoPago: { type: DataTypes.ENUM('efectivo','tarjeta','transferencia'), defaultValue: 'efectivo' },
  itemsJson: { type: DataTypes.TEXT } // [{productId, descripcion, cantidad, unitPrice}]
});

// ---------------------------
// Relaciones
// ---------------------------
Client.hasMany(Vehicle, { onDelete: 'CASCADE' });
Vehicle.belongsTo(Client);

Client.hasMany(Budget);
Budget.belongsTo(Client);

Vehicle.hasMany(Budget);
Budget.belongsTo(Vehicle);

Budget.hasOne(ServiceOrder);
ServiceOrder.belongsTo(Budget);

ServiceOrder.belongsToMany(User, { through: 'ServiceOrderMechanics', as: 'Mechanics' });
User.belongsToMany(ServiceOrder, { through: 'ServiceOrderMechanics', as: 'AssignedOrders' });

Product.hasMany(InventoryMovement);
InventoryMovement.belongsTo(Product);

Sale.belongsTo(Client);
Sale.belongsTo(Vehicle);
Sale.belongsTo(User, { as: 'createdBy' });

// ---------------------------
// Sincronizar DB y crear Admin por defecto
// ---------------------------
(async () => {
  await sequelize.sync();
  console.log('DB sincronizada: taller.sqlite');

  const admin = await User.findOne({ where: { rol: 'Administrador' } });
  if (!admin) {
    const hashed = await bcrypt.hash('123456', 10);
    await User.create({ nombre: 'Administrador', email: 'admin@taller.com', password: hashed, rol: 'Administrador' });
    console.log('Usuario admin creado: admin@taller.com / 123456');
  }
})();

// ---------------------------
// Middlewares: auth y roles
// ---------------------------
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No autorizado' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const permit = (allowed = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  if (!allowed.includes(req.user.rol)) return res.status(403).json({ error: 'Permiso denegado' });
  next();
};

// ---------------------------
// Rutas: Autenticación y Usuarios
// ---------------------------

// Login (email + password) -> devuelve token y rol
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Contraseña incorrecta' });
    const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Autenticado', token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error en login' }); }
});

// Registro: SOLO Admin puede crear usuarios (Mecánico o Cajero)
app.post('/register', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) return res.status(400).json({ error: 'Faltan datos' });
    if (!['Mecánico','Cajero'].includes(rol)) return res.status(403).json({ error: 'Solo se pueden crear roles Mecánico o Cajero' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email ya registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, email, password: hashed, rol });
    res.status(201).json({ message: 'Usuario creado', user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error en registro' }); }
});

// Obtener lista de usuarios (solo Admin)
app.get('/users', authMiddleware, permit(['Administrador']), async (req, res) => {
  const users = await User.findAll({ attributes: ['id','nombre','email','rol','createdAt'] });
  res.json(users);
});

// ---------------------------
// Rutas: Clientes y Vehículos (CRUD COMPLETO)
// ---------------------------

// Crear cliente (Admin, Cajero)
app.post('/clients', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { nombre, telefono, correo, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const client = await Client.create({ nombre, telefono, correo, direccion });
    res.status(201).json(client);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear cliente' }); }
});

// Listar clientes (todos los roles autenticados)
app.get('/clients', authMiddleware, async (req, res) => {
  const clients = await Client.findAll({ include: Vehicle });
  res.json(clients);
});

// Obtener cliente por id
app.get('/clients/:id', authMiddleware, async (req, res) => {
  const client = await Client.findByPk(req.params.id, { include: Vehicle });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(client);
});

// Actualizar cliente (Admin, Cajero)
app.put('/clients/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  await client.update(req.body);
  res.json(client);
});

// Eliminar cliente (solo Admin)
app.delete('/clients/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const client = await Client.findByPk(req.params.id);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  await client.destroy();
  res.json({ message: 'Cliente eliminado' });
});

// Crear vehículo (Admin, Cajero)
app.post('/vehicles', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { clientId, placas, marca, modelo, anio, vin } = req.body;
    if (!clientId) return res.status(400).json({ error: 'clientId requerido' });
    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const vehicle = await Vehicle.create({ ClientId: clientId, placas, marca, modelo, anio, vin });
    res.status(201).json(vehicle);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear vehículo' }); }
});

// Listar vehículos
app.get('/vehicles', authMiddleware, async (req, res) => {
  const vehicles = await Vehicle.findAll({ include: Client });
  res.json(vehicles);
});

// Obtener vehículo por id
app.get('/vehicles/:id', authMiddleware, async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id, { include: Client });
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  res.json(v);
});

// Actualizar vehículo (Admin, Cajero)
app.put('/vehicles/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  await v.update(req.body);
  res.json(v);
});

// Eliminar vehículo (Admin)
app.delete('/vehicles/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  await v.destroy();
  res.json({ message: 'Vehículo eliminado' });
});

// ---------------------------
// Rutas: Productos y Inventario (CRUD COMPLETO)
// ---------------------------

// Crear producto (Admin)
app.post('/products', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { nombreProducto, descripcion, cantidad, precioCosto, precioVenta, sku, minStockAlert } = req.body;
    if (!nombreProducto) return res.status(400).json({ error: 'nombreProducto requerido' });
    const product = await Product.create({ nombreProducto, descripcion, cantidad: cantidad||0, precioCosto: precioCosto||0, precioVenta: precioVenta||0, sku, minStockAlert: minStockAlert||5 });
    res.status(201).json(product);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear producto' }); }
});

// Listar productos (con búsqueda q)
app.get('/products', authMiddleware, async (req, res) => {
  const { q } = req.query;
  const where = q ? { nombreProducto: { [Op.like]: `%${q}%` } } : {};
  const prods = await Product.findAll({ where });
  res.json(prods);
});

// Obtener producto por id
app.get('/products/:id', authMiddleware, async (req, res) => {
  const p = await Product.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

// Actualizar producto (Admin)
app.put('/products/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const p = await Product.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await p.update(req.body);
  res.json(p);
});

// Eliminar producto (Admin)
app.delete('/products/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const p = await Product.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await p.destroy();
  res.json({ message: 'Producto eliminado' });
});

// Movimiento de inventario (ingreso/salida/ajuste) - Admin/Cajero
app.post('/inventory/move', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productId, tipo, cantidad, motivo } = req.body;
    if (!productId || !tipo || !cantidad) { await t.rollback(); return res.status(400).json({ error: 'Faltan datos' }); }
    const p = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!p) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }
    if (tipo === 'salida' && p.cantidad < cantidad) { await t.rollback(); return res.status(400).json({ error: 'Inventario insuficiente' }); }
    const nuevoStock = tipo === 'ingreso' ? p.cantidad + cantidad : tipo === 'salida' ? p.cantidad - cantidad : p.cantidad + cantidad;
    await p.update({ cantidad: nuevoStock }, { transaction: t });
    const mov = await InventoryMovement.create({ ProductId: productId, tipo, cantidad, motivo }, { transaction: t });
    await t.commit();
    res.json({ message: 'Movimiento registrado', movimiento: mov, product: p });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error movimiento inventario' });
  }
});

// Obtener movimientos (Admin)
app.get('/inventory/movements', authMiddleware, permit(['Administrador']), async (req, res) => {
  const movs = await InventoryMovement.findAll({ include: Product });
  res.json(movs);
});

// ---------------------------
// Rutas: Presupuestos (CRUD COMPLETO)
// ---------------------------

// Crear presupuesto (Admin, Cajero)
app.post('/budgets', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { clientId, vehicleId, descripcion, items, descuento } = req.body;
    // items = [{ type: 'mano_obra'|'pieza', descripcion, cantidad, unitPrice }]
    const subtotal = (items || []).reduce((s, it) => s + (it.cantidad * it.unitPrice), 0);
    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto - (descuento||0)).toFixed(2);
    const b = await Budget.create({
      descripcion,
      ClientId: clientId || null,
      VehicleId: vehicleId || null,
      itemsJson: JSON.stringify(items || []),
      subtotal, impuesto, descuento: descuento||0, total
    });
    res.status(201).json(b);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear presupuesto' }); }
});

// Listar presupuestos
app.get('/budgets', authMiddleware, async (req, res) => {
  const budgets = await Budget.findAll({ include: [Client, Vehicle] });
  res.json(budgets);
});

// Obtener presupuesto por id
app.get('/budgets/:id', authMiddleware, async (req, res) => {
  const b = await Budget.findByPk(req.params.id, { include: [Client, Vehicle] });
  if (!b) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(b);
});

// Actualizar presupuesto (Admin, Cajero)
app.put('/budgets/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const b = await Budget.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    
    const { descripcion, items, descuento } = req.body;
    const updateData = { descripcion };
    
    if (items) {
      const subtotal = items.reduce((s, it) => s + (it.cantidad * it.unitPrice), 0);
      const impuesto = +(subtotal * 0.16).toFixed(2);
      const total = +(subtotal + impuesto - (descuento||0)).toFixed(2);
      updateData.itemsJson = JSON.stringify(items);
      updateData.subtotal = subtotal;
      updateData.impuesto = impuesto;
      updateData.descuento = descuento || 0;
      updateData.total = total;
    }
    
    await b.update(updateData);
    res.json(b);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error actualizar presupuesto' }); }
});

// Eliminar presupuesto (Admin)
app.delete('/budgets/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const b = await Budget.findByPk(req.params.id);
  if (!b) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  await b.destroy();
  res.json({ message: 'Presupuesto eliminado' });
});

// Cambiar estatus (Admin, Cajero)
app.put('/budgets/:id/status', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { estatus } = req.body;
    if (!['pendiente','aprobado','rechazado'].includes(estatus)) return res.status(400).json({ error: 'Estatus inválido' });
    const budget = await Budget.findByPk(req.params.id);
    if (!budget) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    await budget.update({ estatus });
    // Si se aprueba -> crear orden base
    if (estatus === 'aprobado') {
      const order = await ServiceOrder.create({
        descripcion: `Orden desde presupuesto ${budget.id}`,
        BudgetId: budget.id,
        actividadesJson: '[]',
        notas: '',
        subtotal: budget.subtotal,
        impuesto: budget.impuesto,
        total: budget.total
      });
      return res.json({ budget, createdOrder: order });
    }
    res.json(budget);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error actualizar estatus' }); }
});

// ---------------------------
// Rutas: Ordenes de Servicio (CRUD COMPLETO)
// ---------------------------

// Crear orden (Admin, Mecánico, Cajero)
app.post('/service-orders', authMiddleware, permit(['Administrador','Mecánico','Cajero']), async (req, res) => {
  try {
    const { budgetId, descripcion, actividades, assignedMechanicIds, notas } = req.body;
    const order = await ServiceOrder.create({
      descripcion,
      BudgetId: budgetId || null,
      actividadesJson: JSON.stringify(actividades || []),
      notas,
      subtotal: 0, impuesto: 0, total: 0
    });
    if (assignedMechanicIds && Array.isArray(assignedMechanicIds)) {
      await order.setMechanics(assignedMechanicIds);
    }
    res.status(201).json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear orden' }); }
});

// Listar órdenes
app.get('/service-orders', authMiddleware, async (req, res) => {
  const orders = await ServiceOrder.findAll({ include: [{ model: Budget }, { model: User, as: 'Mechanics' }] });
  res.json(orders);
});

// Obtener orden por id
app.get('/service-orders/:id', authMiddleware, async (req, res) => {
  const order = await ServiceOrder.findByPk(req.params.id, { include: [{ model: Budget }, { model: User, as: 'Mechanics' }] });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(order);
});

// Actualizar orden (Admin, Mecánico)
app.put('/service-orders/:id', authMiddleware, permit(['Administrador','Mecánico']), async (req, res) => {
  try {
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    
    const { descripcion, actividades, notas, subtotal, impuesto, total } = req.body;
    const updateData = {};
    
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (actividades !== undefined) updateData.actividadesJson = JSON.stringify(actividades);
    if (notas !== undefined) updateData.notas = notas;
    if (subtotal !== undefined) updateData.subtotal = subtotal;
    if (impuesto !== undefined) updateData.impuesto = impuesto;
    if (total !== undefined) updateData.total = total;
    
    await order.update(updateData);
    res.json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error actualizar orden' }); }
});

// Eliminar orden (Admin)
app.delete('/service-orders/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const order = await ServiceOrder.findByPk(req.params.id);
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  await order.destroy();
  res.json({ message: 'Orden eliminada' });
});

// Actualizar estatus de orden (Admin, Mecánico)
app.put('/service-orders/:id/status', authMiddleware, permit(['Administrador','Mecánico']), async (req, res) => {
  try {
    const { estatus } = req.body;
    if (!['pendiente','en_proceso','completada'].includes(estatus)) return res.status(400).json({ error: 'Estatus inválido' });
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    await order.update({ estatus });
    res.json(order);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error actualizar orden' }); }
});

// Asignar mecánicos a orden (Admin)
app.post('/service-orders/:id/assign', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { mechanicIds } = req.body; // [id1, id2]
    const order = await ServiceOrder.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    await order.setMechanics(mechanicIds || []);
    res.json({ message: 'Mecánicos asignados' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error asignar mecánicos' }); }
});

// ---------------------------
// Rutas: Staff (CRUD COMPLETO)
// ---------------------------

// Crear staff (Admin)
app.post('/staff', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { nombre, especialidad, horario } = req.body;
    const s = await Staff.create({ nombre, especialidad, horario });
    res.status(201).json(s);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear staff' }); }
});

// Listar staff
app.get('/staff', authMiddleware, async (req, res) => {
  const staff = await Staff.findAll();
  res.json(staff);
});

// Obtener staff por id
app.get('/staff/:id', authMiddleware, async (req, res) => {
  const s = await Staff.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'Staff no encontrado' });
  res.json(s);
});

// Actualizar staff (Admin)
app.put('/staff/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const s = await Staff.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'Staff no encontrado' });
  await s.update(req.body);
  res.json(s);
});

// Eliminar staff (Admin)
app.delete('/staff/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const s = await Staff.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'Staff no encontrado' });
  await s.destroy();
  res.json({ message: 'Staff eliminado' });
});

// ---------------------------
// Rutas: Ventas (Notas de venta)
// ---------------------------

// Crear venta (Admin, Cajero) - transaccional: crea Sale, descuenta stock y crea movimientos
app.post('/sales', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clientId, vehicleId, items, descuento, metodoPago } = req.body;
    // items = [{ productId, cantidad, unitPrice }]
    if (!items || !Array.isArray(items) || items.length === 0) { await t.rollback(); return res.status(400).json({ error: 'Carrito vacío' }); }

    // Validar stock
    for (const it of items) {
      const p = await Product.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!p) { await t.rollback(); return res.status(404).json({ error: `Producto ${it.productId} no encontrado` }); }
      if (p.cantidad < it.cantidad) { await t.rollback(); return res.status(400).json({ error: `Stock insuficiente ${p.nombreProducto}` }); }
    }

    // Calcular totales
    const subtotal = items.reduce((s, it) => s + (it.cantidad * it.unitPrice), 0);
    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto - (descuento||0)).toFixed(2);

    // Crear venta
    const sale = await Sale.create({
      ClientId: clientId || null,
      VehicleId: vehicleId || null,
      subtotal, impuesto, descuento: descuento||0, total,
      metodoPago: metodoPago || 'efectivo',
      itemsJson: JSON.stringify(items),
      createdById: req.user.id
    }, { transaction: t });

    // Descontar stock y crear movimientos
    for (const it of items) {
      const p = await Product.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
      await p.update({ cantidad: p.cantidad - it.cantidad }, { transaction: t });
      await InventoryMovement.create({ ProductId: p.id, tipo: 'salida', cantidad: it.cantidad, motivo: `Venta #${sale.id}` }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Venta registrada', saleId: sale.id, sale });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error registrar venta' });
  }
});

// Listar ventas / reporte por rango (Admin, Cajero)
app.get('/sales', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    const sales = await Sale.findAll({ where, include: [Client, Vehicle] });
    const total = sales.reduce((s, x) => s + x.total, 0);
    res.json({ sales, total });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error obtener ventas' }); }
});

// ---------------------------
// Rutas: Reportes
// ---------------------------

// Inventario bajo (Admin)
app.get('/reports/inventory-low', authMiddleware, permit(['Administrador']), async (req, res) => {
  const threshold = parseInt(req.query.threshold || '5', 10);
  const prods = await Product.findAll({ where: { cantidad: { [Op.lte]: threshold } } });
  res.json(prods);
});

// Ventas agregadas por día (Admin)
app.get('/reports/sales-summary', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    const sales = await Sale.findAll({ where });
    // agrupar por día simple
    const map = {};
    sales.forEach(s => {
      const d = new Date(s.fecha).toISOString().slice(0,10);
      map[d] = map[d] || { date: d, total: 0, ventas: 0 };
      map[d].total += s.total;
      map[d].ventas += 1;
    });
    res.json(Object.values(map));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error reporte ventas' }); }
});

// Productividad por mecánico (Admin)
app.get('/reports/productivity', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    // contar órdenes completadas por cada mecánico
    const orders = await ServiceOrder.findAll({ where: { estatus: 'completada' }, include: [{ model: User, as: 'Mechanics' }] });
    const map = {};
    orders.forEach(o => {
      if (o.Mechanics && o.Mechanics.length) {
        o.Mechanics.forEach(m => {
          map[m.id] = map[m.id] || { mechanicId: m.id, nombre: m.nombre, completadas: 0 };
          map[m.id].completadas += 1;
        });
      }
    });
    res.json(Object.values(map));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error productividad' }); }
});

// ---------------------------
// Ruta de prueba
// ---------------------------
app.get('/', (req, res) => {
  res.json({ message: 'API Taller Mecánico - OK (Actualizada con CRUD completo)' });
});

// ---------------------------
// Iniciar servidor
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
  console.log('CRUD completo disponible para: Clientes, Vehículos, Productos, Presupuestos, Órdenes de Servicio, Staff');
});
