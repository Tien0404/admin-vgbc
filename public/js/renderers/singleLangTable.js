// ==================== SINGLE-LANG TABLE RENDERER ====================

import { state } from "../state.js";
import { flatten, escapeHtml, showToast } from "../utils.js";
import { updateSingleLang, deleteSingleLang } from "../api.js";

/**
 * Render bảng đơn ngôn ngữ
 */
export function renderSingleLangTable(searchTerm = "", onReload) {
    const { allData, currentSection, currentLang } = state;
    const tableBody = document.getElementById("tableBody");
    const totalKeysEl = document.getElementById("totalKeys");
    const missingKeysEl = document.getElementById("missingKeys");
    const sectionTitle = document.getElementById("sectionTitle");

    const sectionData = allData[currentLang]?.[currentSection] || {};
    const flat = flatten(sectionData);

    let keys = Object.keys(flat);
    if (searchTerm) {
        keys = keys.filter(
            (key) =>
                key.toLowerCase().includes(searchTerm) ||
                String(flat[key]).toLowerCase().includes(searchTerm)
        );
    }

    totalKeysEl.textContent = keys.length;
    missingKeysEl.textContent = 0;
    sectionTitle.textContent = `📁 Section: ${currentSection} (${currentLang.toUpperCase()})`;

    keys.sort();
    tableBody.innerHTML = "";

    if (keys.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Không có dữ liệu</p>
        </td>
      </tr>
    `;
        return;
    }

    keys.forEach((key) => {
        const value = flat[key] || "";
        const row = document.createElement("tr");
        row.innerHTML = `
      <td class="col-key"><code>${escapeHtml(key)}</code></td>
      <td colspan="3" class="col-lang-single">
        <textarea class="lang-input-single">${escapeHtml(String(value))}</textarea>
      </td>
      <td class="col-action">
        <div class="action-buttons">
          <button class="btn-save" title="Lưu">💾</button>
          <button class="btn-delete" title="Xóa">🗑️</button>
        </div>
      </td>
    `;

        row.querySelector(".btn-save").onclick = async () => {
            const newValue = row.querySelector(".lang-input-single").value;
            try {
                await updateSingleLang(currentLang, `${currentSection}.${key}`, newValue);
                showToast(`✅ Đã lưu "${key}"`);
                if (onReload) await onReload();
            } catch (err) {
                showToast(`❌ Lỗi: ${err.message}`, "error");
            }
        };

        row.querySelector(".btn-delete").onclick = async () => {
            if (!confirm(`Xóa "${key}"?`)) return;
            try {
                await deleteSingleLang(currentLang, `${currentSection}.${key}`);
                showToast(`🗑️ Đã xóa "${key}"`);
                if (onReload) await onReload();
            } catch (err) {
                showToast(`❌ Lỗi: ${err.message}`, "error");
            }
        };

        tableBody.appendChild(row);
    });
}
