# Design system cho slide & script thuyết trình

`build-pptx.mjs` không cho phép tuỳ biến màu, cỡ chữ hay toạ độ trong `deck.json` — mọi giá
trị đến từ `assets/design-tokens.json`. Nhờ đó deck luôn nhất quán, và người viết chỉ phải
nghĩ về nội dung.

---

## 1. Token

**Khung hình** 13,333 × 7,5 inch (16:9). Lề ngang 0,8". Tiêu đề tại y = 0,72", gạch nhấn
tại y = 1,42", vùng nội dung 1,78" → 6,53", chân trang 6,82".

**Thang chữ** (điểm): display 40 · sectionTitle 36 · title 28 · h2 20 · body 16 · small 13 ·
caption 11 · kicker 12 · metricValue 40.

**Font** Arial (mặc định, có mặt trên mọi máy). Đổi sang Segoe UI bằng `type.fontHead`/
`type.fontBody` nếu chắc chắn máy trình chiếu có font đó.

**Ba palette** — chọn theo lĩnh vực dự án, khai báo ở `config.palette`:

| Palette | Dùng cho |
|---|---|
| `indigo-slate` | mặc định; hệ thống, kiến trúc, kỹ thuật phần mềm |
| `teal-graphite` | dữ liệu, học máy, phân tích |
| `burgundy-cream` | kinh tế, quản trị, giáo dục |

Mỗi palette có `primary`, `primaryDark`, `accent`, `ink`, `muted`, `surface`, `line`,
`onPrimary`, `onDark` và mảng `series` 6 màu cho biểu đồ. Verifier (SL-03) quét màu thật
trong file pptx và cảnh báo nếu có màu lạ.

## 2. Mười layout

| Layout | Master | Dùng khi | Trường nội dung |
|---|---|---|---|
| `COVER` | tối | slide 1 | `title`, `subtitle` (thông tin học phần/GVHD/thành viên lấy từ `report.json`) |
| `AGENDA` | sáng | slide 2 | `items[]` (tự chia 2 cột khi > 4 mục) |
| `SECTION` | tối | mở đầu mỗi phần lớn | `kicker` ("01"), `title`, `subtitle` |
| `BULLETS` | sáng | lập luận bằng lời | `lead?`, `bullets[]` |
| `TWO_COL` | sáng | đúng hai khái niệm đối sánh | `left{heading,bullets}`, `right{...}` |
| `FIGURE` | sáng | trình bày sơ đồ | `image`, `caption?`, `bullets?` (ảnh chiếm 58% khi có chữ) |
| `METRICS` | sáng | 2–4 con số then chốt | `metrics[{value,label}]`, `bullets?` |
| `TABLE` | sáng | đối chiếu nhiều tiêu chí | `header[]`, `rows[][]`, `source?` |
| `CHART` | sáng | xu hướng, phân bố | `chart{type,labels,series[],showValue?}`, `bullets?` |
| `QUOTE` | sáng | một phát biểu cần nhấn | `text`, `attribution` |
| `CLOSING` | tối | slide cuối | `title`, `subtitle`, `contacts[]` |

Biểu đồ hỗ trợ `bar` (ngang), `column`, `line`, `pie`, `doughnut`, `area`. Số liệu **phải
lấy từ `repo-profile.json`**, không bịa.

## 3. Ngân sách chữ (build sẽ dừng nếu vượt)

| Giới hạn | Giá trị |
|---|---|
| Tiêu đề slide | ≤ 60 ký tự |
| Số gạch đầu dòng | ≤ 6 |
| Mỗi gạch đầu dòng | ≤ 100 ký tự |
| Số chỉ số trên slide METRICS | ≤ 4 |
| Số dòng bảng | ≤ 8 |
| Script thuyết trình | ≥ 200 ký tự **mỗi slide** |
| Nhịp | 40–80 giây/slide |

Slide là **chỗ đặt luận điểm, không phải chỗ đặt đoạn văn**. Câu giải thích thuộc về notes.

Số slide hợp lý: 15 phút → 12–20 slide; 20 phút → 16–28 slide.

## 4. Script thuyết trình — bắt buộc, có công thức

Mọi slide phải có `notes`. Đây không phải quy ước mềm: `build-pptx.mjs` **dừng build** nếu
một slide thiếu hoặc script dưới 200 ký tự, và `verify-output.mjs` (SL-01) kiểm lại trên
file pptx đã sinh.

Công thức bốn phần:

```
⏱ ~<số>s | MỞ: <một câu dẫn vào slide>
| Ý CHÍNH: <2-3 ý, mỗi ý một mệnh đề hoàn chỉnh, nói thành lời chứ không đọc gạch đầu dòng>
| SỐ LIỆU/DẪN CHỨNG: <con số hoặc nguồn cụ thể, nếu slide có>
| CHUYỂN: <một câu nối sang slide sau>
```

Nguyên tắc viết script:

1. **Không đọc lại slide.** Gạch đầu dòng là từ khoá; script là câu nói đầy đủ bổ sung thông
   tin không có trên màn hình.
2. **Viết như nói.** Câu ngắn, đọc lên nghe tự nhiên. Tránh mệnh đề lồng ba tầng.
3. **Ghi thời lượng thật.** Tổng thời lượng các slide phải xấp xỉ `durationMinutes`.
4. **Có câu chuyển.** Người nghe cần biết vì sao slide sau nối tiếp slide này.
5. **Slide có số liệu thì script phải nói được số liệu đó đến từ đâu** — hội đồng hay hỏi
   đúng chỗ này.
6. **Slide cuối cần chuẩn bị cho Q&A**: nêu trước hai, ba hướng câu hỏi có thể gặp.

Ví dụ đạt yêu cầu:

> ⏱ ~70s | MỞ: Biểu đồ cho thấy phân bố dòng mã trên bốn tầng. | Ý CHÍNH: tầng giao diện
> chiếm tỷ trọng lớn nhất, điều này bình thường với ứng dụng nhiều màn hình; tầng domain khá
> mỏng cho thấy logic nghiệp vụ có thể còn nằm lẫn ở nơi khác; khối lượng mã kiểm thử tương
> đương tầng dữ liệu là dấu hiệu tích cực. | SỐ LIỆU: các con số trích từ `repo-profile.json`
> tại commit a1b2c3d. | CHUYỂN: Từ số liệu này nhóm rút ra các đánh giá sau.

## 5. Mạch deck cho buổi bảo vệ 15 phút

```
 1 COVER      Đề tài, học phần, GVHD, nhóm
 2 AGENDA     6 phần
 3 SECTION    01 - Đặt vấn đề
 4 BULLETS    Vấn đề cụ thể (3-4 ý)
 5 SECTION    02 - Cơ sở lý thuyết
 6 FIGURE     Sơ đồ khái niệm / kiến trúc tham chiếu
 7 SECTION    03 - Phương pháp
 8 TWO_COL    Hai hướng tiếp cận / hai nguồn dữ liệu
 9 SECTION    04 - Kết quả
10 METRICS    Quy mô dự án (số liệu thật)
11 CHART      Phân bố / xu hướng
12 FIGURE     Kiến trúc hệ thống thực tế
13 TABLE      Đối chiếu tiêu chí x kết quả
14 BULLETS    Hạn chế
15 SECTION    05 - Kết luận
16 BULLETS    Kết luận + hướng phát triển
17 CLOSING    Cảm ơn + Q&A
```

Deck phải **khớp với báo cáo**: dùng lại chính các hình đã render trong `figures/`, chính các
con số trong `repo-profile.json`, chính các kết luận ở chương 3. Sinh `deck.json` **sau khi**
nội dung báo cáo được duyệt, không viết song song.

## 6. `content/deck.json`

```jsonc
{
  "config": { "palette": "indigo-slate", "durationMinutes": 15 },
  "meta": { /* tuỳ chọn - mặc định kế thừa report.json */ },
  "slides": [
    { "layout": "COVER", "title": "...", "subtitle": "...", "notes": "⏱ ~45s | MỞ: ..." },
    { "layout": "BULLETS", "section": "Đặt vấn đề", "title": "...", "bullets": ["...", "..."], "notes": "..." },
    { "layout": "FIGURE", "section": "...", "title": "...", "image": "figures/fig-kien-truc.png",
      "caption": "...", "bullets": ["..."], "notes": "..." },
    { "layout": "CHART", "section": "...", "title": "...",
      "chart": { "type": "bar", "labels": ["ui","domain","data"], "series": [{ "name": "Dòng mã", "values": [4200,1800,3100] }], "showValue": true },
      "notes": "..." }
  ]
}
```

`section` là nhãn nhỏ màu nhấn ở góc trên trái — điền tên chương tương ứng để người nghe
biết đang ở đâu trong mạch báo cáo.
