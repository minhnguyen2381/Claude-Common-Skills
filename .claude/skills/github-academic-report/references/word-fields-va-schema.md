# Trường Word & lược đồ nội dung

Hai thứ người viết cần nắm: **vì sao mọi con số đều là trường Word**, và **viết
`report.json` / `deck.json` như thế nào**.

---

## 1. Vì sao không được gõ số hiệu

Một báo cáo 40 trang sẽ được sửa nhiều lần: chèn thêm một hình vào giữa chương 2, bỏ một
bảng, thêm một tài liệu tham khảo. Nếu số hiệu là chữ gõ tay, mỗi lần sửa phải rà lại toàn
bộ số hiệu và mọi câu tham chiếu — gần như chắc chắn sẽ sót. Trường Word tự tính lại khi
nhấn `F9`.

Builder **không cho phép** gõ số: block chỉ khai báo `id` và `caption`; số hiệu do
`build-docx.mjs` sinh ra. `verify-output.mjs` (QĐ-07) quét văn bản nằm **ngoài** mọi trường
và báo FAIL nếu tìm thấy chuỗi dạng `Hình 2.1`, `Bảng 3.2`, `Phụ lục 1.1`.

## 2. Bảng công thức trường

| Mục đích | Trường sinh ra | Kết quả |
|---|---|---|
| Số chương trong caption | `STYLEREF 1 \s` | `2` — Word trả **chỉ phần số**, bỏ chữ "CHƯƠNG" trong định dạng danh sách |
| Số thứ tự hình trong chương | `SEQ Hinh \* ARABIC \s 1` | `1` — `\s 1` = đếm lại từ đầu ở mỗi Heading 1 |
| Số thứ tự bảng | `SEQ Bang \* ARABIC \s 1` | `1` |
| Số phụ lục | `SEQ PhuLuc \* ARABIC` | `1` |
| Số tài liệu tham khảo | `SEQ TLTK \* ARABIC` | `1` (đặt trong bookmark `ref_<key>`) |
| Tham chiếu chéo tới hình/bảng | `REF _Ref_<id> \h` | `Hình 2.1` (nhãn + số, có siêu liên kết) |
| Trích dẫn tài liệu | `REF ref_<key> \h` | `3`, được bọc trong `[` `]` |
| Mục lục | `TOC \o "1-4" \h \z` | cây mục lục 4 cấp |
| Danh mục hình vẽ | `TOC \c "Hinh" \h` | mọi đoạn chứa `SEQ Hinh` |
| Danh mục bảng biểu | `TOC \c "Bang" \h` | mọi đoạn chứa `SEQ Bang` |
| Số trang | `PAGE` | trong header, căn giữa |

Định danh SEQ dùng **ASCII không dấu** (`Hinh`, `Bang`, `PhuLuc`, `TLTK`) để tránh rủi ro
dấu tiếng Việt trong mã trường; chữ "Hình"/"Bảng" hiển thị là văn bản thường trong caption.

`Document({ features: { updateFields: true } })` khiến Word hỏi cập nhật trường ngay khi mở.

### Khi mở file lần đầu

1. Word hỏi *"This document contains fields that may refer to other files…"* → chọn **Yes**.
2. `Ctrl+A` rồi `F9`, **nhấn hai lần** — lần một tính `SEQ`/`STYLEREF`, lần hai để `REF` lấy
   được kết quả đã tính của caption.
3. `Alt+F9` bật/tắt chế độ xem mã trường — dùng để kiểm tra rằng số hiệu là trường chứ
   không phải chữ gõ tay.

### Nếu số chương trong caption hiện sai

Đặt `config.captionChapterSource = "seq"` trong `report.json`. Khi đó builder bỏ đánh số
danh sách cho tiêu đề và thay bằng chuỗi trường:

- Heading 1: `CHƯƠNG {SEQ Chuong \* ARABIC}: <tên>`
- Heading 2: `{SEQ Chuong \c}.{SEQ Muc2 \* ARABIC \s 1} <tên>`
- Heading 3: `{SEQ Chuong \c}.{SEQ Muc2 \c}.{SEQ Muc3 \* ARABIC \s 2} <tên>`
- Caption:  `Hình {SEQ Chuong \c}.{SEQ Hinh \* ARABIC \s 1}.`

(`\c` = lặp lại giá trị SEQ gần nhất phía trước; `\s N` = đếm lại ở mỗi Heading N.)

Chế độ `styleref` (mặc định) đã được kiểm chứng trên Microsoft Word: tiêu đề đánh số
`CHƯƠNG %1:` cho ra caption `Hình 1.1.`, `Hình 2.1.`, `Bảng 1.1.` đúng như mong đợi.

---

## 3. `content/report.json`

```jsonc
{
  "config": {
    "captionChapterSource": "styleref",   // "styleref" | "seq"
    "phuLucNumbering": "sequential"       // "sequential" | "theo-chuong"
  },
  "meta": {
    "daiHoc": "ĐẠI HỌC CÔNG NGHIỆP HÀ NỘI",
    "truong": "TRƯỜNG CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG",
    "loaiBaoCao": "BÁO CÁO BÀI TẬP LỚN",
    "hocPhan": "...", "tenDeTai": "...",
    "nguoiHuongDan": "TS. Nguyễn Văn A",
    "hinhThuc": "nhom",                   // "nhom" | "ca-nhan"
    "thanhVien": [{ "hoTen": "...", "maHocVien": "..." }],
    "lop": "...", "khoaHoc": "...", "diaDiem": "Hà Nội", "nam": 2026,
    "repoUrl": "https://github.com/..."
  },
  "abbreviations": [{ "viet_tat": "API", "day_du": "Application Programming Interface", "nghia": "Giao diện lập trình ứng dụng" }],
  "loiNoiDau": [ /* blocks */ ],
  "moDau":     [ /* blocks */ ],
  "chuongs":   [ { "title": "TỔNG QUAN VỀ ...", "blocks": [ /* blocks */ ] } ],
  "ketLuan":   [ /* blocks */ ],
  "phuLucs":   [ { "title": "...", "blocks": [ /* blocks */ ] } ]
}
```

`meta.tenDeTai`, `meta.hocPhan`, `meta.nguoiHuongDan` là bắt buộc.

### Các loại block

| `t` | Trường | Ghi chú |
|---|---|---|
| `p` | `text` | đoạn văn, thụt dòng đầu 1 cm, căn đều |
| `h2` `h3` `h4` | `text` | tiểu mục; builder tự đánh số `1.1`, `1.1.1`, `1.1.1.1` |
| `bullets` | `items: [string \| {text, level}]` | `level: 1` cho gạch đầu dòng con |
| `numbered` | `items` như trên | danh sách đánh số |
| `figure` | `id`, `caption`, `src`, `widthCm` | `src` mặc định `figures/<id>.png`; rộng tối đa 15,5 cm |
| `table` | `id`, `caption`, `header`, `rows`, `widths`, `align`, `source` | `widths` là phần trăm, tổng 100 |
| `code` | `lines: []`, `lang`, `caption` | khối mã đơn sắc, không đánh số hiệu |
| `quote` | `text` | trích dẫn thụt lề, in nghiêng |
| `note` | `text` | dòng chú thích nhỏ, in nghiêng, căn giữa |
| `pagebreak` | — | ngắt trang thủ công |

**Hình và bảng có `caption` bắt buộc nằm trong `chuongs`** — số hiệu đánh theo chương nên
đặt ở MỞ ĐẦU / KẾT LUẬN / PHỤ LỤC sẽ không có số chương. Builder báo lỗi rõ ràng nếu vi phạm.
Muốn chèn ảnh minh hoạ ở phụ lục thì bỏ `caption`, dùng `note`.

### Đánh dấu nội dòng

| Cú pháp | Sinh ra |
|---|---|
| `[[cite:key]]` | `[3]` — trường `REF ref_key \h` |
| `[[cite:k1,k2]]` | `[2], [5]` |
| `[[xref:fig-kien-truc]]` | `Hình 2.1` — trường `REF _Ref_... \h` |
| `**đậm**` | **đậm** |
| `*nghiêng*` | *nghiêng* |
| `` `mã` `` | chữ Consolas |

Trích dẫn tới key không có trong `refs.json`, hoặc tham chiếu tới `id` không tồn tại, làm
build **dừng ngay** kèm thông báo — không có chuyện lọt ra file cuối.

## 4. `content/refs.json`

```jsonc
{
  "references": [
    {
      "key": "google2024",              // khoá dùng trong [[cite:...]]
      "lang": "en",                     // "vi" | "en" | khác (kèm "langLabel")
      "type": "docs",                   // book | article | conference | thesis | web | docs | standard | repo | report
      "authors": ["Fowler, M."],        // hoặc "organization": "Google"
      "year": 2024,
      "title": "...",
      "journal": "...", "volume": 59, "issue": 4, "pages": "112-120",
      "publisher": "...", "place": "...",
      "site": "Android Developers", "url": "https://...",
      "verified": { "url": "https://...", "accessed": "2026-09-12", "method": "fetch" }
    }
  ]
}
```

`verified.url` + `verified.accessed` là **bắt buộc** — xem `tai-lieu-tham-khao.md`.

## 5. `content/figures.json`

```jsonc
{
  "figures": [
    { "id": "fig-kien-truc", "kind": "mermaid", "source": "flowchart LR\n  A --> B" },
    { "id": "fig-erd",  "kind": "drawio", "source": "<mxfile>…</mxfile>", "layout": "verticalFlow" },
    { "id": "fig-ui",   "kind": "image",  "path": "repo/docs/screen.png" }
  ]
}
```

`render-figures.mjs` xuất `figures/<id>.png` và ghi kích thước thật vào
`figures/manifest.json`, nhờ đó builder giữ đúng tỷ lệ ảnh khi chèn vào Word.

## 6. `content/deck.json`

Xem `slide-design-system.md`.
