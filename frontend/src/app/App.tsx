import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "../routes/AppRoutes";
import { ThemeProvider } from "../contexts/ThemeContext";
import { AuthProvider } from "../auth/AuthProvider";

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
