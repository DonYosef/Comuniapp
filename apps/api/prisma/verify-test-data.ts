import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTestData() {
  console.log('🔍 Verificando datos de prueba creados...\n');

  try {
    // Verificar comunidades
    const communities = await prisma.community.findMany();

    console.log('🏢 Comunidades creadas:');
    for (const community of communities) {
      console.log(`\n   📍 ${community.name}`);
      console.log(`      📧 Email: ${community.email}`);
      console.log(`      📞 Teléfono: ${community.phone}`);
      console.log(`      🏠 Unidades: ${community.totalUnits}`);
      console.log(`      🏢 Tipo: ${community.type}`);
    }

    // Verificar administradores
    console.log('\n👨‍💼 Administradores de comunidad:');
    const adminRole = await prisma.role.findUnique({
      where: { name: 'COMMUNITY_ADMIN' },
    });

    if (adminRole) {
      const admins = await prisma.userRole.findMany({
        where: { roleId: adminRole.id },
        include: {
          user: true,
          role: true,
        },
      });

      for (const adminRole of admins) {
        console.log(`\n   👤 ${adminRole.user.name}`);
        console.log(`      📧 Email: ${adminRole.user.email}`);
        console.log(`      📞 Teléfono: ${adminRole.user.phone}`);
      }
    }

    // Verificar residentes
    console.log('\n👥 Residentes creados:');
    const residentRole = await prisma.role.findUnique({
      where: { name: 'RESIDENT' },
    });

    if (residentRole) {
      const residents = await prisma.userRole.findMany({
        where: { roleId: residentRole.id },
        include: {
          user: true,
        },
      });

      console.log(`   Total de residentes: ${residents.length}`);
      console.log('\n   Ejemplos de residentes:');
      for (let i = 0; i < Math.min(5, residents.length); i++) {
        const resident = residents[i].user;
        console.log(`\n   👤 ${resident.name}`);
        console.log(`      📧 Email: ${resident.email}`);
        console.log(`      📞 Teléfono: ${resident.phone}`);
      }
    }

    // Verificar espacios comunes
    console.log('\n🏊 Espacios comunes creados:');
    const spaces = await prisma.communityCommonSpace.findMany({
      include: {
        community: {
          select: {
            name: true,
          },
        },
      },
    });

    const spacesByCommunity = spaces.reduce(
      (acc, space) => {
        if (!acc[space.community.name]) {
          acc[space.community.name] = [];
        }
        acc[space.community.name].push(space);
        return acc;
      },
      {} as Record<string, typeof spaces>,
    );

    for (const [communityName, communitySpaces] of Object.entries(spacesByCommunity)) {
      console.log(`\n   🏢 ${communityName}:`);
      for (const space of communitySpaces) {
        console.log(
          `      🏊 ${space.name} (${space.quantity} unidad${space.quantity > 1 ? 'es' : ''})`,
        );
        console.log(`         📝 ${space.description}`);
      }
    }

    // Verificar avisos
    console.log('\n📢 Avisos creados:');
    const announcements = await prisma.announcement.findMany({
      include: {
        community: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    for (const announcement of announcements) {
      console.log(`\n   📢 ${announcement.title}`);
      console.log(`      🏢 Comunidad: ${announcement.community.name}`);
      console.log(`      👤 Creado por: ${announcement.createdBy.name}`);
      console.log(`      🏷️  Tipo: ${announcement.type}`);
      console.log(`      📅 Fecha: ${announcement.publishedAt.toLocaleDateString('es-ES')}`);
    }

    console.log('\n✅ Verificación completada exitosamente!');
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Contraseña para todos los usuarios: 123456');
    console.log('\n📱 Para probar el sistema:');
    console.log('   1. Inicia sesión con cualquier administrador');
    console.log('   2. Ve a la sección "Avisos" en el sidebar');
    console.log('   3. Crea, edita o elimina avisos');
    console.log('   4. Los residentes pueden ver los avisos en su dashboard');
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

verifyTestData()
  .catch((e) => {
    console.error('❌ Error durante la verificación:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
