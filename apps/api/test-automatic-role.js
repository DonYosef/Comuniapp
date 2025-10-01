const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserCreationWithLogs() {
  try {
    console.log('🔍 Probando creación de usuario con logs detallados...\n');

    // Primero hacer login para obtener token
    const loginResponse = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@comuniapp.com',
        password: 'contrasegura321',
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Error en login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login exitoso');

    // Crear usuario administrador de comunidad
    const userData = {
      email: 'test-automatic-role@comuniapp.com',
      name: 'Test Automatic Role',
      password: 'admin123',
      phone: '+1234567890',
      status: 'ACTIVE',
      roleName: 'COMMUNITY_ADMIN',
      organizationId: null,
      unitId: '',
    };

    console.log('📊 Datos a enviar:', JSON.stringify(userData, null, 2));

    const createResponse = await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('📊 Status:', createResponse.status);

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ Usuario creado:', createData.id);

      // Verificar inmediatamente si se creó el registro en user_roles
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: createData.id,
        },
        include: {
          role: true,
        },
      });

      if (userRole) {
        console.log('✅ Registro en user_roles encontrado:');
        console.log('- Rol:', userRole.role.name);
        console.log('- Permisos:', userRole.role.permissions.length);
      } else {
        console.log('❌ NO se encontró registro en user_roles');

        // Verificar si el rol COMMUNITY_ADMIN existe
        const role = await prisma.role.findUnique({
          where: { name: 'COMMUNITY_ADMIN' },
        });

        if (role) {
          console.log('✅ Rol COMMUNITY_ADMIN existe:', role.id);
          console.log('❌ PROBLEMA: El servicio NO está asignando el rol automáticamente');
        } else {
          console.log('❌ Rol COMMUNITY_ADMIN no existe');
        }
      }
    } else {
      const errorData = await createResponse.text();
      console.log('❌ Error al crear usuario:', errorData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUserCreationWithLogs();
