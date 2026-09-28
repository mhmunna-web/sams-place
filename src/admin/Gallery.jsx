import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./admin.css";
import "./gallery.css";

const BUCKET_NAME = "Gallery";

const EMPTY_FORM = {
  title: "",
  description: "",
  image_url: "",
  sort_order: 0,
  is_active: true,
};

function Gallery() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    setLoading(true);
    setError("");

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (!currentSession?.user) {
      window.location.href = "/admin";
      return;
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("sp_admin_users")
      .select("id, role, is_active")
      .eq("id", currentSession.user.id)
      .maybeSingle();

    if (adminError || !adminUser?.is_active) {
      await supabase.auth.signOut();
      window.location.href = "/admin";
      return;
    }

    setSession(currentSession);
    await loadGallery();
    setLoading(false);
  };

  const loadGallery = async () => {
    const { data, error: loadError } = await supabase
      .from("sp_gallery")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setItems(data || []);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const filePath = `${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!session?.user) {
      setError("Your admin session has expired. Please log in again.");
      return;
    }

    if (!imageFile && !form.image_url) {
      setError("Please select a gallery image.");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        title: form.title.trim() || null,
        image_url: imageUrl,
        description: form.description.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("sp_gallery")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Gallery image updated successfully.");
      } else {
        const { data: insertedGallery, error: insertError } =
          await supabase.rpc("sp_add_gallery", {
            p_title: payload.title,
            p_image_url: payload.image_url,
            p_description: payload.description,
            p_sort_order: payload.sort_order,
            p_is_active: payload.is_active,
          });

        if (insertError) {
          throw insertError;
        }

        if (!insertedGallery) {
          throw new Error("Gallery image could not be created.");
        }

        setSuccess("Gallery image added successfully.");
      }

      await loadGallery();
      resetForm();

      setTimeout(() => setSuccess(""), 3000);
    } catch (saveError) {
      setError(saveError.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);

    setForm({
      title: item.title || "",
      description: item.description || "",
      image_url: item.image_url || "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });

    setImageFile(null);
    setImagePreview(item.image_url || "");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const toggleActive = async (item) => {
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("sp_gallery")
      .update({
        is_active: !item.is_active,
      })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setItems((current) =>
      current.map((galleryItem) =>
        galleryItem.id === item.id
          ? { ...galleryItem, is_active: !item.is_active }
          : galleryItem
      )
    );

    setSuccess(
      item.is_active
        ? "Gallery image hidden from the website."
        : "Gallery image is now active."
    );

    setTimeout(() => setSuccess(""), 2500);
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title || "this gallery image"}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(item.id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("sp_gallery")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(null);
      return;
    }

    setItems((current) =>
      current.filter((galleryItem) => galleryItem.id !== item.id)
    );

    if (editingId === item.id) {
      resetForm();
    }

    setDeleting(null);
    setSuccess("Gallery image deleted successfully.");
    setTimeout(() => setSuccess(""), 2500);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="admin-spinner"></div>
          <p>Loading Gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-brand">
            <span className="admin-brand-mark">SP</span>
            <div>
              <strong>Sam&apos;s Place</strong>
              <span>Admin Dashboard</span>
            </div>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <a href="/" className="admin-topbar-link">
            View Website
          </a>
          <a href="/admin/dashboard" className="admin-topbar-link">
            Dashboard
          </a>
          <button
            type="button"
            className="admin-logout-button"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/admin";
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-label">MANAGEMENT</div>

          <a href="/admin/dashboard" className="admin-sidebar-link">
            Dashboard
          </a>

          <a href="/admin/menu" className="admin-sidebar-link">
            Menu
          </a>

          <a href="/admin/offers" className="admin-sidebar-link">
            Offers
          </a>

          <a href="/admin/happy-hour" className="admin-sidebar-link">
            Happy Hour
          </a>

          <a href="/admin/advertising" className="admin-sidebar-link">
            Advertising
          </a>

          <a
            href="/admin/gallery"
            className="admin-sidebar-link active"
          >
            Gallery
          </a>

          <a href="/admin/reservations" className="admin-sidebar-link">
            Reservations
          </a>

          <a href="/admin/settings" className="admin-sidebar-link">
            Settings
          </a>
        </aside>

        <main className="admin-content">
          <div className="gallery-admin-header">
            <div>
              <span className="gallery-admin-eyebrow">
                SAM&apos;S PLACE
              </span>
              <h1>Gallery</h1>
              <p>
                Upload and manage the photos shown in the restaurant
                website gallery.
              </p>
            </div>

            <div className="gallery-admin-count">
              <strong>{items.length}</strong>
              <span>Images</span>
            </div>
          </div>

          {error && (
            <div className="gallery-alert gallery-alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="gallery-alert gallery-alert-success">
              {success}
            </div>
          )}

          <section className="gallery-form-card">
            <div className="gallery-form-header">
              <div>
                <span className="gallery-small-label">
                  {editingId ? "EDIT IMAGE" : "NEW IMAGE"}
                </span>
                <h2>
                  {editingId
                    ? "Edit Gallery Image"
                    : "Add Gallery Image"}
                </h2>
              </div>

              {editingId && (
                <button
                  type="button"
                  className="gallery-cancel-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="gallery-form-grid">
                <div className="gallery-field">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Example: Our Famous Breakfast"
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="gallery-field">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sort_order: event.target.value,
                      })
                    }
                  />
                  <small>
                    Lower numbers appear first.
                  </small>
                </div>

                <div className="gallery-field gallery-field-wide">
                  <label>Description / Caption</label>
                  <textarea
                    rows="3"
                    placeholder="Short description for this photo..."
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="gallery-field gallery-field-wide">
                  <label>Gallery Image *</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <small>
                    Maximum 8MB. JPG, PNG, WEBP and other image formats
                    are supported.
                  </small>

                  {imagePreview && (
                    <div className="gallery-image-preview">
                      <img
                        src={imagePreview}
                        alt="Gallery preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="gallery-form-options">
                <label className="gallery-toggle">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        is_active: event.target.checked,
                      })
                    }
                  />
                  <span></span>
                  <div>
                    <strong>Active</strong>
                    <small>
                      Show this image on the public website.
                    </small>
                  </div>
                </label>
              </div>

              <div className="gallery-form-actions">
                <button
                  type="submit"
                  className="gallery-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Gallery Image"
                      : "Add Gallery Image"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="gallery-secondary-button"
                    onClick={resetForm}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="gallery-list-section">
            <div className="gallery-list-header">
              <div>
                <span className="gallery-small-label">
                  GALLERY LIBRARY
                </span>
                <h2>All Images</h2>
              </div>

              <span className="gallery-list-count">
                {items.length} total
              </span>
            </div>

            {items.length === 0 ? (
              <div className="gallery-empty">
                <div className="gallery-empty-icon">▧</div>
                <h3>No gallery images yet</h3>
                <p>
                  Upload your first restaurant photo using the form above.
                </p>
              </div>
            ) : (
              <div className="gallery-admin-grid">
                {items.map((item) => (
                  <article className="gallery-admin-card" key={item.id}>
                    <div className="gallery-admin-image">
                      <img
                        src={item.image_url}
                        alt={item.title || "Sam's Place gallery"}
                      />

                      <span
                        className={`gallery-status ${
                          item.is_active
                            ? "gallery-status-active"
                            : "gallery-status-inactive"
                        }`}
                      >
                        {item.is_active ? "ACTIVE" : "HIDDEN"}
                      </span>
                    </div>

                    <div className="gallery-admin-card-content">
                      <div className="gallery-card-top">
                        <div>
                          <h3>
                            {item.title || "Untitled Image"}
                          </h3>
                          <span>
                            Order: {item.sort_order}
                          </span>
                        </div>
                      </div>

                      {item.description && (
                        <p>{item.description}</p>
                      )}

                      <div className="gallery-card-actions">
                        <button
                          type="button"
                          className="gallery-edit-button"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="gallery-active-button"
                          onClick={() => toggleActive(item)}
                        >
                          {item.is_active ? "Hide" : "Activate"}
                        </button>

                        <button
                          type="button"
                          className="gallery-delete-button"
                          onClick={() => handleDelete(item)}
                          disabled={deleting === item.id}
                        >
                          {deleting === item.id
                            ? "Deleting..."
                            : "Delete"}
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

export default Gallery;
