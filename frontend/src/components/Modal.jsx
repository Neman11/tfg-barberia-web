function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    // Fondo oscuro semi-transparente
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose} // Cierra el modal al hacer clic fuera
    >
      {/* Contenedor del modal */}
      <div 
        className="bg-zinc-900 p-8 rounded-lg shadow-2xl text-center relative"
        onClick={e => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        {/* Botón para cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-texto-secundario hover:text-texto-principal text-2xl transition-colors"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;

