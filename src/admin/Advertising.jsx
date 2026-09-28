import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./advertising.css";

const DEFAULT_ORDER_URL =
  "https://order.toasttab.com/online/sams-place-1545-s-novato-blvd";

const EMPTY_FORM = {
  title: "",
  price: "",
  description: "",
  image_url: "",
  order_url: DEFAULT_ORDER_URL,
  is_active: true,
  sort_order: 0,
};

export default function Advertising() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
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

    await loadAdvertisements();
  };

  const loadAdvertisements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sp_advertisements")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading advertisements:", error);
      alert("Could not load advertisements.");
      setAds([]);
    } else {
      setAds(data || []);
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

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

      const filePath = `advertising/${crypto.randomUUID()}-${safeName}`;

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

      setForm((prev) => ({
        ...prev,
        image_url: data.publicUrl,
      }));
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter an advertising title.");
      return;
    }

    if (!form.image_url) {
      alert("Please upload an advertising image.");
      return;
    }

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      price: Number(form.price) || 0,
      description: form.description.trim() || null,
      image_url: form.image_url,
      order_url:
        form.order_url.trim() || DEFAULT_ORDER_URL,
      is_active: Boolean(form.is_active),
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("sp_advertisements")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          console.error(error);
          alert(`Update failed: ${error.message}`);
          return;
        }

        alert("Advertising updated successfully.");
      } else {
        const { error } = await supabase
          .from("sp_advertisements")
          .insert(payload);

        if (error) {
          console.error(error);
          alert(`Save failed: ${error.message}`);
          return;
        }

        alert("Advertising added successfully.");
      }

      resetForm();
      await loadAdvertisements();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ad) => {
    setEditingId(ad.id);

    setForm({
      title: ad.title || "",
      price: ad.price ?? "",
      description: ad.description || "",
      image_url: ad.image_url || "",
      order_url: ad.order_url || DEFAULT_ORDER_URL,
      is_active: ad.is_active ?? true,
      sort_order: ad.sort_order ?? 0,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this advertising?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("sp_advertisements")
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

    await loadAdvertisements();
  };

  const toggleActive = async (ad) => {
    const { error } = await supabase
      .from("sp_advertisements")
      .update({
        is_active: !ad.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ad.id);

    if (error) {
      console.error(error);
      alert(`Status update failed: ${error.message}`);
      return;
    }

    await loadAdvertisements();
  };

  if (loading) {
    return (
      <div className="advertising-loading">
        <div>
          <h2>Sam's Place</h2>
          <p>Loading Advertising...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advertising-page">
      <header className="advertising-header">
        <div>
          <div className="advertising-breadcrumb">
            Sam's Place / Admin / Advertising
          </div>

          <h1>Advertising</h1>

          <p>
            Create and manage promotional banners for the
            restaurant website.
          </p>
        </div>

        <a
          href="/admin/dashboard"
          className="advertising-back-button"
        >
          ← Dashboard
        </a>
      </header>

      <main className="advertising-content">
        <section className="advertising-form-card">
          <div className="advertising-card-heading">
            <div>
              <span>ADVERTISEMENT</span>
              <h2>
                {editingId
                  ? "Edit Advertising"
                  : "Create Advertising"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="advertising-cancel-button"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="advertising-form-grid">
              <div className="advertising-field advertising-field-full">
                <label>Title</label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekend Special"
                  required
                />
              </div>

              <div className="advertising-field">
                <label>Price</label>

                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="15.95"
                />
              </div>

              <div className="advertising-field">
                <label>Sort Order</label>

                <input
                  type="number"
                  name="sort_order"
                  value={form.sort_order}
                  onChange={handleChange}
                  min="0"
                  step="1"
                />
              </div>

              <div className="advertising-field advertising-field-full">
                <label>Description</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Write a short description about this special offer..."
                />
              </div>

              <div className="advertising-field advertising-field-full">
                <label>Order URL</label>

                <input
                  type="url"
                  name="order_url"
                  value={form.order_url}
                  onChange={handleChange}
                  placeholder="https://order.toasttab.com/..."
                />
              </div>

              <div className="advertising-field advertising-field-full">
                <label>Advertising Image</label>

                <div className="advertising-upload-box">
                  {form.image_url ? (
                    <div className="advertising-image-preview">
                      <img
                        src={form.image_url}
                        alt={form.title || "Advertising"}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            image_url: "",
                          }))
                        }
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <label className="advertising-upload-label">
                      <span>＋</span>

                      <strong>
                        {uploading
                          ? "Uploading..."
                          : "Upload Advertising Image"}
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

              <div className="advertising-active-row">
                <label className="advertising-switch">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />

                  <span className="advertising-switch-slider"></span>
                </label>

                <div>
                  <strong>Active Advertising</strong>
                  <p>
                    Show this advertising on the public
                    website.
                  </p>
                </div>
              </div>
            </div>

            <div className="advertising-form-actions">
              <button
                type="button"
                className="advertising-secondary-button"
                onClick={resetForm}
              >
                Clear
              </button>

              <button
                type="submit"
                className="advertising-primary-button"
                disabled={saving || uploading}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Advertising"
                  : "Save Advertising"}
              </button>
            </div>
          </form>
        </section>

        <section className="advertising-list-section">
          <div className="advertising-list-heading">
            <div>
              <span>MANAGEMENT</span>
              <h2>Your Advertisements</h2>
            </div>

            <div className="advertising-count">
              {ads.length}{" "}
              {ads.length === 1
                ? "Advertisement"
                : "Advertisements"}
            </div>
          </div>

          {ads.length === 0 ? (
            <div className="advertising-empty">
              <div>🖼</div>

              <h3>No advertising yet</h3>

              <p>
                Create your first advertising banner
                using the form above.
              </p>
            </div>
          ) : (
            <div className="advertising-list">
              {ads.map((ad) => (
                <article
                  className="advertising-item"
                  key={ad.id}
                >
                  <div className="advertising-item-image">
                    {ad.image_url ? (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                      />
                    ) : (
                      <div>🖼</div>
                    )}
                  </div>

                  <div className="advertising-item-content">
                    <div className="advertising-item-top">
                      <div>
                        <h3>{ad.title}</h3>

                        {ad.description && (
                          <p>{ad.description}</p>
                        )}
                      </div>

                      <strong>
                        ${Number(ad.price || 0).toFixed(2)}
                      </strong>
                    </div>

                    <div className="advertising-item-bottom">
                      <button
                        type="button"
                        className={`advertising-status ${
                          ad.is_active
                            ? "is-active"
                            : "is-inactive"
                        }`}
                        onClick={() =>
                          toggleActive(ad)
                        }
                      >
                        {ad.is_active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </button>

                      <div className="advertising-item-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(ad)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() =>
                            handleDelete(ad.id)
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