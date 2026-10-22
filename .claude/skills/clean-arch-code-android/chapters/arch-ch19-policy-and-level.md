# Clean Architecture — Chapter 19: Policy and Level

## Core Idea
Chương trình là **một tuyên bố policy** biến input thành output. Kiến trúc tách các policy nhỏ ra và gom lại theo **cách chúng thay đổi**. **Level = khoảng cách tới input và output**; dependency phải chĩa từ level thấp tới level cao, **tách khỏi chiều data flow**.

## Frameworks Introduced
- **Policy grouping**: policy đổi cùng lý do và cùng lúc thì cùng level, cùng component; khác thì tách. Các component tạo thành **DAG**, cạnh là source dependency (`import`).
- **Level (strict definition)**: *"the distance from the inputs and outputs."* Càng xa I/O thì càng cao. Policy quản lý I/O là level thấp nhất.
- **Encryption example**:
  - Sai: `function encrypt() { while(true) writeChar(translate(readChar())); }`, vì hàm cấp cao phụ thuộc `readChar`/`writeChar` cấp thấp.
  - Đúng: `Encrypt` + interface `CharReader`, `CharWriter` nằm trong một biên (dashed border); `ConsoleReader`, `ConsoleWriter` implement chúng. Mọi dependency vượt biên **chĩa vào trong**.
  - `Translate` là component cao nhất (Page-Jones gọi là **"Central Transform"**).
- **Source dependency decoupled from data flow, coupled to level**.
- **Change frequency by level**: policy cấp cao đổi **ít** và vì lý do **quan trọng**; policy cấp thấp đổi **thường xuyên**, **gấp**, nhưng vì lý do **ít quan trọng**. Dependency chĩa lên cao giúp thay đổi gấp nhưng tầm thường ở dưới không ảnh hưởng tầng trên.
- **Lower-level components should be plugins to higher-level components**: `IODevices` → `Encryption`.
- Chương này là tổng hợp của **SRP, OCP, CCP, DIP, SDP, SAP**.

## Key Concepts
- **Policy**: quy tắc biến đổi input → output.
- **Level**: khoảng cách tới I/O.
- **Central Transform**: phần xa I/O nhất, chính là lõi.
- **Data flow vs dependency direction**: hai hướng độc lập.

## Mental Models
- Vẽ data flow (input → transform → output), rồi vẽ dependency: **mọi mũi tên chĩa vào transform**.
- Hỏi về một class: "Nó cách màn hình/network/DB bao xa?". Gần thì là plugin; xa thì là lõi.

## Anti-patterns
- **Lõi gọi trực tiếp hàm I/O** (`readChar`/`writeChar`, `api.get()`, `dao.insert()`).
- **Để chiều dependency đi theo data flow**.

## Code Examples
```java
// ❌ Kiến trúc sai — policy cao phụ thuộc I/O thấp
function encrypt() {
  while(true)
    writeChar(translate(readChar()));
}
```
- **What it demonstrates**: data flow đúng nhưng dependency sai hướng.

## 🤖 Android mapping (chuyển thể, không có trong sách)
Chuyển thể ví dụ Encrypt sang feature **parse & validate số điện thoại** (giống `ParseInternationalNumberUseCase` + `ValidatePhoneNumberUseCase` trong Satellite2):
```kotlin
// Level cao nhất — Central Transform: không biết EditText, libphonenumber hay Room
class LookupPhoneNumberUseCase(
    private val parser: PhoneNumberParser,       // <I> — như CharReader
    private val history: LookupHistoryStore,     // <I> — như CharWriter
) {
    suspend operator fun invoke(raw: String, defaultRegion: String): LookupResult {
        val number = parser.parse(raw, defaultRegion) ?: return LookupResult.Invalid
        history.save(LookupEntry(number.e164))
        return LookupResult.Valid(number)
    }
}

// Level thấp — plugin
class LibPhoneNumberParser(private val util: PhoneNumberUtil) : PhoneNumberParser { ... }
class RoomLookupHistoryStore(private val dao: LookupDao) : LookupHistoryStore { ... }
```
Data flow: `EditText → Fragment → ViewModel → UseCase → Room`. Dependency: `Fragment → ViewModel → UseCase ← RoomLookupHistoryStore`. Room chĩa **vào** UseCase dù data chảy **ra** Room.

| Level | Android component | Tần suất đổi |
|---|---|---|
| Cao | Entity / UseCase (`domain`) | Hiếm, lý do business |
| Giữa | ViewModel (presenter), mapper | Theo yêu cầu UX |
| Thấp | Fragment/XML, Adapter, Room DAO, Retrofit API, Google Maps SDK | Thường xuyên, gấp (UI tweak, đổi endpoint, SDK update) |

## Key Takeaways
1. Level = khoảng cách tới I/O.
2. Dependency chĩa từ thấp lên cao, độc lập với data flow.
3. Low-level là plugin của high-level.
4. Thay đổi gấp nhưng tầm thường ở I/O không được chạm tới lõi.

## Connects To
- **arch-ch08 (OCP hierarchy of protection)**, **arch-ch20 (Business Rules)**, **arch-ch22 (Clean Architecture)**.
