# Clean Architecture — Chapter 8: OCP — The Open-Closed Principle

## Core Idea
**"A software artifact should be open for extension but closed for modification."** Ở cấp kiến trúc, OCP đạt được bằng cách tách theo trục thay đổi (SRP), rồi sắp các component thành **hệ thống phân cấp bảo vệ**: component cấp cao không bị ảnh hưởng bởi thay đổi ở cấp thấp (DIP).

## Frameworks Introduced
- **OCP (Bertrand Meyer, 1988)**: mở rộng behavior bằng cách *thêm code mới*, không phải *sửa code cũ*. Nếu mở rộng nhỏ mà phải sửa lớn thì kiến trúc đã "spectacular failure".
- **Thought Experiment, Financial Report**: báo cáo tài chính hiển thị trên web (cuộn, số âm màu đỏ). Yêu cầu mới: in ra máy in đen trắng (phân trang, header/footer, số âm trong ngoặc). Mục tiêu: lượng code cũ phải sửa **gần bằng 0**.
  - How: SRP tách *tính toán dữ liệu báo cáo* khỏi *trình bày*; DIP sắp dependency.
  - Component: **Controller**, **Interactor**, **Database**, **Presenters + Views**.
- **Rule of protection**: *"If component A should be protected from changes in component B, then component B should depend on component A."*
- **Hierarchy of protection by level**: Interactor (business rules, cao nhất, được bảo vệ nhiều nhất) > Controller > Presenter > View (thấp nhất, ít được bảo vệ nhất).
- **Directional control**: interface như `FinancialDataGateway`, `FinancialReportPresenter`, các View interface tồn tại để **đảo chiều** dependency.
- **Information hiding**: interface `FinancialReportRequester` che chi tiết Interactor khỏi Controller, tránh **transitive dependency** vào `FinancialEntities`.

## Key Concepts
- **<I>** interface, **<DS>** data structure; mũi tên mở = using, mũi tên đóng = implements.
- **Unidirectional component relationships**: mỗi đường ranh giới chỉ bị vượt theo một chiều.
- **Transitive dependency**: phụ thuộc gián tiếp vào thứ không dùng trực tiếp, vi phạm ISP/CRP.
- **Level**: khoảng cách tới input/output; càng xa I/O thì càng cao.

## Mental Models
- Vẽ mũi tên dependency **chĩa về phía thứ cần được bảo vệ**.
- Hỏi: "Khi thêm một **output mới** (in, export PDF, widget), mình phải sửa những file nào?". Câu trả lời lý tưởng là chỉ thêm file mới.

## Anti-patterns
- **Business logic trong View/Presenter**: thêm kênh hiển thị mới thì phải sao chép logic.
- **Controller biết Entities** qua transitive dependency.
- **Thêm `if (outputType == PRINT)` khắp nơi**: đó là sửa chứ không phải mở rộng.

## Worked Example
```
[Controller] --> <I> FinancialReportRequester <|-- [Interactor: FinancialReportGenerator]
[Interactor] --> <I> FinancialDataGateway <|-- [Database: FinancialDataMapper]
[Interactor] --> <I> FinancialReportPresenter <|-- [ScreenPresenter], [PrintPresenter]
[ScreenPresenter] --> <I> ScreenView <|-- WebView
[PrintPresenter]  --> <I> PrintView  <|-- PDFView
```
Thêm "in ra giấy" = thêm `PrintPresenter` + `PrintView`; Interactor không đổi.

## 🤖 Android mapping (chuyển thể, không có trong sách)
| Sách | Android (stack Satellite2) |
|---|---|
| Controller | Fragment / `FragmentEx` nhận click và gọi ViewModel |
| Interactor | `XxxUseCase` (`factoryOf` trong Koin) |
| Presenter | `ViewModel` map `DtoModel → UIModel`, giữ `UiState` |
| View | Fragment + XML/ViewBinding, `BaseListAdapter` |
| Database gateway | `Repository` interface + `RepositoryImpl` (Room/Retrofit) |

Ví dụ OCP: màn danh sách live camera cần thêm **home-screen widget**.
```kotlin
// UseCase không đổi — trả domain model
class GetMostViewedCamerasUseCase(private val repo: LiveVideoRepository) {
    suspend operator fun invoke(limit: Int): List<LiveVideo> = repo.getMostViewed(limit)
}
// Mở rộng: Presenter mới cho widget (thêm file, không sửa file cũ)
class CameraWidgetPresenter(private val useCase: GetMostViewedCamerasUseCase) {
    suspend fun render(): RemoteViewsModel = useCase(3).toWidgetModel()
}
```
Nếu logic "most viewed" nằm trong `LiveCameraMainViewModel` thì widget phải copy logic hoặc phụ thuộc vào ViewModel, tức là vi phạm OCP.

## Key Takeaways
1. OCP ở cấp kiến trúc = SRP (tách) + DIP (hướng dependency).
2. Mũi tên dependency chĩa về thứ cần bảo vệ; business rules được bảo vệ nhiều nhất.
3. Interface có hai vai trò: **đảo chiều** dependency và **che giấu** thông tin.
4. Thêm kênh output mới chỉ nên tốn thêm file, không sửa file cũ.

## Connects To
- **arch-ch07 (SRP)**, **arch-ch11 (DIP)**, **arch-ch19 (Policy and Level)**, **arch-ch23 (Presenters)**.
