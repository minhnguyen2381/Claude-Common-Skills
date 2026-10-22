# Clean Architecture — Chapter 4: Structured Programming

## Core Idea
Structured programming cho phép **phân rã đệ quy chương trình thành các đơn vị nhỏ có thể falsify (kiểm chứng sai)**. Vì phần mềm giống khoa học hơn toán học, ta không chứng minh code đúng mà dùng **test** để cố chứng minh nó sai.

## Frameworks Introduced
- **Sequence / Selection / Iteration**: Dijkstra (và Böhm–Jacopini) chỉ ra mọi chương trình đều xây được từ 3 cấu trúc này. `goto` không giới hạn phá vỡ khả năng phân rã.
- **"Go To Statement Considered Harmful"** (CACM, 1968): Dijkstra thắng; ngôn ngữ hiện đại không còn `goto` tự do.
- **Functional Decomposition**: chia bài toán lớn thành hàm cấp cao, rồi hàm cấp thấp hơn, đệ quy. Đây vẫn là best practice ở cấp kiến trúc.
- **Science, not Math**: *"Testing shows the presence, not the absence, of bugs."* Code được coi là "đủ đúng" khi mọi nỗ lực chứng minh nó sai đều thất bại.
  - How: viết hàm nhỏ, có thể test; chương trình không phân rã được thì không thể coi là đúng dù test bao nhiêu.

## Key Concepts
- **Provable unit**: đơn vị nhỏ dùng cấu trúc điều khiển có kỷ luật, có thể lý luận về nó.
- **Falsifiability**: tính có thể bị chứng minh sai; mục tiêu của kiến trúc là module/component/service **dễ falsify (testable)**.
- **Formal proofs**: giấc mơ hệ thống định lý Euclid cho phần mềm, đã thất bại.
- **Scientific method**: không chứng minh đúng, chỉ không chứng minh được sai.

## Mental Models
- Coi mỗi unit test là **một thí nghiệm cố bác bỏ giả thuyết** "hàm này đúng".
- Kiến trúc tốt = áp dụng kỷ luật kiểu structured programming **ở mức cao hơn** (component, boundary).

## Anti-patterns
- **Control flow không thể phân rã** (goto, hoặc tương đương hiện đại: callback hell, cờ boolean nhảy khắp nơi): không thể test, không thể tin.
- **Tin rằng đủ test thì code đúng**: test chỉ cho thấy có bug, không chứng minh vắng bug.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- "Goto hiện đại" trên Android: callback lồng nhau (`addOnSuccessListener { ... addOnSuccessListener { ... } }`). Bọc bằng `suspendCancellableCoroutine` để quay về luồng tuần tự, có thể lý luận, như cách `GetCurrentUserGPSLocationUseCase` trong Satellite2 làm.
- Functional decomposition cho UseCase: `invoke()` gọi 2–3 hàm private nhỏ, mỗi hàm một bước, và từng bước test được.
```kotlin
class GetUserLocationUseCase(private val locationSource: LocationSource) {
    suspend operator fun invoke(): Coordinates? =
        withTimeoutOrNull(TIMEOUT) { locationSource.current() }
            ?: withTimeoutOrNull(TIMEOUT) { locationSource.lastKnown() }
}
```
- Falsify bằng test JVM thuần: dùng `FakeLocationSource` trả `null` hoặc delay quá timeout để thử "bác bỏ" logic fallback.

## Key Takeaways
1. Phân rã chương trình thành đơn vị nhỏ, có thể test.
2. Test là công cụ khoa học: tìm cách chứng minh sai.
3. Kiến trúc sư thiết kế để mọi cấp (hàm → service) đều testable.

## Connects To
- **code-ch03 (Functions)**: hàm nhỏ, một việc. Đây chính là functional decomposition ở cấp code.
- **arch-ch28 (Test Boundary)**: test là một phần của hệ thống.
