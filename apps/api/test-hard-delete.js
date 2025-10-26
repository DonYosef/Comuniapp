const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testHardDelete() {
  try {
    console.log('🧪 Probando funcionalidad de Hard Delete para avisos...\n');

    // 1. Mostrar avisos actuales
    console.log('📋 AVISOS ANTES DE LA ELIMINACIÓN:');
    console.log('='.repeat(60));

    const announcementsBefore = await prisma.announcement.findMany({
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Total de avisos: ${announcementsBefore.length}`);
    announcementsBefore.forEach((announcement, index) => {
      console.log(
        `${index + 1}. ${announcement.title} - ${announcement.community.name} (ID: ${announcement.id})`,
      );
    });

    if (announcementsBefore.length === 0) {
      console.log('❌ No hay avisos para probar la eliminación');
      return;
    }

    // 2. Seleccionar el primer aviso para eliminar
    const announcementToDelete = announcementsBefore[0];
    console.log(
      `\n🗑️ Eliminando aviso: "${announcementToDelete.title}" (ID: ${announcementToDelete.id})`,
    );

    // 3. Simular la eliminación usando el servicio (hard delete)
    console.log('\n⚡ Ejecutando hard delete...');

    const deletedAnnouncement = await prisma.announcement.delete({
      where: { id: announcementToDelete.id },
    });

    console.log('✅ Aviso eliminado exitosamente de la base de datos');
    console.log(`   Título eliminado: ${deletedAnnouncement.title}`);
    console.log(`   ID eliminado: ${deletedAnnouncement.id}`);

    // 4. Verificar que el aviso ya no existe
    console.log('\n🔍 Verificando que el aviso fue eliminado completamente...');

    const announcementsAfter = await prisma.announcement.findMany({
      include: {
        community: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`\n📋 AVISOS DESPUÉS DE LA ELIMINACIÓN:`);
    console.log('='.repeat(60));
    console.log(`Total de avisos: ${announcementsAfter.length}`);

    announcementsAfter.forEach((announcement, index) => {
      console.log(
        `${index + 1}. ${announcement.title} - ${announcement.community.name} (ID: ${announcement.id})`,
      );
    });

    // 5. Verificar que el aviso eliminado no aparece
    const deletedAnnouncementExists = announcementsAfter.find(
      (ann) => ann.id === announcementToDelete.id,
    );

    if (deletedAnnouncementExists) {
      console.log('\n❌ ERROR: El aviso eliminado aún aparece en la base de datos');
    } else {
      console.log('\n✅ CONFIRMADO: El aviso fue eliminado completamente de la base de datos');
    }

    // 6. Estadísticas finales
    console.log('\n📊 ESTADÍSTICAS:');
    console.log(`   Avisos antes: ${announcementsBefore.length}`);
    console.log(`   Avisos después: ${announcementsAfter.length}`);
    console.log(`   Diferencia: ${announcementsBefore.length - announcementsAfter.length}`);

    if (announcementsBefore.length - announcementsAfter.length === 1) {
      console.log('✅ Hard delete funcionando correctamente');
    } else {
      console.log('❌ Problema con el hard delete');
    }
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error('Detalles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
testHardDelete();
