import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./admin.css";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [menuCount, setMenuCount] = useState(0);
  const [advertisingCount, setAdvertisingCount] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);
  const [galleryCount, setGalleryCount] = useState(0);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/admin";
      return;
    }

    const { data: adminUser, error } = await supabase
      .from("sp_admin_users")
      .select("id, full_name, role, is_active")
      .eq("id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !adminUser) {
      await supabase.auth.signOut();
      window.location.href = "/admin";
      return;
    }

    setAdmin(adminUser);

    await loadDashboardStats();

    setLoading(false);
  };

  const loadDashboardStats = async () => {
    try {
      const [
        menuResult,
        advertisingResult,
        reservationResult,
        galleryResult,
      ] = await Promise.all([
        supabase
          .from("sp_menu_items")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("sp_advertisements")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("sp_reservations")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("sp_gallery")
          .select("id", { count: "exact", head: true }),
      ]);

      setMenuCount(menuResult.count || 0);
      setAdvertisingCount(advertisingResult.count || 0);
      setReservationCount(reservationResult.count || 0);
      setGalleryCount(galleryResult.count || 0);
    } catch (error) {
      console.error("Dashboard stats error:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin";
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

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

          {/* DASHBOARD */}

          <a
            href="/admin/dashboard"
            className="admin-nav-item active"
          >
            <span>▣</span>
            Dashboard
          </a>


          {/* MENU */}

          <a
            href="/admin/menu"
            className="admin-nav-item"
          >
            <span>🍽</span>
            Menu
          </a>


          {/* CATEGORIES */}

          <a
            href="/admin/categories"
            className="admin-nav-item"
          >
            <span>▤</span>
            Categories
          </a>


          {/* OFFERS */}

          <a
            href="/admin/offers"
            className="admin-nav-item"
          >
            <span>🏷</span>
            Offers
          </a>


          {/* HAPPY HOUR */}

          <a
            href="/admin/happy-hour"
            className="admin-nav-item"
          >
            <span>🎉</span>
            Happy Hour
          </a>


          {/* ADVERTISING */}

          <a
            href="/admin/advertising"
            className="admin-nav-item"
          >
            <span>📢</span>
            Advertising
          </a>


          {/* GALLERY */}

          <a
            href="/admin/gallery"
            className="admin-nav-item"
          >
            <span>🖼</span>
            Gallery
          </a>


          {/* RESERVATIONS */}

          <a
            href="/admin/reservations"
            className="admin-nav-item"
          >
            <span>📅</span>
            Reservations
          </a>


          {/* SETTINGS */}

          <a
            href="/admin/settings"
            className="admin-nav-item"
          >
            <span>⚙</span>
            Settings
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


      {/* =====================================================
          MAIN
      ===================================================== */}

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


        {/* =====================================================
            WELCOME
        ===================================================== */}

        <section className="admin-welcome">

          <div>

            <p className="admin-eyebrow">
              SAM'S PLACE
            </p>

            <h2>
              Welcome back, {admin?.full_name || "Admin"}
            </h2>

            <p>
              Manage your restaurant website, menu, advertising,
              offers, gallery and reservations from one place.
            </p>

          </div>

        </section>


        {/* =====================================================
            STATS
        ===================================================== */}

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


          {/* RESERVATIONS */}

          <a
            href="/admin/reservations"
            className="admin-stat-card"
          >

            <span className="admin-stat-icon">
              📅
            </span>

            <div>

              <p>
                Reservations
              </p>

              <h3>
                {reservationCount}
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


        {/* =====================================================
            MANAGEMENT
        ===================================================== */}

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

            {/* =================================================
                MENU
            ================================================= */}

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
                Add, edit and remove food items,
                prices, descriptions and images.
              </p>

            </a>


            {/* =================================================
                ADVERTISING
            ================================================= */}

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


            {/* =================================================
                OFFERS
            ================================================= */}

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


            {/* =================================================
                HAPPY HOUR
            ================================================= */}

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


            {/* =================================================
                RESERVATIONS
            ================================================= */}

            <a
              href="/admin/reservations"
              className="admin-quick-card"
            >

              <span>
                📅
              </span>

              <h3>
                Reservations
              </h3>

              <p>
                View and manage customer reservation
                requests.
              </p>

            </a>


            {/* =================================================
                GALLERY
            ================================================= */}

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


            {/* =================================================
                SETTINGS
            ================================================= */}

            <a
              href="/admin/settings"
              className="admin-quick-card"
            >

              <span>
                ⚙
              </span>

              <h3>
                Settings
              </h3>

              <p>
                Manage restaurant information,
                contact details and website settings.
              </p>

            </a>

          </div>

        </section>

      </main>

    </div>
  );
}