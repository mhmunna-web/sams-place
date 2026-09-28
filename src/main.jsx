import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import MenuManagement from "./admin/MenuManagement.jsx";
import Advertising from "./admin/Advertising.jsx";
import Offers from "./admin/Offers.jsx";
import Gallery from "./admin/Gallery.jsx";
import HappyHour from "./admin/HappyHour.jsx";

const path = window.location.pathname;

let page;

if (path === "/admin" || path === "/admin/") {
  page = <AdminLogin />;
} else if (
  path === "/admin/dashboard" ||
  path === "/admin/dashboard/"
) {
  page = <AdminDashboard />;
} else if (
  path === "/admin/menu" ||
  path === "/admin/menu/"
) {
  page = <MenuManagement />;
} else if (
  path === "/admin/advertising" ||
  path === "/admin/advertising/"
) {
  page = <Advertising />;
} else if (
  path === "/admin/offers" ||
  path === "/admin/offers/"
) {
  page = <Offers />;
} else if (
  path === "/admin/happy-hour" ||
  path === "/admin/happy-hour/"
) {
  page = <HappyHour />;
} else if (
  path === "/admin/gallery" ||
  path === "/admin/gallery/"
) {
  page = <Gallery />;
} else {
  page = <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {page}
  </StrictMode>
);
