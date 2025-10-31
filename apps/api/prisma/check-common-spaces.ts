import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndCreateCommonSpaces() {
  try {
    console.log('🔍 Verificando espacios comunes en la base de datos...\n');

    // Obtener todas las comunidades activas
    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Total de comunidades activas: ${communities.length}\n`);

    if (communities.length === 0) {
      console.log('⚠️ No hay comunidades activas en la base de datos.');
      return;
    }

    // Verificar espacios comunes para cada comunidad
    for (const community of communities) {
      console.log(`\n🏢 Comunidad: ${community.name} (ID: ${community.id})`);
      console.log('─'.repeat(60));

      const existingSpaces = await prisma.communityCommonSpace.findMany({
        where: {
          communityId: community.id,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          quantity: true,
        },
      });

      console.log(`   Espacios comunes existentes: ${existingSpaces.length}`);

      if (existingSpaces.length > 0) {
        existingSpaces.forEach((space) => {
          console.log(`   ✓ ${space.name} (Cantidad: ${space.quantity})`);
        });
      } else {
        console.log('   ⚠️ No hay espacios comunes activos en esta comunidad.');
        console.log('   📝 Creando espacios comunes de ejemplo...\n');

        const defaultSpaces = [
          {
            name: 'Salón de Usos Múltiples',
            description: 'Salón para reuniones, celebraciones y eventos comunitarios',
            quantity: 1,
          },
          {
            name: 'Gimnasio',
            description: 'Gimnasio equipado con máquinas cardiovasculares y de pesas',
            quantity: 1,
          },
          {
            name: 'Piscina',
            description: 'Piscina comunitaria con área de descanso y duchas',
            quantity: 1,
          },
          {
            name: 'Cancha de Fútbol',
            description: 'Cancha de fútbol 7 con césped sintético e iluminación',
            quantity: 1,
          },
          {
            name: 'Área de Barbacoa',
            description: 'Zona de asados con parrillas y mesas para picnic',
            quantity: 1,
          },
        ];

        for (const spaceData of defaultSpaces) {
          try {
            const space = await prisma.communityCommonSpace.create({
              data: {
                name: spaceData.name,
                description: spaceData.description,
                quantity: spaceData.quantity,
                isActive: true,
                communityId: community.id,
              },
            });
            console.log(`   ✅ Creado: ${space.name}`);
          } catch (error: any) {
            if (error.code === 'P2002') {
              console.log(`   ⚠️ Ya existe: ${spaceData.name}`);
            } else {
              console.error(`   ❌ Error creando ${spaceData.name}:`, error.message);
            }
          }
        }
      }

      // Verificar unidades activas
      const units = await prisma.unit.findMany({
        where: {
          communityId: community.id,
          isActive: true,
        },
        select: {
          id: true,
          number: true,
        },
      });

      console.log(`\n   🏠 Unidades activas: ${units.length}`);
      if (units.length > 0) {
        const unitsWithResidents = await prisma.unit.findMany({
          where: {
            communityId: community.id,
            isActive: true,
            userUnits: {
              some: {
                status: 'CONFIRMED',
              },
            },
          },
          select: {
            id: true,
            number: true,
          },
        });
        console.log(`   👥 Unidades con residentes confirmados: ${unitsWithResidents.length}`);
      }
    }

    console.log('\n✅ Verificación completada.\n');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndCreateCommonSpaces();
