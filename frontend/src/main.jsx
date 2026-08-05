/** Module entry point for the IntelBox React app.
 *
 *  Fonts are bundled rather than fetched from a CDN -- IntelBox is self-hosted
 *  with no telemetry, and it should not phone a third party to render. */

import React from "react";
import ReactDOM from "react-dom/client";

import "@fontsource-variable/schibsted-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource-variable/source-serif-4";

import "./styles/tokens.css";
import "./styles/base.css";

import App from "./App";
import { initTheme } from "./theme/theme";

initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
