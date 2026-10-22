# Clean Architecture — Chapter 10: ISP — The Interface Segregation Principle

## Core Idea
**Đừng phụ thuộc vào những thứ mình không dùng.** Ở cấp code, nó gây recompile/redeploy không cần thiết. Ở cấp kiến trúc, nó kéo theo "hành lý" (baggage) có thể gây lỗi mà mình không lường trước.

## Frameworks Introduced
- **ISP (OPS example)**: `User1` chỉ dùng `op1`, `User2` chỉ dùng `op2`, `User3` chỉ dùng `op3`, nhưng tất cả phụ thuộc class `OPS`. Đổi `op2` thì `User1` cũng phải recompile.
  - How: tách thành `U1Ops`, `U2Ops`, `U3Ops`; `OPS` implement cả ba; mỗi User chỉ phụ thuộc interface của mình.
- **ISP and Language**: ngôn ngữ static typing (Java, Kotlin) tạo source dependency qua `import`; ngôn ngữ dynamic (Ruby, Python) thì không, nên linh hoạt hơn. Nhưng ISP **không chỉ là chuyện ngôn ngữ**.
- **ISP and Architecture**: System S dùng framework F, F bị gắn với database D. S → F → D. Thay đổi hoặc lỗi trong tính năng của D mà F không dùng vẫn có thể buộc redeploy hoặc làm sập S.

## Key Concepts
- **Fat interface/class**: gom nhiều thao tác cho nhiều client khác nhau.
- **Segregated interface**: interface riêng theo nhu cầu từng client.
- **Baggage**: phần thừa của dependency, kéo theo rủi ro.
- **Transitive dependency**: phụ thuộc gián tiếp qua framework/library.

## Mental Models
- Trước khi thêm dependency (lib, module, interface), hỏi: "**Mình dùng bao nhiêu % của nó? Phần còn lại có thể làm hại mình không?**"
- Interface thuộc về **client** dùng nó, không thuộc về class cài đặt nó.

## Anti-patterns
- **God interface** mà mọi client đều phụ thuộc.
- **Kéo cả framework vào chỉ để dùng một tiện ích nhỏ**.
- **Framework ràng buộc DB/vendor** mà hệ thống không cần.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Fat `ApiInterface` của Retrofit**: một interface chứa mọi endpoint. Mọi Repository phụ thuộc toàn bộ API. Có thể tách `LiveVideoApi`, `StoreApi`, `MapsApi` (Satellite2 đã tách Maps sang Retrofit riêng vì lý do bảo mật, và cũng là một dạng ISP).
- **Base class "biết tất cả"**: `BaseFragment` cung cấp `viewModel`, `commonViewModel`, `navigator`, `dataStoreRepository`, `logger` cho **mọi** Fragment, kể cả Fragment không dùng DataStore. Đổi `DataStoreRepository` thì mọi Fragment bị ảnh hưởng. Cân nhắc inject theo nhu cầu (`by inject()` tại Fragment cần).
- **Repository interface hẹp theo use case**:
```kotlin
// ❌ Use case lưu lịch sử phụ thuộc cả repo 8 hàm
class SaveSearchHistoryUseCase(private val repo: SearchHistoryLiveCameraRepository)

// ✅ Interface hẹp do domain định nghĩa; RepositoryImpl implement nhiều interface
interface SearchHistoryWriter { suspend fun save(query: String) }
interface SearchHistoryReader { fun observeAll(): Flow<List<String>> }
class SearchHistoryRepositoryImpl(dao: SearchHistoryDao) : SearchHistoryWriter, SearchHistoryReader { ... }
// Koin: singleOf(::SearchHistoryRepositoryImpl) binds arrayOf(SearchHistoryWriter::class, SearchHistoryReader::class)
```
- **Module Gradle**: `:domain` không nên `implementation` Room/Retrofit chỉ vì cần một annotation. Đó là baggage kiểu S → F → D.

## Key Takeaways
1. Chỉ phụ thuộc vào thứ mình thực sự dùng.
2. Tách interface theo client.
3. Cẩn thận với framework và lib kéo theo dependency ẩn.

## Connects To
- **arch-ch13 (CRP)**: ISP ở cấp component.
- **arch-ch32 (Frameworks Are Details)**: đừng "cưới" framework.
