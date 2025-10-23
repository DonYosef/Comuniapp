import {
  PrismaClient,
  RoleName,
  DayOfWeek,
  UnitType,
  UserStatus,
  CommunityType,
  AnnouncementType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestCommunities() {
  console.log('🌱 Creando datos de prueba para comunidades...\n');

  try {
    // Obtener la organización existente
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No se encontró organización. Ejecuta primero el seed principal.');
      return;
    }

    // Obtener roles necesarios
    const communityAdminRole = await prisma.role.findUnique({
      where: { name: RoleName.COMMUNITY_ADMIN },
    });
    const residentRole = await prisma.role.findUnique({
      where: { name: RoleName.RESIDENT },
    });

    if (!communityAdminRole || !residentRole) {
      console.log('❌ No se encontraron los roles necesarios. Ejecuta primero el seed principal.');
      return;
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Datos de las comunidades
    const communitiesData = [
      {
        name: 'Residencial Los Pinos',
        address: 'Av. Principal 123, Col. Centro, Ciudad de México',
        description: 'Residencial moderno con amplias amenidades y excelente ubicación',
        type: CommunityType.CONDOMINIO,
        totalUnits: 60,
        floors: 6,
        unitsPerFloor: 10,
        buildingStructure: {
          floors: 6,
          unitsPerFloor: 10,
          totalUnits: 60,
        },
        constructionYear: 2020,
        email: 'admin@lospinos.com',
        phone: '+52 55 1234 5678',
        website: 'https://lospinos.com',
        spaces: [
          { name: 'Piscina', description: 'Piscina comunitaria con área de descanso', quantity: 1 },
          { name: 'Gimnasio', description: 'Gimnasio equipado con máquinas modernas', quantity: 1 },
          {
            name: 'Salón de Eventos',
            description: 'Salón para celebraciones y reuniones',
            quantity: 1,
          },
          {
            name: 'Cancha de Tenis',
            description: 'Cancha de tenis con superficie profesional',
            quantity: 1,
          },
          { name: 'Parque Infantil', description: 'Área de juegos para niños', quantity: 1 },
          { name: 'Terraza Panorámica', description: 'Terraza con vista panorámica', quantity: 1 },
        ],
        admin: {
          name: 'María González',
          email: 'admin.lospinos@comuniapp.com',
          phone: '+52 55 1111 1111',
        },
        residents: [
          {
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            phone: '+52 55 2222 2222',
            unit: '101',
          },
          {
            name: 'Ana Martínez',
            email: 'ana.martinez@email.com',
            phone: '+52 55 3333 3333',
            unit: '102',
          },
          {
            name: 'Luis García',
            email: 'luis.garcia@email.com',
            phone: '+52 55 4444 4444',
            unit: '201',
          },
          {
            name: 'Sofia López',
            email: 'sofia.lopez@email.com',
            phone: '+52 55 5555 5555',
            unit: '202',
          },
          {
            name: 'Miguel Hernández',
            email: 'miguel.hernandez@email.com',
            phone: '+52 55 6666 6666',
            unit: '301',
          },
          {
            name: 'Elena Ruiz',
            email: 'elena.ruiz@email.com',
            phone: '+52 55 7777 7777',
            unit: '302',
          },
        ],
      },
      {
        name: 'Torres del Sol',
        address: 'Calle del Sol 456, Col. Norte, Ciudad de México',
        description: 'Complejo residencial de lujo con servicios premium',
        type: CommunityType.EDIFICIO,
        totalUnits: 80,
        floors: 8,
        unitsPerFloor: 10,
        buildingStructure: {
          floors: 8,
          unitsPerFloor: 10,
          totalUnits: 80,
        },
        constructionYear: 2018,
        email: 'admin@torresdelsol.com',
        phone: '+52 55 9876 5432',
        website: 'https://torresdelsol.com',
        spaces: [
          {
            name: 'Piscina Olímpica',
            description: 'Piscina de tamaño olímpico con jacuzzi',
            quantity: 1,
          },
          {
            name: 'Centro de Fitness',
            description: 'Gimnasio completo con entrenador personal',
            quantity: 1,
          },
          {
            name: 'Salón de Usos Múltiples',
            description: 'Salón para eventos y reuniones',
            quantity: 1,
          },
          {
            name: 'Cancha de Fútbol',
            description: 'Cancha de fútbol 7 con césped sintético',
            quantity: 1,
          },
          {
            name: 'Biblioteca Comunitaria',
            description: 'Espacio de lectura y estudio',
            quantity: 1,
          },
          {
            name: 'Sala de Juegos',
            description: 'Sala con mesa de billar y ping pong',
            quantity: 1,
          },
          { name: 'Área de Barbacoa', description: 'Zona de asados con parrillas', quantity: 1 },
          { name: 'Spa y Sauna', description: 'Área de relajación con sauna', quantity: 1 },
        ],
        admin: {
          name: 'Roberto Silva',
          email: 'admin.torresdelsol@comuniapp.com',
          phone: '+52 55 8888 8888',
        },
        residents: [
          {
            name: 'Patricia Morales',
            email: 'patricia.morales@email.com',
            phone: '+52 55 9999 9999',
            unit: '101',
          },
          {
            name: 'Fernando Castro',
            email: 'fernando.castro@email.com',
            phone: '+52 55 0000 0000',
            unit: '102',
          },
          {
            name: 'Isabel Vargas',
            email: 'isabel.vargas@email.com',
            phone: '+52 55 1111 2222',
            unit: '201',
          },
          {
            name: 'Diego Mendoza',
            email: 'diego.mendoza@email.com',
            phone: '+52 55 3333 4444',
            unit: '202',
          },
          {
            name: 'Carmen Flores',
            email: 'carmen.flores@email.com',
            phone: '+52 55 5555 6666',
            unit: '301',
          },
          {
            name: 'Alejandro Torres',
            email: 'alejandro.torres@email.com',
            phone: '+52 55 7777 8888',
            unit: '302',
          },
          {
            name: 'Valentina Jiménez',
            email: 'valentina.jimenez@email.com',
            phone: '+52 55 9999 0000',
            unit: '401',
          },
          {
            name: 'Ricardo Navarro',
            email: 'ricardo.navarro@email.com',
            phone: '+52 55 1111 3333',
            unit: '402',
          },
        ],
      },
    ];

    for (const communityData of communitiesData) {
      console.log(`\n🏢 Creando comunidad: ${communityData.name}`);

      // Crear comunidad
      const community = await prisma.community.create({
        data: {
          name: communityData.name,
          address: communityData.address,
          description: communityData.description,
          type: communityData.type,
          totalUnits: communityData.totalUnits,
          floors: communityData.floors,
          unitsPerFloor: communityData.unitsPerFloor,
          buildingStructure: communityData.buildingStructure,
          constructionYear: communityData.constructionYear,
          email: communityData.email,
          phone: communityData.phone,
          website: communityData.website,
          isActive: true,
          createdById: (await prisma.user.findFirst())?.id || '',
          organizationId: organization.id,
        },
      });

      console.log(`   ✅ Comunidad creada: ${community.name}`);

      // Crear administrador de la comunidad
      const adminUser = await prisma.user.create({
        data: {
          email: communityData.admin.email,
          name: communityData.admin.name,
          phone: communityData.admin.phone,
          passwordHash: hashedPassword,
          status: UserStatus.ACTIVE,
          isActive: true,
          organizationId: organization.id,
        },
      });

      // Asignar rol de administrador de comunidad
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: communityAdminRole.id,
        },
      });

      // Asignar como administrador de la comunidad
      await prisma.communityAdmin.create({
        data: {
          communityId: community.id,
          userId: adminUser.id,
        },
      });

      console.log(`   ✅ Admin creado: ${adminUser.name} (${adminUser.email})`);

      // Crear unidades
      console.log(`   🏠 Creando unidades...`);
      for (let floor = 1; floor <= communityData.floors; floor++) {
        for (let unit = 1; unit <= communityData.unitsPerFloor; unit++) {
          const unitNumber = `${floor}${unit.toString().padStart(2, '0')}`;
          await prisma.unit.create({
            data: {
              number: unitNumber,
              floor: floor.toString(),
              type: UnitType.APARTMENT,
              coefficient: 1.0,
              isActive: true,
              communityId: community.id,
            },
          });
        }
      }
      console.log(`   ✅ ${communityData.totalUnits} unidades creadas`);

      // Crear espacios comunes
      console.log(`   🏊 Creando espacios comunes...`);
      for (const spaceData of communityData.spaces) {
        const space = await prisma.communityCommonSpace.create({
          data: {
            name: spaceData.name,
            description: spaceData.description,
            quantity: spaceData.quantity,
            isActive: true,
            communityId: community.id,
          },
        });

        // Crear horarios para cada espacio
        const schedules = [
          { day: DayOfWeek.MONDAY, start: '06:00', end: '22:00' },
          { day: DayOfWeek.TUESDAY, start: '06:00', end: '22:00' },
          { day: DayOfWeek.WEDNESDAY, start: '06:00', end: '22:00' },
          { day: DayOfWeek.THURSDAY, start: '06:00', end: '22:00' },
          { day: DayOfWeek.FRIDAY, start: '06:00', end: '22:00' },
          { day: DayOfWeek.SATURDAY, start: '08:00', end: '20:00' },
          { day: DayOfWeek.SUNDAY, start: '08:00', end: '20:00' },
        ];

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

        console.log(`     ✅ ${spaceData.name} creado con horarios`);
      }

      // Crear residentes
      console.log(`   👥 Creando residentes...`);
      for (const residentData of communityData.residents) {
        const residentUser = await prisma.user.create({
          data: {
            email: residentData.email,
            name: residentData.name,
            phone: residentData.phone,
            passwordHash: hashedPassword,
            status: UserStatus.ACTIVE,
            isActive: true,
            organizationId: organization.id,
          },
        });

        // Asignar rol de residente
        await prisma.userRole.create({
          data: {
            userId: residentUser.id,
            roleId: residentRole.id,
          },
        });

        // Buscar la unidad correspondiente
        const unit = await prisma.unit.findFirst({
          where: {
            communityId: community.id,
            number: residentData.unit,
          },
        });

        if (unit) {
          // Asignar usuario a la unidad
          await prisma.userUnit.create({
            data: {
              userId: residentUser.id,
              unitId: unit.id,
              status: 'CONFIRMED',
              confirmedAt: new Date(),
            },
          });

          console.log(`     ✅ ${residentUser.name} asignado a unidad ${residentData.unit}`);
        }
      }

      // Crear algunos avisos de ejemplo
      console.log(`   📢 Creando avisos de ejemplo...`);
      const announcements = [
        {
          title: 'Bienvenida a la Comunidad',
          content: `¡Bienvenidos a ${communityData.name}!\n\nEs un placer darles la bienvenida a nuestra comunidad. Esperamos que disfruten de todas las amenidades y servicios que tenemos para ofrecer.\n\nPara cualquier consulta o sugerencia, no duden en contactarnos.\n\n¡Que tengan un excelente día!`,
          type: AnnouncementType.GENERAL,
        },
        {
          title: 'Mantenimiento de Piscina',
          content:
            'Se realizará mantenimiento de la piscina el próximo lunes de 8:00 AM a 2:00 PM. Durante este tiempo la piscina estará cerrada.\n\nGracias por su comprensión.',
          type: AnnouncementType.MAINTENANCE,
        },
        {
          title: 'Reunión de Copropietarios',
          content:
            'Se convoca a reunión de copropietarios el próximo sábado a las 10:00 AM en el salón de eventos.\n\nAgenda:\n- Presupuesto anual\n- Mejoras en áreas comunes\n- Consultas y sugerencias',
          type: AnnouncementType.GENERAL,
        },
      ];

      for (const announcementData of announcements) {
        await prisma.announcement.create({
          data: {
            communityId: community.id,
            createdById: adminUser.id,
            title: announcementData.title,
            content: announcementData.content,
            type: announcementData.type,
            isActive: true,
          },
        });
      }

      console.log(`   ✅ ${announcements.length} avisos creados`);
    }

    console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
    console.log('\n📋 Resumen de datos creados:');
    console.log('   🏢 2 comunidades completas');
    console.log('   👨‍💼 2 administradores de comunidad');
    console.log('   👥 14 residentes');
    console.log('   🏠 140 unidades');
    console.log('   🏊 14 espacios comunes con horarios');
    console.log('   📢 6 avisos de ejemplo');
    console.log('\n🔑 Credenciales de acceso:');
    console.log('   Contraseña para todos los usuarios: 123456');
    console.log('\n👨‍💼 Administradores:');
    console.log('   - admin.lospinos@comuniapp.com (Residencial Los Pinos)');
    console.log('   - admin.torresdelsol@comuniapp.com (Torres del Sol)');
    console.log('\n👥 Residentes (algunos ejemplos):');
    console.log('   - carlos.rodriguez@email.com');
    console.log('   - ana.martinez@email.com');
    console.log('   - patricia.morales@email.com');
    console.log('   - fernando.castro@email.com');
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
  }
}

seedTestCommunities()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
