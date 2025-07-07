import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function HomePage() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    try {
      const response = await api.get('/servicios');
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-texto-principal">Cargando...</div>
      </div>
    );
  }

  return (
    <>
      <section className="relative h-screen flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/hero-background.webp)',
          }}
        >
          <div className="absolute inset-0 bg-black opacity-70"></div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 text-center px-4 animate-fade-in">
          <h1 className="mb-6 text-acento">
            Barbería Premium
          </h1>
          <p className="text-xl md:text-2xl text-texto-principal mb-10 max-w-2xl mx-auto">
            Donde el estilo clásico se encuentra con la elegancia moderna
          </p>
          <Link
            to="/reservar"
            className="inline-block bg-acento hover:bg-acento-hover text-fondo px-10 py-4 rounded-lg text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Reservar Cita
          </Link>
        </div>
      </section>

      {/* Servicios Section */}
      <section className="py-20 px-4" id="servicios">
        <div className="container mx-auto">
          <h2 className="text-center mb-16 text-acento animate-fade-in-up">
            Nuestros Servicios
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servicios.map((servicio, index) => (
              <div
                key={servicio.id}
                className="bg-zinc-900 rounded-lg p-8 hover:bg-zinc-800 transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <h3 className="text-2xl mb-4 text-acento">
                  {servicio.nombre}
                </h3>
                <p className="mb-6">
                  {servicio.descripcion || 'Servicio profesional de barbería con los mejores estándares de calidad'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-acento">
                    €{servicio.precio}
                  </span>
                  <span className="text-texto-secundario">
                    {servicio.duracion_minutos} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestro Espacio Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h2 className="mb-8 text-acento">Un Espacio Único</h2>
              <p className="text-lg leading-relaxed mb-6">
                Nuestra barbería combina la tradición del oficio clásico con un ambiente moderno y sofisticado.
                Cada detalle ha sido cuidadosamente seleccionado para crear una experiencia única y memorable.
              </p>
              <p className="text-lg leading-relaxed">
                Desde el momento en que cruzas nuestra puerta, te sumergirás en un ambiente donde
                el tiempo se detiene y el cuidado personal se convierte en un ritual de excelencia.
              </p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <img
                src="/images/barberia-interior.webp"
                alt="Interior de la barbería con sillones de cuero y espejos iluminados"
                className="rounded-lg shadow-2xl w-full h-[500px] object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Horario Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="mb-12 text-acento animate-fade-in-up">Horario de Atención</h2>
          <div className="bg-zinc-900 rounded-lg p-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-semibold text-texto-principal">Lunes a Viernes</span>
                <span className="text-acento">9:00 - 20:00</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-semibold text-texto-principal">Sábados</span>
                <span className="text-acento">10:00 - 18:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-texto-principal">Domingos</span>
                <span className="text-texto-secundario">Cerrado</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;