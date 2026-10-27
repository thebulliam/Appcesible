import { useEffect, useRef } from "react";

const APP = "Accesible Desk";

// Encabezado principal de cada pantalla: recibe el foco al abrirse y actualiza el título de la pestaña
export default function PageTitle({ children }) {
  const ref = useRef(null);
  useEffect(() => {
    document.title = children === APP ? APP : `${children} · ${APP}`;
    if (ref.current) ref.current.focus();
  }, [children]);
  return (
    <h1 ref={ref} tabIndex={-1}>
      {children}
    </h1>
  );
}
