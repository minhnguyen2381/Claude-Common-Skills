# Patterns & Techniques

## Dependency Inversion via Interface (Plugin)
**When to use**: policy cấp cao cần gọi chi tiết cấp thấp (DB, network, SDK).
**How**: interface ở phía policy (domain), impl ở phía detail (data), nối ở Main (Koin). Flow of control đi ra, source dependency đi vào. (arch-ch05, ch11, ch17)
**Trade-offs**: thêm một interface; chỉ đáng ở **ranh giới** có volatility, không phải mọi class (code-ch12).

## Abstract Factory / Main (Composition Root)
**When to use**: cần tạo object concrete mà không phụ thuộc vào nó; app quyết định *khi nào* tạo.
**How**: mọi `new` concrete gom vào Main/DI module; factory interface cho thời điểm do app quyết định. (arch-ch11, ch26; code-ch11)
**Trade-offs**: thêm gián tiếp; DI framework phải dừng ở Main.

## Humble Object (Presenter/View, Gateway/DB)
**When to use**: tách phần khó test (UI, DB, SDK callback) khỏi phần testable.
**How**: View/impl chỉ gán hoặc gọi; Presenter/Interactor chứa logic, format sẵn String/boolean/enum. (arch-ch23)
**Trade-offs**: thêm model trung gian (UiModel), nhưng test JVM được.

## Request/Response Models
**When to use**: dữ liệu vào/ra use case.
**How**: `data class` thuần, không chứa Entity, không kế thừa framework, không chứa UiModel. (arch-ch20, ch22)
**Trade-offs**: copy field (duplication giả, chấp nhận được).

## Partial Boundary (Skip Last Step / Strategy / Facade)
**When to use**: có thể cần ranh giới sau này nhưng làm đầy đủ thì quá đắt.
**How**: interface đầy đủ nhưng chung module; hoặc Strategy một chiều; hoặc Facade. Canh bằng test kiến trúc. (arch-ch24)
**Trade-offs**: suy thoái nếu không canh (backchannel, Périphérique).

## Breaking Dependency Cycles
**When to use**: vòng giữa component/package.
**How**: (1) DIP: đặt interface mà A cần vào A, B implement; (2) tách component mới chứa phần dùng chung. (arch-ch14)
**Trade-offs**: thêm component/interface; cấu trúc "jitter".

## Wrap Third-Party API / Adapter
**When to use**: dùng Map, SDK, thư viện, API chưa tồn tại.
**How**: class bọc với interface theo nhu cầu app; dịch exception; learning tests; boundary tests. (code-ch07, ch08)
**Trade-offs**: thêm lớp mỏng; được tự do đổi vendor và mock dễ.

## Special Case (Null Object)
**When to use**: luồng bình thường có trường hợp đặc biệt (không có dữ liệu).
**How**: trả object đặc biệt (`PerDiemMealExpenses`, `emptyList()`, `LookupResult.QuotaExceeded`) thay null/exception. (code-ch07)
**Trade-offs**: thêm type; client sạch hơn hẳn.

## Replace Switch with Polymorphism ("ONE SWITCH")
**When to use**: `switch/when` theo type lặp ở nhiều nơi; thêm type thường xuyên.
**How**: một switch duy nhất trong factory tạo object đa hình; mọi hành vi khác dispatch qua interface. (code-ch03, ch14, G23)
**Trade-offs**: nếu thêm *hàm* thường xuyên hơn thêm *type*, sealed + `when` (procedural) có thể tốt hơn (code-ch06).

## Template Method / Strategy for Duplication
**When to use**: thuật toán giống nhau, khác một bước.
**How**: base class giữ khung, subclass/strategy điền "lỗ" (`VacationPolicy.alterForLegalMinimums`). (code-ch12)
**Trade-offs**: kế thừa cứng; ưu tiên Strategy khi có thể.

## Extract Function / Stepdown
**When to use**: hàm dài, nhiều section, trộn mức trừu tượng.
**How**: tách theo "TO paragraph"; mỗi khối `if`/`while` một dòng gọi hàm có tên; xếp hàm theo thứ tự đọc. (code-ch03, ch05)
**Trade-offs**: nhiều hàm nhỏ; cần tên tốt.

## Argument Object
**When to use**: hàm > 2–3 tham số, các tham số đi cùng nhau.
**How**: gom thành class (`Point center`, `SearchCamerasRequest`). (code-ch03)

## Explaining Variables / Encapsulate Conditional / Encapsulate Boundary
**When to use**: biểu thức khó đọc, `if` phức tạp, `+1/-1` rải rác.
**How**: biến trung gian có tên [G19], hàm `isXxx()` [G28], biến `nextLevel` [G33]. (code-ch17)

## Separate Construction from Use + DI
**When to use**: luôn luôn, ở cấp hệ thống.
**How**: Main/DI container dựng; runtime code nhận qua constructor; tránh lazy-init rải rác. (code-ch11)

## Aspect-like Cross-Cutting (Decorator / Interceptor)
**When to use**: log, retry, auth header, transaction, error handling chung.
**How**: decorator/interceptor/extension quấn quanh POJO (OkHttp Interceptor, `launchIO` handler, `Navigator`). (code-ch11)

## Segregation of Mutability
**When to use**: dữ liệu bị nhiều thread/coroutine truy cập.
**How**: immutable data + một cửa mutate có kỷ luật (CAS/`StateFlow.update`/`Mutex`); event sourcing nếu đủ tài nguyên. (arch-ch06, code-ch13)

## Learning Tests & Boundary Tests
**When to use**: tích hợp thư viện bên thứ ba.
**How**: test gọi API theo cách app dùng; chạy lại khi nâng version. (code-ch08)

## Testing DSL (Given-When-Then)
**When to use**: test đầy chi tiết hạ tầng.
**How**: hàm tiện ích test-only (`givenPages`, `whenUserSearches`, `thenStateShows`). (code-ch09)

## Successive Refinement
**When to use**: module đang thành "festering pile".
**How**: dừng thêm tính năng; test bảo vệ; hàng chục bước nhỏ, mỗi bước xanh. (code-ch14)

## Package by Component + Access Modifiers
**When to use**: muốn compiler cưỡng chế kiến trúc.
**How**: gom business + persistence của component vào package/module; chỉ lộ interface; impl `internal`. (arch-ch34)
**Trade-offs**: `internal` chỉ có hiệu lực giữa Gradle module.
