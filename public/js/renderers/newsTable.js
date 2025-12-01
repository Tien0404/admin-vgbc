// ==================== NEWS TABLE RENDERER ====================

import { state } from "../state.js";
import { escapeHtml, showToast } from "../utils.js";
import { createNews, deleteNews, updateNews } from "../api.js";

/**
 * Render bảng news đa ngôn ngữ
 */
export function renderNewsMultiLang(searchTerm = "", onReload) {
    const { allData } = state;
    const tableBody = document.getElementById("tableBody");
    const totalKeysEl = document.getElementById("totalKeys");
    const missingKeysEl = document.getElementById("missingKeys");
    const sectionTitle = document.getElementById("sectionTitle");

    const dataEn = allData.en?.news || {};
    const dataVi = allData.vi?.news || {};
    const dataZh = allData.zh?.news || {};

    // Gom nhóm news
    const groups = {};
    const allNews = { ...dataEn, ...dataVi, ...dataZh };

    for (let key in allNews) {
        const match = key.match(/news(\d+)(.*)/);
        if (match) {
            const num = match[1];
            if (!groups[num]) groups[num] = {};
        }
    }

    // Lấy dữ liệu cho từng news
    Object.keys(groups).forEach((num) => {
        groups[num] = {
            en: {
                image: dataEn[`news${num}Image`] || "",
                title: dataEn[`news${num}Title`] || "",
                content: dataEn[`news${num}Content`] || "",
                author: dataEn[`news${num}Author`] || "",
            },
            vi: {
                image: dataVi[`news${num}Image`] || "",
                title: dataVi[`news${num}Title`] || "",
                content: dataVi[`news${num}Content`] || "",
                author: dataVi[`news${num}Author`] || "",
            },
            zh: {
                image: dataZh[`news${num}Image`] || "",
                title: dataZh[`news${num}Title`] || "",
                content: dataZh[`news${num}Content`] || "",
                author: dataZh[`news${num}Author`] || "",
            },
        };
    });

    const ids = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b));

    totalKeysEl.textContent = ids.length;
    missingKeysEl.textContent = 0;
    sectionTitle.textContent = "📰 News - Tin tức";

    tableBody.innerHTML = "";

    if (ids.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">📰</div>
          <p>Chưa có bài news nào</p>
        </td>
      </tr>
    `;
    }

    ids.forEach((id) => {
        const n = groups[id];
        const row = document.createElement("tr");
        row.className = "news-row";
        row.innerHTML = createNewsRowHTML(id, n);

        // Save handler
        row.querySelector(".btn-save-n").onclick = async () => {
            await handleSaveNews(id, row, onReload);
        };

        // Delete handler
        row.querySelector(".btn-delete-n").onclick = async () => {
            await handleDeleteNews(id, onReload);
        };

        tableBody.appendChild(row);
    });

    // Add new news button
    const addRow = document.createElement("tr");
    addRow.innerHTML = `
    <td colspan="5" class="add-row">
      <button id="addNewsBtn" class="btn-add-item">
        ➕ Thêm bài News mới
      </button>
    </td>
  `;
    tableBody.appendChild(addRow);

    document.getElementById("addNewsBtn").onclick = async () => {
        try {
            await createNews({
                image: { vi: "", en: "", zh: "" },
                title: { vi: "", en: "", zh: "" },
                content: { vi: "", en: "", zh: "" },
                author: { vi: "", en: "", zh: "" },
            });
            showToast("✅ Đã tạo news mới!");
            if (onReload) await onReload();
        } catch (err) {
            showToast(`❌ Lỗi: ${err.message}`, "error");
        }
    };
}

/**
 * Tạo HTML cho 1 row news
 */
function createNewsRowHTML(id, n) {
    return `
    <td class="col-key">
      <div class="news-id">
        <span class="id-badge">#${id}</span>
        <div class="news-preview">
          ${n.en.image ? `<img src="${escapeHtml(n.en.image)}" alt="Preview" class="news-thumb">` : '<div class="no-image">📷</div>'}
        </div>
      </div>
    </td>
    <td class="col-lang news-cell">
      <div class="news-fields">
        <div class="field-group">
          <label>🖼️ Hình ảnh URL:</label>
          <input class="n-image-en" value="${escapeHtml(n.en.image)}" placeholder="Image URL...">
        </div>
        <div class="field-group">
          <label>📌 Tiêu đề:</label>
          <input class="n-title-en" value="${escapeHtml(n.en.title)}" placeholder="Title...">
        </div>
        <div class="field-group">
          <label>📝 Nội dung:</label>
          <textarea class="n-content-en" placeholder="Content...">${escapeHtml(n.en.content)}</textarea>
        </div>
        <div class="field-group">
          <label>✍️ Tác giả:</label>
          <input class="n-author-en" value="${escapeHtml(n.en.author)}" placeholder="Author...">
        </div>
      </div>
    </td>
    <td class="col-lang news-cell">
      <div class="news-fields">
        <div class="field-group">
          <label>🖼️ Hình ảnh URL:</label>
          <input class="n-image-vi" value="${escapeHtml(n.vi.image)}" placeholder="URL hình...">
        </div>
        <div class="field-group">
          <label>📌 Tiêu đề:</label>
          <input class="n-title-vi" value="${escapeHtml(n.vi.title)}" placeholder="Tiêu đề...">
        </div>
        <div class="field-group">
          <label>📝 Nội dung:</label>
          <textarea class="n-content-vi" placeholder="Nội dung...">${escapeHtml(n.vi.content)}</textarea>
        </div>
        <div class="field-group">
          <label>✍️ Tác giả:</label>
          <input class="n-author-vi" value="${escapeHtml(n.vi.author)}" placeholder="Tác giả...">
        </div>
      </div>
    </td>
    <td class="col-lang news-cell">
      <div class="news-fields">
        <div class="field-group">
          <label>🖼️ Hình ảnh URL:</label>
          <input class="n-image-zh" value="${escapeHtml(n.zh.image)}" placeholder="图片链接...">
        </div>
        <div class="field-group">
          <label>📌 Tiêu đề:</label>
          <input class="n-title-zh" value="${escapeHtml(n.zh.title)}" placeholder="标题...">
        </div>
        <div class="field-group">
          <label>📝 Nội dung:</label>
          <textarea class="n-content-zh" placeholder="内容...">${escapeHtml(n.zh.content)}</textarea>
        </div>
        <div class="field-group">
          <label>✍️ Tác giả:</label>
          <input class="n-author-zh" value="${escapeHtml(n.zh.author)}" placeholder="作者...">
        </div>
      </div>
    </td>
    <td class="col-action">
      <div class="action-buttons vertical">
        <button class="btn-save-n" title="Lưu news">💾 Lưu</button>
        <button class="btn-delete-n" title="Xóa news">🗑️ Xóa</button>
      </div>
    </td>
  `;
}

/**
 * Xử lý lưu news
 */
async function handleSaveNews(id, row, onReload) {
    try {
        for (const lang of ["en", "vi", "zh"]) {
            const image = row.querySelector(`.n-image-${lang}`).value;
            const title = row.querySelector(`.n-title-${lang}`).value;
            const content = row.querySelector(`.n-content-${lang}`).value;
            const author = row.querySelector(`.n-author-${lang}`).value;

            await updateNews(lang, id, { image, title, content, author });
        }

        showToast(`✅ Đã lưu news #${id} cho cả 3 ngôn ngữ!`);
        if (onReload) await onReload();
    } catch (err) {
        showToast(`❌ Lỗi: ${err.message}`, "error");
    }
}

/**
 * Xử lý xóa news
 */
async function handleDeleteNews(id, onReload) {
    if (!confirm(`Xóa news #${id} trên TẤT CẢ ngôn ngữ?`)) return;
    try {
        await deleteNews(id);
        showToast(`🗑️ Đã xóa news #${id}`);
        if (onReload) await onReload();
    } catch (err) {
        showToast(`❌ Lỗi: ${err.message}`, "error");
    }
}
