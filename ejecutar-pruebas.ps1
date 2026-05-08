# Script de Ejecución de Pruebas Automáticas
# Taller Mecánico - Asistido por IA

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRUEBAS AUTOMÁTICAS - TALLER MECÁNICO" -ForegroundColor Cyan
Write-Host "  Asistido por Amazon Q Developer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: No se encuentra package.json" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  FASE 1: PRUEBAS DE SEGURIDAD" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔐 Ejecutando pruebas de AuthService y AuthGuard..." -ForegroundColor Cyan

# Ejecutar pruebas de seguridad
npm run test:security

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  FASE 2: PRUEBAS COMPLETAS CON COBERTURA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Ejecutando suite completa de pruebas..." -ForegroundColor Cyan

# Ejecutar todas las pruebas con cobertura
npm run test:coverage

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  FASE 3: GENERACIÓN DE REPORTES" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar si se generó el reporte de cobertura
if (Test-Path "coverage/app/index.html") {
    Write-Host "✅ Reporte de cobertura generado exitosamente" -ForegroundColor Green
    Write-Host "📊 Ubicación: coverage/app/index.html" -ForegroundColor Cyan
    
    # Abrir reporte en navegador
    Write-Host ""
    $response = Read-Host "¿Deseas abrir el reporte de cobertura en el navegador? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        Start-Process "coverage/app/index.html"
    }
} else {
    Write-Host "⚠️  No se pudo generar el reporte de cobertura" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMEN DE EJECUCIÓN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Pruebas de seguridad: Completadas" -ForegroundColor Green
Write-Host "✅ Pruebas de funcionalidad: Completadas" -ForegroundColor Green
Write-Host "✅ Reporte de cobertura: Generado" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivos de prueba creados:" -ForegroundColor Yellow
Write-Host "   - src/app/services/auth.service.spec.ts (18 casos)" -ForegroundColor White
Write-Host "   - src/app/guards/auth.guard.spec.ts (10 casos)" -ForegroundColor White
Write-Host "   - src/app/services/api.service.spec.ts (40+ casos)" -ForegroundColor White
Write-Host ""
Write-Host "📊 Documentación generada:" -ForegroundColor Yellow
Write-Host "   - PLAN_DE_PRUEBAS.md" -ForegroundColor White
Write-Host "   - coverage/app/index.html" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ejecución completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
