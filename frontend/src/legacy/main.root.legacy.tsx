import React from "react";
import ReactDOM from "react-dom/client";

const App = () => {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>DHCaaS Frontend</h1>
      <p>Local development environment is running successfully.</p>
    </div>
  );
};

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
