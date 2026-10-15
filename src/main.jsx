import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Hero from "./Hero";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Hero />
  </React.StrictMode>
);
