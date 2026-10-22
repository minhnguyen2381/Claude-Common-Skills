# Clean Architecture — Chapter 31: The Web Is a Detail

## Core Idea
Web không thay đổi gì cả. Nó chỉ là một nhịp trong **con lắc vô tận** giữa tập trung (server) và phân tán (client). **GUI là detail; web là GUI; nên web là detail.** Đặt nó sau ranh giới, tách khỏi business logic.

## Frameworks Introduced
- **The Endless Pendulum**: punched cards → mainframe + green-screen → minicomputer + dumb terminal → client–server → web (server farm, browser ngu) → applet → server-side → Web 2.0/Ajax → SPA → Node đưa JS về server… Kiến trúc sư nhìn dài hạn và đẩy các dao động này ra xa lõi business.
- **Company Q**: phần mềm tài chính cá nhân desktop được làm lại cho "trông như browser", người dùng ghét, nên sau vài bản phải quay về GUI desktop. Bài học: **tách business rules khỏi UI** vì "marketing geniuses" luôn rình.
- **Company A**: smartphone nâng cấp OS và thay đổi hoàn toàn look & feel của mọi app. Hy vọng app tách UI khỏi business rules.
- **The Upshot**: *"The GUI is a detail. The web is a GUI. So the web is a detail."* Web là **IO device**; bài học device independence của thập niên 1960 vẫn đúng.
- **Phản biện và giải pháp**: tương tác app–GUI rất "chatty" và đặc thù từng loại GUI, nên khó trừu tượng hóa toàn bộ "điệu nhảy". Nhưng **có thể** trừu tượng ở mức **use case**: tại một thời điểm, input đã đủ, thì đóng gói thành DS, chạy use case, rồi trả output DS về lại điệu nhảy UI. Mỗi use case vận hành thiết bị IO "UI" theo cách **độc lập thiết bị**. Không dễ, cần vài vòng lặp, nhưng khả thi.

## Key Concepts
- **Pendulum**: dao động tập trung/phân tán.
- **GUI as IO device**.
- **Chatty UI dance**: tương tác UI chi tiết, khó trừu tượng hóa.
- **Use-case-level abstraction**: input DS hoàn chỉnh → use case → output DS.

## Mental Models
- Đừng cố trừu tượng **mọi** tương tác UI; trừu tượng ở **điểm input hoàn chỉnh**.
- Thiết kế cho ngày "marketing đổi toàn bộ UI".

## Anti-patterns
- **Business logic sống trong UI layer** (validation, tính toán trong Activity/JS).
- **Để mốt UI quyết định cấu trúc lõi**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **"Mobile is a detail"**: Android UI (XML/View hay Compose), widget, Wear OS, Android Auto, notification đều là IO device. Cùng một `SearchLiveCamerasUseCase` phải phục vụ được màn search, home-screen widget, và một app TV sau này.
- **Company A ngoài đời thật**: Material 2 → Material 3/Material You, edge-to-edge bắt buộc (targetSdk 35+), predictive back, đổi từ XML sang Compose. App tách UI khỏi logic thì chỉ phải sửa tầng View.
- **Use-case-level abstraction cho UI chatty**: màn search có debounce, gợi ý, chip filter, paging (rất chatty và đặc thù UI). Phần chatty đó ở ViewModel/Fragment; khi input đủ (`keyword` đã submit, `page`, `filter`), đóng gói thành `SearchCamerasRequest` rồi gọi use case. Đây chính là cách `LiveCameraSearchResultViewModel` combine `pageIndex`, `pageSize`, `submitSearchKeyword` trước khi gọi use case; chỉ cần request không chứa UiModel.
- **XML → Compose migration test**: nếu đổi một màn sang Compose mà phải sửa ViewModel hoặc UseCase, ranh giới UI đang rò. ViewModel nên expose `StateFlow<UiState>` dùng được cho cả hai.

## Key Takeaways
1. Web/mobile UI là detail, là IO device.
2. Dao động công nghệ UI sẽ còn tiếp diễn; giữ chúng xa lõi.
3. Trừu tượng ở mức use case: input DS hoàn chỉnh → use case → output DS.

## Connects To
- **arch-ch21 (But what about the web?)**, **arch-ch23 (Presenter/View)**, **arch-ch15 (Device independence)**.
