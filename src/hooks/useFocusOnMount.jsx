import { useEffect, useRef } from "react";

// Devuelve una ref para un encabezado (con tabIndex -1) que recibe el foco al aparecer
export default function useFocusOnMount() {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.focus();
  }, []);
  return ref;
}
