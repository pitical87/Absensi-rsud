import { Routes, Route } from "react-router";
import ClientPage from "../pages/ClientPage";
import PresentPage from "../pages/PresentPage";
import LoginPage from "../pages/LoginPage";
import GuestRoute from "../components/GuestRoute";
import ProtectedRoutes from "../components/ProtectedRoutes";
import IzinPage from "../pages/IzinPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<ClientPage />} />
        <Route path="/present/:type" element={<PresentPage />} />
        <Route path="/izin/" element={<IzinPage />} />
      </Route>
    </Routes>
  );
}
