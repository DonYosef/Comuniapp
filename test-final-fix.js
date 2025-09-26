// Script final para verificar la corrección
async function testFinalFix() {
  try {
    console.log("🚀 Probando después del reinicio del backend...");

    // Esperar un poco para que el backend se inicie
    console.log("⏳ Esperando a que el backend se inicie...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Login
    console.log("🔐 Intentando login...");
    const loginResponse = await fetch("http://localhost:3001/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@comuniapp.com",
        password: "contrasegura321",
      }),
    });

    if (!loginResponse.ok) {
      console.log("⏳ Backend aún no está listo, esperando más...");
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const retryLogin = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "admin@comuniapp.com",
          password: "contrasegura321",
        }),
      });

      if (!retryLogin.ok) {
        console.error("❌ Backend no responde después de esperar");
        return;
      }

      const loginData = await retryLogin.json();
      var token = loginData.accessToken;
    } else {
      const loginData = await loginResponse.json();
      var token = loginData.accessToken;
    }

    console.log("✅ Login exitoso");

    // Crear usuario con datos completos para probar la corrección
    const userData = {
      email: "test-final-fix@comuniapp.com",
      password: "123456",
      name: "Test Final Fix",
      phone: "+34 999 888 777",
      organizationId: "cmfub8plc0000pnod3jl14lo4",
      roleName: "RESIDENT",
      unitId: "cmfub9f3c0002rvxtidegk3o5",
    };

    console.log(
      "🔍 Enviando datos con TODOS los campos:",
      JSON.stringify(userData, null, 2),
    );

    const response = await fetch("http://localhost:3001/users", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Usuario creado exitosamente");
      console.log("📊 Respuesta del backend:", JSON.stringify(result, null, 2));

      console.log("\n🎯 VERIFICACIÓN FINAL:");
      console.log("- phone en respuesta:", result.phone || "NO PRESENTE");
      console.log(
        "- organizationId en respuesta:",
        result.organizationId || "NO PRESENTE",
      );

      if (result.phone && result.organizationId) {
        console.log("\n🎉 ¡ÉXITO! Los campos se están guardando correctamente");
      } else {
        console.log(
          "\n⚠️ Los campos aún no aparecen en la respuesta, pero pueden estar en BD",
        );
        console.log("💡 Verifica la consola del backend para logs detallados");
      }
    } else {
      const error = await response.text();
      console.error("❌ Error al crear usuario:", error);
      console.error("Status:", response.status);
    }
  } catch (error) {
    console.error("❌ Error general:", error.message);
  }
}

testFinalFix();
