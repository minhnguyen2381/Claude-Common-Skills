# Clean Architecture — Chapter 21: Screaming Architecture

## Core Idea
Nhìn vào cấu trúc thư mục cấp cao, kiến trúc phải **"hét lên" mục đích của hệ thống** ("Health Care System", "Accounting") chứ không phải tên framework ("Rails", "Spring/Hibernate"). Framework là **công cụ**, không phải **lối sống**.

## Frameworks Introduced
- **Screaming Architecture**: bản vẽ nhà hét "HOME", bản vẽ thư viện hét "LIBRARY". Top-level directory và package cấp cao nhất của app phải hét **use case**.
- **The Theme of an Architecture**: Ivar Jacobson, *Object Oriented Software Engineering: A Use Case Driven Approach*. Kiến trúc là cấu trúc hỗ trợ use case. *"If your architecture is based on frameworks, then it cannot be based on your use cases."*
- **Purpose**: kiến trúc sư nhà lo nhà *dùng được* trước, vật liệu (gạch/đá/gỗ) để sau. Tương tự, framework, DB, web server là **options để ngỏ**.
- **But what about the Web?** Web là **delivery mechanism, một thiết bị IO**, là detail. Có thể giao hệ thống dưới dạng console, web, thick client hay web service mà không đổi kiến trúc nền tảng.
- **Frameworks Are Tools, Not Ways of Life**: nhìn framework với "con mắt hoài nghi" (jaded eye): giúp được gì, giá bao nhiêu, làm sao **tự bảo vệ** khỏi nó.
- **Testable Architectures**: unit-test mọi use case **mà không cần framework**: không web server, không DB. Entity là plain old object; use case điều phối Entity.
- **Dev mới hỏi "views và controllers đâu?"**, câu trả lời là: *"Oh, those are details that needn't concern us at the moment. We'll decide about them later."*

## Key Concepts
- **Screaming**: cấu trúc phơi bày use case.
- **Delivery mechanism**: web/mobile/console chỉ là IO.
- **Framework skepticism**: dùng framework có kiểm soát.
- **Testable in situ**: test use case không cần hạ tầng.

## Mental Models
- **"5-second test"**: mở repo, nhìn top-level folder 5 giây. Bạn đoán được app làm gì hay chỉ đoán được app dùng framework gì?
- Framework là "khách", không phải "chủ nhà".

## Anti-patterns
- **Top-level = `controllers/ models/ views/`** (hét "MVC framework").
- **Để framework cung cấp kiến trúc** ("cứ theo Rails way").
- **Không test được use case nếu không bật server/DB**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Satellite2 hôm nay** (`app/src/main/java/pion/tech/pionbase/`):
```
app/ base/ customView/ data/ di/ domain/ feature/ util/      ← top-level hét "MVVM + Koin"
feature/ liveCameraMainScreen/ numberLocatorMap/ streetView360Map/ ...  ← cấp 2 mới hét use case
domain/usecase/ liveVideo/ numberLocator/ language/            ← đây là phần hét tốt nhất
```
- **Hướng "hét" hơn** (package-by-feature ở top, layer ở bên trong):
```
liveCamera/   domain/ (SearchLiveCamerasUseCase, LiveVideo)  data/  ui/ (MainScreen, Map, SearchResult, WatchVideo)
numberLocator/ domain/ (ValidatePhoneNumber, SearchNumberLocator, LookupQuota) data/ ui/
streetView360/ ...
core/ (base, di, util, designsystem)
```
  Hoặc với Gradle: `:feature:liveCamera`, `:feature:numberLocator`, `:feature:streetView360`, `:core:*`.
- **Framework skepticism trên Android**:
  - **Jetpack Navigation**: bọc sau interface `Navigator` (Satellite2 đã làm). ViewModel/UseCase không biết `NavController`.
  - **Koin**: chỉ xuất hiện trong `di/` và Fragment (`by viewModel()`); UseCase/Repository dùng constructor thuần.
  - **Firebase Remote Config / Analytics**: bọc sau `ConfigProvider` / `AnalyticsLogger` interface để test và để đổi vendor.
  - **Ads SDK**: nằm trong `:LibAds`, không lan vào domain.
- **Testable**: `./gradlew :app:testDebugUnitTest` chạy UseCase với fake repository, không Robolectric, không emulator. Satellite2 mới có `ExampleUnitTest.kt` và một vài test trong `data/domain/feature/util`. Thước đo screaming architecture thực tế là mỗi use case có test JVM thuần.

## Key Takeaways
1. Top-level structure phải hét use case, không hét framework.
2. Web/mobile là delivery mechanism, tức detail.
3. Dùng framework một cách hoài nghi; tự bảo vệ bằng ranh giới.
4. Use case phải test được mà không cần framework.

## Connects To
- **arch-ch16 (Decoupling use cases)**, **arch-ch32 (Frameworks Are Details)**, **arch-ch34 (Package by feature/component)**.
