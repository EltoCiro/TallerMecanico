// index.js - API completa (único archivo) - Taller Mecánico
// Dependencias:
// npm install express cors sequelize sqlite3 bcryptjs jsonwebtoken
// Ejecutar:
// node index.js

const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

/* -----------------------------
   Configuración
   ----------------------------- */
const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIA_POR_UN_SECRETO_MUY_FUERTE';
const PORT = process.env.PORT || 3000;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'taller.db',
  logging: false,
});

/* -----------------------------
   MODELOS
   ----------------------------- */

// Usuarios
const Usuario = sequelize.define('Usuario', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM('Administrador', 'Mecánico', 'Cajero'), allowNull: false }
});

// Clientes
const Cliente = sequelize.define('Cliente', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  telefono: DataTypes.STRING,
  correo: DataTypes.STRING,
  direccion: DataTypes.STRING
});

// Vehículos
const Vehiculo = sequelize.define('Vehiculo', {
  marca: DataTypes.STRING,
  modelo: DataTypes.STRING,
  anio: DataTypes.STRING,
  placas: DataTypes.STRING,
  vin: DataTypes.STRING
});

// Productos / Inventario
const Producto = sequelize.define('Producto', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  cantidad: { type: DataTypes.INTEGER, defaultValue: 0 },
  precioCosto: { type: DataTypes.FLOAT, defaultValue: 0 },
  precioVenta: { type: DataTypes.FLOAT, defaultValue: 0 },
  sku: DataTypes.STRING,
  minStockAlert: { type: DataTypes.INTEGER, defaultValue: 5 }
});

// Movimientos de inventario
const Movimiento = sequelize.define('Movimiento', {
  tipo: { type: DataTypes.ENUM('ingreso', 'salida', 'ajuste'), allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false },
  motivo: DataTypes.STRING
});

// Presupuestos
const Presupuesto = sequelize.define('Presupuesto', {
  descripcion: DataTypes.TEXT,
  itemsJson: DataTypes.TEXT, // JSON string [{type, descripcion, cantidad, unitPrice}]
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  descuento: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  estado: { type: DataTypes.ENUM('pendiente','aprobado','rechazado'), defaultValue: 'pendiente' }
});

// Ordenes de servicio
const Orden = sequelize.define('Orden', {
  descripcion: DataTypes.TEXT,
  actividadesJson: DataTypes.TEXT, // [{descripcion, mechanicId, minutos}]
  estatus: { type: DataTypes.ENUM('pendiente','en_proceso','completada'), defaultValue: 'pendiente' },
  notas: DataTypes.TEXT,
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 }
});

// Staff (mecánicos info extra)
const Staff = sequelize.define('Staff', {
  nombre: DataTypes.STRING,
  especialidad: DataTypes.STRING,
  horario: DataTypes.STRING
});

// Ventas / Notas de venta
const Venta = sequelize.define('Venta', {
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  itemsJson: DataTypes.TEXT, // [{productId, descripcion, cantidad, unitPrice}]
  subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  impuesto: { type: DataTypes.FLOAT, defaultValue: 0 },
  descuento: { type: DataTypes.FLOAT, defaultValue: 0 },
  total: { type: DataTypes.FLOAT, defaultValue: 0 },
  metodoPago: { type: DataTypes.ENUM('efectivo','tarjeta','transferencia'), defaultValue: 'efectivo' }
});

// Configuración simple (single-row table)
const Config = sequelize.define('Config', {
  key: { type: DataTypes.STRING, unique: true },
  value: DataTypes.TEXT
});

/* -----------------------------
   RELACIONES
   ----------------------------- */

Cliente.hasMany(Vehiculo, { onDelete: 'CASCADE' });
Vehiculo.belongsTo(Cliente);

Cliente.hasMany(Presupuesto);
Presupuesto.belongsTo(Cliente);

Vehiculo.hasMany(Presupuesto);
Presupuesto.belongsTo(Vehiculo);

Presupuesto.hasOne(Orden);
Orden.belongsTo(Presupuesto);

// Tabla de unión para Orden y Mecánicos
// La restricción UNIQUE debe ser sobre la combinación (OrdenId, UsuarioId), no solo UsuarioId
Orden.belongsToMany(Usuario, {
  through: 'OrdenMechanics',
  as: 'Mechanics',
  foreignKey: 'OrdenId',
  otherKey: 'UsuarioId'
});
Usuario.belongsToMany(Orden, {
  through: 'OrdenMechanics',
  as: 'AssignedOrders',
  foreignKey: 'UsuarioId',
  otherKey: 'OrdenId'
});

Producto.hasMany(Movimiento);
Movimiento.belongsTo(Producto);

Venta.belongsTo(Cliente);
Venta.belongsTo(Vehiculo);
Venta.belongsTo(Usuario, { as: 'createdBy' });

Orden.belongsTo(Cliente);
Orden.belongsTo(Vehiculo);

/* -----------------------------
   UTILIDADES
   ----------------------------- */

function normalizeRole(input) {
  if (!input) return null;
  const low = input.toString().toLowerCase();
  if (['administrador','admin'].includes(low)) return 'Administrador';
  if (['mecanico','mecánico','mecaníco'].includes(low) || low.normalize && low.normalize('NFD').replace(/[\u0300-\u036f]/g,'') === 'mecanico') return 'Mecánico';
  if (['cajero'].includes(low)) return 'Cajero';
  return null;
}

async function createDefaultConfig() {
  const defaults = [
    { key: 'iva', value: '0.16' },
    { key: 'shopName', value: 'Mi Taller' },
    { key: 'shopLogo', value: '' },
  ];
  for (const d of defaults) {
    const found = await Config.findOne({ where: { key: d.key }});
    if (!found) await Config.create(d);
  }
}

/* -----------------------------
   AUTH MIDDLEWARE
   ----------------------------- */

function generateToken(user) {
  return jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, JWT_SECRET, { expiresIn: '8h' });
}

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token requerido' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await Usuario.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const permit = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  if (!allowedRoles.includes(req.user.rol)) return res.status(403).json({ error: 'Permiso denegado' });
  next();
};

/* -----------------------------
   SYNC DB + crear admin por defecto
   ----------------------------- */
(async () => {
  // Primero, intentar corregir la tabla OrdenMechanics si existe con estructura incorrecta
  try {
    await sequelize.query('DROP TABLE IF EXISTS OrdenMechanics;');
    console.log('✅ Tabla OrdenMechanics eliminada para recreación');
  } catch (err) {
    console.log('⚠️ No se pudo eliminar OrdenMechanics (puede no existir)');
  }

  // No modificar estructura de tablas existentes (excepto OrdenMechanics que acabamos de eliminar)
  await sequelize.sync({ force: false });

  // crear admin si no existe
  const adminEmail = 'admin@taller.com';
  const admin = await Usuario.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const hashed = await bcrypt.hash('admin123', 10);
    await Usuario.create({ nombre: 'Administrador', email: adminEmail, password: hashed, rol: 'Administrador' });
    console.log(`Usuario admin creado: ${adminEmail} / admin123`);
  }

  await createDefaultConfig();

  app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
})();

/* -----------------------------
   RUTAS - AUTH
   ----------------------------- */

// Registro público -> crea cliente o usuario según tipoRequest
// Here: public registration creates CLIENTE account (not employee)
app.post('/auth/register-client', async (req, res) => {
  try {
    const { nombre, telefono, correo, direccion } = req.body;
    if (!nombre || !correo) return res.status(400).json({ error: 'nombre y correo requeridos' });
    const client = await Cliente.create({ nombre, telefono, correo, direccion });
    return res.status(201).json(client);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error registrar cliente' });
  }
});

// Login (email + password) -> retorna token y rol
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
    const user = await Usuario.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Contraseña incorrecta' });
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en login' });
  }
});

/* -----------------------------
   RUTAS - USUARIOS (Admin)
   ----------------------------- */

// Crear usuario empleado (Admin only)
app.post('/usuarios', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) return res.status(400).json({ error: 'Faltan datos' });
    const r = normalizeRole(rol);
    if (!r || !['Mecánico','Cajero'].includes(r)) return res.status(403).json({ error: 'Solo se pueden crear Mecánico o Cajero' });
    const exists = await Usuario.findOne({ where: { email }});
    if (exists) return res.status(400).json({ error: 'Email ya registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await Usuario.create({ nombre, email, password: hashed, rol: r });
    res.status(201).json({ message: 'Usuario creado', user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error crear usuario' });
  }
});

// Obtener usuarios (Admin)
app.get('/usuarios', authMiddleware, permit(['Administrador']), async (req, res) => {
  const users = await Usuario.findAll({ attributes: ['id','nombre','email','rol','createdAt'] });
  res.json(users);
});

// Actualizar usuario (Admin)
app.put('/usuarios/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    const { nombre, email, rol } = req.body;
    if (rol) {
      const nr = normalizeRole(rol);
      if (!nr) return res.status(400).json({ error: 'Rol inválido' });
      u.rol = nr;
    }
    if (nombre) u.nombre = nombre;
    if (email) u.email = email;
    await u.save();
    res.json({ message: 'Usuario actualizado', user: { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizar usuario' });
  }
});

// Eliminar usuario (Admin) - protege último admin
app.delete('/usuarios/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const u = await Usuario.findByPk(req.params.id);
    if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (u.rol === 'Administrador') {
      const count = await Usuario.count({ where: { rol: 'Administrador' }});
      if (count <= 1) return res.status(400).json({ error: 'No se puede eliminar el último Administrador' });
    }
    await u.destroy();
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminar usuario' });
  }
});

/* -----------------------------
   RUTAS - CLIENTES y VEHICULOS
   ----------------------------- */

// Clientes CRUD
app.post('/clientes', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const c = await Cliente.create(req.body);
    res.status(201).json(c);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear cliente' }); }
});

app.get('/clientes', authMiddleware, async (req, res) => {
  const clients = await Cliente.findAll({ include: Vehiculo });
  res.json(clients);
});

app.get('/clientes/:id', authMiddleware, async (req, res) => {
  const c = await Cliente.findByPk(req.params.id, { include: Vehiculo });
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json(c);
});

app.put('/clientes/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const c = await Cliente.findByPk(req.params.id);
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
  await c.update(req.body);
  res.json(c);
});

app.delete('/clientes/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const c = await Cliente.findByPk(req.params.id);
  if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
  await c.destroy();
  res.json({ message: 'Cliente eliminado' });
});

// Vehículos CRUD (asociados a cliente)
app.post('/vehiculos', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { clienteId, marca, modelo, anio, placas, vin } = req.body;
    if (!clienteId) return res.status(400).json({ error: 'clienteId requerido' });
    const client = await Cliente.findByPk(clienteId);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    const v = await Vehiculo.create({ ClienteId: clienteId, marca, modelo, anio, placas, vin });
    res.status(201).json(v);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear vehículo' }); }
});

app.get('/vehiculos', authMiddleware, async (req, res) => {
  const vehs = await Vehiculo.findAll({ include: Cliente });
  res.json(vehs);
});

app.get('/vehiculos/:id', authMiddleware, async (req, res) => {
  const v = await Vehiculo.findByPk(req.params.id, { include: Cliente });
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  res.json(v);
});

app.put('/vehiculos/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const v = await Vehiculo.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  await v.update(req.body);
  res.json(v);
});

app.delete('/vehiculos/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const v = await Vehiculo.findByPk(req.params.id);
  if (!v) return res.status(404).json({ error: 'Vehículo no encontrado' });
  await v.destroy();
  res.json({ message: 'Vehículo eliminado' });
});

/* -----------------------------
   RUTAS - PRODUCTOS E INVENTARIO
   ----------------------------- */

app.post('/productos', authMiddleware, permit(['Administrador','Cajero','Mecánico']), async (req, res) => {
  try {
    const p = await Producto.create(req.body);
    res.status(201).json(p);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear producto' }); }
});

app.get('/productos', authMiddleware, async (req, res) => {
  const { q } = req.query;
  const where = q ? { nombre: { [Op.like]: `%${q}%` } } : {};
  const prods = await Producto.findAll({ where });
  res.json(prods);
});

app.get('/productos/:id', authMiddleware, async (req, res) => {
  const p = await Producto.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(p);
});

app.put('/productos/:id', authMiddleware, permit(['Administrador','Cajero','Mecánico']), async (req, res) => {
  const p = await Producto.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await p.update(req.body);
  res.json(p);
});

app.delete('/productos/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const p = await Producto.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  await p.destroy();
  res.json({ message: 'Producto eliminado' });
});

// Movimientos
app.post('/movimientos', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { productoId, tipo, cantidad, motivo } = req.body;
    if (!productoId || !tipo || !cantidad) { await t.rollback(); return res.status(400).json({ error: 'Faltan datos' }); }
    const prod = await Producto.findByPk(productoId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!prod) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }
    if (tipo === 'salida' && prod.cantidad < cantidad) { await t.rollback(); return res.status(400).json({ error: 'Stock insuficiente' }); }
    const nuevo = tipo === 'ingreso' ? prod.cantidad + cantidad : tipo === 'salida' ? prod.cantidad - cantidad : prod.cantidad + cantidad;
    await prod.update({ cantidad: nuevo }, { transaction: t });
    const mov = await Movimiento.create({ ProductoId: productoId, tipo, cantidad, motivo }, { transaction: t });
    await t.commit();
    res.json({ message: 'Movimiento registrado', mov });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error registrar movimiento' });
  }
});

app.get('/movimientos', authMiddleware, permit(['Administrador']), async (req, res) => {
  const movs = await Movimiento.findAll({ include: Producto });
  res.json(movs);
});

/* -----------------------------
   RUTAS - PRESUPUESTOS
   ----------------------------- */

app.post('/presupuestos', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { clienteId, vehiculoId, descripcion, items, descuento } = req.body;
    const subtotal = (items || []).reduce((s, it) => s + (it.cantidad * it.unitPrice), 0);
    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto - (descuento||0)).toFixed(2);
    const p = await Presupuesto.create({ descripcion, itemsJson: JSON.stringify(items||[]), subtotal, impuesto, descuento: descuento||0, total, ClienteId: clienteId||null, VehiculoId: vehiculoId||null });
    res.status(201).json(p);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error crear presupuesto' }); }
});

app.get('/presupuestos', authMiddleware, async (req, res) => {
  const presupuestos = await Presupuesto.findAll({ include: [Cliente, Vehiculo] });
  res.json(presupuestos);
});

app.get('/presupuestos/:id', authMiddleware, async (req, res) => {
  const p = await Presupuesto.findByPk(req.params.id, { include: [Cliente, Vehiculo] });
  if (!p) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(p);
});

app.put('/presupuestos/:id', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const p = await Presupuesto.findByPk(req.params.id);
  if (!p) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  await p.update(req.body);
  res.json(p);
});

app.put('/presupuestos/:id/status', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['pendiente','aprobado','rechazado'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
    const p = await Presupuesto.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Presupuesto no encontrado' });
    await p.update({ estado });
    if (estado === 'aprobado') {
      // crear orden desde presupuesto aprobado
      const order = await Orden.create({
        descripcion: `Orden desde presupuesto ${p.id}`,
        actividadesJson: '[]',
        estatus: 'pendiente',
        subtotal: p.subtotal,
        impuesto: p.impuesto,
        total: p.total,
        ClienteId: p.ClienteId,
        VehiculoId: p.VehiculoId,
        PresupuestoId: p.id
      });
      return res.json({ presupuesto: p, ordenCreada: order });
    }
    res.json(p);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error actualizar estado' }); }
});

/* -----------------------------
   RUTAS - ORDENES DE SERVICIO
   ----------------------------- */

app.post('/ordenes', authMiddleware, permit(['Administrador','Mecánico','Cajero']), async (req, res) => {
  try {
    const { presupuestoId, descripcion, actividades, actividadesJson, assignedMechanicIds, notas, estatus, subtotal, impuesto, total, ClienteId, VehiculoId } = req.body;

    // Aceptar tanto actividades como actividadesJson
    let actividadesData = actividadesJson || JSON.stringify(actividades || []);

    const order = await Orden.create({
      descripcion: descripcion || '',
      actividadesJson: actividadesData,
      estatus: estatus || 'pendiente',
      notas: notas || '',
      subtotal: subtotal || 0,
      impuesto: impuesto || 0,
      total: total || 0,
      ClienteId: ClienteId || (presupuestoId ? (await Presupuesto.findByPk(presupuestoId))?.ClienteId : null),
      VehiculoId: VehiculoId || (presupuestoId ? (await Presupuesto.findByPk(presupuestoId))?.VehiculoId : null),
      PresupuestoId: presupuestoId || null
    });

    if (!order.descripcion || order.descripcion.trim() === '') {
      order.descripcion = `Orden #${order.id}`;
      await order.save();
    }

    if (assignedMechanicIds && Array.isArray(assignedMechanicIds)) {
      // Eliminar duplicados del array
      const uniqueMechanicIds = [...new Set(assignedMechanicIds)];
      await order.setMechanics(uniqueMechanicIds);
    }

    // Devolver con actividades parseadas
    let actividades_parsed = [];
    try { actividades_parsed = JSON.parse(order.actividadesJson || '[]'); } catch(e){}

    res.status(201).json({
      ...order.toJSON(),
      actividades: actividades_parsed,
      actividadesJson: order.actividadesJson
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error crear orden' });
  }
});

app.get('/ordenes', authMiddleware, async (req, res) => {
  const orders = await Orden.findAll({ include: [{ model: Presupuesto }, { model: Usuario, as: 'Mechanics' }, Cliente, Vehiculo] });
  const mapped = orders.map(o => {
    let actividades = [];
    try { actividades = JSON.parse(o.actividadesJson || '[]'); } catch(e){}
    return {
      id: o.id,
      descripcion: o.descripcion,
      estatus: o.estatus,
      notas: o.notas,
      actividades,
      actividadesJson: o.actividadesJson, // Incluir el JSON también
      Mechanics: o.Mechanics || [],
      subtotal: o.subtotal,
      impuesto: o.impuesto,
      total: o.total,
      ClienteId: o.ClienteId,
      VehiculoId: o.VehiculoId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt
    };
  });
  res.json(mapped);
});

app.get('/ordenes/:id', authMiddleware, async (req, res) => {
  const o = await Orden.findByPk(req.params.id, { include: [{ model: Presupuesto }, { model: Usuario, as: 'Mechanics' }, Cliente, Vehiculo] });
  if (!o) return res.status(404).json({ error: 'Orden no encontrada' });
  let actividades = [];
  try { actividades = JSON.parse(o.actividadesJson || '[]'); } catch(e){}
  res.json({
    id: o.id,
    descripcion: o.descripcion,
    estatus: o.estatus,
    notas: o.notas,
    actividades,
    actividadesJson: o.actividadesJson, // Incluir el JSON también
    Mechanics: o.Mechanics || [],
    subtotal: o.subtotal,
    impuesto: o.impuesto,
    total: o.total,
    ClienteId: o.ClienteId,
    VehiculoId: o.VehiculoId,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt
  });
});

app.put('/ordenes/:id', authMiddleware, permit(['Administrador','Mecánico']), async (req, res) => {
  try {
    const { descripcion, actividades, actividadesJson, assignedMechanicIds, notas, estatus, subtotal, impuesto, total, ClienteId, VehiculoId } = req.body;
    const o = await Orden.findByPk(req.params.id);
    if (!o) return res.status(404).json({ error: 'Orden no encontrada' });

    if (descripcion !== undefined) o.descripcion = descripcion;

    // Aceptar tanto actividades como actividadesJson
    if (actividadesJson !== undefined) {
      o.actividadesJson = actividadesJson;
    } else if (actividades !== undefined) {
      o.actividadesJson = JSON.stringify(actividades);
    }

    if (notas !== undefined) o.notas = notas;
    if (subtotal !== undefined) o.subtotal = subtotal;
    if (impuesto !== undefined) o.impuesto = impuesto;
    if (total !== undefined) o.total = total;
    if (ClienteId !== undefined) o.ClienteId = ClienteId;
    if (VehiculoId !== undefined) o.VehiculoId = VehiculoId;

    if (estatus !== undefined) {
      if (!['pendiente','en_proceso','completada'].includes(estatus)) return res.status(400).json({ error: 'Estatus inválido' });
      o.estatus = estatus;
    }

    await o.save();

    if (assignedMechanicIds && Array.isArray(assignedMechanicIds)) {
      // Eliminar duplicados del array
      const uniqueMechanicIds = [...new Set(assignedMechanicIds)];
      await o.setMechanics(uniqueMechanicIds);
    }

    // Devolver la orden actualizada con actividades parseadas
    let actividades_parsed = [];
    try { actividades_parsed = JSON.parse(o.actividadesJson || '[]'); } catch(e){}

    res.json({
      message: 'Orden actualizada',
      orden: {
        ...o.toJSON(),
        actividades: actividades_parsed,
        actividadesJson: o.actividadesJson
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizar orden' });
  }
});

app.delete('/ordenes/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const o = await Orden.findByPk(req.params.id);
  if (!o) return res.status(404).json({ error: 'Orden no encontrada' });
  await o.destroy();
  res.json({ message: 'Orden eliminada' });
});

/* -----------------------------
   RUTAS - STAFF (PERSONAL)
   ----------------------------- */

app.post('/staff', authMiddleware, permit(['Administrador']), async (req, res) => {
  const s = await Staff.create(req.body);
  res.status(201).json(s);
});

app.get('/staff', authMiddleware, async (req, res) => {
  const staff = await Staff.findAll();
  res.json(staff);
});

app.put('/staff/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const s = await Staff.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'No encontrado' });
  await s.update(req.body);
  res.json(s);
});

app.delete('/staff/:id', authMiddleware, permit(['Administrador']), async (req, res) => {
  const s = await Staff.findByPk(req.params.id);
  if (!s) return res.status(404).json({ error: 'No encontrado' });
  await s.destroy();
  res.json({ message: 'Empleado eliminado' });
});

/* -----------------------------
   RUTAS - VENTAS / NOTAS DE VENTA
   ----------------------------- */

app.post('/ventas', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { clienteId, vehiculoId, items, descuento, metodoPago } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) { await t.rollback(); return res.status(400).json({ error: 'Carrito vacío' }); }
    // validar stock
    for (const it of items) {
      const p = await Producto.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!p) { await t.rollback(); return res.status(404).json({ error: `Producto ${it.productId} no encontrado` }); }
      if (p.cantidad < it.cantidad) { await t.rollback(); return res.status(400).json({ error: `Stock insuficiente ${p.nombre}` }); }
    }
    const subtotal = items.reduce((s, it) => s + (it.cantidad * it.unitPrice), 0);
    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto - (descuento||0)).toFixed(2);
    const sale = await Venta.create({ ClienteId: clienteId||null, VehiculoId: vehiculoId||null, itemsJson: JSON.stringify(items), subtotal, impuesto, descuento: descuento||0, total, metodoPago, createdById: req.user.id }, { transaction: t });
    for (const it of items) {
      const p = await Producto.findByPk(it.productId, { transaction: t, lock: t.LOCK.UPDATE });
      await p.update({ cantidad: p.cantidad - it.cantidad }, { transaction: t });
      await Movimiento.create({ ProductoId: p.id, tipo: 'salida', cantidad: it.cantidad, motivo: `Venta #${sale.id}` }, { transaction: t });
    }
    await t.commit();
    res.status(201).json({ message: 'Venta registrada', saleId: sale.id, sale });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error registrar venta' });
  }
});

app.get('/ventas', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = {};
  if (startDate && endDate) where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  const ventas = await Venta.findAll({ where, include: [Cliente, Vehiculo] });

  // Parsear itemsJson para cada venta
  const ventasWithItems = ventas.map(v => {
    const ventaJson = v.toJSON();
    try {
      ventaJson.items = JSON.parse(v.itemsJson || '[]');
    } catch (e) {
      ventaJson.items = [];
    }
    return ventaJson;
  });

  res.json(ventasWithItems);
});

/* -----------------------------
   RUTAS - REPORTES
   ----------------------------- */

app.get('/reports/inventory-low', authMiddleware, permit(['Administrador']), async (req, res) => {
  const threshold = parseInt(req.query.threshold || '5', 10);
  const prods = await Producto.findAll({ where: { cantidad: { [Op.lte]: threshold } }});
  res.json(prods);
});

app.get('/reports/sales-summary', authMiddleware, permit(['Administrador']), async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = {};
  if (startDate && endDate) where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  const ventas = await Venta.findAll({ where });
  const map = {};
  ventas.forEach(v => {
    const d = new Date(v.fecha).toISOString().slice(0,10);
    map[d] = map[d] || { date: d, total: 0, ventas: 0 };
    map[d].total += v.total;
    map[d].ventas += 1;
  });
  res.json(Object.values(map));
});

app.get('/reports/productivity', authMiddleware, permit(['Administrador']), async (req, res) => {
  const orders = await Orden.findAll({ where: { estatus: 'completada' }, include: [{ model: Usuario, as: 'Mechanics' }] });
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
});

app.get('/reports/top-products', authMiddleware, permit(['Administrador','Cajero']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };

    const ventas = await Venta.findAll({ where });
    const productMap = {};

    ventas.forEach(v => {
      try {
        const items = JSON.parse(v.itemsJson || '[]');
        items.forEach(item => {
          const productId = item.productId;
          if (productId) {
            if (!productMap[productId]) {
              productMap[productId] = {
                productId: productId,
                nombre: item.descripcion || 'Producto',
                cantidadVendida: 0,
                ingresoTotal: 0
              };
            }
            productMap[productId].cantidadVendida += item.cantidad || 0;
            productMap[productId].ingresoTotal += (item.cantidad || 0) * (item.unitPrice || 0);
          }
        });
      } catch (e) {
        console.error('Error parsing itemsJson:', e);
      }
    });

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
      .slice(0, 10);

    res.json(topProducts);
  } catch (error) {
    console.error('Error en top-products:', error);
    res.status(500).json({ error: 'Error al obtener productos más vendidos' });
  }
});

app.get('/reports/top-clients', authMiddleware, permit(['Administrador']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) where.fecha = { [Op.between]: [new Date(startDate), new Date(endDate)] };

    // Obtener órdenes de servicio agrupadas por cliente
    const ordenes = await Orden.findAll({
      where: { estatus: 'completada' },
      include: [Cliente]
    });

    const clientMap = {};

    ordenes.forEach(o => {
      if (o.Cliente) {
        const clientId = o.Cliente.id;
        if (!clientMap[clientId]) {
          clientMap[clientId] = {
            clientId: clientId,
            nombre: o.Cliente.nombre,
            telefono: o.Cliente.telefono,
            correo: o.Cliente.correo,
            totalServicios: 0,
            totalGastado: 0
          };
        }
        clientMap[clientId].totalServicios += 1;
        clientMap[clientId].totalGastado += o.total || 0;
      }
    });

    // También contar ventas directas
    const ventas = await Venta.findAll({
      where,
      include: [Cliente]
    });

    ventas.forEach(v => {
      if (v.Cliente) {
        const clientId = v.Cliente.id;
        if (!clientMap[clientId]) {
          clientMap[clientId] = {
            clientId: clientId,
            nombre: v.Cliente.nombre,
            telefono: v.Cliente.telefono,
            correo: v.Cliente.correo,
            totalServicios: 0,
            totalGastado: 0
          };
        }
        clientMap[clientId].totalGastado += v.total || 0;
      }
    });

    const topClients = Object.values(clientMap)
      .sort((a, b) => b.totalServicios - a.totalServicios)
      .slice(0, 10);

    res.json(topClients);
  } catch (error) {
    console.error('Error en top-clients:', error);
    res.status(500).json({ error: 'Error al obtener clientes frecuentes' });
  }
});

/* -----------------------------
   RUTAS - CONFIG
   ----------------------------- */

app.get('/config', authMiddleware, permit(['Administrador']), async (req, res) => {
  const all = await Config.findAll();
  const obj = {};
  all.forEach(c => obj[c.key] = c.value);
  res.json(obj);
});

app.put('/config/:key', authMiddleware, permit(['Administrador']), async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  const c = await Config.findOne({ where: { key }});
  if (!c) {
    const created = await Config.create({ key, value });
    return res.json(created);
  }
  c.value = value;
  await c.save();
  res.json(c);
});

/* -----------------------------
   RUTA TEST
   ----------------------------- */
app.get('/', (req, res) => res.json({ message: 'API Taller Mecánico - OK' }));

/* -----------------------------
   FIN
   ----------------------------- */
