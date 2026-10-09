import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css"; // Tailwind + shadcn theme. Without this line no styles load.

async function bootstrap() {
  // `mock`: mock everything. `hybrid`: mock only the gateway; /catalog/* passes through to the real service.
  if (import.meta.env.MODE === "mock" || import.meta.env.MODE === "hybrid") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
  createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
