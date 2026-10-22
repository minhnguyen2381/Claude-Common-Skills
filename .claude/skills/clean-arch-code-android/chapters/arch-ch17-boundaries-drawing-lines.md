# Clean Architecture — Chapter 17: Boundaries: Drawing Lines

## Core Idea
Kiến trúc là **nghệ thuật vẽ đường ranh giới** giữa các phần mềm, ngăn bên này biết về bên kia. Thứ hút cạn nhân lực là **coupling vào quyết định sớm** (framework, DB, web server, DI). Hãy vẽ ranh giới giữa **thứ quan trọng** (business rules) và **thứ không quan trọng** (GUI, DB), và cho mũi tên chĩa về business rules: **plugin architecture**.

## Frameworks Introduced
- **Premature decisions**: quyết định không liên quan tới use case (framework, DB, web server, utility lib, DI). Kiến trúc tốt khiến chúng thành **phụ** và **hoãn được**.
- **Sad story: Company P**: app desktop thành công; khi lên web, đội Java chọn kiến trúc **3-tier** phân tán (GUI/middleware/DB server). Mỗi domain object có 3 bản; thêm một field cần 3 class, 4 message, 8 protocol handler, 3 executable. Họ **chưa bao giờ** bán hệ thống cần server farm. ("Three-tier is not an architecture; it's a topology.")
- **Sad story: Company W**: "Architect" áp SOA enterprise cho một công ty quản lý xe nhỏ. Thêm contact vào sales record cần ServiceRegistry → `CreateContact` (hàng chục field phải bịa) → `UpdateContact`. Test phải khởi động mọi service, message bus, BPEL server.
- **Success: FitNesse**:
  - Quy tắc **"Download and Go"** (một jar).
  - Tự viết web server tối giản để hoãn quyết định web framework (về sau mới thêm Velocity).
  - Interface **`WikiPage`** che mọi truy cập dữ liệu: `MockWikiPage` (stub, 3 tháng chỉ làm wiki→HTML), `InMemoryPage` (hash table trong RAM, một năm tính năng), `FileSystemWikiPage` (flat file), và sau đó **bỏ hẳn MySQL**. Một khách hàng tự viết `MySqlWikiPage` trong **một ngày**.
  - 18 tháng không có DB: không lo schema, query, password, connection; test chạy nhanh.
- **Which lines do you draw?** Giữa thứ quan trọng và không quan trọng: GUI ↔ business rules, DB ↔ GUI, DB ↔ business rules.
  - `BusinessRules` → `DatabaseInterface` ← `DatabaseAccess` → `Database`. Ranh giới cắt qua quan hệ kế thừa, ngay dưới `DatabaseInterface`. `DatabaseInterface` nằm trong component BusinessRules.
- **"The IO is irrelevant"**: model của game vẫn chạy được khi không hiển thị. GUI là plugin của business rules.
- **Plugin Architecture / Plugin Argument**: ReSharper phụ thuộc Visual Studio, nên VS có thể làm hỏng ReSharper nhưng không ngược lại. Ta muốn quan hệ **bất đối xứng** này: business rules miễn nhiễm với thay đổi GUI/DB. Ranh giới là **firewall**.
- **Boundaries are drawn where there is an axis of change** = SRP. Sắp mũi tên từ detail cấp thấp tới abstraction cấp cao = **DIP + SAP**.

## Key Concepts
- **Boundary**: đường ngăn hiểu biết giữa hai phía.
- **Premature decision**: quyết định chi tiết đưa ra trước khi cần.
- **Topology vs architecture**: 3-tier là cách bố trí máy, không phải kiến trúc.
- **Plugin**: component tùy chọn hoặc có nhiều dạng, cắm vào lõi.
- **Axis of change**: trục mà hai phía đổi với tốc độ và lý do khác nhau.

## Mental Models
- "Bên nào **có thể làm hỏng** bên nào?". Hãy thiết kế để business rules không thể bị làm hỏng.
- Viết business rules với **Mock → InMemory → thật**, theo đúng lộ trình của FitNesse.

## Anti-patterns
- **Kiến trúc phân tán cho nhu cầu tưởng tượng** (Company P).
- **Enterprise SOA cho hệ thống nhỏ** (Company W).
- **Coi GUI là hệ thống**, đòi GUI chạy trước business rules.
- **Business rules biết schema/query language**.

## Worked Example
```
WikiPage (interface, trong BusinessRules)
 ├─ MockWikiPage        // tháng 1–3: stub
 ├─ InMemoryPage        // năm 1: HashMap trong RAM
 ├─ FileSystemWikiPage  // khi cần persistence → giữ luôn
 └─ MySqlWikiPage       // khách tự viết trong 1 ngày, sau đó bỏ
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
Lộ trình FitNesse cho một feature Android mới, "Lịch sử số điện thoại đã tra":
```kotlin
// domain — interface thuộc business rules
interface LookupHistoryStore {
    suspend fun save(entry: LookupEntry)
    fun observeRecent(limit: Int): Flow<List<LookupEntry>>
}

// Tuần 1: InMemory — làm UI, ViewModel, use case, test mà chưa cần Room
class InMemoryLookupHistoryStore : LookupHistoryStore {
    private val items = MutableStateFlow<List<LookupEntry>>(emptyList())
    override suspend fun save(entry: LookupEntry) = items.update { listOf(entry) + it }
    override fun observeRecent(limit: Int) = items.map { it.take(limit) }
}

// Tuần 3: khi chốt cần persistence — RoomLookupHistoryStore(dao) : LookupHistoryStore
// Koin: chỉ đổi một dòng trong di/
singleOf(::RoomLookupHistoryStore) bind LookupHistoryStore::class
```
- InMemory store **giữ lại cho unit test** ViewModel/UseCase, vì test nhanh như FitNesse.
- **Ranh giới cụ thể trong Android**: Fragment/View là plugin của ViewModel; ViewModel là plugin của UseCase; `RepositoryImpl`/Room/Retrofit là plugin của interface ở domain. Mũi tên `import` luôn chĩa vào trong.
- **Premature decision kiểu Android**: chọn Compose/Room/Hilt/multi-module ngay buổi đầu cho một app 5 màn; dựng "clean architecture" 4 tầng với Mapper cho mọi model khi chưa có use case nào. Đó là Company W phiên bản mobile.

## Key Takeaways
1. Coupling vào quyết định sớm là thứ đắt nhất.
2. Vẽ ranh giới giữa thứ quan trọng và không; mũi tên chĩa về business rules.
3. Đặt interface của DB/GUI **trong** component business rules.
4. Dùng Mock/InMemory để hoãn quyết định DB hàng tháng.
5. Ranh giới = trục thay đổi (SRP) + hướng dependency (DIP/SAP).

## Connects To
- **arch-ch18 (Boundary Anatomy)**, **arch-ch22 (Clean Architecture)**, **arch-ch30 (Database Is a Detail)**.
- **code-ch08 (Boundaries)**: cùng ý tưởng ở cấp code với third-party API.
