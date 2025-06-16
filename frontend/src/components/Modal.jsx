

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    // Fondo oscuro semi-transparente
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose} // Cierra el modal al hacer clic fuera
    >
      {/* Contenedor del modal */}
      <div 
        className="bg-white p-8 rounded-lg shadow-xl text-center relative"
        onClick={e => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        {/* Botón para cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;