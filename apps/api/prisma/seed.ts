import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear roles iniciales
  const roles = [
    {
      name: RoleName.ADMIN,
      description: 'Administrador con acceso completo al sistema',
      permissions: [
        'communities:read',
        'communities:write',
        'communities:delete',
        'units:read',
        'units:write',
        'units:delete',
        'users:read',
        'users:write',
        'users:delete',
        'expenses:read',
        'expenses:write',
        'payments:read',
        'payments:write',
        'announcements:read',
        'announcements:write',
        'documents:read',
        'documents:write',
        'parcels:read',
        'parcels:write',
        'visitors:read',
        'visitors:write',
        'reservations:read',
        'reservations:write',
        'incidents:read',
        'incidents:write',
        'communications:read',
        'communications:write',
        'dashboard:read',
      ],
    },
    {
      name: RoleName.RESIDENT,
      description: 'Residente de la comunidad',
      permissions: [
        'profile:read',
        'profile:write',
        'expenses:read',
        'payments:read',
        'payments:write',
        'announcements:read',
        'documents:read',
        'parcels:read',
        'parcels:write',
        'visitors:read',
        'visitors:write',
        'reservations:read',
        'reservations:write',
        'incidents:read',
        'incidents:write',
        'communications:read',
      ],
    },
    {
      name: RoleName.CONCIERGE,
      description: 'Personal de conserjería',
      permissions: [
        'parcels:read',
        'parcels:write',
        'visitors:read',
        'visitors:write',
        'incidents:read',
        'incidents:write',
        'communications:read',
        'reservations:read',
        'reservations:write',
      ],
    },
  ];

  for (const roleData of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (!existingRole) {
      await prisma.role.create({
        data: roleData,
      });
      console.log(`✅ Rol creado: ${roleData.name}`);
    } else {
      console.log(`⚠️  Rol ya existe: ${roleData.name}`);
    }
  }

  // Crear usuario administrador por defecto
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@comuniapp.com' },
  });

  if (!adminUser) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const newAdminUser = await prisma.user.create({
      data: {
        email: 'admin@comuniapp.com',
        name: 'Administrador del Sistema',
        phone: '+1234567890',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    // Asignar rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: RoleName.ADMIN },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: newAdminUser.id,
          roleId: adminRole.id,
        },
      });
      console.log('✅ Usuario administrador creado: admin@comuniapp.com');
    }
  } else {
    console.log('⚠️  Usuario administrador ya existe');
  }

  console.log('🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
