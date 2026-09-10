# Android Code Review Checklist

Detailed criteria for each review dimension. Load this file in full when performing a review.

**How to use it**: every changed file is walked against **all seven dimensions**, in order.
Dimension 0 is a gate — if a change fails it, the finding is written before anything else,
because no amount of clean architecture rescues code that should not exist. Tick each box as
it is considered; a dimension with no finding is a normal outcome, a dimension that was never
considered is a gap.

Every subsection carries a section code (`0.1`, `2.3`, ...). Cite it in the `dim=` field of
each finding so the reasoning is traceable back to a criterion.

Companion references:
- `architecture-guide.md` — MVVM / MVI / Clean Architecture rules, layer contracts, Do/Don't
- `do-and-dont.md` — the code-example catalogue, indexed by the same section codes

---

## 0. YAGNI / KISS / DRY — **highest priority, evaluated first**

These three are not style preferences. They are the dimensions with the highest long-term
cost when violated, and they outrank every other dimension in this file. A change that is
architecturally immaculate but solves a problem nobody has is still a defect.

**Order of judgement for every changed file:**

1. **YAGNI** — should this code exist at all?
2. **KISS** — is this the simplest thing that solves the *actual* requirement?
3. **DRY** — is this knowledge already expressed somewhere in the codebase?

Only after all three pass does dimension 1 onward matter.

### 0.1 YAGNI — You Aren't Gonna Need It

- [ ] Does every added class / interface / parameter / config flag serve a requirement that
      exists **today**, in this change?
- [ ] Are there abstractions with exactly **one** implementation and no second one planned?
      (one `interface` + one `Impl` created in the same commit, purely "for testability",
      when the concrete class was already injectable)
- [ ] Are there generic type parameters, `Any`-typed maps, or plugin/registry mechanisms
      built for a future extension that no ticket asks for?
- [ ] Are there unused public functions, unused `sealed` subtypes, unused DI bindings, or
      dead `when` branches introduced by this change?
- [ ] Are there feature flags / remote-config keys added with no rollout plan?
- [ ] Are there "just in case" nullable fields, optional params with defaults nobody passes,
      or `TODO` placeholders shipped as production code?
- [ ] Is a new module / new layer being introduced for a single screen?

**Severity guide**: dead or unreachable code shipped → CRITICAL. A speculative abstraction
that adds one indirection hop → WARNING. An unused optional parameter → NITPICK.

### 0.2 KISS — Keep It Simple, Stupid

- [ ] Is there a materially shorter, more direct implementation with the same behaviour?
- [ ] Is the nesting depth reasonable? (> 3 levels of `if`/`let`/`when` is a smell)
- [ ] Are there chained scope functions (`let { run { apply { ... } } }`) where plain
      statements would read better?
- [ ] Is reflection, dynamic dispatch, annotation processing, or codegen used where a direct
      call would do?
- [ ] Is a design pattern (Factory / Builder / Strategy / Mediator) applied where a plain
      function or a `when` would be clearer?
- [ ] Is the async machinery proportionate? (a `SharedFlow` + `stateIn` + `combine` pipeline
      to deliver a value that is read once)
- [ ] Can a reader who did not write this understand the control flow in one pass?
- [ ] Are there clever one-liners that need a comment to explain what they do?

**Severity guide**: complexity that makes a bug likely → CRITICAL. Complexity that only
costs reading time → WARNING.

### 0.3 DRY — Don't Repeat Yourself

DRY is about **knowledge**, not about characters. Two blocks of similar-looking code that
change for different reasons are *not* a DRY violation, and merging them is a KISS violation.

- [ ] Is the same business rule (a validation, a threshold, a formatting rule, an error map)
      expressed in more than one place?
- [ ] Are magic numbers / strings / API keys / endpoint paths duplicated instead of being a
      `const val` or a resource?
- [ ] Is the same `try/catch` → `Result` mapping copy-pasted across repositories instead of
      living in one helper?
- [ ] Is the same UI state plumbing (loading/error/empty) re-implemented per screen instead
      of reusing the project's convention?
- [ ] Is there a duplicated layout / style / dimension in XML that a `style` or
      `@dimen` already covers?
- [ ] **Reverse check**: is this change over-DRYing — merging two things that merely look
      alike, creating a helper with a `Boolean` flag parameter to serve two callers?

**Severity guide**: a duplicated business rule that can drift → CRITICAL. Duplicated
boilerplate with no drift risk → WARNING or NITPICK. Over-DRY with a flag parameter →
WARNING (cite 0.2 as well).

### 0.4 Principle conflict resolution

When the three collide, resolve in this order and **say so in the finding**:

| Conflict | Resolution |
|---|---|
| DRY vs KISS | KISS wins. Duplication is cheaper than the wrong abstraction. |
| DRY vs YAGNI | YAGNI wins. Do not extract a shared helper for a second caller that does not exist yet. |
| KISS vs "architecture purity" | KISS wins unless the shortcut breaks a layer boundary that the project actually enforces. |
| YAGNI vs a documented near-term requirement | The requirement wins — but only if it is documented; "the PM mentioned it" is not. |

Rule of thumb: **duplicate twice, abstract on the third**.

---

## 1. Architecture & SOLID

Detailed pattern rules live in `architecture-guide.md`. This section is the checklist.

### 1.1 Single Responsibility Principle (SRP)
- [ ] Does each class have only one reason to change?
- [ ] Are Activities/Fragments/Composables doing business logic instead of delegating?
- [ ] Are ViewModels doing data access instead of delegating to Repository/UseCase?
- [ ] Are Repository implementations mixing multiple data sources without abstraction?
- [ ] Is a "God" ViewModel forming (> ~300 lines, > ~10 injected dependencies)?

### 1.2 Open/Closed Principle (OCP)
- [ ] Can behaviour be extended without modifying existing code?
- [ ] Are `when` statements on types that could grow using sealed classes/interfaces?
- [ ] Are strategies hardcoded instead of injected?
- [ ] **YAGNI cross-check (0.1)**: is the extension point real, or speculative?

### 1.3 Liskov Substitution Principle (LSP)
- [ ] Do subclasses honour the contracts of their parent classes?
- [ ] Does an override throw, no-op, or tighten preconditions where the base did not?

### 1.4 Interface Segregation Principle (ISP)
- [ ] Are interfaces focused and minimal?
- [ ] Do classes implement interfaces with methods they don't use?
- [ ] Are callback interfaces bloated with unused methods (use a sealed event type instead)?

### 1.5 Dependency Inversion Principle (DIP)
- [ ] Do high-level modules depend on abstractions, not concrete implementations?
- [ ] Are dependencies constructor-injected (preferred over field/service-locator)?
- [ ] Is the DI framework used correctly?
  - Hilt: correct scope (`@Singleton`, `@ViewModelScoped`, `@ActivityRetainedScoped`)?
  - Is anything `@Singleton` that holds an `Activity`, a `View`, or per-user state?
  - Koin: is resolution eager where it should be `factory`/`scoped`?
- [ ] Is `@Inject` used on something with no second implementation and no test double —
      i.e. an interface that exists only to satisfy DI (0.1)?

### 1.6 Pattern compliance
- [ ] Does the change follow the pattern the project **actually uses** (from `context.md`),
      not the reviewer's preferred pattern?
- [ ] MVVM: View observes state; ViewModel holds no View/Context reference; one state holder
      per screen. See `architecture-guide.md` §2.
- [ ] MVI: strictly unidirectional (Intent → Reducer → State → View); state is an immutable
      single object; one-shot events are a separate `Channel`/`SharedFlow`, not in state.
      See `architecture-guide.md` §3.
- [ ] Clean Architecture: domain has zero Android imports; dependencies point inward;
      mappers at each boundary. See `architecture-guide.md` §4.
- [ ] Is the change mixing patterns inconsistently with neighbouring screens?

### 1.7 Separation of concerns
- [ ] Is navigation triggered from the right place (event from ViewModel, executed by View)?
- [ ] Is UI formatting (date/currency/plurals) out of the ViewModel's business logic?
- [ ] Are Android framework types (`Context`, `Uri`, `Bundle`, `Cursor`, `SharedPreferences`)
      isolated from business logic?
- [ ] Do domain models leak DTO annotations (`@SerializedName`, `@Entity`)?

---

## 2. Performance & Memory

### 2.1 Memory leaks
- [ ] **Context references**: is an `Activity` context stored in a long-lived object? Use
      `applicationContext` for singletons.
- [ ] **Inner classes**: non-static inner classes / anonymous listeners holding the outer
      class beyond its lifetime?
- [ ] **Listeners/Callbacks**: registered but never unregistered (sensors, broadcast
      receivers, `ViewTreeObserver`, ad callbacks, `LocationManager`)?
- [ ] **View references**: `View`/`Binding` stored in a field that outlives the view?
- [ ] **Coroutine scopes**: `GlobalScope` or a custom `CoroutineScope` created without a
      matching `cancel()`?
- [ ] **Flow collection**: collected with `repeatOnLifecycle`/`flowWithLifecycle` (Views) or
      `collectAsStateWithLifecycle` (Compose)?
- [ ] Are `Handler`/`Runnable` postDelayed callbacks removed in `onDestroy`?

### 2.2 ANR risks
- [ ] Any I/O (network, DB, file, `SharedPreferences` read) on the Main Thread?
- [ ] Heavy computation (sorting/filtering large lists, JSON parsing, bitmap decoding) on Main?
- [ ] `runBlocking` on the Main Thread?
- [ ] `SharedPreferences.commit()` where `apply()` would do — or better, DataStore?
- [ ] Synchronous work in `Application.onCreate()` / `ContentProvider` init that delays start?
- [ ] Binder/IPC calls (PackageManager, ConnectivityManager queries) in a hot path?

### 2.3 Coroutines / Flow
- [ ] Correct dispatcher (`IO` for I/O, `Default` for CPU, `Main.immediate` for UI)?
- [ ] Is dispatcher choice injected rather than hardcoded (testability)?
- [ ] `stateIn`/`shareIn` used with a sensible `SharingStarted` (usually
      `WhileSubscribed(5_000)`) rather than `Eagerly`?
- [ ] Cold flows unnecessarily converted to hot ones (0.1/0.2)?
- [ ] `flowOn` placed correctly (it affects everything **upstream**)?
- [ ] Structured concurrency respected — no fire-and-forget `launch` on a detached scope?
- [ ] Is `catch`/`retryWhen` used on flows that can throw, and does `catch` sit upstream of
      the collector?
- [ ] Is cancellation cooperative (`ensureActive()`/`isActive` in long loops)?

### 2.4 Allocation efficiency
- [ ] Objects allocated inside tight loops, `onBindViewHolder`, or a Composable body?
- [ ] `String` concatenation in loops instead of `StringBuilder`/`buildString`?
- [ ] `DiffUtil`/`ListAdapter` used instead of `notifyDataSetChanged()`?
- [ ] `LazyColumn`/`LazyRow` items given stable `key`s?
- [ ] Are lambdas capturing values that force recomposition / re-binding every frame?

### 2.5 Threading
- [ ] Thread-safe structures where accessed from multiple threads?
- [ ] `Mutex`/`synchronized` used correctly for shared mutable state (and not held across
      a suspension point that can deadlock)?
- [ ] `LiveData.postValue()` from background, `setValue()` from Main?
- [ ] `MutableStateFlow.update { }` used for read-modify-write instead of `value = value.copy()`
      (which is not atomic)?

### 2.6 Rendering & startup
- [ ] Deep or nested layout hierarchies where `ConstraintLayout`/`merge` would flatten them?
- [ ] Overdraw from stacked opaque backgrounds?
- [ ] Images loaded without downsampling / without an image library's memory cache?
- [ ] Compose: unstable parameters causing recomposition of large subtrees? Is
      `derivedStateOf` used for values derived from frequently-changing state?
- [ ] Is a Baseline Profile in place for a startup-critical path that this change touches?

---

## 3. Lifecycle & State

### 3.1 Configuration changes
- [ ] State preserved across rotation via ViewModel?
- [ ] `SavedStateHandle` / `rememberSaveable` for state that must survive process death?
- [ ] Dialogs survive configuration changes (`DialogFragment`, not a raw `AlertDialog` field)?
- [ ] Fragment transactions safe after `onSaveInstanceState` (no `IllegalStateException`)?
- [ ] Android 16 (API 36) large-screen behaviour: does the change rely on a fixed orientation
      or non-resizable window that the platform no longer honours?

### 3.2 Process death recovery
- [ ] Critical user input saved to `SavedStateHandle`/`onSaveInstanceState`?
- [ ] Navigation arguments and back stack restore correctly?
- [ ] Does the screen re-fetch or restore after a cold restart into a deep-linked state?

### 3.3 Fragment lifecycle
- [ ] `viewLifecycleOwner` used instead of `this` when observing in a Fragment?
- [ ] `_binding = null` in `onDestroyView`?
- [ ] `childFragmentManager` used where the dialog belongs to the fragment?
- [ ] View accessed only between `onCreateView` and `onDestroyView`?

### 3.4 Compose lifecycle
- [ ] Correct effect handler (`LaunchedEffect`, `DisposableEffect`, `SideEffect`,
      `rememberCoroutineScope`)?
- [ ] Correct **keys** on `LaunchedEffect`/`remember` (a key of `Unit` where it should
      restart, or an unstable key that restarts every recomposition)?
- [ ] `collectAsStateWithLifecycle()` rather than `collectAsState()` for ViewModel flows?
- [ ] `rememberSaveable` for state that must survive process death?
- [ ] Is state hoisted to the right level, or is a stateful Composable making itself untestable?
- [ ] Are one-shot events consumed exactly once (not re-fired on recomposition)?

### 3.5 Scope management
- [ ] `viewModelScope` / `lifecycleScope` / `repeatOnLifecycle` used appropriately?
- [ ] Work that must outlive the UI moved to WorkManager or a foreground service — with the
      correct `foregroundServiceType` declared (mandatory since API 34)?
- [ ] Long-running operations cancelled when the scope dies?

---

## 4. Kotlin Idioms

### 4.1 Null safety
- [ ] `!!` used? Almost always a smell — prefer `?.`, `?:`, `let`, `requireNotNull(x) { msg }`.
- [ ] Nullable types used only when null is a valid business state?
- [ ] `lateinit` initialised before every access path, and never for a nullable/primitive?
- [ ] Platform types from Java/JSON handled explicitly rather than assumed non-null?

### 4.2 Scope functions
- [ ] `let` for null-checks/transforms, `run` for config + result, `with` for grouped calls,
      `apply` for config returning the receiver, `also` for side effects.
- [ ] Nesting kept to ≤ 2 levels (cross-check 0.2)?
- [ ] Is `apply` used where a constructor/named arguments would be clearer?

### 4.3 Data classes & sealed hierarchies
- [ ] `data class` for value types/DTOs; `value class` for single-field wrappers in hot paths?
- [ ] `sealed interface`/`sealed class` for restricted hierarchies (prefer `sealed interface`)?
- [ ] `copy()` for immutable updates?
- [ ] `when` on sealed types exhaustive **without** an `else` branch, so adding a subtype
      becomes a compile error?
- [ ] `data class` used where identity matters, or holding mutable properties?

### 4.4 Extension functions
- [ ] Utilities that operate on a type written as extensions, scoped appropriately?
- [ ] Extensions not hiding member functions or creating a surprising API surface?
- [ ] Is a new `Xyz.kt` "utils" grab-bag being created where the function belongs on a type?

### 4.5 Collections & functional style
- [ ] Chains efficient (`map`/`filter`/`flatMap`) without repeated full traversals?
- [ ] `asSequence()` for large collections with multiple operations?
- [ ] `groupBy`/`associateBy`/`partition`/`sumOf` instead of manual loops?
- [ ] `firstOrNull`/`getOrNull` instead of index access that can throw?
- [ ] Is a functional chain harder to read than a loop here (0.2)?

### 4.6 Coroutines idioms
- [ ] `suspend` functions instead of callback APIs (`suspendCancellableCoroutine` at the edge)?
- [ ] `withContext` for dispatcher switching, not a nested `launch`?
- [ ] `coroutineScope`/`supervisorScope` for parallel decomposition, `async`+`await` used in
      pairs?
- [ ] Flow operators used idiomatically (`map`, `filter`, `combine`, `flatMapLatest`,
      `debounce`, `distinctUntilChanged`)?
- [ ] Is `CancellationException` accidentally swallowed by a broad `catch (e: Exception)`?

### 4.7 General
- [ ] `const val` for compile-time constants; `object` for stateless singletons?
- [ ] `by lazy` for expensive lazy init (with the right thread-safety mode)?
- [ ] String templates instead of concatenation; `buildString` for accumulation?
- [ ] Named arguments used at call sites with multiple booleans/same-typed params?
- [ ] `require`/`check`/`error` used for precondition failures instead of silent returns?
- [ ] Is `kotlinx.serialization` used where the project has standardised on it?

---

## 5. Edge Cases

### 5.1 Network & errors
- [ ] Every network call wrapped in `try/catch` or a `Result`/`Either` type?
- [ ] Handling for: no connectivity, timeout, 4xx, 5xx, malformed body, empty body, redirect?
- [ ] Retry with backoff for transient failures — and a cap, so it cannot loop forever?
- [ ] Loading / error / empty / success modelled explicitly (sealed `UiState`)?
- [ ] Are errors mapped to user-facing messages at the presentation layer, not raw
      exception text shown to the user?

### 5.2 Null & empty data
- [ ] Empty list → empty state in the UI (distinct from loading)?
- [ ] Null API fields handled gracefully with sensible, documented defaults?
- [ ] Is "no data" visually distinguishable from "loading" and from "error"?

### 5.3 Race conditions
- [ ] Rapid taps → duplicate requests / duplicate navigation? (debounce, disable, or guard)
- [ ] Navigation while a coroutine is in flight?
- [ ] Concurrent writes to shared state (`update {}`, `Mutex`)?
- [ ] Search input debounced (`debounce` + `distinctUntilChanged` + `flatMapLatest`)?
- [ ] Out-of-order responses — does a stale response overwrite a newer one?

### 5.4 Input validation
- [ ] Input validated before it reaches the API/DB?
- [ ] Empty string, whitespace-only, very long input, emoji/RTL, leading zeros, locale
      decimal separators?
- [ ] Input sanitised (SQL via parameterised queries, HTML/JS in WebView, path traversal)?

### 5.5 Resource constraints & permissions
- [ ] Behaviour when storage is full / write fails?
- [ ] Permission denied **and** "don't ask again" both handled?
- [ ] Large images/files handled without OOM (downsampling, streaming)?
- [ ] Pagination for large datasets (`Paging 3`) rather than loading everything?
- [ ] Behaviour on low memory / background process death mid-flow?

### 5.6 Security
- [ ] No secrets, API keys, or tokens hardcoded in source or committed config?
- [ ] Tokens stored in `EncryptedSharedPreferences`/Keystore, not plain prefs?
- [ ] Exported components (`android:exported`) intentional and access-controlled?
- [ ] `PendingIntent` flags include `FLAG_IMMUTABLE` (required since API 31)?
- [ ] WebView: JavaScript enabled only when needed, no `addJavascriptInterface` to untrusted
      content, `file://` access disabled?
- [ ] Logging free of PII, tokens, and full request/response bodies in release builds?
- [ ] Cleartext traffic disabled; certificate/domain config intentional?

---

## 6. Platform Currency & Context Fit

This dimension answers the two questions the report must always address: **is this still the
right way to do it in 2026**, and **is it right for *this* app**?

### 6.1 Deprecated / superseded APIs
- [ ] Is a superseded API being introduced where the project already has the replacement?
      Common ones to flag:
      - `AsyncTask`, `Handler(Looper.getMainLooper())` polling → Coroutines/Flow
      - `startActivityForResult` → Activity Result APIs
      - `onBackPressed()` → `OnBackPressedDispatcher` / predictive back
      - `SharedPreferences` for new state → DataStore
      - ExoPlayer2 (`com.google.android.exoplayer2`) → Media3
      - Smart Lock / old sign-in flows → Credential Manager
      - KAPT → KSP
      - `collectAsState()` → `collectAsStateWithLifecycle()`
      - `notifyDataSetChanged()` → `ListAdapter` + `DiffUtil`
      - Gson reflection models in a Kotlin module → `kotlinx.serialization`
- [ ] Is a deprecation warning being suppressed rather than addressed?

### 6.2 Target SDK & platform requirements
Verify against the project's actual `targetSdk` in `context.md` — do not assume.

- [ ] **Edge-to-edge**: with `targetSdk` 35+, the app draws behind system bars by default.
      Does new UI handle `WindowInsets` (status/nav bar, IME, display cutout), or does it
      assume an inset-free window?
- [ ] **Predictive back**: with `targetSdk` 36+, predictive back is on by default. Does new
      back-handling use `OnBackPressedCallback` / `BackHandler` correctly, and does it avoid
      irreversible work in the back callback?
- [ ] **16 KB page size**: does this change add or update a native library (`.so`, NDK, a
      dependency with JNI)? It must be 16 KB-aligned for Play submissions targeting
      Android 15+.
- [ ] **Foreground services**: is a `foregroundServiceType` declared and justified (API 34+)?
- [ ] **Permissions**: are granular media permissions (`READ_MEDIA_IMAGES`/`VIDEO`/
      `VISUAL_USER_SELECTED`) or the Photo Picker used instead of broad storage access?
- [ ] **Notifications**: `POST_NOTIFICATIONS` requested at the right moment (API 33+)?
- [ ] Is any new API guarded with a `Build.VERSION.SDK_INT` check where `minSdk` requires it,
      and is a now-unnecessary guard being kept for an SDK below `minSdk` (0.1)?

### 6.3 Toolchain currency
- [ ] Dependencies added through the version catalog (`libs.versions.toml`), not hardcoded?
- [ ] A new dependency added for something the project already has, or for a few lines of
      code that could be written directly (0.1/0.3)?
- [ ] Kotlin 2.x / K2 idioms available and used where they simplify (e.g. `sealed interface`,
      guard conditions in `when`, `data object`)?
- [ ] Compose: is the project's stability configuration respected — are new parameters
      stable, so strong skipping actually skips?

### 6.4 App-context fit — **required for every finding**

Every finding must be judged against the app's real context from `context.md`
(`app_context` block): what kind of app is this, who uses it, how does it make money, what
scale does it run at, what is the team's capacity?

Ask, in order:

1. **What does this change cost *this* app?** A 200 ms extra allocation is noise in an
   internal admin tool and a revenue defect in an ad-funded app with a 3-second launch
   budget. Severity must reflect the app, not the textbook.
2. **Does the reach match the risk?** A defect on the main flow of a 5M-user app outranks a
   perfect-looking issue on a settings screen behind two taps.
3. **Is this still appropriate in the project's current direction?** If the project is
   migrating XML → Compose, adding a new XML screen is a WARNING even though the code is
   correct. If it is migrating away from a library, extending that library is a finding.
4. **Is the fix affordable?** A refactor spanning 20 files, proposed on a hotfix branch, is
   not actionable. Say so, and offer the smaller version of the fix.
5. **Does the suggestion respect existing conventions?** If the project consistently does X
   and this change does X, "I would do Y" is not a finding. Consistency beats the reviewer's
   preference.

Checklist per finding:
- [ ] Stated the concrete production consequence **for this app**, not in the abstract
- [ ] Severity calibrated to reach × likelihood × cost for this app
- [ ] Confirmed the suggestion fits the project's current direction and conventions
- [ ] Confirmed the fix is proportionate to the change under review

**Do not report** a violated principle with no observable consequence in this app's context
as anything above WARNING — and if the consequence is genuinely zero, do not report it.

---

## Per-dimension verdict (fill before finishing a batch)

Record this at the top of the batch's findings file so it is visible that every dimension was
actually walked:

```markdown
<!--DIMENSIONS-->
| Dim | Đã xét | Kết luận ngắn |
|---|---|---|
| 0 YAGNI/KISS/DRY | ✅ | 1 abstraction thừa (0.1), 1 rule trùng lặp (0.3) |
| 1 Architecture    | ✅ | tuân thủ MVVM, không vi phạm layer |
| 2 Performance     | ✅ | 1 leak listener |
| 3 Lifecycle       | ✅ | đạt |
| 4 Kotlin          | ✅ | 2 nitpick |
| 5 Edge cases      | ✅ | thiếu xử lý empty state |
| 6 Platform/Context| ✅ | dùng collectAsState cũ; phù hợp bối cảnh app |
<!--/DIMENSIONS-->
```
