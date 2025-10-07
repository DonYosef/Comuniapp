import { PrismaClient, RoleName, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // Crear roles iniciales
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      description: 'Administrador con acceso completo al sistema',
      permissions: [
        'manage_all_organizations',
        'manage_all_users',
        'view_system_metrics',
        'manage_community',
        'manage_community_users',
        'manage_community_units',
        'manage_community_expenses',
        'view_community_reports',
        'manage_visitors',
        'manage_parcels',
        'manage_reservations',
        'view_community_announcements',
        'view_own_unit',
        'view_own_expenses',
        'manage_own_profile',
        'create_incidents',
        'view_announcements',
        'manage_own_visitors',
      ],
    },
    {
      name: RoleName.COMMUNITY_ADMIN,
      description: 'Administrador de comunidad',
      permissions: [
        'manage_community',
        'manage_community_users',
        'manage_community_units',
        'manage_community_expenses',
        'view_community_reports',
        'manage_visitors',
        'manage_parcels',
        'manage_reservations',
        'view_community_announcements',
        'view_own_unit',
        'view_own_expenses',
        'manage_own_profile',
        'create_incidents',
        'view_announcements',
        'manage_own_visitors',
      ],
    },
    {
      name: RoleName.CONCIERGE,
      description: 'Personal de conserjería',
      permissions: [
        'manage_visitors',
        'manage_parcels',
        'manage_reservations',
        'view_community_announcements',
        'manage_own_profile',
        'view_announcements',
      ],
    },
    {
      name: RoleName.OWNER,
      description: 'Propietario de unidad',
      permissions: [
        'view_own_unit',
        'view_own_expenses',
        'manage_own_profile',
        'create_incidents',
        'view_announcements',
        'manage_own_visitors',
      ],
    },
    {
      name: RoleName.TENANT,
      description: 'Arrendatario de unidad',
      permissions: [
        'view_own_unit',
        'view_own_expenses',
        'manage_own_profile',
        'create_incidents',
        'view_announcements',
        'manage_own_visitors',
      ],
    },
    {
      name: RoleName.RESIDENT,
      description: 'Residente de unidad',
      permissions: [
        'view_own_unit',
        'view_own_expenses',
        'manage_own_profile',
        'create_incidents',
        'view_announcements',
        'manage_own_visitors',
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

  // Crear organización por defecto
  const defaultOrg = await prisma.organization.findFirst({
    where: { name: 'Comuniapp Organization' },
  });

  let organizationId: string;
  if (!defaultOrg) {
    const newOrg = await prisma.organization.create({
      data: {
        name: 'Comuniapp Organization',
        plan: PlanType.BASIC,
        isActive: true,
      },
    });
    organizationId = newOrg.id;
    console.log('✅ Organización por defecto creada');
  } else {
    organizationId = defaultOrg.id;
    console.log('⚠️  Organización por defecto ya existe');
  }

  // Crear usuario administrador por defecto
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@comuniapp.com' },
  });

  if (!adminUser) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('contrasegura321', 12);

    const newAdminUser = await prisma.user.create({
      data: {
        email: 'admin@comuniapp.com',
        name: 'Administrador del Sistema',
        phone: '+1234567890',
        passwordHash: hashedPassword,
        status: 'ACTIVE',
        isActive: true,
        organizationId: organizationId,
      },
    });

    // Asignar rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: RoleName.SUPER_ADMIN },
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
