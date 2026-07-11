import { Route, Routes } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { AtivarDispositivoPage } from "../pages/AtivarDispositivoPage";
import { TotemHomePage } from "../pages/totem/TotemHomePage";
import { CaixaHomePage } from "../pages/caixa/CaixaHomePage";
import { CozinhaHomePage } from "../pages/cozinha/CozinhaHomePage";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { AdminHomePage } from "../pages/admin/AdminHomePage";
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminDispositivosPage } from "../pages/admin/AdminDispositivosPage";
import { AdminRestaurantesPage } from "../pages/admin/AdminRestaurantesPage";
import { AdminCategoriasPage } from "../pages/admin/AdminCategoriasPage";
import { AdminProdutosPage } from "../pages/admin/AdminProdutosPage";
import { AdminUsuariosPage } from "../pages/admin/AdminUsuariosPage";
import { AdminPedidosPage } from "../pages/admin/AdminPedidosPage";

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
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/dispositivos" element={<AdminDispositivosPage />} />
      <Route path="/admin/restaurantes" element={<AdminRestaurantesPage />} />
      <Route path="/admin/categorias" element={<AdminCategoriasPage />} />
      <Route path="/admin/produtos" element={<AdminProdutosPage />} />
      <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
      <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
    </Routes>
  );
}
