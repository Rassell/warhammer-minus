/* eslint-disable react-refresh/only-export-components -- entry point: route chunks are declared here on purpose */
import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { HelmetProvider } from "react-helmet-async";

import "./app.css";

import AppLayout from "./components/AppLayout";

// Routes are code-split so the initial bundle stays small. The Suspense
// boundary lives inside AppLayout, which keeps the header and sidebar stable
// while a page chunk loads.
const Home = lazy(() => import("./routes/Home"));
const Explore = lazy(() => import("./routes/Explore"));
const Videos = lazy(() => import("./routes/Videos"));
const VideoDetail = lazy(() => import("./routes/VideoDetail"));
const Authors = lazy(() => import("./routes/Authors"));
const AuthorDetail = lazy(() => import("./routes/AuthorDetail"));
const Collections = lazy(() => import("./routes/Collections"));
const CollectionDetail = lazy(() => import("./routes/CollectionDetail"));
const Categories = lazy(() => import("./routes/Categories"));
const CategoryDetail = lazy(() => import("./routes/CategoryDetail"));
const Search = lazy(() => import("./routes/Search"));
const NotFound = lazy(() => import("./routes/NotFound"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/warhammer-minus/">
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="explore" element={<Explore />} />
            <Route path="videos" element={<Videos />} />
            <Route path="video/:videoId" element={<VideoDetail />} />
            <Route path="authors" element={<Authors />} />
            <Route path="authors/:authorId" element={<AuthorDetail />} />
            <Route path="collections" element={<Collections />} />
            <Route
              path="collections/:playlistId"
              element={<CollectionDetail />}
            />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<CategoryDetail />} />
            <Route path="search" element={<Search />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
