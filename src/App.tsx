import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Admin } from "./pages/Admin";
import { Home } from "./pages/Home";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/yonetim" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
