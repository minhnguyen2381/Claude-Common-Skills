# Tài liệu tham khảo: giao thức chống bịa nguồn

Bịa tài liệu tham khảo là lỗi nghiêm trọng nhất mà một trợ lý có thể gây ra cho người học:
hội đồng tra một nguồn không tồn tại thì toàn bộ báo cáo mất tín nhiệm. Tài liệu này quy
định cách tìm, xác minh và ghi nguồn.

---

## 1. Luật bất di bất dịch

1. **Không bao giờ viết một tài liệu tham khảo từ trí nhớ.** Mọi mục phải xuất phát từ một
   kết quả tìm kiếm thật trong phiên làm việc này.
2. **Phải mở được nguồn.** Sau khi tìm thấy, dùng `WebFetch` (hoặc
   `firecrawl_research_read_paper`) để mở URL/DOI và **đối chiếu ba thứ**: tiêu đề, danh
   sách tác giả, năm công bố. Chỉ khi khớp mới ghi vào `refs.json`.
3. **Ghi lại bằng chứng.** Mỗi mục bắt buộc có
   `verified: { url, accessed, method }` — `accessed` là ngày thật (`YYYY-MM-DD`).
4. **Không có nguồn thì sửa luận điểm.** Nếu một câu cần dẫn chứng mà không tìm được nguồn
   thật, viết lại câu đó thành nhận định của chính nhóm ("Qua khảo sát mã nguồn, nhóm nhận
   thấy…") hoặc bỏ hẳn. Tuyệt đối không gắn một nguồn "gần đúng" cho có.
5. **Không dùng URL giả.** `example.com`, `example.org`, `localhost`, `TODO` — verifier
   (QĐ-12b) báo FAIL ngay.
6. **Không trích dẫn thứ chưa đọc.** Nếu chỉ đọc phần tóm tắt, đừng khẳng định chi tiết
   phương pháp hay con số trong bài báo đó.

## 2. Quy trình tìm nguồn

| Loại nguồn cần | Công cụ | Ghi chú |
|---|---|---|
| Bài báo khoa học, hội nghị | `firecrawl_research_search_papers`, `firecrawl_research_related_papers` | có DOI là tốt nhất |
| Đọc sâu một bài đã tìm được | `firecrawl_research_read_paper`, `firecrawl_research_inspect_paper` | để trích đúng kết luận |
| Tài liệu kỹ thuật chính thức | `firecrawl_developer_search`, `WebSearch` | Android Developers, MDN, tài liệu framework |
| Sách, giáo trình | `WebSearch` + trang nhà xuất bản / thư viện | cần năm và NXB chính xác |
| Nguồn tiếng Việt | `WebSearch` (tạp chí trong nước, thư viện số trường) | ưu tiên tạp chí có ISSN |

Trình tự cho mỗi luận điểm cần dẫn chứng:

```
Xác định luận điểm  ->  tìm 2-3 ứng viên  ->  fetch từng ứng viên
    ->  đối chiếu tiêu đề/tác giả/năm  ->  chọn 1  ->  ghi refs.json kèm verified
```

## 3. Định mức cho báo cáo trình độ thạc sĩ

| Tiêu chí | Mức tối thiểu |
|---|---|
| Tổng số tài liệu | 10–15 |
| Nguồn học thuật (`article` / `conference` / `book` / `thesis`) | ≥ 5 |
| Công bố trong 5 năm gần nhất | ≥ 3 |
| Nguồn tiếng Việt | ≥ 1 nếu lĩnh vực có công bố trong nước |
| Tài liệu được trích dẫn ít nhất một lần | 100% |

Builder cảnh báo nếu có tài liệu không được trích dẫn lần nào; verifier kiểm QĐ-13b.

## 4. Cách trích dẫn trong bài

Dùng `[[cite:key]]` — sinh ra `[n]` là **trường Word**, số tự cập nhật theo thứ tự trong
danh mục. Ba lỗi thường gặp:

| Sai | Đúng |
|---|---|
| Gõ `[3]` trực tiếp vào câu | `[[cite:fowler2002]]` |
| Dồn 5 trích dẫn vào cuối đoạn cho "có vẻ học thuật" | đặt trích dẫn ngay sau mệnh đề mà nó chứng minh |
| Trích nguồn cho điều hiển nhiên ("Android là hệ điều hành di động [4]") | chỉ trích cho khẳng định cần chứng minh |

Trích dẫn phải gắn với **một khẳng định cụ thể**. Câu "MVVM giúp tăng khả năng kiểm thử
[[cite:x]]" là hợp lệ khi nguồn `x` thật sự nói về khả năng kiểm thử.

## 5. Nguồn nội bộ: chính dự án GitHub

Số liệu về dự án (số dòng mã, số commit, số tác giả, danh sách phụ thuộc) **không phải tài
liệu tham khảo** — chúng là dữ liệu sơ cấp do nhóm thu thập. Cách ghi đúng:

- Trong `refs.json` thêm một mục `type: "repo"` cho chính kho mã, có URL và ngày truy cập —
  để người đọc tìm lại được đối tượng nghiên cứu.
- Trong thân bài, nêu rõ nguồn số liệu: *"Các số liệu trong Bảng 2.1 được trích xuất tự động
  từ kho mã tại thời điểm commit `a1b2c3d` (truy cập ngày 12/09/2026)."*
- Với bảng/hình dựng từ số liệu này, đặt `source: "Nguồn: nhóm tác giả tổng hợp từ repo-profile.json."`

**Mọi con số về dự án phải lấy từ `repo-profile.json`**, không ước lượng. Mọi đường dẫn file
nêu trong báo cáo phải tồn tại thật trong repo đã clone — verifier kiểm QĐ-15.

## 6. Mẫu điền `refs.json`

```jsonc
// Bài báo tiếng Việt
{ "key": "binhpv2006", "lang": "vi", "type": "article",
  "authors": ["Phạm Văn Bình", "Trần Thị Minh Diễm"], "year": 2006,
  "title": "Nghiên cứu tình hình nhiễm virus viêm gan B tỉnh Thừa Thiên Huế",
  "journal": "Tạp chí Y học Thực hành", "volume": 3, "issue": 536, "pages": "82-85",
  "verified": { "url": "https://...", "accessed": "2026-09-12", "method": "fetch" } }

// Sách tiếng Anh
{ "key": "fowler2002", "lang": "en", "type": "book",
  "authors": ["Fowler, M."], "year": 2002,
  "title": "Patterns of Enterprise Application Architecture",
  "publisher": "Addison-Wesley", "place": "Boston",
  "verified": { "url": "https://martinfowler.com/books/eaa.html", "accessed": "2026-09-12", "method": "fetch" } }

// Tài liệu kỹ thuật chính thức
{ "key": "google2024arch", "lang": "en", "type": "docs",
  "organization": "Google", "year": 2024,
  "title": "Guide to app architecture", "site": "Android Developers",
  "url": "https://developer.android.com/topic/architecture",
  "verified": { "url": "https://developer.android.com/topic/architecture", "accessed": "2026-09-12", "method": "fetch" } }

// Chính kho mã là đối tượng nghiên cứu
{ "key": "repo2026", "lang": "en", "type": "repo",
  "organization": "Android Open Source Project", "year": 2026,
  "title": "architecture-samples", "site": "GitHub",
  "url": "https://github.com/android/architecture-samples",
  "verified": { "url": "https://github.com/android/architecture-samples", "accessed": "2026-09-12", "method": "fetch" } }
```

Thứ tự in ra do builder tự tính: nhóm theo ngôn ngữ (Tiếng Việt trước), trong nhóm xếp ABC —
người Việt theo **tên**, người nước ngoài theo **họ** (QĐ-13). Số `[n]` đánh theo thứ tự in,
nên không cần và không được tự đánh số trong `refs.json`.
