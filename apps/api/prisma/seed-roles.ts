import { PrismaClient, RoleName, PlanType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de roles y organizaciones...');

  // Crear roles
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      description: 'Administrador del sistema con acceso total',
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
      description: 'Conserje de la comunidad',
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
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: roleData,
      create: roleData,
    });
    console.log(`✅ Rol ${roleData.name} creado/actualizado`);
  }

  // Crear organización por defecto
  const defaultOrg = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Comuniapp Demo',
      plan: PlanType.ENTERPRISE,
    },
  });
  console.log('✅ Organización por defecto creada');

  // Crear Super Admin
  const superAdminEmail = 'admin@comuniapp.com';
  const superAdminPassword = await bcrypt.hash('admin123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      name: 'Super Administrador',
      passwordHash: superAdminPassword,
      organizationId: defaultOrg.id,
    },
  });

  // Asignar rol de Super Admin
  const superAdminRole = await prisma.role.findUnique({
    where: { name: RoleName.SUPER_ADMIN },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superAdmin.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
      },
    });
    console.log('✅ Super Admin creado y configurado');
  }

  console.log('🎉 Seed completado exitosamente!');
  console.log('📧 Super Admin: admin@comuniapp.com');
  console.log('🔑 Contraseña: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
