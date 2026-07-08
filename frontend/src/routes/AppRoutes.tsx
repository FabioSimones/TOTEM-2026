import { Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { AtivarDispositivoPage } from "../pages/AtivarDispositivoPage";
import { TotemHomePage } from "../pages/totem/TotemHomePage";
import { CaixaHomePage } from "../pages/caixa/CaixaHomePage";
import { CozinhaHomePage } from "../pages/cozinha/CozinhaHomePage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminHomePage } from "../pages/admin/AdminHomePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ativar-dispositivo" element={<AtivarDispositivoPage />} />
      <Route path="/totem" element={<TotemHomePage />} />
      <Route path="/caixa" element={<CaixaHomePage />} />
      <Route path="/cozinha" element={<CozinhaHomePage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminHomePage />} />
    </Routes>
  );
}
