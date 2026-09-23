import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import PortfolioPage from "./pages/PortfolioPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<MarketPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);