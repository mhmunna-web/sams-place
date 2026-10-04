import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

import "./admin.css";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [menuCount, setMenuCount] = useState(0);
  const [advertisingCount, setAdvertisingCount] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [happyHourCount, setHappyHourCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/admin";
        return;
      }

      setAdmin({
        id: user.uid,
        full_name: user.displayName || user.email?.split("@")[0] || "Admin",
        email: user.email || "",
        role: "Administrator",
      });

      await loadDashboardStats();

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getCollectionCount = async (collectionName) => {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.size;
    } catch (error) {
      console.warn(
        `Could not load ${collectionName}:`,
        error.message
      );
      return 0;
    }
  };

  const loadDashboardStats = async () => {
    const [
      menu,
      advertising,
      offers,
      happyHour,
      gallery,
    ] = await Promise.all([
      getCollectionCount("menu_items"),
      getCollectionCount("advertisements"),
      getCollectionCount("offers"),
      getCollectionCount("happy_hours"),
      getCollectionCount("gallery"),
    ]);

    setMenuCount(menu);
    setAdvertisingCount(advertising);
    setOfferCount(offers);
    setHappyHourCount(happyHour);
    setGalleryCount(gallery);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/admin";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div>
          <h2>Sam's Place</h2>
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            SAM'S PLACE
          </div>

          <div className="admin-sidebar-label">
            ADMIN PANEL
          </div>
        </div>

        <nav className="admin-sidebar-nav">

          <a
            href="/admin/dashboard"
            className="admin-nav-item active"
          >
            <span>▣</span>
            Dashboard
          </a>

          <a
            href="/admin/menu"
            className="admin-nav-item"
          >
            <span>🍽</span>
            Menu
          </a>

          <a
            href="/admin/offers"
            className="admin-nav-item"
          >
            <span>🏷</span>
            Offers
          </a>

          <a
            href="/admin/happy-hour"
            className="admin-nav-item"
          >
            <span>🎉</span>
            Happy Hour
          </a>

          <a
            href="/admin/advertising"
            className="admin-nav-item"
          >
            <span>📢</span>
            Advertising
          </a>

          <a
            href="/admin/gallery"
            className="admin-nav-item"
          >
            <span>🖼</span>
            Gallery
          </a>

        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="admin-sidebar-bottom">

          <div className="admin-user-box">

            <div className="admin-user-avatar">
              {admin?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>

            <div>
              <strong>
                {admin?.full_name || "Admin"}
              </strong>

              <span>
                Administrator
              </span>
            </div>

          </div>

          <button
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Sign Out
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="admin-main">

        {/* TOP BAR */}
        <header className="admin-topbar">

          <div>

            <div className="admin-breadcrumb">
              Sam's Place / Admin
            </div>

            <h1>
              Dashboard
            </h1>

          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="admin-view-site"
          >
            View Website ↗
          </a>

        </header>

        {/* WELCOME */}
        <section className="admin-welcome">

          <div>

            <p className="admin-eyebrow">
              SAM'S PLACE
            </p>

            <h2>
              Welcome back, {admin?.full_name || "Admin"}
            </h2>

            <p>
              Manage your restaurant website, menu,
              advertising, offers, gallery and Happy Hour
              from one place.
            </p>

          </div>

        </section>

        {/* STATS */}
        <section className="admin-stat-grid">

          {/* MENU */}
          <a
            href="/admin/menu"
            className="admin-stat-card"
          >
            <span className="admin-stat-icon">
              🍽
            </span>

            <div>
              <p>
                Menu Items
              </p>

              <h3>
                {menuCount}
              </h3>
            </div>

          </a>

          {/* ADVERTISING */}
          <a
            href="/admin/advertising"
            className="admin-stat-card"
          >
            <span className="admin-stat-icon">
              📢
            </span>

            <div>
              <p>
                Advertising
              </p>

              <h3>
                {advertisingCount}
              </h3>
            </div>

          </a>

          {/* OFFERS */}
          <a
            href="/admin/offers"
            className="admin-stat-card"
          >
            <span className="admin-stat-icon">
              🏷
            </span>

            <div>
              <p>
                Offers
              </p>

              <h3>
                {offerCount}
              </h3>
            </div>

          </a>

          {/* HAPPY HOUR */}
          <a
            href="/admin/happy-hour"
            className="admin-stat-card"
          >
            <span className="admin-stat-icon">
              🎉
            </span>

            <div>
              <p>
                Happy Hour
              </p>

              <h3>
                {happyHourCount}
              </h3>
            </div>

          </a>

          {/* GALLERY */}
          <a
            href="/admin/gallery"
            className="admin-stat-card"
          >
            <span className="admin-stat-icon">
              🖼
            </span>

            <div>
              <p>
                Gallery Images
              </p>

              <h3>
                {galleryCount}
              </h3>
            </div>

          </a>

        </section>

        {/* MANAGEMENT */}
        <section className="admin-content-card">

          <div className="admin-content-card-header">

            <div>

              <p className="admin-eyebrow">
                WEBSITE MANAGEMENT
              </p>

              <h2>
                Restaurant Management
              </h2>

            </div>

          </div>

          <div className="admin-quick-grid">

            {/* MENU */}
            <a
              href="/admin/menu"
              className="admin-quick-card"
            >
              <span>
                🍽
              </span>

              <h3>
                Menu Management
              </h3>

              <p>
                Add categories and manage food items,
                prices, descriptions and images.
              </p>

            </a>

            {/* ADVERTISING */}
            <a
              href="/admin/advertising"
              className="admin-quick-card"
            >
              <span>
                📢
              </span>

              <h3>
                Advertising
              </h3>

              <p>
                Create large promotional banners,
                food advertisements and Order Now campaigns.
              </p>

            </a>

            {/* OFFERS */}
            <a
              href="/admin/offers"
              className="admin-quick-card"
            >
              <span>
                🏷
              </span>

              <h3>
                Offers & Discounts
              </h3>

              <p>
                Manage promotions, discounts and
                special restaurant offers.
              </p>

            </a>

            {/* HAPPY HOUR */}
            <a
              href="/admin/happy-hour"
              className="admin-quick-card"
            >
              <span>
                🎉
              </span>

              <h3>
                Happy Hour
              </h3>

              <p>
                Upload and manage your Happy Hour
                banner and information.
              </p>

            </a>

            {/* GALLERY */}
            <a
              href="/admin/gallery"
              className="admin-quick-card"
            >
              <span>
                🖼
              </span>

              <h3>
                Gallery
              </h3>

              <p>
                Manage restaurant photos and
                gallery images.
              </p>

            </a>

          </div>

        </section>

      </main>

    </div>
  );
}