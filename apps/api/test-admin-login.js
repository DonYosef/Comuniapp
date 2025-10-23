async function testAdminLogin() {
  try {
    console.log('🔐 Probando login con usuario admin...');

    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@comuniapp.com',
        password: 'contrasegura321',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('❌ Error en login:');
      console.log('Status:', response.status);
      console.log('Mensaje:', errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ Login exitoso!');
    console.log('📧 Usuario:', data.user.email);
    console.log('👤 Nombre:', data.user.name);
    console.log('🔑 Token:', data.accessToken.substring(0, 50) + '...');
    console.log(
      '🎭 Roles:',
      data.user.roles.map((r) => r.name),
    );
    console.log('🏢 Organización:', data.user.organizationId);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(
        '❌ No se puede conectar al servidor. Asegúrate de que esté ejecutándose en el puerto 3001',
      );
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAdminLogin();
