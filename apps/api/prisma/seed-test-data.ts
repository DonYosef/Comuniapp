import { PrismaClient, DayOfWeek, AnnouncementType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Agregando datos de prueba para el chatbot...\n');

  try {
    // 1. Obtener la organización existente
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No se encontró organización. Ejecuta primero el seed principal.');
      return;
    }

    // 2. Obtener una comunidad existente o crear una
    let community = await prisma.community.findFirst();
    let adminUser = await prisma.user.findFirst();

    if (!adminUser) {
      console.log('❌ No se encontró usuario administrador. Ejecuta primero el seed principal.');
      return;
    }

    if (!community) {
      community = await prisma.community.create({
        data: {
          name: 'Residencial Villa del Sol',
          address: 'Calle de las Flores 456, Col. Centro, Ciudad de México',
          description: 'Residencial de lujo con amplias amenidades y excelente ubicación',
          isActive: true,
          createdById: adminUser.id,
          organizationId: organization.id,
          type: 'CONDOMINIO',
          totalUnits: 120,
          floors: 8,
          unitsPerFloor: 15,
          constructionYear: 2020,
          email: 'admin@villasol.com',
          phone: '+52 55 1234-5678',
          website: 'www.villasol.com',
        },
      });
      console.log('✅ Residencial Villa del Sol creada');
    } else {
      console.log(`✅ Usando residencia existente: ${community.name}`);
    }

    // 3. Crear espacios comunes típicos de residencia
    const commonSpaces = [
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
        name: 'Cancha de Tenis',
        description: 'Cancha de tenis con superficie de cemento e iluminación',
        quantity: 1,
      },
      {
        name: 'Parque Infantil',
        description: 'Área de juegos infantiles con columpios y toboganes',
        quantity: 1,
      },
      {
        name: 'Área de Barbacoa',
        description: 'Zona de asados con parrillas y mesas para picnic',
        quantity: 1,
      },
      {
        name: 'Sala de Juegos',
        description: 'Sala con mesa de billar, ping pong y juegos de mesa',
        quantity: 1,
      },
      {
        name: 'Biblioteca Comunitaria',
        description: 'Espacio de lectura y estudio con libros y revistas',
        quantity: 1,
      },
      {
        name: 'Terraza Panorámica',
        description: 'Terraza en el último piso con vista panorámica de la ciudad',
        quantity: 1,
      },
    ];

    console.log('🏢 Creando espacios comunes...');
    for (const spaceData of commonSpaces) {
      const existingSpace = await prisma.communityCommonSpace.findFirst({
        where: {
          communityId: community.id,
          name: spaceData.name,
        },
      });

      if (!existingSpace) {
        const space = await prisma.communityCommonSpace.create({
          data: {
            ...spaceData,
            communityId: community.id,
            isActive: true,
          },
        });

        // Crear horarios específicos según el tipo de espacio
        let schedules = [];

        if (spaceData.name.includes('Gimnasio') || spaceData.name.includes('Piscina')) {
          // Gimnasio y piscina: horarios extendidos
          schedules = [
            { day: DayOfWeek.MONDAY, start: '05:00', end: '23:00' },
            { day: DayOfWeek.TUESDAY, start: '05:00', end: '23:00' },
            { day: DayOfWeek.WEDNESDAY, start: '05:00', end: '23:00' },
            { day: DayOfWeek.THURSDAY, start: '05:00', end: '23:00' },
            { day: DayOfWeek.FRIDAY, start: '05:00', end: '23:00' },
            { day: DayOfWeek.SATURDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.SUNDAY, start: '06:00', end: '22:00' },
          ];
        } else if (spaceData.name.includes('Cancha')) {
          // Canchas deportivas: horarios deportivos
          schedules = [
            { day: DayOfWeek.MONDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.TUESDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.WEDNESDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.THURSDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.FRIDAY, start: '06:00', end: '22:00' },
            { day: DayOfWeek.SATURDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.SUNDAY, start: '07:00', end: '21:00' },
          ];
        } else if (spaceData.name.includes('Parque Infantil')) {
          // Parque infantil: horarios diurnos
          schedules = [
            { day: DayOfWeek.MONDAY, start: '08:00', end: '19:00' },
            { day: DayOfWeek.TUESDAY, start: '08:00', end: '19:00' },
            { day: DayOfWeek.WEDNESDAY, start: '08:00', end: '19:00' },
            { day: DayOfWeek.THURSDAY, start: '08:00', end: '19:00' },
            { day: DayOfWeek.FRIDAY, start: '08:00', end: '19:00' },
            { day: DayOfWeek.SATURDAY, start: '09:00', end: '20:00' },
            { day: DayOfWeek.SUNDAY, start: '09:00', end: '20:00' },
          ];
        } else if (spaceData.name.includes('Biblioteca')) {
          // Biblioteca: horarios de estudio
          schedules = [
            { day: DayOfWeek.MONDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.TUESDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.WEDNESDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.THURSDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.FRIDAY, start: '07:00', end: '21:00' },
            { day: DayOfWeek.SATURDAY, start: '08:00', end: '20:00' },
            { day: DayOfWeek.SUNDAY, start: '08:00', end: '20:00' },
          ];
        } else {
          // Otros espacios: horarios estándar
          schedules = [
            { day: DayOfWeek.MONDAY, start: '08:00', end: '22:00' },
            { day: DayOfWeek.TUESDAY, start: '08:00', end: '22:00' },
            { day: DayOfWeek.WEDNESDAY, start: '08:00', end: '22:00' },
            { day: DayOfWeek.THURSDAY, start: '08:00', end: '22:00' },
            { day: DayOfWeek.FRIDAY, start: '08:00', end: '22:00' },
            { day: DayOfWeek.SATURDAY, start: '09:00', end: '21:00' },
            { day: DayOfWeek.SUNDAY, start: '09:00', end: '21:00' },
          ];
        }

        for (const scheduleData of schedules) {
          await prisma.spaceSchedule.create({
            data: {
              commonSpaceId: space.id,
              dayOfWeek: scheduleData.day,
              startTime: scheduleData.start,
              endTime: scheduleData.end,
              isActive: true,
            },
          });
        }

        console.log(`   ✅ ${spaceData.name} creado con horarios`);
      } else {
        console.log(`   ⚠️  ${spaceData.name} ya existe`);
      }
    }

    // 4. Crear avisos comunitarios
    const announcements = [
      {
        title: 'Mantenimiento de Piscina',
        content:
          'Se realizará mantenimiento de la piscina el próximo lunes de 8:00 AM a 2:00 PM. Durante este tiempo la piscina estará cerrada.',
        type: AnnouncementType.MAINTENANCE,
        publishedAt: new Date(),
      },
      {
        title: 'Reunión de Copropietarios',
        content:
          'Se convoca a reunión de copropietarios el próximo sábado 15 de octubre a las 10:00 AM en el salón de eventos.',
        type: AnnouncementType.GENERAL,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 día atrás
      },
      {
        title: 'Nuevo Sistema de Seguridad',
        content:
          'Se ha instalado un nuevo sistema de cámaras de seguridad en las áreas comunes. Los residentes pueden acceder a las grabaciones solicitándolo en conserjería.',
        type: AnnouncementType.SECURITY,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
      },
      {
        title: 'Fiesta de Halloween',
        content:
          '¡Únete a nuestra fiesta de Halloween! El 31 de octubre a las 6:00 PM en el área de juegos infantiles. Habrá concursos, premios y mucha diversión para toda la familia.',
        type: AnnouncementType.SOCIAL,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 días atrás
      },
      {
        title: 'Corte de Agua Programado',
        content:
          'El próximo miércoles de 9:00 AM a 12:00 PM se realizará mantenimiento en el sistema de agua. Se recomienda almacenar agua para uso personal.',
        type: AnnouncementType.URGENT,
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 días atrás
      },
    ];

    console.log('\n📢 Creando avisos comunitarios...');
    for (const announcementData of announcements) {
      const existingAnnouncement = await prisma.announcement.findFirst({
        where: {
          communityId: community.id,
          title: announcementData.title,
        },
      });

      if (!existingAnnouncement) {
        await prisma.announcement.create({
          data: {
            ...announcementData,
            communityId: community.id,
            createdById: adminUser.id,
            isActive: true,
          },
        });
        console.log(`   ✅ ${announcementData.title}`);
      } else {
        console.log(`   ⚠️  ${announcementData.title} ya existe`);
      }
    }

    // 5. Crear algunos gastos comunes de ejemplo
    console.log('\n💰 Creando gastos comunes de ejemplo...');
    const expenseCategories = [
      { name: 'Mantenimiento', description: 'Gastos de mantenimiento general' },
      { name: 'Limpieza', description: 'Servicios de limpieza' },
      { name: 'Seguridad', description: 'Servicios de seguridad' },
      { name: 'Administración', description: 'Gastos administrativos' },
    ];

    for (const categoryData of expenseCategories) {
      const existingCategory = await prisma.expenseCategory.findFirst({
        where: {
          communityId: community.id,
          name: categoryData.name,
        },
      });

      if (!existingCategory) {
        await prisma.expenseCategory.create({
          data: {
            ...categoryData,
            communityId: community.id,
            isActive: true,
          },
        });
        console.log(`   ✅ Categoría ${categoryData.name} creada`);
      }
    }

    console.log('\n🎉 ¡Datos de prueba agregados exitosamente!');
    console.log('\n📋 Resumen de datos creados:');
    console.log('   🏢 5 espacios comunes con horarios');
    console.log('   📢 5 avisos comunitarios');
    console.log('   💰 4 categorías de gastos');
    console.log('\n🤖 Ahora puedes probar el chatbot con:');
    console.log('   - "espacios comunes"');
    console.log('   - "avisos"');
    console.log('   - "funciones del sistema"');
  } catch (error) {
    console.error('❌ Error agregando datos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
