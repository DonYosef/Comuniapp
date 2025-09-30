export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold gradient-title-primary mb-8">Términos y Condiciones</h1>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-gray-700 mb-6">
              Al acceder y utilizar Comuniapp, usted acepta estar sujeto a estos términos y
              condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, no debe
              utilizar nuestro servicio.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Descripción del Servicio
            </h2>
            <p className="text-gray-700 mb-6">
              Comuniapp es una plataforma de gestión de comunidades que permite administrar
              usuarios, roles, pagos, comunicaciones, encomiendas, reservas de espacios comunes,
              incidencias y control de acceso.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Uso Aceptable</h2>
            <p className="text-gray-700 mb-6">
              Usted se compromete a utilizar Comuniapp únicamente para fines legales y de acuerdo
              con estos términos. No debe utilizar el servicio para actividades ilegales,
              fraudulentas o que puedan dañar a otros usuarios.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cuentas de Usuario</h2>
            <p className="text-gray-700 mb-6">
              Para utilizar Comuniapp, debe crear una cuenta proporcionando información precisa y
              actualizada. Es responsable de mantener la confidencialidad de su contraseña y de
              todas las actividades que ocurran bajo su cuenta.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Privacidad</h2>
            <p className="text-gray-700 mb-6">
              Su privacidad es importante para nosotros. Consulte nuestra Política de Privacidad
              para entender cómo recopilamos, utilizamos y protegemos su información.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Modificaciones</h2>
            <p className="text-gray-700 mb-6">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Las
              modificaciones entrarán en vigor inmediatamente después de su publicación en el sitio
              web.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contacto</h2>
            <p className="text-gray-700 mb-6">
              Si tiene preguntas sobre estos términos y condiciones, puede contactarnos a través de
              admin@comuniapp.com
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/register"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Volver al Registro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
