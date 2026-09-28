import { useEffect, useState } from "react";
import "./App.css";
import "./happy-hour-public.css";
import "./advertising-public.css";
import { supabase } from "./lib/supabaseClient";

const ORDER_URL =
  "https://order.toasttab.com/online/sams-place-1545-s-novato-blvd";

function App() {
  const [menuCategories, setMenuCategories] = useState([]);
  const [advertisement, setAdvertisement] = useState(null);
  const [happyHour, setHappyHour] = useState(null);
  const [offer, setOffer] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    loadPublicContent();
  }, []);

  const loadPublicContent = async () => {
    setMenuLoading(true);
    setMenuError("");

    try {
      const [
        categoriesResult,
        itemsResult,
        advertisementResult,
        happyHourResult,
        galleryResult,
      ] = await Promise.all([
        supabase
          .from("sp_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),

        supabase
          .from("sp_menu_items")
          .select("*")
          .eq("is_available", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),

        supabase
          .from("sp_advertisements")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("sp_happy_hours")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("sp_gallery")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (categoriesResult.error) {
        throw categoriesResult.error;
      }

      if (itemsResult.error) {
        throw itemsResult.error;
      }

      if (advertisementResult.error) {
        throw advertisementResult.error;
      }

      if (happyHourResult.error) {
        throw happyHourResult.error;
      }

      if (galleryResult.error) {
        throw galleryResult.error;
      }

      const categories = categoriesResult.data || [];
      const items = itemsResult.data || [];

      const formattedCategories = categories.map((category) => ({
        ...category,
        items: items.filter(
          (item) => item.category_id === category.id
        ),
      }));

      setMenuCategories(formattedCategories);

      setAdvertisement(advertisementResult.data || null);
      setHappyHour(happyHourResult.data || null);
      setGalleryImages(galleryResult.data || []);

      // Load the active public offer separately so an offer/RLS issue
      // never prevents the menu, advertising, or Happy Hour from loading.
      const { data: offersData, error: offersError } = await supabase
        .from("sp_offers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (offersError) {
        console.error("PUBLIC OFFERS ERROR:", offersError);
        setOffer(null);
      } else {
        // The Admin "Active" switch controls whether the offer is shown.
        // Start/end dates are displayed as offer information and do not
        // prevent an active offer from appearing on the public website.
        setOffer((offersData || [])[0] || null);
      }
    } catch (error) {
      console.error("PUBLIC CONTENT ERROR:", error);

      setMenuError(
        error.message || "Unable to load menu right now."
      );
    } finally {
      setMenuLoading(false);
    }
  };

  const formatHappyHourTime = (time) => {
    if (!time) return "";

    const [hourText, minuteText] = time.split(":");
    const hour = Number(hourText);
    const minute = minuteText || "00";

    if (Number.isNaN(hour)) return time;

    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
  };

  return (
    <div className="app">
      <style>{`
        @media (max-width: 800px) {
          #offers article {
            grid-template-columns: 1fr !important;
          }

          #offers article > div:first-child {
            min-height: 280px !important;
          }

          #offers article img {
            min-height: 280px !important;
          }
        }
      `}</style>

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">
        <div className="nav-container">

          <a
            href="#home"
            className="logo"
          >
            SAM'S PLACE
          </a>

          <nav className="nav-links">

            <a href="#home">
              Home
            </a>

            <a href="#featured">
              Specials
            </a>

            <a href="#offers">
              Offers
            </a>

            <a href="#menu">
              Menu
            </a>

            <a href="#about">
              About
            </a>

            <a href="#gallery">
              Gallery
            </a>

            <a href="#reservation">
              Reserve
            </a>

          </nav>

          <a
            href={ORDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="order-button"
          >
            Order Now
          </a>

        </div>
      </header>


      <main>

        {/* =====================================================
            HERO
        ===================================================== */}

        <section
          id="home"
          className="hero hero-with-image"
        >

          <div className="hero-background">

            <img
              src="/images/hero-breakfast.png"
              alt="Sam's Place breakfast"
            />

          </div>

          <div className="hero-overlay"></div>

          <div className="hero-content">

            <p className="eyebrow">
              WELCOME TO
            </p>

            <h1>
              Sam's Place
            </h1>

            <p className="hero-subtitle">
              Good food, warm hospitality, and a place to enjoy every moment.
            </p>

            <div className="hero-buttons">

              <a
                href={ORDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button"
              >
                Order Now
              </a>

              <a
                href="#reservation"
                className="secondary-button"
              >
                Reserve a Table
              </a>

            </div>

          </div>

          <div className="scroll-indicator">
            <span>
              Scroll to explore
            </span>
          </div>

        </section>


        {/* =====================================================
            ADVERTISING
        ===================================================== */}

        <section
          id="featured"
          className="advertising-public-section"
        >

          {advertisement ? (

            <div className="advertising-public-card">

              <div className="advertising-public-image">
                {advertisement.image_url ? (
                  <img
                    src={advertisement.image_url}
                    alt={advertisement.title}
                  />
                ) : (
                  <div className="advertising-public-placeholder">
                    SAM'S PLACE
                  </div>
                )}

                <div className="advertising-public-overlay"></div>

                <div className="advertising-public-label">
                  SPECIAL
                </div>
              </div>

              <div className="advertising-public-content">
                <p className="eyebrow">
                  SAM'S PLACE SPECIAL
                </p>

                <h2>{advertisement.title}</h2>

                {advertisement.description && (
                  <p>{advertisement.description}</p>
                )}

                <div className="advertising-public-bottom">
                  <strong>
                    ${Number(advertisement.price || 0).toFixed(2)}
                  </strong>

                  <a
                    href={advertisement.order_url || ORDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="featured-link"
                  >
                    Order Now →
                  </a>
                </div>
              </div>

            </div>

          ) : (

            <div className="advertising-public-empty">
              <p className="eyebrow">SAM'S PLACE</p>
              <h2>Something special is coming.</h2>
              <p>
                Check back soon for our latest specials and offers.
              </p>
            </div>

          )}

        </section>


        {/* =====================================================
            HAPPY HOUR
        ===================================================== */}

        <section
          id="happy-hour"
          className="public-happy-hour-section"
        >

          <div className="public-happy-hour-heading section-heading">

            <p className="eyebrow">
              HAPPY HOUR
            </p>

            <h2>
              Great food. Great prices. Great time.
            </h2>

            <p>
              Join us for Happy Hour at Sam&apos;s Place.
            </p>

          </div>

          {happyHour ? (

            <div className="public-happy-hour-card">

              <div className="public-happy-hour-image">

                {happyHour.image_url ? (
                  <img
                    src={happyHour.image_url}
                    alt={happyHour.title}
                  />
                ) : (
                  <div className="public-happy-hour-image-placeholder">
                    HAPPY HOUR
                  </div>
                )}

                <div className="public-happy-hour-image-overlay"></div>

              </div>

              <div className="public-happy-hour-content">

                <span className="badge">
                  HAPPY HOUR
                </span>

                <h2>
                  {happyHour.title}
                </h2>

                {happyHour.description && (
                  <p>
                    {happyHour.description}
                  </p>
                )}

                {(happyHour.start_time || happyHour.end_time) && (
                  <div className="public-happy-hour-time">
                    {happyHour.start_time
                      ? formatHappyHourTime(happyHour.start_time)
                      : ""}
                    {happyHour.start_time && happyHour.end_time
                      ? " — "
                      : ""}
                    {happyHour.end_time
                      ? formatHappyHourTime(happyHour.end_time)
                      : ""}
                  </div>
                )}

              </div>

            </div>

          ) : (

            <div className="public-happy-hour-empty">
              <span className="badge">HAPPY HOUR</span>
              <h2>Happy Hour information coming soon.</h2>
              <p>
                Check back soon for our latest Happy Hour specials and times.
              </p>
            </div>

          )}

        </section>


        {/* =====================================================
            OFFERS
        ===================================================== */}

        <section
          id="offers"
          style={{
            padding: "90px 7%",
            background: "#fef3e1",
          }}
        >
          <div
            style={{
              maxWidth: "1180px",
              margin: "0 auto",
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: "42px",
              }}
            >
              <p
                className="eyebrow"
                style={{
                  color: "#881716",
                  marginBottom: "10px",
                }}
              >
                SPECIAL OFFERS
              </p>

              <h2
                style={{
                  margin: 0,
                  color: "#264e5d",
                  fontSize: "clamp(34px, 5vw, 58px)",
                  lineHeight: 1.05,
                }}
              >
                Offers & Discounts
              </h2>

              <p
                style={{
                  maxWidth: "680px",
                  margin: "16px auto 0",
                  color: "#5b6770",
                  fontSize: "17px",
                  lineHeight: 1.7,
                }}
              >
                Enjoy our current special offers at Sam&apos;s Place.
              </p>
            </div>

            {offer ? (
              <article
                style={{
                  maxWidth: "1080px",
                  margin: "0 auto",
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
                  background: "#173e4d",
                  borderRadius: "24px",
                  overflow: "hidden",
                  boxShadow: "0 24px 60px rgba(14, 48, 64, 0.18)",
                }}
              >
                <div
                  style={{
                    minHeight: "390px",
                    position: "relative",
                    background: "#264e5d",
                  }}
                >
                  {offer.image_url ? (
                    <img
                      src={offer.image_url}
                      alt={offer.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        minHeight: "390px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        minHeight: "390px",
                        display: "grid",
                        placeItems: "center",
                        color: "#fef3e1",
                        fontSize: "28px",
                        fontWeight: 700,
                      }}
                    >
                      SAM&apos;S PLACE
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(14,48,64,0.08), rgba(14,48,64,0.48))",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: "24px",
                      left: "24px",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      background: "#881716",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "14px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {offer.discount_type === "fixed"
                      ? `$${Number(offer.discount_value || 0).toFixed(2)} OFF`
                      : `${Number(offer.discount_value || 0).toFixed(0)}% OFF`}
                  </div>
                </div>

                <div
                  style={{
                    padding: "46px 42px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    color: "#fef3e1",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: "#d7a33d",
                      fontSize: "13px",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                    }}
                  >
                    SAM&apos;S PLACE OFFER
                  </p>

                  <h3
                    style={{
                      margin: "0 0 16px",
                      color: "#fffaf0",
                      fontSize: "clamp(30px, 4vw, 46px)",
                      lineHeight: 1.05,
                    }}
                  >
                    {offer.title}
                  </h3>

                  {offer.description && (
                    <p
                      style={{
                        margin: "0 0 22px",
                        color: "rgba(255,250,240,0.86)",
                        fontSize: "16px",
                        lineHeight: 1.7,
                      }}
                    >
                      {offer.description}
                    </p>
                  )}

                  {(offer.start_date || offer.end_date) && (
                    <div
                      style={{
                        color: "rgba(255,250,240,0.72)",
                        fontSize: "14px",
                        marginTop: "4px",
                      }}
                    >
                      {offer.start_date || "Now"}
                      {offer.start_date && offer.end_date ? " — " : ""}
                      {offer.end_date || ""}
                    </div>
                  )}
                </div>
              </article>
            ) : (
              <div
                style={{
                  maxWidth: "760px",
                  margin: "0 auto",
                  padding: "56px 32px",
                  textAlign: "center",
                  background: "#fffaf0",
                  border: "1px solid #eadcc5",
                  borderRadius: "20px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 10px",
                    color: "#264e5d",
                    fontSize: "30px",
                  }}
                >
                  No active offers right now.
                </h3>

                <p
                  style={{
                    margin: 0,
                    color: "#66727a",
                    lineHeight: 1.7,
                  }}
                >
                  Check back soon for our latest offers and discounts.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            MENU
        ===================================================== */}

        <section id="menu" className="full-menu-section">
          <div className="section-heading">
            <p className="eyebrow">SAM'S PLACE MENU</p>
            <h2>Something for everyone.</h2>
            <p>Browse our menu and order your favorites directly online.</p>
          </div>

          {menuLoading && (
            <div className="menu-category-list">
              <div className="menu-category">
                <div className="menu-category-heading"><h3>Loading Menu...</h3></div>
                <div className="menu-items-grid">
                  <article className="menu-item">
                    <div className="menu-item-info"><h4>Please wait...</h4></div>
                  </article>
                </div>
              </div>
            </div>
          )}

          {!menuLoading && menuError && (
            <div className="menu-category-list">
              <div className="menu-category">
                <div className="menu-category-heading"><h3>Menu unavailable</h3></div>
                <div className="menu-category-empty"><p>We are unable to load the menu right now.</p></div>
              </div>
            </div>
          )}

          {!menuLoading && !menuError && menuCategories.length > 0 && (
            <div className="menu-category-list">
              {menuCategories.map((category) => (
                <section className="menu-category" key={category.id}>
                  <div className="menu-category-heading">
                    <div>
                      <p className="eyebrow">SAM'S PLACE</p>
                      <h3>{category.name}</h3>
                    </div>
                    <span>{category.items.length} {category.items.length === 1 ? "item" : "items"}</span>
                  </div>

                  {category.items.length > 0 ? (
                    <div className="menu-items-grid">
                      {category.items.map((item) => (
                        <article className="menu-item" key={item.id}>
                          <div className="menu-item-image">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} loading="lazy" />
                            ) : (
                              <div className="menu-item-image-placeholder"><span>🍽</span></div>
                            )}
                          </div>

                          <div className="menu-item-content">
                            <div className="menu-item-top">
                              <div className="menu-item-info">
                                <h4>{item.name}</h4>
                                {item.description && <p>{item.description}</p>}
                              </div>
                              <div className="menu-item-price">${Number(item.price).toFixed(2)}</div>
                            </div>

                            <div className="menu-item-bottom">
                              <span className="menu-item-available">Available</span>
                              <a href={item.order_url || ORDER_URL} target="_blank" rel="noopener noreferrer" className="menu-item-order-button">
                                Order Now <span>→</span>
                              </a>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="menu-category-empty"><p>No items available yet.</p></div>
                  )}
                </section>
              ))}
            </div>
          )}

          {!menuLoading && !menuError && menuCategories.length === 0 && (
            <div className="menu-category-list">
              <div className="menu-category">
                <div className="menu-category-heading"><h3>Menu coming soon</h3></div>
                <div className="menu-category-empty"><p>Our menu is being prepared.</p></div>
              </div>
            </div>
          )}

          {!menuLoading && !menuError && (
            <div className="menu-order-cta">
              <p>Ready to order?</p>
              <a href={ORDER_URL} target="_blank" rel="noopener noreferrer" className="primary-button">Order Online</a>
            </div>
          )}

        </section>


        {/* =====================================================
            ABOUT
        ===================================================== */}

        <section
          id="about"
          className="about-section"
        >

          <div className="about-grid">

            <div className="about-copy">

              <p className="eyebrow">
                ABOUT SAM'S PLACE
              </p>

              <h2>
                A neighborhood place for good food and good company.
              </h2>

              <p>
                Sam's Place brings together comforting favorites, generous
                portions, and a welcoming atmosphere. Whether you're joining
                us for breakfast, lunch, dinner, or a quick drink, there's
                something for everyone.
              </p>

            </div>

            <div className="about-quote">

              GOOD FOOD
              <br />
              GOOD PEOPLE
              <br />
              GOOD TIMES

            </div>

          </div>

        </section>


        {/* =====================================================
            GALLERY
        ===================================================== */}

        <section
          id="gallery"
          className="gallery-section"
        >

          <div className="section-heading">

            <p className="eyebrow">
              FROM OUR KITCHEN
            </p>

            <h2>
              Food worth coming back for.
            </h2>

          </div>


          {galleryImages.length > 0 ? (

            <div className="gallery-grid">

              {galleryImages.map((image) => (

                <div
                  className="gallery-item gallery-photo"
                  key={image.id}
                >

                  <img
                    src={image.image_url}
                    alt={image.title || "Sam's Place"}
                    loading="lazy"
                  />

                  <div className="gallery-overlay"></div>

                  <span>
                    {image.title || "Sam's Place"}
                  </span>

                </div>

              ))}

            </div>

          ) : (

            <div className="gallery-grid">

              <div className="gallery-item">

                <span>
                  Our gallery is coming soon.
                </span>

              </div>

            </div>

          )}

        </section>


        {/* =====================================================
            RESERVATION
        ===================================================== */}

        <section
          id="reservation"
          className="reservation-section"
        >

          <div className="reservation-grid">

            <div className="reservation-copy">

              <p className="eyebrow">
                RESERVATIONS
              </p>

              <h2>
                Reserve your
                <br />
                table.
              </h2>

              <p>
                Planning a meal with family or friends? Send us your
                reservation request and we'll get back to you.
              </p>

            </div>


            <form
              className="reservation-form"
              onSubmit={(event) =>
                event.preventDefault()
              }
            >

              <div className="form-group">

                <label htmlFor="name">
                  Name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="phone">
                  Phone
                </label>

                <input
                  id="phone"
                  type="tel"
                  placeholder="Your phone number"
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="email">
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="Your email"
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="guests">
                  Guests
                </label>

                <select
                  id="guests"
                  defaultValue="2"
                >

                  <option value="1">
                    1 Guest
                  </option>

                  <option value="2">
                    2 Guests
                  </option>

                  <option value="3">
                    3 Guests
                  </option>

                  <option value="4">
                    4 Guests
                  </option>

                  <option value="5">
                    5 Guests
                  </option>

                  <option value="6">
                    6 Guests
                  </option>

                  <option value="7">
                    7 Guests
                  </option>

                  <option value="8">
                    8 Guests
                  </option>

                  <option value="9">
                    9 Guests
                  </option>

                  <option value="10">
                    10 Guests
                  </option>

                  <option value="11">
                    11 Guests
                  </option>

                  <option value="12">
                    12 Guests
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label htmlFor="date">
                  Date
                </label>

                <input
                  id="date"
                  type="date"
                  required
                />

              </div>


              <div className="form-group">

                <label htmlFor="time">
                  Time
                </label>

                <input
                  id="time"
                  type="time"
                  required
                />

              </div>


              <div className="form-group full-width">

                <label htmlFor="request">
                  Special Request
                </label>

                <textarea
                  id="request"
                  placeholder="Anything we should know?"
                ></textarea>

              </div>


              <button type="submit">
                Request Reservation
              </button>

            </form>

          </div>

        </section>


        {/* =====================================================
            LOCATION
        ===================================================== */}

        <section className="location-section">

          <div className="location-grid">

            <div className="location-copy">

              <p className="eyebrow">
                VISIT US
              </p>

              <h2>
                Come hungry.
                <br />
                Leave happy.
              </h2>

            </div>


            <div className="location-address">

              1545 S Novato Blvd
              <br />
              Novato, California
              <br />
              United States

            </div>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-inner">

          <div className="footer-brand">

            <h3>
              SAM'S PLACE
            </h3>

            <p>
              Good food. Good people. Good times.
            </p>

          </div>


          <div className="footer-links">

            <a href="#menu">
              Menu
            </a>

            <a href="#about">
              About
            </a>

            <a href="#gallery">
              Gallery
            </a>

            <a href="#reservation">
              Reservations
            </a>

          </div>


          <div className="footer-order">

            <a
              href={ORDER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Order Online →
            </a>

          </div>

        </div>


        <div className="footer-bottom">

          <span>
            © {new Date().getFullYear()} Sam's Place
          </span>

          <span>
            Novato, California
          </span>

        </div>

      </footer>

    </div>
  );
}

export default App;