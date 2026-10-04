import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./menu.css";

const DEFAULT_ORDER_URL =
  "https://order.toasttab.com/online/sams-place-1545-s-novato-blvd";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category_id: "",
  order_url: DEFAULT_ORDER_URL,
  image_url: "",
  is_available: true,
};

const makeSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function MenuManagement() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [newCategory, setNewCategory] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("sp_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      supabase
        .from("sp_menu_items")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (categoriesResult.error) {
      setError(categoriesResult.error.message);
      setLoading(false);
      return;
    }

    if (itemsResult.error) {
      setError(itemsResult.error.message);
      setLoading(false);
      return;
    }

    setCategories(categoriesResult.data || []);
    setItems(itemsResult.data || []);

    setLoading(false);
  };

  const activeCategories = useMemo(() => {
    return categories.filter((category) => category.is_active);
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "all") {
      return items;
    }

    return items.filter(
      (item) => item.category_id === selectedCategory
    );
  }, [items, selectedCategory]);

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || "Uncategorized";
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      category_id: activeCategories[0]?.id || "",
    });

    setEditingId(null);
    setImageFile(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);

    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      category_id: item.category_id || "",
      order_url: item.order_url || DEFAULT_ORDER_URL,
      image_url: item.image_url || "",
      is_available: item.is_available ?? true,
    });

    setImageFile(null);
    setImagePreview(item.image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const uploadImage = async () => {
    if (!imageFile) {
      return form.image_url || "";
    }

    const safeName = imageFile.name
      .replace(/[^a-zA-Z0-9.-]/g, "-")
      .toLowerCase();

    const filePath = `menu/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("food-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("food-images")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Food name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (form.price === "" || Number(form.price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        name: form.name.trim(),
        slug: makeSlug(form.name),
        description: form.description.trim(),
        price: Number(form.price),
        category_id: form.category_id,
        order_url:
          form.order_url.trim() || DEFAULT_ORDER_URL,
        image_url: imageUrl || null,
        is_available: form.is_available,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("sp_menu_items")
          .update(payload)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Food item updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("sp_menu_items")
          .insert({
            ...payload,
            slug: `${payload.slug}-${crypto.randomUUID().slice(0, 8)}`,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Food item added successfully.");
      }

      await loadData();
      resetForm();

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (saveError) {
      setError(
        saveError.message || "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.name}"?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(item.id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("sp_menu_items")
      .delete()
      .eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(null);
      return;
    }

    setItems((current) =>
      current.filter((food) => food.id !== item.id)
    );

    if (editingId === item.id) {
      resetForm();
    }

    setSuccess("Food item deleted.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);

    setDeleting(null);
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();

    const categoryName = newCategory.trim();

    if (!categoryName) {
      setError("Category name is required.");
      return;
    }

    setError("");
    setSuccess("");

    const slug = makeSlug(categoryName);

    const duplicate = categories.some(
      (category) =>
        category.slug === slug ||
        category.name.toLowerCase() ===
          categoryName.toLowerCase()
    );

    if (duplicate) {
      setError("This category already exists.");
      return;
    }

    const nextSortOrder =
      categories.length > 0
        ? Math.max(
            ...categories.map(
              (category) => category.sort_order || 0
            )
          ) + 1
        : 0;

    const { data, error: categoryError } = await supabase
      .from("sp_categories")
      .insert({
        name: categoryName,
        slug,
        sort_order: nextSortOrder,
        is_active: true,
      })
      .select()
      .single();

    if (categoryError) {
      setError(categoryError.message);
      return;
    }

    setCategories((current) => [...current, data]);

    setNewCategory("");
    setShowCategoryForm(false);

    setForm((current) => ({
      ...current,
      category_id:
        current.category_id || data.id,
    }));

    setSuccess("Category added successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const handleToggleCategory = async (category) => {
    setError("");
    setSuccess("");

    const newStatus = !category.is_active;

    const { error: updateError } = await supabase
      .from("sp_categories")
      .update({
        is_active: newStatus,
      })
      .eq("id", category.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCategories((current) =>
      current.map((item) =>
        item.id === category.id
          ? {
              ...item,
              is_active: newStatus,
            }
          : item
      )
    );

    setSuccess(
      `${category.name} is now ${
        newStatus ? "active" : "inactive"
      }.`
    );

    setTimeout(() => {
      setSuccess("");
    }, 2500);
  };

  const handleDeleteCategory = async (category) => {
    const itemCount = items.filter(
      (item) => item.category_id === category.id
    ).length;

    if (itemCount > 0) {
      setError(
        `You cannot delete "${category.name}" because it contains ${itemCount} food item(s).`
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"?`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("sp_categories")
      .delete()
      .eq("id", category.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setCategories((current) =>
      current.filter((item) => item.id !== category.id)
    );

    if (selectedCategory === category.id) {
      setSelectedCategory("all");
    }

    if (form.category_id === category.id) {
      setForm((current) => ({
        ...current,
        category_id: "",
      }));
    }

    setSuccess("Category deleted.");

    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="menu-loading">
        <h2>Loading Menu...</h2>
        <p>Please wait.</p>
      </div>
    );
  }

  return (
    <div className="menu-management">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="menu-page-header">

        <div>
          <div className="menu-breadcrumb">
            Admin / Menu
          </div>

          <h1>
            Menu Management
          </h1>

          <p>
            Manage your restaurant categories and food items.
          </p>
        </div>

        <a
          href="/admin/dashboard"
          className="menu-back-button"
        >
          ← Dashboard
        </a>

      </div>

      {/* =====================================================
          ALERTS
      ===================================================== */}

      {error && (
        <div className="menu-alert menu-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="menu-alert menu-alert-success">
          {success}
        </div>
      )}

      <div className="menu-layout">

        {/* ===================================================
            CATEGORIES
        =================================================== */}

        <aside className="menu-categories-card">

          <div className="menu-card-title-row">

            <div>
              <span className="menu-small-label">
                MENU
              </span>

              <h2>
                Categories
              </h2>
            </div>

            <button
              type="button"
              className="menu-add-small"
              onClick={() =>
                setShowCategoryForm(
                  (value) => !value
                )
              }
            >
              + Add
            </button>

          </div>

          {showCategoryForm && (
            <form
              className="menu-category-form"
              onSubmit={handleAddCategory}
            >

              <input
                type="text"
                placeholder="Category name"
                value={newCategory}
                onChange={(event) =>
                  setNewCategory(event.target.value)
                }
              />

              <button type="submit">
                Save
              </button>

            </form>
          )}

          <button
            type="button"
            className={`menu-category-button ${
              selectedCategory === "all"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setSelectedCategory("all")
            }
          >

            <span>
              All Menu
            </span>

            <strong>
              {items.length}
            </strong>

          </button>

          {categories.map((category) => {

            const count = items.filter(
              (item) =>
                item.category_id === category.id
            ).length;

            return (
              <div
                className="menu-category-row"
                key={category.id}
              >

                <button
                  type="button"
                  className={`menu-category-button ${
                    selectedCategory === category.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedCategory(category.id)
                  }
                >

                  <span>
                    {category.name}
                  </span>

                  <strong>
                    {count}
                  </strong>

                </button>

                <div className="menu-category-actions">

                  <button
                    type="button"
                    className="menu-category-status"
                    onClick={() =>
                      handleToggleCategory(category)
                    }
                    title={
                      category.is_active
                        ? "Set inactive"
                        : "Set active"
                    }
                  >
                    {category.is_active
                      ? "ON"
                      : "OFF"}
                  </button>

                  <button
                    type="button"
                    className="menu-category-delete"
                    onClick={() =>
                      handleDeleteCategory(category)
                    }
                    title="Delete category"
                  >
                    ×
                  </button>

                </div>

              </div>
            );
          })}

        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="menu-main">

          {/* =================================================
              FOOD FORM
          ================================================= */}

          <section className="menu-form-card">

            <div className="menu-form-header">

              <div>

                <span className="menu-small-label">
                  {editingId
                    ? "EDIT FOOD"
                    : "NEW FOOD"}
                </span>

                <h2>
                  {editingId
                    ? "Edit Food Item"
                    : "Add Food Item"}
                </h2>

              </div>

              {editingId && (
                <button
                  type="button"
                  className="menu-cancel-button"
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}

            </div>

            <form onSubmit={handleSave}>

              <div className="menu-form-grid">

                {/* FOOD NAME */}

                <div className="menu-field menu-field-wide">

                  <label>
                    Food Name *
                  </label>

                  <input
                    type="text"
                    placeholder="Example: Classic Cheeseburger"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    required
                  />

                </div>

                {/* PRICE */}

                <div className="menu-field">

                  <label>
                    Price *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="15.95"
                    value={form.price}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        price: event.target.value,
                      })
                    }
                    required
                  />

                </div>

                {/* CATEGORY */}

                <div className="menu-field">

                  <label>
                    Category *
                  </label>

                  <select
                    value={form.category_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category_id:
                          event.target.value,
                      })
                    }
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    {activeCategories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* DESCRIPTION */}

                <div className="menu-field menu-field-wide">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows="4"
                    placeholder="Describe the food..."
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description:
                          event.target.value,
                      })
                    }
                  />

                </div>

                {/* ORDER URL */}

                <div className="menu-field menu-field-wide">

                  <label>
                    Order Link
                  </label>

                  <input
                    type="url"
                    value={form.order_url}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        order_url:
                          event.target.value,
                      })
                    }
                  />

                  <small>
                    Leave the default Toast link or
                    enter a custom ordering link.
                  </small>

                </div>

                {/* IMAGE */}

                <div className="menu-field menu-field-wide">

                  <label>
                    Food Image
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />

                  <small>
                    Maximum 5MB. JPG, PNG, WEBP, etc.
                  </small>

                  {imagePreview && (
                    <div className="menu-image-preview">

                      <img
                        src={imagePreview}
                        alt="Food preview"
                      />

                    </div>
                  )}

                </div>

              </div>

              {/* OPTIONS */}

              <div className="menu-options">

                <label className="menu-checkbox">

                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        is_available:
                          event.target.checked,
                      })
                    }
                  />

                  <span>

                    <strong>
                      Available
                    </strong>

                    <small>
                      Show this food on the website.
                    </small>

                  </span>

                </label>

              </div>

              <button
                type="submit"
                className="menu-save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Food"
                  : "Save Food"}
              </button>

            </form>

          </section>

          {/* =================================================
              FOOD LIST
          ================================================= */}

          <section className="menu-items-card">

            <div className="menu-items-header">

              <div>

                <span className="menu-small-label">
                  {selectedCategory === "all"
                    ? "ALL FOOD"
                    : getCategoryName(
                        selectedCategory
                      )}
                </span>

                <h2>
                  Food Items
                </h2>

              </div>

              <div className="menu-item-count">
                {filteredItems.length} items
              </div>

            </div>

            {filteredItems.length === 0 ? (

              <div className="menu-empty">

                <div>
                  🍽️
                </div>

                <h3>
                  No food items yet
                </h3>

                <p>
                  Add your first food item using
                  the form above.
                </p>

              </div>

            ) : (

              <div className="menu-food-list">

                {filteredItems.map((item) => (

                  <article
                    className="menu-food-item"
                    key={item.id}
                  >

                    {/* IMAGE */}

                    <div className="menu-food-image">

                      {item.image_url ? (

                        <img
                          src={item.image_url}
                          alt={item.name}
                        />

                      ) : (

                        <span>
                          🍽️
                        </span>

                      )}

                    </div>

                    {/* INFO */}

                    <div className="menu-food-info">

                      <div className="menu-food-title-row">

                        <h3>
                          {item.name}
                        </h3>

                        <strong>
                          $
                          {Number(
                            item.price
                          ).toFixed(2)}
                        </strong>

                      </div>

                      <span className="menu-food-category">
                        {getCategoryName(
                          item.category_id
                        )}
                      </span>

                      {item.description && (
                        <p>
                          {item.description}
                        </p>
                      )}

                      <div className="menu-food-badges">

                        <span
                          className={
                            item.is_available
                              ? "badge-available"
                              : "badge-unavailable"
                          }
                        >
                          {item.is_available
                            ? "Available"
                            : "Unavailable"}
                        </span>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="menu-food-actions">

                      <a
                        href={
                          item.order_url ||
                          DEFAULT_ORDER_URL
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="menu-action-view"
                      >
                        View
                      </a>

                      <button
                        type="button"
                        className="menu-action-edit"
                        onClick={() =>
                          startEdit(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="menu-action-delete"
                        onClick={() =>
                          handleDelete(item)
                        }
                        disabled={
                          deleting === item.id
                        }
                      >
                        {deleting === item.id
                          ? "..."
                          : "Delete"}
                      </button>

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