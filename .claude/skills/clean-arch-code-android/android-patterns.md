# 🤖 Android Patterns — Clean Code + Clean Architecture cho Android

> Phần **chuyển thể**, không có trong hai cuốn sách. Mỗi pattern ghi rõ nguyên tắc gốc (arch-chNN / code-chNN / mã heuristic).
> Stack tham chiếu theo dự án Satellite2: Kotlin, XML + ViewBinding, single-Activity + Navigation, **Koin**, Coroutines/Flow, Room, Retrofit/OkHttp, DataStore, `BaseViewModel<State, Event>` + `setState {}` + `launchIO {}`, `Result<T>` (data) / `UiState<T>` (UI), DtoModel → UIModel. Compose/Hilt áp dụng tương tự.

---

## 1. Bản đồ tầng (Dependency Rule, arch-ch22)

```
┌──────────────── Frameworks & Drivers ─────────────────┐
│ Fragment/XML/Adapter · Room DB · Retrofit · Maps SDK  │
│ Firebase · Ads SDK · Koin modules · Application (Main)│
│  ┌──────────── Interface Adapters ─────────────────┐  │
│  │ ViewModel (Controller+Presenter) · UiState/UI   │  │
│  │ Model · toPresentation() · RepositoryImpl ·     │  │
│  │ DTO↔domain mapper · Room Entity/DAO             │  │
│  │  ┌──────────── Use Cases ───────────────────┐   │  │
│  │  │ XxxUseCase · Repository/Provider         │   │  │
│  │  │ interfaces · Request/Response models     │   │  │
│  │  │  ┌──────── Entities ──────────────┐      │   │  │
│  │  │  │ domain model + business rules  │      │   │  │
│  │  │  └────────────────────────────────┘      │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────┘
         import chỉ được chĩa VÀO TRONG
```

| Câu hỏi | Trả lời |
|---|---|
| Domain được import gì? | Kotlin stdlib, `kotlinx.coroutines` (must-marry, arch-ch32). **Không** `android.*`, `com.google.*`, Retrofit, Room, Gson, Koin |
| Interface repository nằm đâu? | **domain** (policy sở hữu abstraction, arch-ch11/17) |
| DTO/Entity đi tới đâu? | Dừng ở `data`; map sang domain model tại `RepositoryImpl` (arch-ch30) |
| UiModel nằm đâu? | Presentation/feature, cạnh ViewModel (CCP, arch-ch13) |
| DI framework xuất hiện ở đâu? | `di/` + `Application` (Main, arch-ch26); class khác dùng constructor thuần |

---

## 2. Bố cục package/module

**Giai đoạn 1: một `:app`, package-by-feature, domain thuần** (phù hợp Satellite2 hiện tại; "skip the last step", arch-ch24):
```
pion/tech/pionbase/
├── core/            base/, di/ (Main), util/, designsystem/, navigation/Navigator
├── liveCamera/
│   ├── domain/      LiveVideo.kt, LiveVideoRepository.kt (interface), SearchLiveCamerasUseCase.kt
│   ├── data/        LiveVideoRepositoryImpl.kt, LiveVideoApi.kt, LiveVideoDto.kt, mappers
│   └── ui/          main/, map/, search/, watch/  (Fragment, FragmentEx, ViewModel, UiState, UiModel, adapter)
├── numberLocator/   domain/ data/ ui/
└── streetView360/   domain/ data/ ui/
```
Cách này **hét use case** (arch-ch21). Cưỡng chế Dependency Rule bằng test kiến trúc (mục 7).

**Giai đoạn 2: tách module khi có ma sát** (build chậm, 2+ team, cần `internal`, arch-ch25/34):
```
:app                  Main: Application, MainActivity, nav graph, Koin assembly
:feature:liveCamera   ui + domain + data của camera (data impl `internal`)
:feature:numberLocator
:core:domain-common   Coordinates, AppError, Result
:core:ui              BaseFragment, BaseViewModel, extensions, designsystem
:core:network         OkHttp/Retrofit factory, interceptors
:LibAds  :permissionx
```
Gradle **cấm vòng** (ADP), `internal` chặn import impl (arch-ch14/34).

---

## 3. Ví dụ end-to-end: "Tra số điện thoại" (Clean Code + Clean Arch cùng lúc)

### 3.1 Entities: business rules thuần (arch-ch20, code-ch06)
```kotlin
// numberLocator/domain/PhoneNumber.kt
@JvmInline
value class E164(val value: String) {
    init { require(PATTERN.matches(value)) { "Invalid E.164: $value" } }
    private companion object { val PATTERN = Regex("^\\+[1-9]\\d{6,14}$") }
}

data class LookupQuota(val usedToday: Int, val dailyLimit: Int) {
    fun allows(isPremium: Boolean): Boolean = isPremium || usedToday < dailyLimit   // G28, tên khẳng định G29
}
```

### 3.2 Ports do domain sở hữu (DIP, ISP: interface hẹp theo client)
```kotlin
interface PhoneNumberParser { fun toE164(raw: String, defaultRegion: String): E164? }   // bọc libphonenumber (code-ch08)
interface LookupHistoryWriter { suspend fun save(number: E164) }
interface LookupQuotaSource { suspend fun today(): LookupQuota }
interface PremiumStatusSource { val isPremium: Flow<Boolean> }
```

### 3.3 Use case: một việc, Request/Response thuần, lỗi theo nhu cầu caller
```kotlin
sealed interface LookupResult {
    data class Valid(val number: E164) : LookupResult
    data object InvalidFormat : LookupResult
    data object QuotaExceeded : LookupResult                // Special Case thay vì exception/null (code-ch07)
}

class LookupPhoneNumberUseCase(
    private val parser: PhoneNumberParser,
    private val quota: LookupQuotaSource,
    private val premium: PremiumStatusSource,
    private val history: LookupHistoryWriter,
) {
    suspend operator fun invoke(raw: String, defaultRegion: String): LookupResult {
        val number = parser.toE164(raw, defaultRegion) ?: return LookupResult.InvalidFormat
        if (!quota.today().allows(premium.isPremium.first())) return LookupResult.QuotaExceeded
        history.save(number)
        return LookupResult.Valid(number)
    }
}
```
Stepdown: parse → kiểm quota → lưu → trả kết quả, đều ở một mức trừu tượng (code-ch03).

### 3.4 Adapters (data): firmware mỏng, map tại ranh giới
```kotlin
class LibPhoneNumberParser(private val util: PhoneNumberUtil) : PhoneNumberParser {
    override fun toE164(raw: String, defaultRegion: String): E164? = runCatching {
        val parsed = util.parse(raw, defaultRegion)
        if (util.isValidNumber(parsed)) E164(util.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164)) else null
    }.getOrNull()
}

class RoomLookupHistoryStore(private val dao: LookupHistoryDao) : LookupHistoryWriter {
    override suspend fun save(number: E164) = dao.insert(LookupHistoryEntity(e164 = number.value, createdAt = System.currentTimeMillis()))
}
```

### 3.5 Presenter (ViewModel): format sẵn, View humble (arch-ch23)
```kotlin
data class NumberLocatorUiState(
    val input: String = "",
    @StringRes val errorRes: Int? = null,
    val isSearching: Boolean = false,
)
sealed interface NumberLocatorEvent {
    data class OpenResult(val e164: String) : NumberLocatorEvent
    data object ShowPaywall : NumberLocatorEvent
}

class NumberLocatorViewModel(
    private val lookupPhoneNumber: LookupPhoneNumberUseCase,
    private val deviceRegion: DeviceLocaleProvider,             // provider đã có trong Satellite2
) : BaseViewModel<NumberLocatorUiState, NumberLocatorEvent>(NumberLocatorUiState()) {

    fun onSearch(raw: String) = launchIO {
        setState { copy(input = raw, isSearching = true, errorRes = null) }
        render(lookupPhoneNumber(raw, deviceRegion.getDeviceLanguageCode().uppercase()))
    }

    private suspend fun render(result: LookupResult) = when (result) {
        is LookupResult.Valid         -> { setState { copy(isSearching = false) }; setEvent(NumberLocatorEvent.OpenResult(result.number.value)) }
        LookupResult.InvalidFormat    -> setState { copy(isSearching = false, errorRes = R.string.invalid_phone_number) }
        LookupResult.QuotaExceeded    -> { setState { copy(isSearching = false) }; setEvent(NumberLocatorEvent.ShowPaywall) }
    }
}
```
> Ghi chú: ví dụ dùng locale làm region cho ngắn gọn; production nên có `DeviceRegionProvider` riêng (N2, đúng mức trừu tượng).

### 3.6 View (Fragment + FragmentEx): humble
```kotlin
fun NumberLocatorFragment.settingEvent() {
    binding.btnSearch.setPreventDoubleClickScaleView { viewModel.onSearch(binding.edtPhone.text.toString()) }
}
override fun subscribeObserver(view: View) {
    viewModel.uiState.map { it.errorRes }.distinctUntilChanged()
        .collectFlowOnView(viewLifecycleOwner) { res -> binding.tvError.text = res?.let(::getString) }
    viewModel.uiEvent.collectFlowOnView(viewLifecycleOwner) { event ->
        when (event) {
            is NumberLocatorEvent.OpenResult -> navigator.navigateTo(R.id.action_locator_to_map, bundleOf(ARG_E164 to event.e164))
            NumberLocatorEvent.ShowPaywall   -> navigator.navigateTo(R.id.action_global_iap)
        }
    }
}
```

### 3.7 Main (Koin): nơi duy nhất biết concrete (arch-ch26)
```kotlin
val numberLocatorModule = module {
    single { PhoneNumberUtil.getInstance() }
    singleOf(::LibPhoneNumberParser) bind PhoneNumberParser::class
    singleOf(::RoomLookupHistoryStore) bind LookupHistoryWriter::class
    singleOf(::DataStoreLookupQuotaSource) bind LookupQuotaSource::class
    factoryOf(::LookupPhoneNumberUseCase)
    viewModelOf(::NumberLocatorViewModel)
}
```

### 3.8 Test: JVM, nhanh, Given-When-Then (code-ch09, arch-ch28)
```kotlin
class LookupPhoneNumberUseCaseTest {
    private val history = FakeLookupHistory()
    private fun useCase(used: Int = 0, limit: Int = 3, premium: Boolean = false) = LookupPhoneNumberUseCase(
        parser = FakeParser(valid = setOf("+84912345678")),
        quota = FixedQuota(LookupQuota(used, limit)),
        premium = FixedPremium(premium),
        history = history,
    )

    @Test fun `free user over quota is blocked and nothing saved`() = runTest {
        val result = useCase(used = 3).invoke("+84912345678", "VN")
        assertEquals(LookupResult.QuotaExceeded, result)
        assertTrue(history.saved.isEmpty())
    }
    @Test fun `premium ignores quota`() = runTest {
        assertTrue(useCase(used = 99, premium = true).invoke("+84912345678", "VN") is LookupResult.Valid)
    }
}
```
(`FakeParser`, `FixedQuota`, `FixedPremium`, `FakeLookupHistory` là các fake nhỏ trong `src/test`, tuân thủ đúng contract của interface (arch-ch09 LSP).)

---

## 4. Repository pattern chuẩn hóa (LSP contract + DRY)

```kotlin
// core — một chỗ cho contract "không throw, rethrow cancel, chạy IO" (arch-ch09, code-ch12 G5)
inline fun <T> resultFlow(crossinline block: suspend () -> T): Flow<Result<T>> =
    flow<Result<T>> { emit(Result.Success(block())) }
        .catch { e -> if (e is CancellationException) throw e; emit(Result.Error(e.toAppError())) }
        .flowOn(Dispatchers.IO)

class LiveVideoRepositoryImpl(private val api: LiveVideoApi) : LiveVideoRepository {
    override fun mostViewed(limit: Int) = resultFlow { api.mostViewed(limit).data.map(LiveVideoDto::toDomain) }
}
```
Nếu là thao tác một lần (one-shot), `suspend fun …: Result<T>` đơn giản hơn `Flow<Result<T>>` chỉ emit một lần. Dùng `Flow` cho thứ **quan sát được** (Room, DataStore).

---

## 5. Lộ trình refactor Satellite2 (ưu tiên theo giá trị/rủi ro)

| # | Việc | Nguyên tắc | Rủi ro |
|---|---|---|---|
| 1 | Dừng truyền `UiModel` vào UseCase (thay bằng id/Request) | arch-ch20, Dependency Rule | Thấp |
| 2 | Chuyển interface `XxxRepository` sang `domain/`, trả domain model thay DTO | arch-ch11, ch22 | Trung bình (đổi nhiều import) |
| 3 | `GetCurrentUserGPSLocationUseCase` → `LocationSource` + `PlayServicesLocationSource`; domain dùng `Coordinates` | arch-ch29 (firmware) | Thấp |
| 4 | Gom lặp `flow{}.catch{}.flowOn()` vào `resultFlow {}` | code-ch12 G5 | Thấp |
| 5 | Tách `CommonViewModel` theo actor (catalog / premium / location) | arch-ch07 SRP | Trung bình |
| 6 | Inject dispatcher vào `launchIO` để test | arch-ch28, code-ch13 | Thấp |
| 7 | Formatting hiển thị chuyển từ Adapter sang mapper/Presenter (`UiText`) | arch-ch23 Humble Object | Thấp, làm dần từng màn |
| 8 | Test kiến trúc (mục 7) trong CI | arch-ch24/34 | Rất thấp |
| 9 | Xóa log debug/comment mumbling (`"testAPI"`, "Khai báo ngoài init block") | code-ch04 | Rất thấp |
| 10 | Khi build chậm hoặc nhiều team: tách `:feature:*` | arch-ch25 inflection point | Cao, chỉ làm khi có ma sát |

Mỗi bước: **impact analysis** (GitNexus, theo quy định dự án) → bước nhỏ → test xanh → commit (code-ch14).

---

## 6. Bảng quyết định nhanh

| Tình huống | Làm gì | Nguồn |
|---|---|---|
| Màn chỉ đọc 1 repository, không rule | ViewModel gọi Repository trực tiếp được (relaxed layering có chủ đích, ghi vào quy ước) | arch-ch34 |
| Có rule nghiệp vụ / kết hợp ≥2 nguồn / dùng lại ở ≥2 màn | Tạo UseCase | arch-ch20 |
| Logic cần `Context`/SDK | Interface ở domain + impl ở data/platform | arch-ch29 |
| Cùng "trông giống" ở 2 feature | Hỏi: cùng actor, cùng lý do đổi? Không thì giữ riêng | arch-ch16, ch07 |
| `when(type)` xuất hiện lần thứ 2 | Chuyển thành sealed/polymorphism + một factory | code-ch03, G23 |
| Hàm > ~20 dòng / >2 indent / >3 tham số | Tách hàm / argument object | code-ch03 |
| Class mô tả cần "và/hoặc" | Tách class | code-ch10 |
| Thêm SDK bên thứ ba | Wrapper/Adapter + learning test | code-ch08 |

---

## 7. Cưỡng chế kiến trúc tự động (Structure over Convention, G27)

**CI grep (không cần thư viện)**:
```bash
! grep -rnE "^import (android\.|com\.google\.android|retrofit2|androidx\.room|com\.google\.gson|org\.koin|pion\.tech\.pionbase\.(data|feature))" \
  app/src/main/java/pion/tech/pionbase/domain
```

**Konsist** (test JVM; API theo bản Konsist ≥ 0.13, kiểm lại khi nâng version):
```kotlin
@Test fun `clean architecture layers`() {
    Konsist.scopeFromProduction().assertArchitecture {
        val domain = Layer("Domain", "pion.tech.pionbase.domain..")
        val data = Layer("Data", "pion.tech.pionbase.data..")
        val presentation = Layer("Presentation", "pion.tech.pionbase.feature..")
        domain.dependsOnNothing()
        data.dependsOn(domain)
        presentation.dependsOn(domain)
    }
}
```
**detekt/ktlint** cho code-level smell (code-ch17).
