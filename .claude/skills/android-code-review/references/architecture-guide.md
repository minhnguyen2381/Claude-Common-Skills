# Architecture Guide — MVVM, MVI, Clean Architecture

Reference for dimension 1.6. Use it to judge **pattern compliance**, not to campaign for a
pattern change. The project's actual pattern is recorded in `context.md`; review against
that one.

**Prime directive**: architecture serves the app, not the other way round. Before citing any
rule in this file, apply dimension 0 — an "architecturally correct" change that adds three
files to move one string is a YAGNI finding, and the architecture rule does not override it.

---

## 1. Which rules apply to which pattern

| Rule | MVVM | MVI | Clean |
|---|---|---|---|
| View holds no business logic | ✅ | ✅ | ✅ |
| ViewModel holds no `View`/`Activity` reference | ✅ | ✅ | ✅ |
| State exposed as an observable stream | ✅ | ✅ | ✅ |
| **Single** immutable state object per screen | optional | **required** | optional |
| All input funnelled through one entry point | optional | **required** | optional |
| Reducer is a pure function | — | **required** | — |
| Domain layer free of Android imports | optional | optional | **required** |
| Dependencies point inward (data → domain ← presentation) | — | — | **required** |
| Mapper at every layer boundary | — | — | **required** |

MVI and Clean are orthogonal — "MVI + Clean" is common and consistent. MVVM + Clean is
equally valid. Flag *inconsistency with the project*, not the combination.

---

## 2. MVVM

### 2.1 Rules

- The View (Activity/Fragment/Composable) observes state and forwards user input. It contains
  no branching on business rules.
- The ViewModel exposes state (`StateFlow`/`LiveData`) and functions for input. It never
  imports `android.view`, `android.widget`, or holds a `Context` other than
  `@ApplicationContext`.
- Data access goes through a Repository (or UseCase). The ViewModel does not build Retrofit
  calls, touch DAOs, or read `SharedPreferences` directly.
- One-shot events (navigation, toast, dialog) are **not** state. They go through a
  `Channel`/`SharedFlow`, or a state field that the View explicitly acknowledges.

### 2.2 Do / Don't — state exposure

❌ **Don't**: mutable state leaked, event modelled as state, `Context` held.

```kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val api: ProfileApi,                 // 1.5: depends on a concrete data source
    private val activityContext: Context,        // 2.1: leak
) : ViewModel() {

    val user = MutableStateFlow<User?>(null)     // 1.1: mutable state exposed to the View
    var navigateToSettings = false               // 5.3: event as state, fires twice on rotation

    fun load(id: String) {
        viewModelScope.launch {
            user.value = api.fetch(id)           // 5.1: no error handling; 1.1: no repository
        }
    }
}
```

✅ **Do**: immutable state out, events separate, dependencies abstract.

```kotlin
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    private val _events = Channel<ProfileEvent>(Channel.BUFFERED)
    val events: Flow<ProfileEvent> = _events.receiveAsFlow()

    fun load(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repository.getProfile(id)
                .onSuccess { user -> _state.update { it.copy(isLoading = false, user = user) } }
                .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.toMessage()) } }
        }
    }

    fun onSettingsClick() = viewModelScope.launch { _events.send(ProfileEvent.OpenSettings) }
}
```

Note `_state.update { }` rather than `_state.value = _state.value.copy(...)`: only `update`
is atomic under concurrent writers (2.5).

### 2.3 Do / Don't — collecting in the View

❌ **Don't**: collects forever, keeps running in the background, leaks the binding.

```kotlin
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    lifecycleScope.launch {                       // 2.1: not lifecycle-aware
        viewModel.state.collect { render(it) }    // keeps collecting while stopped
    }
    viewModel.user.observe(this) { ... }          // 3.3: `this`, not viewLifecycleOwner
}
```

✅ **Do**:

```kotlin
override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    viewLifecycleOwner.lifecycleScope.launch {
        viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            launch { viewModel.state.collect(::render) }
            launch { viewModel.events.collect(::handleEvent) }
        }
    }
}

override fun onDestroyView() {
    _binding = null                               // 3.3
    super.onDestroyView()
}
```

Compose equivalent:

```kotlin
val state by viewModel.state.collectAsStateWithLifecycle()   // not collectAsState()

LaunchedEffect(Unit) {
    viewModel.events.collect { event -> /* navigate, snackbar */ }
}
```

### 2.4 MVVM review checklist
- [ ] `MutableStateFlow`/`MutableLiveData` private, immutable type exposed
- [ ] No `View`, `Activity`, `Fragment`, or non-application `Context` in the ViewModel
- [ ] No direct API/DAO/prefs access from the ViewModel
- [ ] One-shot events separated from state and consumed exactly once
- [ ] Collection is lifecycle-aware
- [ ] State survives rotation; anything needed after process death is in `SavedStateHandle`

---

## 3. MVI

MVI adds three hard constraints on top of MVVM. If the project claims MVI, all three must
hold; if only some hold, that is the finding.

1. **One state object** per screen, immutable, containing everything the UI renders.
2. **One input entry point** — every user action becomes an Intent/Action passed to a single
   function.
3. **A pure reducer** — `(State, Action) -> State`, no I/O, no side effects, testable alone.

### 3.1 Do / Don't — state modelling

❌ **Don't**: multiple parallel flows produce impossible combinations.

```kotlin
val isLoading = MutableStateFlow(false)
val items = MutableStateFlow<List<Item>>(emptyList())
val error = MutableStateFlow<String?>(null)
// Nothing prevents isLoading = true AND error != null AND items non-empty at once.
// The View must then branch on 3 flows -> combinatorial rendering bugs (5.2).
```

✅ **Do**: make illegal states unrepresentable.

```kotlin
data class CartUiState(
    val content: Content = Content.Loading,
    val isCheckoutEnabled: Boolean = false,
) {
    sealed interface Content {
        data object Loading : Content
        data object Empty : Content
        data class Items(val items: List<CartItem>, val total: Money) : Content
        data class Error(val message: UiText, val retryable: Boolean) : Content
    }
}
```

Note `data object` (Kotlin 1.9+) rather than `object` for a readable `toString()` and
`equals` in state comparisons.

### 3.2 Do / Don't — the reducer

❌ **Don't**: I/O inside the reducer; the reducer becomes untestable and the flow bidirectional.

```kotlin
fun reduce(state: State, action: Action): State = when (action) {
    is Action.Refresh -> {
        val items = runBlocking { api.load() }   // 2.2 ANR, and no longer pure
        state.copy(items = items)
    }
    ...
}
```

✅ **Do**: reducer is pure; side effects are produced as a separate, declared result.

```kotlin
// Pure: no dispatchers, no repositories, trivially unit-testable.
internal fun reduce(state: CartUiState, action: CartAction): CartUiState = when (action) {
    CartAction.Refresh          -> state.copy(content = Content.Loading)
    is CartAction.ItemsLoaded   -> state.copy(
        content = if (action.items.isEmpty()) Content.Empty
                  else Content.Items(action.items, action.total),
        isCheckoutEnabled = action.items.isNotEmpty(),
    )
    is CartAction.LoadFailed    -> state.copy(
        content = Content.Error(action.message, retryable = action.retryable),
    )
}

@HiltViewModel
class CartViewModel @Inject constructor(
    private val loadCart: LoadCartUseCase,
) : ViewModel() {

    private val _state = MutableStateFlow(CartUiState())
    val state: StateFlow<CartUiState> = _state.asStateFlow()

    // Single entry point (constraint 2).
    fun dispatch(action: CartAction) {
        _state.update { reduce(it, action) }
        when (action) {                       // effects handled outside the reducer
            CartAction.Refresh -> refresh()
            else -> Unit
        }
    }

    private fun refresh() = viewModelScope.launch {
        loadCart().fold(
            onSuccess = { dispatch(CartAction.ItemsLoaded(it.items, it.total)) },
            onFailure = { dispatch(CartAction.LoadFailed(it.toUiText(), retryable = it.isTransient())) },
        )
    }
}
```

### 3.3 MVI anti-patterns to flag

| Anti-pattern | Why it is a finding |
|---|---|
| A `MutableStateFlow` per field instead of one state object | breaks constraint 1; produces impossible states |
| A public `setX()` per action alongside `dispatch()` | breaks constraint 2; input path is no longer single |
| Reducer calling a repository / launching a coroutine | breaks constraint 3; reducer untestable, flow bidirectional |
| Navigation stored as a `Boolean` in state | replays on rotation (5.3); use an effect channel |
| `State` containing a `Context`, `View`, or `Drawable` | leak (2.1); use `UiText`/resource ids |
| `State` with a `List` that is mutated in place | equality is broken, `StateFlow` skips the emission |
| An Action class per field with 40 subtypes for one form | 0.2 KISS — one `FieldChanged(field, value)` action |

### 3.4 MVI review checklist
- [ ] Exactly one immutable state object exposed per screen
- [ ] Illegal state combinations are unrepresentable (sealed content, not parallel booleans)
- [ ] Single input entry point
- [ ] Reducer pure and unit-testable without Android
- [ ] Side effects declared and handled outside the reducer
- [ ] One-shot effects delivered once (Channel/`SharedFlow(replay=0)`), never in state
- [ ] The ceremony is proportionate to the screen (0.2) — a static "About" screen does not
      need a reducer

---

## 4. Clean Architecture

### 4.1 The dependency rule

```
   presentation  ──────►  domain  ◄──────  data
   (UI, ViewModel)      (entities,       (Retrofit, Room,
                       use cases,         DataStore,
                       repo interfaces)   repo impls)
```

Arrows are compile-time dependencies. **Domain depends on nothing.** Repository *interfaces*
live in domain; their *implementations* live in data.

### 4.2 Do / Don't — layer boundaries

❌ **Don't**: domain contaminated by the framework and by the transport format.

```kotlin
// domain/model/User.kt
import android.net.Uri                     // 1.7: Android type in domain
import com.google.gson.annotations.SerializedName
import androidx.room.Entity

@Entity(tableName = "users")               // 1.7: persistence concern in domain
data class User(
    @SerializedName("user_id") val id: String,   // 1.7: transport concern in domain
    val avatar: Uri,
)

// domain/usecase/GetUserUseCase.kt
class GetUserUseCase(private val api: UserApi)   // 1.5: domain -> data. Arrow reversed.
```

Consequences that make this a real finding, not a purity complaint: the domain can no longer
be unit-tested on the JVM without Robolectric; a rename of an API field forces a change to a
business entity; swapping Gson for `kotlinx.serialization` touches the domain.

✅ **Do**: three models, mappers at the boundaries, interface in domain.

```kotlin
// ── domain (pure Kotlin module, no Android dependency) ───────────────
data class User(val id: UserId, val name: String, val avatarUrl: String?)

interface UserRepository {
    suspend fun getUser(id: UserId): Result<User>
}

class GetUserUseCase @Inject constructor(
    private val repository: UserRepository,
) {
    suspend operator fun invoke(id: UserId): Result<User> = repository.getUser(id)
}

// ── data ─────────────────────────────────────────────────────────────
@Serializable
data class UserDto(
    @SerialName("user_id") val id: String,
    @SerialName("display_name") val name: String?,
    @SerialName("avatar") val avatar: String?,
)

fun UserDto.toDomain() = User(
    id = UserId(id),
    name = name.orEmpty().ifBlank { "Unknown" },   // 5.2: null/empty handled at the boundary
    avatarUrl = avatar?.takeIf { it.isNotBlank() },
)

class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val dao: UserDao,
    @IoDispatcher private val io: CoroutineDispatcher,   // 2.3: injected, testable
) : UserRepository {

    override suspend fun getUser(id: UserId): Result<User> = withContext(io) {
        runCatching { api.getUser(id.value).toDomain() }
            .onSuccess { dao.upsert(it.toEntity()) }
            .recoverCatching { e ->
                dao.findById(id.value)?.toDomain() ?: throw e   // 5.1: offline fallback
            }
    }
}

// ── presentation ─────────────────────────────────────────────────────
data class UserUiModel(val name: String, val initials: String, val avatarUrl: String?)

fun User.toUiModel() = UserUiModel(
    name = name,
    initials = name.split(' ').mapNotNull { it.firstOrNull()?.uppercase() }.take(2).joinToString(""),
    avatarUrl = avatarUrl,
)
```

### 4.3 When three models are over-engineering (0.1 / 0.2)

Do **not** mechanically demand DTO + Entity + Domain + UiModel for every type. Ask what each
model buys:

| Situation | Verdict |
|---|---|
| DTO shape differs from the domain shape, or the API is unstable | mapper earns its place |
| Domain model needs computed/validated fields the DTO lacks | earns its place |
| A 3-field DTO mapped 1:1 to an identical domain model, in a single-module app | 0.1 — say so |
| UiModel identical to the domain model | 0.1 — render the domain model |

`runCatching` note: it catches `Throwable`, including `CancellationException`. In coroutine
code prefer an explicit `catch (e: Exception)` that rethrows `CancellationException`, or the
project's own `safeCall` helper (4.6).

### 4.4 UseCase rules
- [ ] One public operation per use case (`operator fun invoke`)
- [ ] Contains actual logic — orchestration, validation, combination. A use case that only
      forwards one call to one repository is 0.1 unless the project applies it uniformly as a
      convention (then it is consistency, not a finding — check `context.md`)
- [ ] No Android imports, no dispatcher hardcoded inside
- [ ] Returns a domain type or `Result<domain type>`, never a DTO

### 4.5 Clean Architecture review checklist
- [ ] Domain module has no `android.*` / `androidx.*` / Retrofit / Room / Gson imports
- [ ] Repository interface in domain, implementation in data
- [ ] No DTO or Entity crosses out of the data layer
- [ ] Mappers exist at the boundaries and handle null/empty (5.2)
- [ ] Errors converted to domain types at the data boundary; no raw `HttpException` in the UI
- [ ] Dispatchers injected, not hardcoded
- [ ] Module dependency direction in Gradle matches the diagram (`api`/`implementation` lines)
- [ ] The layering is proportionate to the app's size and lifespan (0.1/0.2, and 6.4)

---

## 5. Judging an architecture finding

Before writing an architecture finding, answer all four:

1. **Which rule of the project's own pattern is broken?** Cite it. "Not Clean Architecture"
   is not a finding; "domain/User.kt imports android.net.Uri, so domain can no longer be
   JVM-unit-tested" is.
2. **What breaks in production or in maintenance?** If the honest answer is "nothing, it is
   just not how I would do it", it is a NITPICK or not a finding at all.
3. **Is the fix proportionate?** A boundary violation in a new file is cheap to fix; the same
   violation inherited from 30 existing files is a WARNING with a note that it is systemic.
4. **Does it fit the app's context (6.4)?** A one-screen internal tool and a 5M-user
   ad-funded app do not warrant the same layering.
