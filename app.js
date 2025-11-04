import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";

const app = express();
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANG_DIR = path.join(__dirname, "locales");
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(express.static(PUBLIC_DIR));

function readLang(lang) {
  const filePath = path.join(LANG_DIR, `${lang}.json`);
  if (!fs.existsSync(filePath)) throw new Error(`Không tìm thấy file ${lang}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function saveLang(lang, data) {
  const filePath = path.join(LANG_DIR, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ✅ Lấy toàn bộ nội dung
app.get("/api/lang/:lang", (req, res) => {
  try {
    const data = readLang(req.params.lang);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ✅ Thêm hoặc sửa key bất kỳ
app.post("/api/lang/:lang", (req, res) => {
  try {
    const { pathKey, value } = req.body;
    if (!pathKey) return res.status(400).json({ error: "Thiếu pathKey" });
    const data = readLang(req.params.lang);
    const keys = pathKey.split(".");
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    saveLang(req.params.lang, data);
    res.json({ message: "✅ Cập nhật thành công", pathKey, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xóa key bất kỳ
app.delete("/api/lang/:lang", (req, res) => {
  try {
    const { pathKey } = req.body;
    if (!pathKey) return res.status(400).json({ error: "Thiếu pathKey" });
    const data = readLang(req.params.lang);
    const keys = pathKey.split(".");
    let obj = data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) return res.status(404).json({ error: "Không tìm thấy key" });
      obj = obj[keys[i]];
    }
    delete obj[keys[keys.length - 1]];
    saveLang(req.params.lang, data);
    res.json({ message: "🗑️ Xóa thành công", pathKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API riêng cho testimonials
// → thêm một testimonial mới (tự tạo đủ 4 trường)
app.post("/api/lang/:lang/testimonial", (req, res) => {
  try {
    const { content, author, name, company } = req.body;
    const lang = req.params.lang;
    const data = readLang(lang);

    if (!data.testimonials) data.testimonials = {};

    // tìm testimonial cuối cùng
    const numbers = Object.keys(data.testimonials)
      .map((k) => {
        const m = k.match(/testimonial(\d+)/);
        return m ? parseInt(m[1]) : 0;
      })
      .filter((n) => n > 0);

    const nextNum = numbers.length ? Math.max(...numbers) + 1 : 1;

    data.testimonials[`testimonial${nextNum}`] = content || "";
    data.testimonials[`testimonial${nextNum}Author`] = author || "";
    data.testimonials[`testimonial${nextNum}Name`] = name || "";
    data.testimonials[`testimonial${nextNum}Company`] = company || "";

    saveLang(lang, data);

    res.json({
      message: "✅ Đã thêm testimonial mới",
      id: nextNum,
      data: {
        content,
        author,
        name,
        company,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xóa toàn bộ 1 testimonial (4 trường)
app.delete("/api/lang/:lang/testimonial/:id", (req, res) => {
  try {
    const lang = req.params.lang;
    const id = req.params.id;
    const data = readLang(lang);
    if (!data.testimonials) return res.status(404).json({ error: "Không có testimonials" });

    const keys = [
      `testimonial${id}`,
      `testimonial${id}Author`,
      `testimonial${id}Name`,
      `testimonial${id}Company`,
    ];

    let deleted = 0;
    for (const k of keys) {
      if (data.testimonials[k]) {
        delete data.testimonials[k];
        deleted++;
      }
    }

    saveLang(lang, data);
    res.json({ message: `🗑️ Đã xóa testimonial ${id} (${deleted} trường)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ================== API TESTIMONIAL SONG NGỮ ==================

// ✅ Thêm 1 testimonial đồng thời cho 3 ngôn ngữ
app.post("/api/testimonial", (req, res) => {
  try {
    const { content, author, name, company } = req.body;

    const langs = ["en", "vi", "zh"];
    const results = [];

    langs.forEach((lang) => {
      const data = readLang(lang);
      if (!data.testimonials) data.testimonials = {};

      const nums = Object.keys(data.testimonials)
        .map((k) => {
          const m = k.match(/testimonial(\d+)/);
          return m ? parseInt(m[1]) : 0;
        })
        .filter((n) => n > 0);
      const nextNum = nums.length ? Math.max(...nums) + 1 : 1;

      data.testimonials[`testimonial${nextNum}`] = content?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Author`] = author?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Name`] = name?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Company`] = company?.[lang] || "";

      saveLang(lang, data);
      results.push({ lang, id: nextNum });
    });

    res.json({ message: "✅ Đã thêm testimonial mới cho EN-VI-ZH", results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Cập nhật 1 testimonial trên cả 3 ngôn ngữ
app.post("/api/testimonial/:id", (req, res) => {
  try {
    const { content, author, name, company } = req.body;
    const id = req.params.id;
    const langs = ["en", "vi", "zh"];

    langs.forEach((lang) => {
      const data = readLang(lang);
      if (!data.testimonials) data.testimonials = {};
      data.testimonials[`testimonial${id}`] = content?.[lang] || "";
      data.testimonials[`testimonial${id}Author`] = author?.[lang] || "";
      data.testimonials[`testimonial${id}Name`] = name?.[lang] || "";
      data.testimonials[`testimonial${id}Company`] = company?.[lang] || "";
      saveLang(lang, data);
    });

    res.json({ message: `✅ Đã cập nhật testimonial ${id} cho EN-VI-ZH` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xóa 1 testimonial ở cả 3 file
app.delete("/api/testimonial/:id", (req, res) => {
  try {
    const id = req.params.id;
    const langs = ["en", "vi", "zh"];

    langs.forEach((lang) => {
      const data = readLang(lang);
      if (data.testimonials) {
        ["", "Author", "Name", "Company"].forEach((f) => {
          delete data.testimonials[`testimonial${id}${f}`];
        });
        saveLang(lang, data);
      }
    });

    res.json({ message: `🗑️ Đã xóa testimonial ${id} cho EN-VI-ZH` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Test nhanh contact
app.get("/api/lang/:lang/contact", (req, res) => {
  try {
    const data = readLang(req.params.lang);
    res.json(data.contact || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () =>
  console.log("🚀 Server JSON nâng cấp testimonial đang chạy tại http://localhost:3000")
);
