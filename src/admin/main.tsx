import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AlmacenConectaApp } from "./AlmacenConectaApp";
import "./almacen.css";
import "./almacen-premium.css";

const root = document.getElementById("almacen-root");
if (!root) throw new Error("No se encontró el contenedor de Almacén CONECTA.");

createRoot(root).render(
  <StrictMode>
    <AlmacenConectaApp />
  </StrictMode>,
);
