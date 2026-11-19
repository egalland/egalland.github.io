import { createRoot } from "react-dom/client";
import Configurateur from "./page";
import "./globals.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<Configurateur />);
