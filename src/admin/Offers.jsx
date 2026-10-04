import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./Offers.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
  image_url: "",
  is_active: true,
};

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

    await loadOffers();
  };

  const loadOffers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sp_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Offers loading error:", error);
      alert(`Could not load offers: ${error.message}`);
      setOffers([]);
    } else {
      setOffers(data || []);
    }

    setLoading(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Image must be smaller than 8MB.");
      return;
    }

    setUploading(true);

    try {
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, "-");

      const filePath = `offers/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("food-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        alert(`Image upload failed: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from("food-images")
        .getPublicUrl(filePath);

      setForm((current) => ({
        ...current,
        image_url: data.publicUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter an offer title.");
      return;
    }

    if (!form.discount_value) {
      alert("Please enter a discount value.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      image_url: form.image_url || null,
      is_active: Boolean(form.is_active),
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("sp_offers")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error(error);
          alert(`Update failed: ${error.message}`);
          return;
        }

        alert("Offer updated successfully.");
      } else {
        const { error } = await supabase
          .from("sp_offers")
          .insert(payload);

        if (error) {
          console.error(error);
          alert(`Save failed: ${error.message}`);
          return;
        }

        alert("Offer added successfully.");
      }

      resetForm();
      await loadOffers();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (offer) => {
    setEditingId(offer.id);

    setForm({
      title: offer.title || "",
      description: offer.description || "",
      discount_type: offer.discount_type || "percentage",
      discount_value: offer.discount_value ?? "",
      start_date: offer.start_date || "",
      end_date: offer.end_date || "",
      image_url: offer.image_url || "",
      is_active: offer.is_active ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this offer?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("sp_offers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert(`Delete failed: ${error.message}`);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadOffers();
  };

  const toggleActive = async (offer) => {
    const { error } = await supabase
      .from("sp_offers")
      .update({
        is_active: !offer.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id);

    if (error) {
      console.error(error);
      alert(`Status update failed: ${error.message}`);
      return;
    }

    await loadOffers();
  };

  const formatDiscount = (offer) => {
    const value = Number(offer.discount_value || 0);

    if (offer.discount_type === "fixed") {
      return `$${value.toFixed(2)} OFF`;
    }

    return `${value}% OFF`;
  };

  if (loading) {
    return (
      <div className="offers-loading">
        <div>
          <h2>Sam's Place</h2>
          <p>Loading Offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-page">

      {/* HEADER */}

      <header className="offers-header">

        <div>

          <div className="offers-breadcrumb">
            Sam's Place / Admin / Offers
          </div>

          <h1>
            Offers & Discounts
          </h1>

          <p>
            Create and manage restaurant promotions and special offers.
          </p>

        </div>

        <a
          href="/admin/dashboard"
          className="offers-back-button"
        >
          ← Dashboard
        </a>

      </header>


      <main className="offers-content">

        {/* FORM */}

        <section className="offers-form-card">

          <div className="offers-card-heading">

            <div>

              <span>
                PROMOTION
              </span>

              <h2>
                {editingId
                  ? "Edit Offer"
                  : "Create New Offer"}
              </h2>

            </div>

            {editingId && (
              <button
                type="button"
                className="offers-cancel-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}

          </div>


          <form onSubmit={handleSubmit}>

            <div className="offers-form-grid">

              {/* TITLE */}

              <div className="offers-field offers-field-full">

                <label>
                  Offer Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekend Special"
                  required
                />

              </div>


              {/* DISCOUNT TYPE */}

              <div className="offers-field">

                <label>
                  Discount Type
                </label>

                <select
                  name="discount_type"
                  value={form.discount_type}
                  onChange={handleChange}
                >

                  <option value="percentage">
                    Percentage (%)
                  </option>

                  <option value="fixed">
                    Fixed Amount ($)
                  </option>

                </select>

              </div>


              {/* DISCOUNT VALUE */}

              <div className="offers-field">

                <label>
                  Discount Value
                </label>

                <input
                  type="number"
                  name="discount_value"
                  value={form.discount_value}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder={
                    form.discount_type === "percentage"
                      ? "20"
                      : "5"
                  }
                  required
                />

              </div>


              {/* START DATE */}

              <div className="offers-field">

                <label>
                  Start Date
                </label>

                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                />

              </div>


              {/* END DATE */}

              <div className="offers-field">

                <label>
                  End Date
                </label>

                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="offers-field offers-field-full">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Write a short description about this offer..."
                />

              </div>


              {/* IMAGE */}

              <div className="offers-field offers-field-full">

                <label>
                  Offer Image
                </label>

                <div className="offers-upload-box">

                  {form.image_url ? (

                    <div className="offers-image-preview">

                      <img
                        src={form.image_url}
                        alt={form.title || "Offer"}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            image_url: "",
                          }))
                        }
                      >
                        Remove Image
                      </button>

                    </div>

                  ) : (

                    <label className="offers-upload-label">

                      <span>
                        ＋
                      </span>

                      <strong>
                        {uploading
                          ? "Uploading..."
                          : "Upload Offer Image"}
                      </strong>

                      <small>
                        JPG, PNG or WEBP · Maximum 8MB
                      </small>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />

                    </label>

                  )}

                </div>

              </div>


              {/* ACTIVE */}

              <div className="offers-active-row">

                <label className="offers-switch">

                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span className="offers-switch-slider"></span>

                </label>

                <div>

                  <strong>
                    Active Offer
                  </strong>

                  <p>
                    Show this offer on the public website.
                  </p>

                </div>

              </div>

            </div>


            {/* ACTIONS */}

            <div className="offers-form-actions">

              <button
                type="button"
                className="offers-secondary-button"
                onClick={resetForm}
              >
                Clear
              </button>

              <button
                type="submit"
                className="offers-primary-button"
                disabled={saving || uploading}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Offer"
                  : "Save Offer"}
              </button>

            </div>

          </form>

        </section>


        {/* LIST */}

        <section className="offers-list-section">

          <div className="offers-list-heading">

            <div>

              <span>
                MANAGEMENT
              </span>

              <h2>
                Your Offers
              </h2>

            </div>

            <div className="offers-count">
              {offers.length}{" "}
              {offers.length === 1
                ? "Offer"
                : "Offers"}
            </div>

          </div>


          {offers.length === 0 ? (

            <div className="offers-empty">

              <div>
                🏷
              </div>

              <h3>
                No offers yet
              </h3>

              <p>
                Create your first promotion using the form above.
              </p>

            </div>

          ) : (

            <div className="offers-list">

              {offers.map((offer) => (

                <article
                  className="offer-item"
                  key={offer.id}
                >

                  <div className="offer-item-image">

                    {offer.image_url ? (

                      <img
                        src={offer.image_url}
                        alt={offer.title}
                      />

                    ) : (

                      <div>
                        🏷
                      </div>

                    )}

                  </div>


                  <div className="offer-item-content">

                    <div className="offer-item-top">

                      <div>

                        <h3>
                          {offer.title}
                        </h3>

                        {offer.description && (
                          <p>
                            {offer.description}
                          </p>
                        )}

                      </div>

                      <strong>
                        {formatDiscount(offer)}
                      </strong>

                    </div>


                    <div className="offer-item-info">

                      {offer.start_date && (
                        <span>
                          Start: {offer.start_date}
                        </span>
                      )}

                      {offer.end_date && (
                        <span>
                          End: {offer.end_date}
                        </span>
                      )}

                    </div>


                    <div className="offer-item-bottom">

                      <button
                        type="button"
                        className={`offer-status ${
                          offer.is_active
                            ? "is-active"
                            : "is-inactive"
                        }`}
                        onClick={() =>
                          toggleActive(offer)
                        }
                      >
                        {offer.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </button>


                      <div className="offer-item-actions">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(offer)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            handleDelete(offer.id)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}