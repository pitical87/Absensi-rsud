import { Routes, Route } from "react-router";

import ClientPage from "../pages/ClientPage";
import PresentPage from "../pages/PresentPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ClientPage />} />
      <Route path="/present/:type" element={<PresentPage />} />
    </Routes>
  );
}
