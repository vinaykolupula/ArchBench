import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import { ArchBenchProvider } from "./context/ArchBenchContext.js";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root DOM element #root not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ArchBenchProvider>
      <App />
    </ArchBenchProvider>
  </React.StrictMode>
);

