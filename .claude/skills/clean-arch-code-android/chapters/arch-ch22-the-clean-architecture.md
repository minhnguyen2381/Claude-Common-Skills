# Clean Architecture — Chapter 22: The Clean Architecture

## Core Idea
Hexagonal (Ports & Adapters), DCI và BCE có cùng mục tiêu: **tách mối quan tâm bằng các lớp**. Clean Architecture hợp nhất chúng thành **các vòng tròn đồng tâm** với một luật duy nhất, **The Dependency Rule**: *"Source code dependencies must point only inward, toward higher-level policies."*

## Frameworks Introduced
- **5 đặc tính của hệ thống "sạch"**: Independent of frameworks · Testable (business rules test được không cần UI/DB/web server) · Independent of the UI · Independent of the database · Independent of any external agency.
- **The Dependency Rule**: vòng trong **không được biết bất cứ điều gì** về vòng ngoài: không nhắc tên function, class hay biến nào được khai báo ở vòng ngoài. **Data format** của vòng ngoài (nhất là do framework sinh ra) cũng không được dùng ở vòng trong.
- **4 vòng (từ trong ra ngoài)**:
  1. **Entities**: enterprise-wide Critical Business Rules (object hoặc data structure + function). Với một app đơn lẻ thì là business object của app. Ít đổi nhất; không bị ảnh hưởng bởi navigation hay security.
  2. **Use Cases**: application-specific business rules; điều phối data đến/đi từ Entities. Không ảnh hưởng Entities, không bị ảnh hưởng bởi DB/UI/framework. Đổi khi *nghiệp vụ vận hành* của app đổi.
  3. **Interface Adapters**: chuyển đổi format giữa use case/entity và bên ngoài (DB, web). Chứa **toàn bộ MVC** của GUI (Presenter, View, Controller). **Mọi SQL** nằm ở đây; vòng trong không biết gì về DB.
  4. **Frameworks and Drivers**: DB, web framework; chủ yếu là glue code. *"The web is a detail. The database is a detail."*
- **Only four circles?** Không bắt buộc 4; luật Dependency Rule thì **luôn** áp dụng. Vào trong thì càng trừu tượng, càng nhiều policy.
- **Crossing Boundaries**: flow of control đi Controller → Use Case → Presenter, nhưng source dependency đều chĩa **vào** Use Case. Use case gọi **Use Case Output Port** (interface ở vòng trong), Presenter (vòng ngoài) implement nó. Đây là DIP.
- **Which Data Crosses the Boundaries**: data structure **đơn giản, cô lập** (struct, DTO, tham số hàm, hashmap). **Không** truyền Entity hay **database row**. Data luôn ở dạng **thuận tiện cho vòng trong**.
- **A Typical Scenario** (web Java + DB):
  `Controller` → đóng gói input thành POJO → `InputBoundary` → `UseCaseInteractor` → (dùng `DataAccessInterface` ← `DataAccess` ← `Database`; điều phối `Entities`) → `OutputData` → `OutputBoundary` → `Presenter` → `ViewModel` (chủ yếu String + flag; Date/Currency đã format; tên Button/MenuItem; flag gray-out) → `View` (chỉ chuyển data từ ViewModel lên HTML).

## Key Concepts
- **Dependency Rule**.
- **Input Boundary / Output Boundary (Port)**: interface ở vòng use case.
- **Interactor**: hiện thực use case.
- **Data Access Interface (Gateway)**: interface vòng trong cho DB.
- **ViewModel (Clean Arch sense)**: POJO toàn String/boolean/enum đã sẵn để hiển thị.

## Mental Models
- **Mỗi `import` là một mũi tên.** Mũi tên nào chĩa ra ngoài là bug kiến trúc.
- Data vượt ranh giới phải **"nói ngôn ngữ của vòng trong"**.
- Vòng tròn là *sơ đồ*, không phải *số lượng thư mục cố định*.

## Anti-patterns
- **Entity/use case import framework** (ORM annotation, HTTP type, UI type).
- **Truyền DB row / ORM entity vào trong**.
- **View tự format dữ liệu** thay vì nhận string sẵn từ Presenter.
- **Use case gọi trực tiếp Presenter cụ thể**.

## Worked Example
```
[Controller] --InputData(DS)--> <I>InputBoundary <|-- [UseCaseInteractor]
[UseCaseInteractor] --> <I>DataAccessInterface <|-- [DataAccess] --> [Database]
[UseCaseInteractor] --> [Entities]
[UseCaseInteractor] --OutputData(DS)--> <I>OutputBoundary <|-- [Presenter]
[Presenter] --> ViewModel(DS) <-- [View]
Mọi mũi tên vượt đường ranh giới đều chĩa vào trong.
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
**Bản đồ vòng tròn ↔ Android (stack Satellite2: XML + ViewBinding, Koin, Flow, Room, Retrofit)**
| Vòng | Android | Được import gì |
|---|---|---|
| Entities | `domain/model` (`LiveVideo`, `E164`, `LookupQuota`) | Chỉ Kotlin stdlib |
| Use Cases | `domain/usecase/*UseCase`, `domain/repository/*Repository` (interface = DataAccessInterface) | Entities, `kotlinx.coroutines` |
| Interface Adapters | `ViewModel` (Controller+Presenter), `UiState`/`UIModel` (ViewModel của sách), mapper `toPresentation()`, `RepositoryImpl`, `Dto`↔domain mapper, Room `@Entity`/DAO | Use cases, Entities |
| Frameworks & Drivers | Fragment/XML/Adapter (View), Room DB, Retrofit/OkHttp, Google Maps SDK, Firebase, Koin modules | Mọi thứ |

**Luồng một use case trong app** (search live camera):
```kotlin
// Controller (Fragment/FragmentEx) — humble: chỉ chuyển input
binding.btnSearch.setPreventDoubleClick { viewModel.onSearch(binding.edtKeyword.text.toString()) }

// ViewModel = Controller + Presenter: gói input → gọi use case → format output thành UiState
fun onSearch(keyword: String) = launchIO {
    setState { copy(results = UiState.Loading) }
    when (val r = searchLiveCameras(SearchCamerasRequest(keyword, page = 0, pageSize = 20))) {
        is Result.Success -> setState { copy(results = UiState.Success(r.data.items.map { it.toPresentation() })) }
        is Result.Error   -> setState { copy(results = UiState.Error(r.error)) }
    }
}

// Interactor — chỉ biết domain
class SearchLiveCamerasUseCase(private val repo: LiveVideoRepository) {
    suspend operator fun invoke(req: SearchCamerasRequest): Result<SearchCamerasResponse> =
        repo.search(req.keyword, req.page, req.pageSize)
}
```
- **Output Port trên Android**: thực tế thường thay *Output Boundary interface* bằng **giá trị trả về / `Flow`** của use case. Cách này vẫn đúng Dependency Rule, vì kiểu trả về (`SearchCamerasResponse`) khai báo ở vòng use case. Đây là đơn giản hóa phổ biến và chấp nhận được.
- **Kiểm tra Dependency Rule bằng một lệnh**:
```bash
# domain không được import data/feature/android
grep -rnE "^import (pion\.tech\.pionbase\.(data|feature)|android\.|com\.google\.android)" app/src/main/java/pion/tech/pionbase/domain
```
  Satellite2 hiện có các hit loại này (use case import `data.repository.*`, `data.model.*UiModel`, `android.content.Context`, `com.google.android.gms`). Đó là danh sách việc cần dọn.
- **Data qua ranh giới**: Repository nên trả domain model, không trả `XxxDtoModel` có `@SerializedName`; Room `@Entity` không được lên tới ViewModel.

## Key Takeaways
1. Một luật duy nhất: dependency chỉ chĩa vào trong.
2. Vòng trong không biết tên hay format của vòng ngoài.
3. Dùng DIP (output port / interface) khi flow of control đi ra ngoài.
4. Data qua ranh giới là DS đơn giản theo nhu cầu vòng trong; không truyền Entity hay DB row.
5. Kết quả là hệ thống tự nhiên testable và dễ thay DB/UI/framework.

## Connects To
- **arch-ch11 (DIP)**, **arch-ch20 (Entities/Use cases)**, **arch-ch23 (Presenters & Humble Objects)**, **arch-ch26 (Main)**.
- **code-ch06**: Objects vs Data Structures (data qua ranh giới là DS).
