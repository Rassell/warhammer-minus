import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import "./app.css";

import Home from "./routes/Home";
import VideoDetail from "./routes/VideoDetail";
import Layout from "./components/Layout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/warhammer-minus">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="video/:videoId" element={<VideoDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
