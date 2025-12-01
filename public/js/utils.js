// ==================== UTILITY FUNCTIONS ====================

/**
 * Hiển thị toast notification
 */
export function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

/**
 * Flatten nested object thành flat object với dot notation
 */
export function flatten(obj, prefix = "", res = {}) {
    if (!obj || typeof obj !== "object") return res;
    for (let key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            flatten(obj[key], path, res);
        } else {
            res[path] = obj[key];
        }
    }
    return res;
}

/**
 * Lấy giá trị từ object theo path (dot notation)
 */
export function getValueByPath(obj, path) {
    if (!obj || !path) return "";
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) return "";
        current = current[key];
    }
    return current !== undefined && current !== null ? current : "";
}

/**
 * Escape HTML để tránh XSS
 */
export function escapeHtml(text) {
    if (typeof text !== "string") return text;
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Auto resize textarea theo nội dung
 */
export function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}
