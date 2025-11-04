const langSelect = document.getElementById("lang");
const reloadBtn = document.getElementById("reloadBtn");
const sectionTabs = document.getElementById("sectionTabs");
const sectionTitle = document.getElementById("sectionTitle");
const tableBody = document.querySelector("#translationTable tbody");
const keyInput = document.getElementById("keyInput");
const valueInput = document.getElementById("valueInput");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");

let currentLang = "en";
let currentSection = "nav";
let jsonData = {};

async function loadData() {
    try {
        const res = await fetch(`/api/lang/${currentLang}`);
        jsonData = await res.json();
        renderTable();
    } catch (err) {
        console.error("Lỗi load dữ liệu:", err);
    }
}

function flatten(obj, prefix = "", res = {}) {
    if (!obj) return res;
    for (let key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "object" && obj[key] !== null) {
            flatten(obj[key], path, res);
        } else {
            res[path] = obj[key];
        }
    }
    return res;
}

async function renderTable() {
  // ✅ Nếu là testimonials → bảng 3 ngôn ngữ
  if (currentSection === "testimonials") {
    await renderTestimonialsTable();
    return;
  }

  // ✅ Các section thường (nav, hero, contact, ...)
  const sectionData = jsonData[currentSection];
  if (!sectionData) {
    tableBody.innerHTML = `<tr><td colspan="3">❌ Section "${currentSection}" không có dữ liệu</td></tr>`;
    return;
  }

  sectionTitle.textContent = `Section: ${currentSection}`;
  const flat = flatten(sectionData);
  tableBody.innerHTML = "";

  Object.entries(flat).forEach(([key, value]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${key}</td>
      <td><textarea class="valueInput">${value}</textarea></td>
      <td>
        <button class="saveBtn">💾</button>
        <button class="deleteBtn">🗑️</button>
      </td>
    `;

    // ✅ Sửa giá trị
    row.querySelector(".saveBtn").onclick = async () => {
      const newValue = row.querySelector(".valueInput").value;
      await fetch(`/api/lang/${currentLang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathKey: `${currentSection}.${key}`,
          value: newValue,
        }),
      });
      alert(`✅ Đã lưu ${currentSection}.${key}`);
    };

    // ✅ Xóa
    row.querySelector(".deleteBtn").onclick = async () => {
      if (confirm(`Xóa "${currentSection}.${key}"?`)) {
        await fetch(`/api/lang/${currentLang}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pathKey: `${currentSection}.${key}` }),
        });
        await loadData();
      }
    };

    tableBody.appendChild(row);
  });
}


// 💬 Hiển thị bảng testimonials (4 cột)
function renderTestimonialsTable() {
    const data = jsonData.testimonials;
    if (!data) {
        tableBody.innerHTML = "<tr><td colspan='5'>❌ Không có testimonials</td></tr>";
        return;
    }

    // Gom nhóm
    const groups = {};
    for (let key in data) {
        const m = key.match(/testimonial(\d+)(.*)/);
        if (m) {
            const num = m[1];
            const field = m[2] || "Text";
            if (!groups[num]) groups[num] = {};
            groups[num][field] = data[key];
        }
    }

    tableBody.innerHTML = `
    <tr style="background:#e9f2ff;font-weight:bold">
      <td>#</td>
      <td>Nội dung</td>
      <td>Tác giả</td>
      <td>Tên</td>
      <td>Công ty</td>
      <td>Hành động</td>
    </tr>
  `;

    Object.entries(groups).forEach(([id, t]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${id}</td>
      <td><textarea class="testimonial-content">${t[""] || ""}</textarea></td>
      <td><input class="testimonial-author" value="${t["Author"] || ""}"/></td>
      <td><input class="testimonial-name" value="${t["Name"] || ""}"/></td>
      <td><input class="testimonial-company" value="${t["Company"] || ""}"/></td>
      <td>
        <button class="saveTBtn">💾</button>
        <button class="delTBtn">🗑️</button>
      </td>
    `;
        row.querySelector(".saveTBtn").onclick = async () => {
            const content = row.querySelector(".testimonial-content").value;
            const author = row.querySelector(".testimonial-author").value;
            const name = row.querySelector(".testimonial-name").value;
            const company = row.querySelector(".testimonial-company").value;

            await fetch(`/api/lang/${currentLang}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathKey: `testimonials.testimonial${id}`, value: content }),
            });
            await fetch(`/api/lang/${currentLang}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathKey: `testimonials.testimonial${id}Author`, value: author }),
            });
            await fetch(`/api/lang/${currentLang}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathKey: `testimonials.testimonial${id}Name`, value: name }),
            });
            await fetch(`/api/lang/${currentLang}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pathKey: `testimonials.testimonial${id}Company`, value: company }),
            });
            alert(`✅ Đã lưu testimonial ${id}`);
        };

        row.querySelector(".delTBtn").onclick = async () => {
            if (confirm(`Xóa toàn bộ testimonial ${id}?`)) {
                await fetch(`/api/lang/${currentLang}/testimonial/${id}`, { method: "DELETE" });
                await loadData();
            }
        };

        tableBody.appendChild(row);
    });

    // nút thêm mới
    const addRow = document.createElement("tr");
    addRow.innerHTML = `
    <td colspan="6" style="text-align:center;">
      <button id="addTestimonialBtn">➕ Thêm testimonial mới</button>
    </td>`;
    tableBody.appendChild(addRow);

    document.getElementById("addTestimonialBtn").onclick = async () => {
        await fetch(`/api/lang/${currentLang}/testimonial`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: "",
                author: "",
                name: "",
                company: "",
            }),
        });
        await loadData();
    };
}


// 🟢 Lưu / Sửa
saveBtn.onclick = async () => {
    const pathKey = keyInput.value.trim();
    const value = valueInput.value.trim();
    if (!pathKey) return alert("Nhập key!");
    const res = await fetch(`/api/lang/${currentLang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey, value }),
    });
    const data = await res.json();
    alert(data.message || data.error);
    await loadData();
    keyInput.value = "";
    valueInput.value = "";
};

// 🔴 Xóa
deleteBtn.onclick = async () => {
    const pathKey = keyInput.value.trim();
    if (!pathKey) return alert("Nhập key cần xóa");
    await fetch(`/api/lang/${currentLang}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathKey }),
    });
    await loadData();
    keyInput.value = "";
    valueInput.value = "";
};

// 🌀 Tải lại dữ liệu
reloadBtn.onclick = loadData;

// 🌐 Chọn ngôn ngữ
langSelect.onchange = () => {
    currentLang = langSelect.value;
    loadData();
};

// 🧭 Chuyển tab section
sectionTabs.querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
        sectionTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentSection = btn.dataset.section;
        renderTable();
    };
});

// 🚀 Tải lần đầu
loadData();
