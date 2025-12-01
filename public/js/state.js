// ==================== GLOBAL STATE ====================

export const state = {
    allData: { en: {}, vi: {}, zh: {} },
    currentSection: "nav",
    viewMode: "multi", // "multi" hoặc "single"
    currentLang: "en",
};

/**
 * Cập nhật state
 */
export function setState(key, value) {
    state[key] = value;
}

/**
 * Lấy state
 */
export function getState(key) {
    return state[key];
}
