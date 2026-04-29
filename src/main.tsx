import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installWebRtcDiagnostics } from "./webrtcDiagnostics";
import "./styles.css";

installWebRtcDiagnostics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
