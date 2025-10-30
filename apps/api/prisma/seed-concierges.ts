import { PrismaClient, RoleName, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedConcierges() {
  console.log('🌱 Creando usuarios conserjes para cada comunidad...\n');

  try {
    // Obtener todas las comunidades activas
    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        organization: true,
      },
    });

    if (communities.length === 0) {
      console.log('❌ No se encontraron comunidades activas.');
      return;
    }

    console.log(`📋 Se encontraron ${communities.length} comunidades activas.\n`);

    // Obtener el rol CONCIERGE
    const conciergeRole = await prisma.role.findUnique({
      where: { name: RoleName.CONCIERGE },
    });

    if (!conciergeRole) {
      console.log('❌ No se encontró el rol CONCIERGE. Ejecuta primero el seed de roles.');
      return;
    }

    // Hash de la contraseña
    const password = '123456';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let createdCount = 0;
    let skippedCount = 0;

    // Crear un conserje para cada comunidad
    for (const community of communities) {
      // Generar email único para el conserje
      const emailPrefix = community.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]/g, '-') // Reemplazar caracteres especiales con guiones
        .replace(/-+/g, '-') // Eliminar guiones duplicados
        .replace(/^-|-$/g, ''); // Eliminar guiones al inicio y final

      const email = `concierge-${emailPrefix}@comuniapp.local`;

      // Verificar si ya existe un conserje para esta comunidad
      const existingConcierge = await prisma.user.findFirst({
        where: {
          email: email,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
          communityAdmins: true,
        },
      });

      // Si ya existe un conserje con este email, verificar si está asociado a la comunidad
      if (existingConcierge) {
        const isAssociated = existingConcierge.communityAdmins.some(
          (ca) => ca.communityId === community.id,
        );

        if (isAssociated) {
          console.log(`⏭️  Ya existe un conserje para la comunidad: ${community.name}`);
          skippedCount++;
          continue;
        }
      }

      // Si existe el usuario pero no está asociado, asociarlo
      if (existingConcierge) {
        await prisma.communityAdmin.create({
          data: {
            communityId: community.id,
            userId: existingConcierge.id,
          },
        });
        console.log(`✅ Conserje existente asociado a la comunidad: ${community.name}`);
        createdCount++;
        continue;
      }

      // Crear nuevo usuario conserje
      const conciergeUser = await prisma.user.create({
        data: {
          email: email,
          name: `Conserje de ${community.name}`,
          phone: community.phone || null,
          passwordHash: hashedPassword,
          status: UserStatus.ACTIVE,
          isActive: true,
          organizationId: community.organizationId,
        },
      });

      // Asignar rol CONCIERGE
      await prisma.userRole.create({
        data: {
          userId: conciergeUser.id,
          roleId: conciergeRole.id,
        },
      });

      // Asociar conserje con la comunidad
      await prisma.communityAdmin.create({
        data: {
          communityId: community.id,
          userId: conciergeUser.id,
        },
      });

      console.log(
        `✅ Conserje creado para "${community.name}":\n   👤 Nombre: ${conciergeUser.name}\n   📧 Email: ${conciergeUser.email}\n   🔑 Contraseña: ${password}\n`,
      );
      createdCount++;
    }

    console.log('\n📊 Resumen:');
    console.log(`   ✅ Conserjes creados/asociados: ${createdCount}`);
    console.log(`   ⏭️  Conserjes omitidos (ya existían): ${skippedCount}`);
    console.log(`   📋 Total de comunidades procesadas: ${communities.length}\n`);
  } catch (error) {
    console.error('❌ Error creando conserjes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedConcierges()
  .then(() => {
    console.log('✅ Seed de conserjes completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el seed de conserjes:', error);
    process.exit(1);
  });
