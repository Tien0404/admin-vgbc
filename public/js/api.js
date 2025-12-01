// ==================== API SERVICE ====================

const API_BASE = "/api";

/**
 * Lấy tất cả dữ liệu ngôn ngữ
 */
export async function fetchAllLanguages() {
    const res = await fetch(`${API_BASE}/lang/all`);
    if (!res.ok) throw new Error("Lỗi tải dữ liệu");
    return res.json();
}

/**
 * Lấy dữ liệu 1 ngôn ngữ
 */
export async function fetchLanguage(lang) {
    const res = await fetch(`${API_BASE}/lang/${lang}`);
    if (!res.ok) throw new Error(`Lỗi tải ngôn ngữ ${lang}`);
    return res.json();
}

/**
 * Cập nhật key cho 1 ngôn ngữ
 */
export async function updateSingleLang(lang, pathKey, value) {
    const res = await fetch(`${API_BASE}/lang/${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey, value }),
    });
    if (!res.ok) throw new Error("Lỗi cập nhật");
    return res.json();
}

/**
 * Cập nhật key cho nhiều ngôn ngữ (bulk)
 */
export async function updateBulkLang(pathKey, values) {
    const res = await fetch(`${API_BASE}/lang/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey, values }),
    });
    if (!res.ok) throw new Error("Lỗi cập nhật bulk");
    return res.json();
}

/**
 * Xóa key cho 1 ngôn ngữ
 */
export async function deleteSingleLang(lang, pathKey) {
    const res = await fetch(`${API_BASE}/lang/${lang}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey }),
    });
    if (!res.ok) throw new Error("Lỗi xóa");
    return res.json();
}

/**
 * Xóa key cho tất cả ngôn ngữ (bulk)
 */
export async function deleteBulkLang(pathKey) {
    const res = await fetch(`${API_BASE}/lang/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey }),
    });
    if (!res.ok) throw new Error("Lỗi xóa bulk");
    return res.json();
}

/**
 * Thêm testimonial mới
 */
export async function createTestimonial(data) {
    const res = await fetch(`${API_BASE}/testimonial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Lỗi tạo testimonial");
    return res.json();
}

/**
 * Xóa testimonial
 */
export async function deleteTestimonial(id) {
    const res = await fetch(`${API_BASE}/testimonial/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Lỗi xóa testimonial");
    return res.json();
}

/**
 * Thêm news mới
 */
export async function createNews(data) {
    const res = await fetch(`${API_BASE}/news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Lỗi tạo news");
    return res.json();
}

/**
 * Cập nhật news
 */
export async function updateNews(lang, id, data) {
    const res = await fetch(`${API_BASE}/lang/${lang}/news/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Lỗi cập nhật news");
    return res.json();
}

/**
 * Xóa news
 */
export async function deleteNews(id) {
    const res = await fetch(`${API_BASE}/news/${id}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Lỗi xóa news");
    return res.json();
}
