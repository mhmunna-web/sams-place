import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./admin.css";
import "./happy-hour.css";

const EMPTY_FORM = {
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  image_url: "",
  is_active: true,
};

function HappyHour() {
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/admin";
      return;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("sp_admin_users")
      .select("id, role, is_active")
      .eq("id", session.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (
      adminError ||
      !adminUser ||
      adminUser.role !== "admin"
    ) {
      await supabase.auth.signOut();
      window.location.href = "/admin";
      return;
    }

    setSession(session);
    await loadItems();
  };

  const loadItems = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("sp_happy_hours")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be smaller than 8MB.");
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) {
      return form.image_url || "";
    }

    const safeName = imageFile.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-");

    const path = `happy-hour/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("food-images")
      .upload(path, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("food-images")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!form.title.trim()) {
        throw new Error("Please enter a Happy Hour title.");
      }

      const imageUrl = await uploadImage();

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        image_url: imageUrl || null,
        is_active: Boolean(form.is_active),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("sp_happy_hours")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setMessage("Happy Hour updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("sp_happy_hours")
          .insert(payload);

        if (insertError) {
          throw insertError;
        }

        setMessage("Happy Hour created successfully.");
      }

      resetForm();
      await loadItems();

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      setError(
        err.message || "Unable to save Happy Hour."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      description: item.description || "",
      start_time: item.start_time
        ? item.start_time.slice(0, 5)
        : "",
      end_time: item.end_time
        ? item.end_time.slice(0, 5)
        : "",
      image_url: item.image_url || "",
      is_active: item.is_active !== false,
    });

    setImageFile(null);
    setImagePreview(item.image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleToggle = async (item) => {
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("sp_happy_hours")
      .update({
        is_active: !item.is_active,
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      !item.is_active
        ? "Happy Hour is now active."
        : "Happy Hour has been hidden."
    );

    await loadItems();

    setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title}" permanently?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    const { error: deleteError } = await supabase
      .from("sp_happy_hours")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === item.id) {
      resetForm();
    }

    setMessage("Happy Hour deleted.");

    await loadItems();

    setTimeout(() => {
      setMessage("");
    }, 2500);
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
          <p>Loading Happy Hour...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="admin-page">
      {/* TOP BAR */}
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            SP
          </div>

          <div>
            <strong>Sam's Place</strong>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Website
          </a>

          <a href="/admin/dashboard">
            Dashboard
          </a>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="admin-layout">
        {/* SIDEBAR */}
        <aside className="admin-sidebar">
          <p className="admin-sidebar-label">
            MANAGEMENT
          </p>

          <a href="/admin/dashboard">
            Dashboard
          </a>

          <a href="/admin/menu">
            Menu
          </a>

          <a href="/admin/offers">
            Offers
          </a>

          <a
            href="/admin/happy-hour"
            className="active"
          >
            Happy Hour
          </a>

          <a href="/admin/advertising">
            Advertising
          </a>

          <a href="/admin/gallery">
            Gallery
          </a>
        </aside>

        {/* MAIN */}
        <main className="admin-content">
          <div className="hh-page-header">
            <div>
              <p className="hh-eyebrow">
                SAM'S PLACE
              </p>

              <h1>Happy Hour</h1>

              <p>
                Manage the Happy Hour banner shown on
                the restaurant website.
              </p>
            </div>

            <div className="hh-count-card">
              <strong>{items.length}</strong>
              <span>Entries</span>
            </div>
          </div>

          {message && (
            <div className="hh-message success">
              {message}
            </div>
          )}

          {error && (
            <div className="hh-message error">
              {error}
            </div>
          )}

          {/* FORM */}
          <section className="hh-form-card">
            <div className="hh-form-heading">
              <p className="hh-eyebrow">
                {editingId
                  ? "EDIT HAPPY HOUR"
                  : "NEW HAPPY HOUR"}
              </p>

              <h2>
                {editingId
                  ? "Update Happy Hour"
                  : "Add Happy Hour"}
              </h2>
            </div>

            <form onSubmit={handleSave}>
              <div className="hh-form-grid">
                {/* TITLE */}
                <div className="hh-field hh-field-wide">
                  <label htmlFor="title">
                    Title
                  </label>

                  <input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Happy Hour Specials"
                    required
                  />
                </div>

                {/* START TIME */}
                <div className="hh-field">
                  <label htmlFor="start_time">
                    Start Time
                  </label>

                  <input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={form.start_time}
                    onChange={handleChange}
                  />
                </div>

                {/* END TIME */}
                <div className="hh-field">
                  <label htmlFor="end_time">
                    End Time
                  </label>

                  <input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={handleChange}
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="hh-field hh-field-full">
                  <label htmlFor="description">
                    Description
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Join us for great food and special prices..."
                    rows="5"
                  />
                </div>

                {/* IMAGE */}
                <div className="hh-field hh-field-full">
                  <label htmlFor="image">
                    Happy Hour Image
                  </label>

                  <input
                    id="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleImageChange}
                  />

                  <p className="hh-help">
                    JPG, PNG, WEBP and other common image
                    formats are supported. Maximum 8MB.
                  </p>

                  {imagePreview && (
                    <div className="hh-image-preview">
                      <img
                        src={imagePreview}
                        alt="Happy Hour preview"
                      />
                    </div>
                  )}
                </div>

                {/* ACTIVE */}
                <div className="hh-active-row">
                  <label className="hh-switch-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                    />

                    <span className="hh-switch"></span>

                    <span>
                      <strong>Active</strong>

                      <small>
                        Show this Happy Hour on the public
                        website.
                      </small>
                    </span>
                  </label>
                </div>
              </div>

              <div className="hh-form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="hh-secondary-button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="hh-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Happy Hour"
                    : "Add Happy Hour"}
                </button>
              </div>
            </form>
          </section>

          {/* LIBRARY */}
          <section className="hh-library">
            <div className="hh-library-heading">
              <div>
                <p className="hh-eyebrow">
                  HAPPY HOUR LIBRARY
                </p>

                <h2>
                  All Happy Hours
                </h2>
              </div>

              <span>
                {items.length} total
              </span>
            </div>

            {items.length === 0 ? (
              <div className="hh-empty-card">
                <h3>
                  No Happy Hour entries yet.
                </h3>

                <p>
                  Add your first Happy Hour above and it
                  will be available to display on the
                  website.
                </p>
              </div>
            ) : (
              <div className="hh-cards">
                {items.map((item) => (
                  <article
                    className="hh-card"
                    key={item.id}
                  >
                    {/* IMAGE */}
                    <div className="hh-card-image">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                        />
                      ) : (
                        <div className="hh-card-placeholder">
                          HAPPY HOUR
                        </div>
                      )}

                      <span
                        className={
                          item.is_active
                            ? "hh-status active"
                            : "hh-status"
                        }
                      >
                        {item.is_active
                          ? "ACTIVE"
                          : "HIDDEN"}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="hh-card-body">
                      <h3>
                        {item.title}
                      </h3>

                      {(item.start_time ||
                        item.end_time) && (
                        <div className="hh-card-time">
                          {item.start_time
                            ? item.start_time.slice(0, 5)
                            : ""}

                          {item.start_time &&
                          item.end_time
                            ? " — "
                            : ""}

                          {item.end_time
                            ? item.end_time.slice(0, 5)
                            : ""}
                        </div>
                      )}

                      {item.description && (
                        <p>
                          {item.description}
                        </p>
                      )}

                      <div className="hh-card-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="hh-hide-button"
                          onClick={() =>
                            handleToggle(item)
                          }
                        >
                          {item.is_active
                            ? "Hide"
                            : "Show"}
                        </button>

                        <button
                          type="button"
                          className="hh-delete-button"
                          onClick={() =>
                            handleDelete(item)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default HappyHour;