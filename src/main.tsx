import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { HelmetProvider } from "react-helmet-async";

import "./app.css";

import Home from "./routes/Home";
import VideoDetail from "./routes/VideoDetail";
import Collections from "./routes/Collections";
import CollectionDetail from "./routes/CollectionDetail";
import Layout from "./components/Layout";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/warhammer-minus/">
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="video/:videoId" element={<VideoDetail />} />
            <Route path="collections" element={<Collections />} />
            <Route
              path="collections/:playlistId"
              element={<CollectionDetail />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
