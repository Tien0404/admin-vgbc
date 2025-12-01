// ==================== MULTI-LANG TABLE RENDERER ====================

import { state } from "../state.js";
import { flatten, escapeHtml, autoResize, showToast } from "../utils.js";
import { updateBulkLang, deleteBulkLang } from "../api.js";

/**
 * Render bảng đa ngôn ngữ (3 cột EN/VI/ZH)
 */
export function renderMultiLangTable(searchTerm = "", onReload) {
    const { allData, currentSection } = state;
    const tableBody = document.getElementById("tableBody");
    const totalKeysEl = document.getElementById("totalKeys");
    const missingKeysEl = document.getElementById("missingKeys");
    const sectionTitle = document.getElementById("sectionTitle");

    const sectionData = {
        en: allData.en?.[currentSection] || {},
        vi: allData.vi?.[currentSection] || {},
        zh: allData.zh?.[currentSection] || {},
    };

    // Lấy tất cả keys từ cả 3 ngôn ngữ
    const allKeys = new Set([
        ...Object.keys(flatten(sectionData.en)),
        ...Object.keys(flatten(sectionData.vi)),
        ...Object.keys(flatten(sectionData.zh)),
    ]);

    const flatEn = flatten(sectionData.en);
    const flatVi = flatten(sectionData.vi);
    const flatZh = flatten(sectionData.zh);

    // Filter theo search
    let filteredKeys = [...allKeys];
    if (searchTerm) {
        filteredKeys = filteredKeys.filter((key) => {
            const keyMatch = key.toLowerCase().includes(searchTerm);
            const enMatch = String(flatEn[key] || "").toLowerCase().includes(searchTerm);
            const viMatch = String(flatVi[key] || "").toLowerCase().includes(searchTerm);
            const zhMatch = String(flatZh[key] || "").toLowerCase().includes(searchTerm);
            return keyMatch || enMatch || viMatch || zhMatch;
        });
    }

    // Đếm keys thiếu
    let missingCount = 0;
    filteredKeys.forEach((key) => {
        if (!flatEn[key] || !flatVi[key] || !flatZh[key]) missingCount++;
    });

    totalKeysEl.textContent = filteredKeys.length;
    missingKeysEl.textContent = missingCount;
    sectionTitle.textContent = `📁 Section: ${currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}`;

    // Sort keys
    filteredKeys.sort();

    tableBody.innerHTML = "";

    if (filteredKeys.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>Không có dữ liệu trong section "${currentSection}"</p>
        </td>
      </tr>
    `;
        return;
    }

    filteredKeys.forEach((key) => {
        const enValue = flatEn[key] || "";
        const viValue = flatVi[key] || "";
        const zhValue = flatZh[key] || "";

        const isMissing = !enValue || !viValue || !zhValue;
        const rowClass = isMissing ? "row-missing" : "";

        const row = document.createElement("tr");
        row.className = rowClass;
        row.innerHTML = `
      <td class="col-key">
        <div class="key-wrapper">
          <code>${escapeHtml(key)}</code>
          ${isMissing ? '<span class="badge-missing">⚠️ Thiếu</span>' : ""}
        </div>
      </td>
      <td class="col-lang">
        <textarea class="lang-input input-en" data-lang="en" placeholder="English...">${escapeHtml(String(enValue))}</textarea>
        ${!enValue ? '<span class="lang-missing">Chưa có bản dịch EN</span>' : ""}
      </td>
      <td class="col-lang">
        <textarea class="lang-input input-vi" data-lang="vi" placeholder="Tiếng Việt...">${escapeHtml(String(viValue))}</textarea>
        ${!viValue ? '<span class="lang-missing">Chưa có bản dịch VI</span>' : ""}
      </td>
      <td class="col-lang">
        <textarea class="lang-input input-zh" data-lang="zh" placeholder="中文...">${escapeHtml(String(zhValue))}</textarea>
        ${!zhValue ? '<span class="lang-missing">Chưa có bản dịch ZH</span>' : ""}
      </td>
      <td class="col-action">
        <div class="action-buttons">
          <button class="btn-save" title="Lưu tất cả ngôn ngữ">💾</button>
          <button class="btn-delete" title="Xóa key này">🗑️</button>
        </div>
      </td>
    `;

        // Event handlers
        const saveBtn = row.querySelector(".btn-save");
        const deleteBtn = row.querySelector(".btn-delete");

        saveBtn.onclick = async () => {
            const newEn = row.querySelector(".input-en").value;
            const newVi = row.querySelector(".input-vi").value;
            const newZh = row.querySelector(".input-zh").value;

            try {
                saveBtn.disabled = true;
                saveBtn.textContent = "⏳";

                await updateBulkLang(`${currentSection}.${key}`, {
                    en: newEn,
                    vi: newVi,
                    zh: newZh,
                });

                showToast(`✅ Đã lưu "${key}" cho cả 3 ngôn ngữ!`);
                if (onReload) await onReload();
            } catch (err) {
                showToast(`❌ Lỗi: ${err.message}`, "error");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = "💾";
            }
        };

        deleteBtn.onclick = async () => {
            if (!confirm(`Xóa "${key}" trên TẤT CẢ ngôn ngữ?`)) return;

            try {
                await deleteBulkLang(`${currentSection}.${key}`);
                showToast(`🗑️ Đã xóa "${key}"`);
                if (onReload) await onReload();
            } catch (err) {
                showToast(`❌ Lỗi: ${err.message}`, "error");
            }
        };

        tableBody.appendChild(row);
    });

    // Auto-resize textareas
    document.querySelectorAll(".lang-input").forEach((textarea) => {
        autoResize(textarea);
        textarea.addEventListener("input", () => autoResize(textarea));
    });
}
