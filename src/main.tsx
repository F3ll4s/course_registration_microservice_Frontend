import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css"; // Tailwind + shadcn theme. Without this line no styles load.

async function bootstrap() {
  // `mock`: answer every API call from src/mocks instead of the backend
  if (import.meta.env.MODE === "mock") {
    const { startMocking } = await import("./mocks/browser");
    startMocking();
  }
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
