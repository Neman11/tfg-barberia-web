import { useState } from 'react';

function ContactPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Mensaje enviado (funcionalidad no implementada)');
    setFormData({ nombre: '', email: '', mensaje: '' });
  };

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-5xl font-playfair font-bold mb-16 text-center text-acento animate-fade-in">
          Contacto
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-playfair mb-8 text-acento">Encuéntranos</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-texto-principal mb-2">Dirección</h3>
                <p className="text-texto-secundario">
                  Campus de Vicálvaro<br />
                  Universidad Rey Juan Carlos<br />
                  Paseo de los Artilleros, 18<br />
                  28032 Madrid, España
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-texto-principal mb-2">Teléfono</h3>
                <p className="text-texto-secundario">
                  <a href="tel:+34912345678" className="hover:text-acento transition-colors">
                    +34 91 234 56 78
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-texto-principal mb-2">Email</h3>
                <p className="text-texto-secundario">
                  <a href="mailto:info@barberiapremium.com" className="hover:text-acento transition-colors">
                    info@barberiapremium.com
                  </a>
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-texto-principal mb-2">Horario</h3>
                <p className="text-texto-secundario">
                  Lunes a Viernes: 9:00 - 20:00<br />
                  Sábados: 10:00 - 18:00<br />
                  Domingos: Cerrado
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="bg-zinc-900 p-8 rounded-lg shadow-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-playfair mb-6 text-acento">Envíanos un mensaje</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-texto-principal">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-texto-principal">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-texto-principal">
                  Mensaje
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-md focus:ring-2 focus:ring-acento focus:border-transparent text-texto-principal resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-acento hover:bg-acento-hover text-fondo rounded-md font-semibold transition-all duration-300 transform hover:scale-[1.02]"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl font-playfair mb-8 text-center text-acento">Nuestra Ubicación</h2>
          <div className="w-full h-96 bg-zinc-900 rounded-lg overflow-hidden shadow-xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1801.908680275756!2d-3.6112586303475593!3d40.406085019425554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd422565721d7127%3A0xa5f359b54179c57b!2sUniversidad%20Rey%20Juan%20Carlos%20(URJC)%20Campus%20de%20Vic%C3%A1lvaro!5e1!3m2!1ses!2ses!4v1750523220196!5m2!1ses!2ses" // <-- Tu URL de "Insertar un mapa"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación Barbería - URJC Vicálvaro"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;