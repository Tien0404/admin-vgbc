// ==================== TESTIMONIALS TABLE RENDERER ====================

import { state } from "../state.js";
import { escapeHtml, showToast } from "../utils.js";
import { createTestimonial, deleteTestimonial, updateSingleLang } from "../api.js";

/**
 * Render bảng testimonials đa ngôn ngữ
 */
export function renderTestimonialsMultiLang(searchTerm = "", onReload) {
  const { allData } = state;
  const tableBody = document.getElementById("tableBody");
  const totalKeysEl = document.getElementById("totalKeys");
  const missingKeysEl = document.getElementById("missingKeys");
  const sectionTitle = document.getElementById("sectionTitle");

  const dataEn = allData.en?.testimonials || {};
  const dataVi = allData.vi?.testimonials || {};
  const dataZh = allData.zh?.testimonials || {};

  // Gom nhóm testimonials
  const groups = {};
  const allTestimonials = { ...dataEn, ...dataVi, ...dataZh };

  for (let key in allTestimonials) {
    const match = key.match(/testimonial(\d+)(.*)/);
    if (match) {
      const num = match[1];
      if (!groups[num]) groups[num] = {};
    }
  }

  // Lấy dữ liệu cho từng testimonial
  Object.keys(groups).forEach((num) => {
    groups[num] = {
      en: {
        img: dataEn[`testimonial${num}Img`] || "",
        content: dataEn[`testimonial${num}`] || dataEn[`testimonial${num}Content`] || "",
        author: dataEn[`testimonial${num}Author`] || "",
        name: dataEn[`testimonial${num}Name`] || "",
        company: dataEn[`testimonial${num}Company`] || "",
      },
      vi: {
        img: dataVi[`testimonial${num}Img`] || "",
        content: dataVi[`testimonial${num}`] || dataVi[`testimonial${num}Content`] || "",
        author: dataVi[`testimonial${num}Author`] || "",
        name: dataVi[`testimonial${num}Name`] || "",
        company: dataVi[`testimonial${num}Company`] || "",
      },
      zh: {
        img: dataZh[`testimonial${num}Img`] || "",
        content: dataZh[`testimonial${num}`] || dataZh[`testimonial${num}Content`] || "",
        author: dataZh[`testimonial${num}Author`] || "",
        name: dataZh[`testimonial${num}Name`] || "",
        company: dataZh[`testimonial${num}Company`] || "",
      },
    };
  });

  const ids = Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b));

  totalKeysEl.textContent = ids.length;
  missingKeysEl.textContent = 0;
  sectionTitle.textContent = "💬 Testimonials - Đánh giá khách hàng";

  tableBody.innerHTML = "";

  if (ids.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-icon">💬</div>
          <p>Chưa có testimonial nào</p>
        </td>
      </tr>
    `;
  }

  ids.forEach((id) => {
    const t = groups[id];
    const row = document.createElement("tr");
    row.className = "testimonial-row";
    row.innerHTML = createTestimonialRowHTML(id, t);

    // Save handler
    row.querySelector(".btn-save-t").onclick = async () => {
      await handleSaveTestimonial(id, row, onReload);
    };

    // Delete handler
    row.querySelector(".btn-delete-t").onclick = async () => {
      await handleDeleteTestimonial(id, onReload);
    };

    tableBody.appendChild(row);
  });

  // Add new testimonial button
  const addRow = document.createElement("tr");
  addRow.innerHTML = `
    <td colspan="5" class="add-row">
      <button id="addTestimonialBtn" class="btn-add-item">
        ➕ Thêm Testimonial mới
      </button>
    </td>
  `;
  tableBody.appendChild(addRow);

  document.getElementById("addTestimonialBtn").onclick = async () => {
    try {
      await createTestimonial({
        content: { vi: "", en: "", zh: "" },
        author: { vi: "", en: "", zh: "" },
        name: { vi: "", en: "", zh: "" },
        company: { vi: "", en: "", zh: "" },
      });
      showToast("✅ Đã tạo testimonial mới!");
      if (onReload) await onReload();
    } catch (err) {
      showToast(`❌ Lỗi: ${err.message}`, "error");
    }
  };
}

/**
 * Tạo HTML cho 1 row testimonial
 */
function createTestimonialRowHTML(id, t) {
  const imgUrl = t.en.img || t.vi.img || t.zh.img || "";
  return `
    <td class="col-key">
      <div class="testimonial-id">
        <span class="id-badge">#${id}</span>
        <div class="testimonial-img-preview">
          ${imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="Avatar" class="t-img-preview">` : '<div class="t-img-placeholder">📷</div>'}
        </div>
        <div class="field-group img-field">
          <label>Hình ảnh:</label>
          <input class="t-img" value="${escapeHtml(imgUrl)}" placeholder="URL hình ảnh...">
        </div>
      </div>
    </td>
    <td class="col-lang testimonial-cell">
      <div class="testimonial-fields">
        <div class="field-group">
          <label>Nội dung:</label>
          <textarea class="t-content-en" placeholder="Content...">${escapeHtml(t.en.content)}</textarea>
        </div>
        <div class="field-row">
          <div class="field-group half">
            <label>Tên:</label>
            <input class="t-name-en" value="${escapeHtml(t.en.name)}" placeholder="Name">
          </div>
          <div class="field-group half">
            <label>Chức vụ:</label>
            <input class="t-author-en" value="${escapeHtml(t.en.author)}" placeholder="Position">
          </div>
        </div>
        <div class="field-group">
          <label>Công ty:</label>
          <input class="t-company-en" value="${escapeHtml(t.en.company)}" placeholder="Company">
        </div>
      </div>
    </td>
    <td class="col-lang testimonial-cell">
      <div class="testimonial-fields">
        <div class="field-group">
          <label>Nội dung:</label>
          <textarea class="t-content-vi" placeholder="Nội dung...">${escapeHtml(t.vi.content)}</textarea>
        </div>
        <div class="field-row">
          <div class="field-group half">
            <label>Tên:</label>
            <input class="t-name-vi" value="${escapeHtml(t.vi.name)}" placeholder="Tên">
          </div>
          <div class="field-group half">
            <label>Chức vụ:</label>
            <input class="t-author-vi" value="${escapeHtml(t.vi.author)}" placeholder="Chức vụ">
          </div>
        </div>
        <div class="field-group">
          <label>Công ty:</label>
          <input class="t-company-vi" value="${escapeHtml(t.vi.company)}" placeholder="Công ty">
        </div>
      </div>
    </td>
    <td class="col-lang testimonial-cell">
      <div class="testimonial-fields">
        <div class="field-group">
          <label>Nội dung:</label>
          <textarea class="t-content-zh" placeholder="内容...">${escapeHtml(t.zh.content)}</textarea>
        </div>
        <div class="field-row">
          <div class="field-group half">
            <label>Tên:</label>
            <input class="t-name-zh" value="${escapeHtml(t.zh.name)}" placeholder="姓名">
          </div>
          <div class="field-group half">
            <label>Chức vụ:</label>
            <input class="t-author-zh" value="${escapeHtml(t.zh.author)}" placeholder="职位">
          </div>
        </div>
        <div class="field-group">
          <label>Công ty:</label>
          <input class="t-company-zh" value="${escapeHtml(t.zh.company)}" placeholder="公司">
        </div>
      </div>
    </td>
    <td class="col-action">
      <div class="action-buttons vertical">
        <button class="btn-save-t" title="Lưu testimonial">💾 Lưu</button>
        <button class="btn-delete-t" title="Xóa testimonial">🗑️ Xóa</button>
      </div>
    </td>
  `;
}

/**
 * Xử lý lưu testimonial
 */
async function handleSaveTestimonial(id, row, onReload) {
  const imgUrl = row.querySelector(".t-img").value;
  const updates = {
    en: {
      content: row.querySelector(".t-content-en").value,
      author: row.querySelector(".t-author-en").value,
      name: row.querySelector(".t-name-en").value,
      company: row.querySelector(".t-company-en").value,
    },
    vi: {
      content: row.querySelector(".t-content-vi").value,
      author: row.querySelector(".t-author-vi").value,
      name: row.querySelector(".t-name-vi").value,
      company: row.querySelector(".t-company-vi").value,
    },
    zh: {
      content: row.querySelector(".t-content-zh").value,
      author: row.querySelector(".t-author-zh").value,
      name: row.querySelector(".t-name-zh").value,
      company: row.querySelector(".t-company-zh").value,
    },
  };

  try {
    for (const lang of ["en", "vi", "zh"]) {
      const fields = [
        { key: `testimonials.testimonial${id}`, value: updates[lang].content },
        { key: `testimonials.testimonial${id}Content`, value: updates[lang].content },
        { key: `testimonials.testimonial${id}Author`, value: updates[lang].author },
        { key: `testimonials.testimonial${id}Name`, value: updates[lang].name },
        { key: `testimonials.testimonial${id}Company`, value: updates[lang].company },
        { key: `testimonials.testimonial${id}Img`, value: imgUrl },
      ];

      for (const field of fields) {
        await updateSingleLang(lang, field.key, field.value);
      }
    }

    showToast(`✅ Đã lưu testimonial #${id} cho cả 3 ngôn ngữ!`);
    if (onReload) await onReload();
  } catch (err) {
    showToast(`❌ Lỗi: ${err.message}`, "error");
  }
}

/**
 * Xử lý xóa testimonial
 */
async function handleDeleteTestimonial(id, onReload) {
  if (!confirm(`Xóa testimonial #${id} trên TẤT CẢ ngôn ngữ?`)) return;
  try {
    await deleteTestimonial(id);
    showToast(`🗑️ Đã xóa testimonial #${id}`);
    if (onReload) await onReload();
  } catch (err) {
    showToast(`❌ Lỗi: ${err.message}`, "error");
  }
}
