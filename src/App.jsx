import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import "./happy-hour-public.css";
import "./advertising-public.css";

const ORDER_URL =
  "https://order.toasttab.com/online/sams-place-1545-s-novato-blvd";

/*
  EMERGENCY OFFLINE MODE
  -----------------------
  This version does not depend on Supabase, so the public website can load
  even while the Supabase project endpoint is unavailable.

  The menu data below is based on the current public Sam's Place ordering menu.
  Images remain optional; the existing UI shows a clean placeholder when an
  image is not available.
*/

const makeItem = (
  id,
  name,
  price,
  description = "",
  image = ""
) => ({
  id,
  name,
  price,
  description,
  image_url: image ? `/images/menu/${image}` : "",
  order_url: ORDER_URL,
});

const offlineMenu = [
  {
    id: "breakfast",
    name: "Breakfast",
    items: [
      makeItem("b1", "Classic Breakfast", 15.95, "Two eggs, your choice of crispy hash browns or country potatoes, and fresh locally made bread."),
      makeItem("b2", "Two Eggs with Bacon", 18.95, "Two eggs with four slices of thick-cut bacon, potatoes, and fresh bread."),
      makeItem("b3", "Two Eggs with Sausage", 18.95, "Two eggs with sausage links, potatoes, and fresh bread."),
      makeItem("b4", "Two Eggs with Ham", 18.95, "Two eggs with a thick-cut house ham steak, potatoes, and fresh bread."),
      makeItem("b5", "Country Breakfast", 18.95, "Fresh biscuit topped with homemade country sausage gravy, two eggs, and potatoes."),
      makeItem("b6", "Fresh Corned Beef Hash and Eggs", 20.95, "House-cooked corned beef with potatoes, onions, and bell peppers, served with eggs and toast."),
      makeItem("b7", "Sam's Scramble", 20.95, "Scrambled eggs with fresh ground beef, mushrooms, spinach, and onions."),
      makeItem("b8", "Steak and Eggs", 22.95, "10 oz. New York steak with two eggs and your choice of potatoes."),
      makeItem("b9", "Chicken Apple Sausage", 19.95, "Chicken-apple sausage served with two eggs and potatoes."),
      makeItem("b10", "Linguica and Eggs", 19.95, "Portuguese linguica sausage with two eggs and potatoes."),
      makeItem("b11", "Chorizo and Eggs", 19.95, "Spicy Mexican chorizo with eggs, potatoes, and fresh pico de gallo."),
      makeItem("b12", "Huevos Rancheros", 19.95, "Corn tortillas, black beans, eggs, Jack cheese, jalapenos, and pico de gallo."),
      makeItem("b13", "Chicken Fried Steak and Eggs", 19.95, "Breaded beef patty with country sausage gravy and two eggs."),
      makeItem("b14", "Breakfast Sandwich", 18.95, "Two eggs, bacon, mayonnaise, melted cheese, and potatoes on toasted sourdough."),
      makeItem("b15", "Breakfast Quesadilla", 21.95, "Flour tortilla with scrambled eggs, mushrooms, tomatoes, onions, and cheese."),
      makeItem("b16", "Breakfast Burrito", 19.95, "Smoked ham, scrambled eggs, pico de gallo, and cheddar in a flour tortilla."),
      makeItem("b17", "Pancakes (Full)", 15.95, "Three fluffy pancakes served with butter and syrup."),
      makeItem("b18", "French Toast", 15.95, "Thick-cut Texas toast dipped in signature egg batter and grilled golden."),
      makeItem("b19", "Short Stack", 11.95, "A stack of fluffy pancakes served with butter and syrup."),
      makeItem("b20", "Half Waffle", 7.95, "Half of a golden Belgian waffle with butter and syrup."),
      makeItem("b21", "Full Waffle", 15.95, "Full golden Belgian waffle with butter and syrup."),
    ],
  },
  {
    id: "lunch",
    name: "Lunch",
    items: [
      makeItem("l1", "Cup Soup of the Day", 6.25, "Homemade soup of the day, prepared fresh daily."),
      makeItem("l2", "Bowl Soup of the Day", 9.25, "A bowl of our homemade soup of the day."),
      makeItem("l3", "House Salad", 7.95, "Fresh greens, tomatoes, cucumbers, carrots, and red onions with homemade dressing."),
      makeItem("l4", "Caesar Salad", 15.95, "Crisp romaine, Parmesan, croutons, and homemade Caesar dressing."),
      makeItem("l5", "Chicken Caesar Salad", 21.95, "Grilled chicken, romaine, Parmesan, and croutons with Caesar dressing."),
      makeItem("l6", "Cobb Salad", 21.95, "Mixed greens, blue cheese, eggs, turkey, bacon, tomatoes, cucumbers, and avocado."),
      makeItem("l7", "Hamburger", 17.95, "Fresh 1/3 lb Angus chuck patty with classic toppings and your choice of side."),
      makeItem("l8", "Cheese Burger", 18.95, "Fresh 1/3 lb Angus chuck patty with melted cheese and your choice of side."),
      makeItem("l9", "Giant Burger", 20.95, "Fresh 1/2 lb Angus chuck patty with cheddar cheese and classic toppings."),
      makeItem("l10", "Novato Burger", 20.95, "Angus patty with mushrooms, grilled onions, melted cheese, and chipotle aioli."),
      makeItem("l11", "Sourdough Burger", 18.95, "Angus patty with mayonnaise, lettuce, tomato, and onion on French roll."),
      makeItem("l12", "Veggie Burger", 17.95, "Black bean patty with classic toppings and your choice of side."),
      makeItem("l13", "Patty Melt", 17.95, "Angus patty with cheddar and grilled onions on grilled rye."),
      makeItem("l14", "Turkey Burger", 17.95, "Turkey patty with mayonnaise, lettuce, tomato, and onions."),
      makeItem("l15", "Pulled Pork Sandwich", 17.95, "Roasted pulled pork marinated in BBQ sauce with coleslaw."),
      makeItem("l16", "Fish and Chips Lunch", 17.95, "House-breaded Icelandic cod with French fries and coleslaw."),
      makeItem("l17", "Chicken Strips Wrap", 17.95, "Crispy chicken strips with lettuce, tomato, avocado, and ranch."),
      makeItem("l18", "Beef Burrito", 17.95, "Roasted beef, seasoned rice, beans, salsa, avocado, and sour cream."),
      makeItem("l19", "Chicken Burrito", 17.95, "Grilled chicken, seasoned rice, beans, salsa, avocado, and sour cream."),
      makeItem("l20", "The Reuben", 19.95, "Corned beef, sauerkraut, Swiss cheese, and Thousand Island dressing on grilled rye."),
      makeItem("l21", "Fresh Turkey Sandwich", 18.95, "Thinly sliced turkey with mayonnaise, lettuce, tomato, and your choice of side."),
      makeItem("l22", "French Dip", 18.95, "House-roasted beef on a fresh sourdough French roll with au jus."),
      makeItem("l23", "The Club Sandwich", 19.95, "Roasted turkey, honey-smoked bacon, mayonnaise, tomatoes, and lettuce on sourdough."),
      makeItem("l24", "BLT", 17.95, "Honey-smoked bacon, crisp lettuce, mayonnaise, and fresh tomato."),
      makeItem("l25", "Steak Sandwich", 21.95, "10 oz. New York steak with grilled mushrooms and onions on a French roll."),
      makeItem("l26", "Tuna Sandwich", 17.95, "Homemade tuna salad with lettuce, tomato, and mayonnaise."),
      makeItem("l27", "Grilled Cheese Sandwich", 13.95, "Melted cheese on locally baked grilled sourdough."),
      makeItem("l28", "Mozzarella Sticks", 14.95, "Crispy mozzarella sticks."),
      makeItem("l29", "Chicken Strips", 14.95, "Crispy chicken strips."),
      makeItem("l30", "Onion Rings", 6.95, "Crispy golden onion rings."),
      makeItem("l31", "Potato Wedges", 7.95, "Crispy seasoned potato wedges."),
    ],
  },
  {
    id: "dinner",
    name: "Dinner",
    items: [
      makeItem("d1", "Turkey Dinner Plate", 25.95, "Fresh turkey with homemade mashed potatoes and vegetables, or your choice of two sides."),
      makeItem("d2", "Roast Beef Dinner Plate", 25.95, "Fresh roast beef with mashed potatoes and vegetables, or your choice of two sides."),
      makeItem("d3", "Corned Beef Dinner", 25.95, "Fresh corned beef with mashed potatoes and vegetables, or your choice of two sides."),
      makeItem("d4", "Fish and Chips Dinner", 25.95, "Fresh Icelandic cod with French fries and coleslaw."),
      makeItem("d5", "Grilled Salmon", 27.95, "Wild salmon with lemon-garlic caper sauce, mashed potatoes, and vegetables."),
      makeItem("d6", "Filet of Sole", 27.95, "Grilled filet with lemon-garlic butter sauce, mashed potatoes, and vegetables."),
      makeItem("d7", "Chicken Parmesan", 25.95, "Breaded chicken breast with homemade marinara and melted cheese."),
      makeItem("d8", "Chicken Piccata", 25.95, "Grilled chicken breast with lemon-garlic caper sauce."),
      makeItem("d9", "Chicken Marsala", 25.95, "Grilled chicken breast served with marsala sauce."),
      makeItem("d10", "Buttermilk Fried Chicken", 25.95, "Crispy buttermilk-marinated chicken with mashed potatoes and coleslaw."),
      makeItem("d11", "Chicken Fried Steak", 25.95, "Two crispy beef chicken-fried steaks with homemade country gravy."),
      makeItem("d12", "Half BBQ Pork Ribs", 21.95, "St. Louis-style pork ribs with BBQ sauce, fries, and coleslaw."),
      makeItem("d13", "Full BBQ Pork Ribs", 27.95, "St. Louis-style pork ribs with BBQ sauce, fries, and coleslaw."),
      makeItem("d14", "New York Steak", 27.95, "10 oz. fresh-cut New York steak with mashed potatoes and vegetables."),
      makeItem("d15", "Mayan Camarones", 27.95, "Prawns with chipotle, onions, garlic, and sour cream, served with rice and beans."),
      makeItem("d16", "Bistek Carabenia", 25.95, "Grilled beef with grilled onion, avocado, rice, beans, and salad."),
      makeItem("d17", "Salisbury Steak", 25.95, "Ground-beef steak with grilled onions, mushrooms, and homemade gravy."),
      makeItem("d18", "Fettuccini", 19.95, "Fresh pasta with your choice of homemade Alfredo or marinara sauce."),
      makeItem("d19", "Fettuccini Carbonara", 21.95, "Fresh fettuccine with creamy Parmesan sauce, bacon, and garlic."),
      makeItem("d20", "Fettuccini Pesto", 21.95, "Fresh fettuccine with basil pesto and Parmesan."),
      makeItem("d21", "Spaghetti Meat Balls", 23.95, "Fresh spaghetti with homemade marinara and Italian meatballs."),
      makeItem("d22", "Seafood Pasta", 26.95, "Shrimp, fish, and calamari with your choice of fresh sauce."),
    ],
  },
  {
    id: "additional",
    name: "Additional Menu",
    items: [
      makeItem("a1", "Sweet Potato Bowl", 17.95, "Roasted sweet potatoes, seasoned ground beef, cottage cheese, black beans, and avocado."),
      makeItem("a2", "Ahi Tuna Poke Bowl", 18.95, "Fresh ahi tuna over rice with cucumber, avocado, green onions, sesame, and poke sauce."),
      makeItem("a3", "Beans Salad", 21.95, "Fresh greens with seasoned beans, avocado, cucumber, tomato, and egg."),
      makeItem("a4", "Pulled Pork Skillet", 18.95, "Pulled pork, red potatoes, peppers, onions, cheddar, and two eggs."),
      makeItem("a5", "Fresh Fruit Plate", 14.95, "Fresh blueberries, banana, mango, yellow melon, and orange slices."),
      makeItem("a6", "Crispy Fried Chicken Sandwich", 17.95, "Crispy fried chicken with lettuce, tomato, sauce, and fries."),
    ],
  },
  {
    id: "kids",
    name: "Kid's Menu",
    items: [
      makeItem("k1", "Kids Bacon with 1 Egg & Toast", 10.95, "One egg with crispy bacon and your choice of toast."),
      makeItem("k2", "Kids Sausage with 1 Egg & Toast", 10.95, "One egg with sausage and your choice of toast."),
      makeItem("k3", "Kids 1 Pancake with 1 Bacon & 1 Egg", 10.95, "One pancake with bacon and one egg."),
      makeItem("k4", "Kids 1 Pancake with 1 Sausage & 1 Egg", 10.95, "One pancake with sausage and one egg."),
      makeItem("k5", "Kids 1 French Toast with 1 Bacon & 1 Egg", 10.95, "French toast with bacon and one egg."),
      makeItem("k6", "Kids Hot Dog with French Fries", 11.95, "All-beef hot dog served with crispy French fries."),
      makeItem("k7", "Kids Grilled Cheese with French Fries", 11.95, "Grilled cheese sandwich with French fries."),
      makeItem("k8", "Kids Hamburger with French Fries", 11.95, "Angus beef hamburger served with French fries."),
      makeItem("k9", "Kids Spaghetti with Butter & Cheese", 11.95, "Spaghetti tossed with butter and Parmesan."),
      makeItem("k10", "Kids Chicken Strips with French Fries", 11.95, "Two crispy chicken strips served with French fries."),
      makeItem("k11", "Kids Soda", 2.95),
      makeItem("k12", "Kids Milk", 3.95),
      makeItem("k13", "Kids Juice", 3.95),
      makeItem("k14", "Kids Hot Chocolate", 3.95),
      makeItem("k15", "Milkshake", 4.95),
    ],
  },
  {
    id: "dessert",
    name: "Dessert",
    items: [
      makeItem("ds1", "Homemade Flan", 6.50, "Traditional homemade egg flan with rich caramel sauce."),
      makeItem("ds2", "Homemade Rice Pudding", 6.95, "Creamy homemade rice pudding with cinnamon and raisins."),
      makeItem("ds3", "Apple Pie", 6.50),
      makeItem("ds4", "Pecan Pie", 6.50),
      makeItem("ds5", "Lemon Meringue Pie", 6.50),
      makeItem("ds6", "Chocolate Sundae", 9.50, "Vanilla ice cream with chocolate sauce, whipped cream, and a cherry."),
    ],
  },
  {
    id: "beverage",
    name: "Beverage",
    items: [
      makeItem("bv1", "Coffee", 4.25, "Freshly brewed coffee with free refills for dine-in."),
      makeItem("bv2", "Hot Tea", 4.25),
      makeItem("bv3", "Hot Chocolate", 4.75),
      makeItem("bv4", "Ice Tea", 4.25),
      makeItem("bv5", "Pepsi", 4.25),
      makeItem("bv6", "Diet Pepsi", 4.25),
      makeItem("bv7", "Dr Pepper", 4.25),
      makeItem("bv8", "Root Beer", 4.25),
      makeItem("bv9", "Starry", 4.25),
      makeItem("bv10", "Pink Lemonade", 4.25),
      makeItem("bv11", "Sparkling Water", 4.25),
      makeItem("bv12", "Milk", 4.95),
      makeItem("bv13", "Fresh Squeezed Orange Juice - Large", 7.50),
      makeItem("bv14", "Fresh Squeezed Orange Juice - Small", 5.25),
      makeItem("bv15", "Apple Juice - Large", 6.25),
      makeItem("bv16", "Apple Juice - Small", 4.25),
      makeItem("bv17", "Cranberry Juice - Large", 6.25),
      makeItem("bv18", "Cranberry Juice - Small", 4.25),
      makeItem("bv19", "Vanilla Milkshake", 7.95),
      makeItem("bv20", "Chocolate Milkshake", 7.95),
      makeItem("bv21", "Strawberry Milkshake", 7.95),
      makeItem("bv22", "OREO Milkshake", 7.95),
      makeItem("bv23", "Chocolate Peanut Butter Milkshake", 8.50),
      makeItem("bv24", "Banana Malted Milkshake", 9.50),
    ],
  },
];

function App() {
  const [menuCategories, setMenuCategories] = useState(offlineMenu);
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
      const [categoriesResult, itemsResult, adsResult, happyHourResult, offersResult, galleryResult] =
        await Promise.all([
          supabase
            .from("sp_categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true }),
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
            .order("created_at", { ascending: false }),
          supabase
            .from("sp_happy_hours")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("sp_offers")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),
          supabase
            .from("sp_gallery")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false }),
        ]);

      const firstError = [
        categoriesResult.error,
        itemsResult.error,
        adsResult.error,
        happyHourResult.error,
        offersResult.error,
        galleryResult.error,
      ].find(Boolean);

      if (firstError) {
        console.error("Public content loading error:", firstError);
        setMenuError("Unable to load live menu data. Showing the saved menu instead.");
        setMenuCategories(offlineMenu);
        return;
      }

      const categories = categoriesResult.data || [];
      const items = itemsResult.data || [];

      const liveCategories = categories.map((category) => ({
        id: category.id,
        name: category.name,
        items: items.filter((item) => item.category_id === category.id),
      }));

      if (liveCategories.length > 0) {
        setMenuCategories(liveCategories);
      } else {
        setMenuCategories(offlineMenu);
      }

      setAdvertisement(adsResult.data?.[0] || null);
      setHappyHour(happyHourResult.data?.[0] || null);

      const today = new Date().toISOString().slice(0, 10);
      const currentOffer = (offersResult.data || []).find((item) => {
        const starts = !item.start_date || item.start_date <= today;
        const ends = !item.end_date || item.end_date >= today;
        return starts && ends;
      });

      setOffer(currentOffer || null);
      setGalleryImages(galleryResult.data || []);
    } catch (error) {
      console.error("Unexpected public content error:", error);
      setMenuError("Unable to load live menu data. Showing the saved menu instead.");
      setMenuCategories(offlineMenu);
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
            <div className="menu-live-notice">
              {menuError}
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