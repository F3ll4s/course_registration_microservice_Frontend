import { AppProvider } from "./provider/AppProvider";
import { AppRouter } from "./router/AppRouter";

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
