// ==================== MAIN APPLICATION ====================

import { state, setState } from "./state.js";
import { showToast } from "./utils.js";
import { fetchAllLanguages, updateBulkLang } from "./api.js";
import {
    renderMultiLangTable,
    renderSingleLangTable,
    renderTestimonialsMultiLang,
    renderNewsMultiLang,
} from "./renderers/index.js";

// ==================== DOM ELEMENTS ====================
const elements = {
    tableBody: document.getElementById("tableBody"),
    sectionTitle: document.getElementById("sectionTitle"),
    searchInput: document.getElementById("searchInput"),
    totalKeysEl: document.getElementById("totalKeys"),
    missingKeysEl: document.getElementById("missingKeys"),
    sectionTabs: document.getElementById("sectionTabs"),
    langSelect: document.getElementById("lang"),
    reloadBtn: document.getElementById("reloadBtn"),
    addNewKeyBtn: document.getElementById("addNewKeyBtn"),
    addKeyModal: document.getElementById("addKeyModal"),
    closeModal: document.getElementById("closeModal"),
    cancelAddKey: document.getElementById("cancelAddKey"),
    confirmAddKey: document.getElementById("confirmAddKey"),
    viewMultiLang: document.getElementById("viewMultiLang"),
    viewSingleLang: document.getElementById("viewSingleLang"),
    singleLangSelect: document.querySelector(".single-lang-select"),
    expandAllBtn: document.getElementById("expandAllBtn"),
    collapseAllBtn: document.getElementById("collapseAllBtn"),
};

// ==================== DATA LOADING ====================
async function loadAllData() {
    try {
        showToast("⏳ Đang tải dữ liệu...", "info");
        const data = await fetchAllLanguages();
        setState("allData", data);
        renderTable();
        showToast("✅ Đã tải dữ liệu thành công!", "success");
    } catch (err) {
        console.error("Lỗi load dữ liệu:", err);
        showToast("❌ Lỗi tải dữ liệu: " + err.message, "error");
    }
}

// ==================== RENDER TABLE ====================
function renderTable() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    const { currentSection, viewMode } = state;

    // Xử lý đặc biệt cho testimonials và news
    if (currentSection === "testimonials") {
        renderTestimonialsMultiLang(searchTerm, loadAllData);
        return;
    }
    if (currentSection === "news") {
        renderNewsMultiLang(searchTerm, loadAllData);
        return;
    }

    // Render bình thường cho các section khác
    if (viewMode === "multi") {
        renderMultiLangTable(searchTerm, loadAllData);
    } else {
        renderSingleLangTable(searchTerm, loadAllData);
    }
}

// ==================== EVENT HANDLERS ====================
function initEventHandlers() {
    // Reload button
    elements.reloadBtn.onclick = loadAllData;

    // Search input
    elements.searchInput.oninput = () => {
        renderTable();
    };

    // Section tabs
    elements.sectionTabs.querySelectorAll("button").forEach((btn) => {
        btn.onclick = () => {
            elements.sectionTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            setState("currentSection", btn.dataset.section);
            elements.searchInput.value = "";
            renderTable();
        };
    });

    // View mode toggle
    elements.viewMultiLang.onclick = () => {
        setState("viewMode", "multi");
        elements.viewMultiLang.classList.add("active");
        elements.viewSingleLang.classList.remove("active");
        elements.singleLangSelect.style.display = "none";

        // Update table header
        document.querySelector("#translationTable thead").innerHTML = `
      <tr>
        <th class="col-key">Key</th>
        <th class="col-lang">🇬🇧 English</th>
        <th class="col-lang">🇻🇳 Tiếng Việt</th>
        <th class="col-lang">🇨🇳 中文</th>
        <th class="col-action">Hành động</th>
      </tr>
    `;
        renderTable();
    };

    elements.viewSingleLang.onclick = () => {
        setState("viewMode", "single");
        elements.viewSingleLang.classList.add("active");
        elements.viewMultiLang.classList.remove("active");
        elements.singleLangSelect.style.display = "block";

        // Update table header
        document.querySelector("#translationTable thead").innerHTML = `
      <tr>
        <th class="col-key">Key</th>
        <th class="col-lang-single" colspan="3">Giá trị (${state.currentLang.toUpperCase()})</th>
        <th class="col-action">Hành động</th>
      </tr>
    `;
        renderTable();
    };

    // Language select (single mode)
    elements.langSelect.onchange = () => {
        setState("currentLang", elements.langSelect.value);
        renderTable();
    };

    // Modal handlers
    elements.addNewKeyBtn.onclick = () => {
        elements.addKeyModal.classList.add("show");
        document.getElementById("newKeyPath").value = state.currentSection + ".";
        document.getElementById("newValueEn").value = "";
        document.getElementById("newValueVi").value = "";
        document.getElementById("newValueZh").value = "";
    };

    elements.closeModal.onclick = () => elements.addKeyModal.classList.remove("show");
    elements.cancelAddKey.onclick = () => elements.addKeyModal.classList.remove("show");

    // Click outside modal to close
    elements.addKeyModal.onclick = (e) => {
        if (e.target === elements.addKeyModal) elements.addKeyModal.classList.remove("show");
    };

    // Confirm add new key
    elements.confirmAddKey.onclick = async () => {
        const pathKey = document.getElementById("newKeyPath").value.trim();
        const valueEn = document.getElementById("newValueEn").value;
        const valueVi = document.getElementById("newValueVi").value;
        const valueZh = document.getElementById("newValueZh").value;

        if (!pathKey) {
            showToast("❌ Vui lòng nhập Key Path!", "error");
            return;
        }

        try {
            await updateBulkLang(pathKey, { en: valueEn, vi: valueVi, zh: valueZh });
            showToast(`✅ Đã thêm key "${pathKey}" cho cả 3 ngôn ngữ!`);
            elements.addKeyModal.classList.remove("show");
            await loadAllData();
        } catch (err) {
            showToast(`❌ Lỗi: ${err.message}`, "error");
        }
    };

    // Expand/Collapse all
    elements.expandAllBtn.onclick = () => {
        document.querySelectorAll(".lang-input, .lang-input-single").forEach((textarea) => {
            textarea.style.height = "150px";
        });
    };

    elements.collapseAllBtn.onclick = () => {
        document.querySelectorAll(".lang-input, .lang-input-single").forEach((textarea) => {
            textarea.style.height = "60px";
        });
    };

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
        // Ctrl+S to save focused row
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault();
            const activeElement = document.activeElement;
            if (activeElement && activeElement.closest("tr")) {
                const saveBtn = activeElement.closest("tr").querySelector(".btn-save, .btn-save-t, .btn-save-n");
                if (saveBtn) saveBtn.click();
            }
        }

        // Escape to close modal
        if (e.key === "Escape") {
            elements.addKeyModal.classList.remove("show");
        }
    });
}

// ==================== INITIALIZE ====================
function init() {
    initEventHandlers();
    loadAllData();
}

// Start app
init();
