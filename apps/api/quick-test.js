#!/usr/bin/env node

/**
 * Script de Prueba Rápida - Creación de Usuarios
 * Verifica que el flujo completo de creación de usuarios funcione correctamente
 */

async function quickUserCreationTest() {
  const timestamp = Date.now();
  const testEmail = `test-quick-${timestamp}@comuniapp.com`;

  try {
    console.log('🚀 Iniciando prueba rápida de creación de usuarios...');

    // 1. Login
    console.log('📝 Paso 1: Login...');
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@comuniapp.com',
        password: 'contrasegura321',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login exitoso');

    // 2. Crear usuario
    console.log('📝 Paso 2: Crear usuario...');
    const userData = {
      email: testEmail,
      password: '123456',
      name: 'Test Quick',
      phone: '+34 999 888 777',
      organizationId: 'cmfub8plc0000pnod3jl14lo4',
      roleName: 'RESIDENT',
      unitId: 'cmfub9f3c0002rvxtidegk3o5',
    };

    const createResponse = await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`User creation failed: ${createResponse.status} - ${error}`);
    }

    const createdUser = await createResponse.json();
    console.log('✅ Usuario creado exitosamente');

    // 3. Verificar campos críticos
    console.log('📝 Paso 3: Verificar campos críticos...');
    const criticalFields = ['phone', 'organizationId'];
    const missingFields = [];

    criticalFields.forEach((field) => {
      if (!createdUser[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      throw new Error(`Campos faltantes en respuesta: ${missingFields.join(', ')}`);
    }

    console.log('✅ Todos los campos críticos presentes');

    // 4. Verificar en base de datos
    console.log('📝 Paso 4: Verificar en base de datos...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      if (!dbUser) {
        throw new Error('Usuario no encontrado en base de datos');
      }

      const dbMissingFields = [];
      criticalFields.forEach((field) => {
        if (!dbUser[field]) {
          dbMissingFields.push(field);
        }
      });

      if (dbMissingFields.length > 0) {
        throw new Error(`Campos faltantes en BD: ${dbMissingFields.join(', ')}`);
      }

      console.log('✅ Campos verificados en base de datos');

      // 5. Limpiar usuario de prueba
      console.log('📝 Paso 5: Limpiar usuario de prueba...');
      await prisma.user.delete({
        where: { email: testEmail },
      });
      console.log('✅ Usuario de prueba eliminado');
    } finally {
      await prisma.$disconnect();
    }

    // Resultado final
    console.log('\n🎉 ¡PRUEBA EXITOSA!');
    console.log('📊 Resumen:');
    console.log(`   - Usuario creado: ${createdUser.email}`);
    console.log(`   - Phone: ${createdUser.phone}`);
    console.log(`   - OrganizationId: ${createdUser.organizationId}`);
    console.log(`   - Status: ${createdUser.status}`);
    console.log('   - Campos guardados correctamente en BD');
    console.log('   - Flujo completo funcionando');

    return true;
  } catch (error) {
    console.error('\n❌ PRUEBA FALLIDA:');
    console.error(`   Error: ${error.message}`);
    console.error('\n🔍 Posibles causas:');
    console.error('   - Backend no está ejecutándose');
    console.error('   - Campos faltantes en arquitectura');
    console.error('   - Problemas de mapeo en repositorio');
    console.error('   - DTOs incompletos');

    return false;
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  quickUserCreationTest().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = quickUserCreationTest;
