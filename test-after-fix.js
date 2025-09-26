// Script para probar después de la corrección
async function testAfterFix() {
  try {
    console.log("🚀 Probando después de la corrección del destructuring...");

    // Login
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

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log("✅ Login exitoso");

    // Crear usuario con datos completos
    const userData = {
      email: "test-fix@comuniapp.com",
      password: "123456",
      name: "Test After Fix",
      phone: "111-222-333",
      organizationId: "cmfub8plc0000pnod3jl14lo4",
      roleName: "RESIDENT",
    };

    console.log("🔍 Enviando datos:", JSON.stringify(userData, null, 2));

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
      console.log("Respuesta:", JSON.stringify(result, null, 2));

      console.log("\n📊 Verificación de campos en respuesta:");
      console.log("- phone presente:", !!result.phone, "valor:", result.phone);
      console.log(
        "- organizationId presente:",
        !!result.organizationId,
        "valor:",
        result.organizationId,
      );
    } else {
      const error = await response.text();
      console.error("❌ Error:", error);
      console.error("Status:", response.status);
    }
  } catch (error) {
    console.error("❌ Error general:", error.message);
  }
}

testAfterFix();
