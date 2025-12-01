import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// ------------------ MongoDB CONNECT ------------------
mongoose.connect(
  "mongodb+srv://votien4040_db_user:wYKL94DSiYx2Z3qG@vgbc.0wh1mqk.mongodb.net/vgbc")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));;


const LangSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // en, vi, zh
  lang: { type: String, required: true },
  data: { type: Object, default: {} },
});

const LangModel = mongoose.model("translations", LangSchema);

// ------------------ EXPRESS ------------------
const app = express();
app.use(bodyParser.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// ------------------ HELPERS ------------------
async function readLang(lang) {
  const doc = await LangModel.findById(lang);
  if (!doc) throw new Error(`Không tìm thấy ngôn ngữ: ${lang}`);
  return doc.data;
}

async function saveLang(lang, data) {
  await LangModel.updateOne(
    { _id: lang },
    { $set: { lang, data } },
    { upsert: true }
  );
}

// ------------------ API BULK (ĐẶT TRƯỚC :lang) ------------------

// ✅ API lấy tất cả ngôn ngữ cùng lúc
app.get("/api/lang/all", async (req, res) => {
  try {
    const [en, vi, zh] = await Promise.all([
      readLang("en"),
      readLang("vi"),
      readLang("zh")
    ]);
    res.json({ en, vi, zh });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API cập nhật bulk cho nhiều ngôn ngữ
app.post("/api/lang/bulk", async (req, res) => {
  try {
    const { pathKey, values } = req.body;
    if (!pathKey || !values) {
      return res.status(400).json({ error: "Thiếu pathKey hoặc values" });
    }

    const langs = ["en", "vi", "zh"];
    const results = [];

    for (const lang of langs) {
      if (values[lang] !== undefined) {
        const data = await readLang(lang);
        const keys = pathKey.split(".");
        let obj = data;

        for (let i = 0; i < keys.length - 1; i++) {
          if (!obj[keys[i]]) obj[keys[i]] = {};
          obj = obj[keys[i]];
        }

        obj[keys[keys.length - 1]] = values[lang];
        await saveLang(lang, data);
        results.push({ lang, status: "updated" });
      }
    }

    res.json({ message: "✅ Cập nhật thành công", pathKey, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API xóa key trên tất cả ngôn ngữ
app.delete("/api/lang/bulk", async (req, res) => {
  try {
    const { pathKey } = req.body;
    if (!pathKey) return res.status(400).json({ error: "Thiếu pathKey" });

    const langs = ["en", "vi", "zh"];

    for (const lang of langs) {
      const data = await readLang(lang);
      const keys = pathKey.split(".");
      let obj = data;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) break;
        obj = obj[keys[i]];
      }

      if (obj && obj[keys[keys.length - 1]] !== undefined) {
        delete obj[keys[keys.length - 1]];
        await saveLang(lang, data);
      }
    }

    res.json({ message: `🗑️ Đã xóa "${pathKey}" trên tất cả ngôn ngữ` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ API CƠ BẢN ------------------

// ✅ Lấy toàn bộ nội dung
app.get("/api/lang/:lang", async (req, res) => {
  try {
    const data = await readLang(req.params.lang);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ✅ Thêm hoặc sửa key bất kỳ
app.post("/api/lang/:lang", async (req, res) => {
  try {
    const { pathKey, value } = req.body;
    if (!pathKey) return res.status(400).json({ error: "Thiếu pathKey" });

    const data = await readLang(req.params.lang);
    const keys = pathKey.split(".");
    let obj = data;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    await saveLang(req.params.lang, data);

    res.json({ message: "✅ Cập nhật thành công", pathKey, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xóa key bất kỳ
app.delete("/api/lang/:lang", async (req, res) => {
  try {
    const { pathKey } = req.body;
    if (!pathKey) return res.status(400).json({ error: "Thiếu pathKey" });

    const data = await readLang(req.params.lang);
    const keys = pathKey.split(".");
    let obj = data;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) return res.status(404).json({ error: "Không tìm thấy key" });
      obj = obj[keys[i]];
    }

    delete obj[keys[keys.length - 1]];
    await saveLang(req.params.lang, data);

    res.json({ message: "🗑️ Xóa thành công", pathKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------ New ------------------
// ✅ Thêm news mới cho cả 3 ngôn ngữ
app.post("/api/news", async (req, res) => {
  try {
    const { image, title, content, author } = req.body;
    const langs = ["en", "vi", "zh"];
    const results = [];

    for (const lang of langs) {
      const data = await readLang(lang);
      if (!data.news) data.news = {};

      const nums = Object.keys(data.news)
        .map((k) => parseInt(k.match(/news(\d+)/)?.[1] || 0))
        .filter((n) => n > 0);
      const nextNum = nums.length ? Math.max(...nums) + 1 : 1;

      data.news[`news${nextNum}Image`] = image?.[lang] || "";
      data.news[`news${nextNum}Title`] = title?.[lang] || "";
      data.news[`news${nextNum}Content`] = content?.[lang] || "";
      data.news[`news${nextNum}Author`] = author?.[lang] || "";

      await saveLang(lang, data);
      results.push({ lang, id: nextNum });
    }

    res.json({ message: "✅ Đã thêm news mới cho EN - VI - ZH", results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Thêm news mới cho 1 ngôn ngữ
app.post("/api/lang/:lang/news", async (req, res) => {
  try {
    const lang = req.params.lang;
    const { image, title, content, author } = req.body;

    const data = await readLang(lang);
    if (!data.news) data.news = {};

    const numbers = Object.keys(data.news)
      .map((k) => parseInt(k.match(/news(\d+)/)?.[1] || 0))
      .filter((n) => n > 0);

    const nextNum = numbers.length ? Math.max(...numbers) + 1 : 1;

    data.news[`news${nextNum}Image`] = image || "";
    data.news[`news${nextNum}Title`] = title || "";
    data.news[`news${nextNum}Content`] = content || "";
    data.news[`news${nextNum}Author`] = author || "";

    await saveLang(lang, data);
    res.json({ message: "✅ Đã thêm news mới", id: nextNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Cập nhật news theo ID cho 1 ngôn ngữ
app.post("/api/lang/:lang/news/:id", async (req, res) => {
  try {
    const { lang, id } = req.params;
    const { image, title, content, author } = req.body;

    // Đọc dữ liệu gốc
    const data = await readLang(lang);
    if (!data.news) data.news = {};

    // Cập nhật lại các trường
    data.news[`news${id}Image`] = image || "";
    data.news[`news${id}Title`] = title || "";
    data.news[`news${id}Content`] = content || "";
    data.news[`news${id}Author`] = author || "";

    // Lưu lại
    await saveLang(lang, data);

    res.json({
      message: `✅ Đã cập nhật news ${id} cho ngôn ngữ ${lang}`,
      updated: { id, lang, image, title, content, author }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Xóa news theo ID trên EN - VI - ZH
app.delete("/api/news/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const langs = ["en", "vi", "zh"];

    for (const lang of langs) {
      const data = await readLang(lang);
      if (data.news) {
        ["Image", "Title", "Content", "Author"].forEach((suffix) => {
          delete data.news[`news${id}${suffix}`];
        });
        await saveLang(lang, data);
      }
    }

    res.json({ message: `🗑️ Đã xóa news ${id} trên EN - VI - ZH` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ------------------ TESTIMONIALS ------------------
// ✅ Thêm testimonial mới cho cả 3 ngôn ngữ
app.post("/api/testimonial", async (req, res) => {
  try {
    const { content, img, author, name, company } = req.body;
    const langs = ["en", "vi", "zh"];
    const results = [];

    for (const lang of langs) {
      const data = await readLang(lang);
      if (!data.testimonials) data.testimonials = {};

      const nums = Object.keys(data.testimonials)
        .map((k) => parseInt(k.match(/testimonial(\d+)/)?.[1] || 0))
        .filter((n) => n > 0);
      const nextNum = nums.length ? Math.max(...nums) + 1 : 1;

      data.testimonials[`testimonial${nextNum}Content`] = content?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Img`] = img?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Name`] = name?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Author`] = author?.[lang] || "";
      data.testimonials[`testimonial${nextNum}Company`] = company?.[lang] || "";

      await saveLang(lang, data);
      results.push({ lang, id: nextNum });
    }

    res.json({ message: "✅ Đã thêm testimonial mới cho EN - VI - ZH", results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Thêm testimonial mới
app.post("/api/lang/:lang/testimonial", async (req, res) => {
  try {
    const lang = req.params.lang;
    const { content, img, author, name, company } = req.body;


    const data = await readLang(lang);
    if (!data.testimonials) data.testimonials = {};

    const numbers = Object.keys(data.testimonials)
      .map((k) => parseInt(k.match(/testimonial(\d+)/)?.[1] || 0))
      .filter((n) => n > 0);

    const nextNum = numbers.length ? Math.max(...numbers) + 1 : 1;

    data.testimonials[`testimonial${nextNum}Content`] = content || "";
    data.testimonials[`testimonial${nextNum}Img`] = img || "";
    data.testimonials[`testimonial${nextNum}Name`] = name || "";
    data.testimonials[`testimonial${nextNum}Author`] = author || "";
    data.testimonials[`testimonial${nextNum}Company`] = company || "";

    await saveLang(lang, data);
    res.json({ message: "✅ Đã thêm testimonial mới", id: nextNum });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Xóa testimonial theo ID
// ✅ Xóa testimonial trên cả 3 ngôn ngữ
app.delete("/api/testimonial/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const langs = ["vi", "en", "zh"];

    for (const lang of langs) {
      const data = await readLang(lang);
      if (data.testimonials) {
        ["Content", "Img", "Author", "Name", "Company"].forEach((suffix) => {
          delete data.testimonials[`testimonial${id}${suffix}`];
        });
        await saveLang(lang, data);
      }
    }

    res.json({ message: `🗑️ Đã xóa testimonial ${id} trên EN - VI - ZH` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Cập nhật testimonial trên 3 ngôn ngữ
app.post("/api/testimonial/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, author, name, company } = req.body;
    const langs = ["en", "vi", "zh"];

    for (const lang of langs) {
      const data = await readLang(lang);
      if (!data.testimonials) data.testimonials = {};

      data.testimonials[`testimonial${id}`] = content?.[lang] || "";
      data.testimonials[`testimonial${id}Author`] = author?.[lang] || "";
      data.testimonials[`testimonial${id}Name`] = name?.[lang] || "";
      data.testimonials[`testimonial${id}Company`] = company?.[lang] || "";

      await saveLang(lang, data);
    }

    res.json({ message: `✅ Đã cập nhật testimonial ${id} cho EN-VI-ZH` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ API kiểm tra nhanh contact
app.get("/api/lang/:lang/contact", async (req, res) => {
  try {
    const data = await readLang(req.params.lang);
    res.json(data.contact || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Route mặc định
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ------------------ SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server JSON + MongoDB đang chạy trên cổng ${PORT}`);
});