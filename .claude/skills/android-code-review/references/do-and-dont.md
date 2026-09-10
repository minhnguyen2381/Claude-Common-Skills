# Do / Don't Catalogue

Concrete code pairs for the criteria in `android-review-checklist.md`, indexed by the same
section codes. Use it two ways:

- while reviewing — to recognise a pattern you are looking at;
- while writing a finding — to produce the `Trước / Sau` block instead of inventing one.

Architecture pairs (dimension 1) live in `architecture-guide.md`.

Every ❌ block is annotated with the section codes it violates. Adapt the code to the
project's naming and conventions before pasting it into a finding — a suggestion that does
not compile in the project's style is worse than no suggestion.

---

## 0.1 YAGNI

### Speculative abstraction

❌ **Don't** — one interface, one implementation, no second one in sight, created in the same
commit:

```kotlin
interface AnalyticsTracker {                     // 0.1
    fun track(event: String, params: Map<String, Any>)
}

class FirebaseAnalyticsTracker @Inject constructor(
    private val firebase: FirebaseAnalytics,
) : AnalyticsTracker { ... }

@Module @InstallIn(SingletonComponent::class)
abstract class AnalyticsModule {
    @Binds abstract fun bind(impl: FirebaseAnalyticsTracker): AnalyticsTracker
}
```

✅ **Do** — inject the concrete class; introduce the interface when the second implementation
or the test double actually arrives:

```kotlin
class AnalyticsTracker @Inject constructor(
    private val firebase: FirebaseAnalytics,
) {
    fun track(event: String, params: Map<String, Any>) { ... }
}
```

**When the ❌ version is right**: the project already has 2+ analytics backends, or the
module boundary requires the interface so a lower module can call it. Check before flagging.

### Configuration nobody asked for

❌ **Don't**:

```kotlin
data class RetryPolicy(                          // 0.1 — every caller uses the defaults
    val maxAttempts: Int = 3,
    val backoffMs: Long = 1_000,
    val jitter: Boolean = false,
    val multiplier: Double = 2.0,
    val retryOn: Set<Int> = setOf(500, 502, 503),
)
```

✅ **Do**:

```kotlin
private const val MAX_ATTEMPTS = 3
private const val BACKOFF_MS = 1_000L
```

---

## 0.2 KISS

### Nesting and scope-function pileup

❌ **Don't** — 4 levels deep, control flow hidden inside scope functions:

```kotlin
fun handle(response: Response?) {                // 0.2
    response?.let { r ->
        r.body?.let { b ->
            b.items?.let { items ->
                if (items.isNotEmpty()) {
                    items.firstOrNull()?.let { first ->
                        render(first)
                    }
                }
            }
        }
    }
}
```

✅ **Do** — flat, with early returns:

```kotlin
fun handle(response: Response?) {
    val first = response?.body?.items?.firstOrNull() ?: return
    render(first)
}
```

### Disproportionate async machinery

❌ **Don't** — a whole flow pipeline to read a value once:

```kotlin
val userName: StateFlow<String> = flow { emit(prefs.getName()) }   // 0.2
    .flowOn(Dispatchers.IO)
    .distinctUntilChanged()
    .stateIn(viewModelScope, SharingStarted.Eagerly, "")
```

✅ **Do**:

```kotlin
val userName: String = prefs.name        // if it is genuinely a one-shot, synchronous read
```

...or, if it must be async, a plain `suspend fun` called once in `init`.

### Pattern applied for its own sake

❌ **Don't**:

```kotlin
interface DialogStrategy { fun show(context: Context) }            // 0.2 + 0.1
class ErrorDialogStrategy : DialogStrategy { ... }
class InfoDialogStrategy : DialogStrategy { ... }
class DialogStrategyFactory {
    fun create(type: DialogType): DialogStrategy = when (type) { ... }
}
```

✅ **Do**:

```kotlin
fun showDialog(context: Context, type: DialogType) = when (type) {
    DialogType.Error -> showError(context)
    DialogType.Info  -> showInfo(context)
}
```

---

## 0.3 DRY

### Duplicated business rule

❌ **Don't** — the same threshold in three places; one will drift:

```kotlin
// CheckoutViewModel.kt
if (cart.total >= 500_000) applyFreeShipping()          // 0.3

// CartFragment.kt
binding.freeShipBadge.isVisible = total >= 500_000      // 0.3 + 1.1 (rule in the View)

// PromoBanner.kt
text = "Mua thêm ${500_000 - total}đ để được miễn phí ship"   // 0.3
```

✅ **Do** — the rule lives once, in the domain:

```kotlin
// domain
@JvmInline value class Money(val amount: Long)

object ShippingPolicy {
    val FREE_SHIPPING_THRESHOLD = Money(500_000)
    fun qualifiesForFreeShipping(total: Money) = total.amount >= FREE_SHIPPING_THRESHOLD.amount
    fun amountToFreeShipping(total: Money) =
        Money((FREE_SHIPPING_THRESHOLD.amount - total.amount).coerceAtLeast(0))
}
```

### Duplicated error mapping

❌ **Don't** — repeated verbatim in every repository:

```kotlin
override suspend fun getX() = try {                      // 0.3
    Result.success(api.getX())
} catch (e: IOException) {
    Result.failure(NetworkError.NoConnection)
} catch (e: HttpException) {
    Result.failure(if (e.code() >= 500) NetworkError.Server else NetworkError.Client)
}
```

✅ **Do**:

```kotlin
suspend fun <T> safeCall(
    dispatcher: CoroutineDispatcher,
    block: suspend () -> T,
): Result<T> = withContext(dispatcher) {
    try {
        Result.success(block())
    } catch (e: CancellationException) {
        throw e                                      // 4.6 — never swallow cancellation
    } catch (e: IOException) {
        Result.failure(NetworkError.NoConnection)
    } catch (e: HttpException) {
        Result.failure(if (e.code() >= 500) NetworkError.Server else NetworkError.Client)
    }
}

override suspend fun getX(): Result<X> = safeCall(io) { api.getX().toDomain() }
```

### Over-DRY — the reverse finding

❌ **Don't** — merging two rules that merely look alike; the flag parameter is the tell:

```kotlin
fun validate(input: String, isEmail: Boolean, isStrict: Boolean): Boolean { ... }  // 0.3 rev + 0.2
```

✅ **Do** — two names, two rules, free to diverge:

```kotlin
fun validateEmail(input: String): Boolean = ...
fun validatePhone(input: String): Boolean = ...
```

---

## 2.1 Memory leaks

❌ **Don't**:

```kotlin
@Singleton
class SessionManager @Inject constructor(
    private val context: Context,                 // 2.1 — an Activity context here leaks it
) {
    private val listeners = mutableListOf<() -> Unit>()   // 2.1 — never removed
    fun addListener(l: () -> Unit) { listeners += l }
}
```

✅ **Do**:

```kotlin
@Singleton
class SessionManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val _events = MutableSharedFlow<SessionEvent>(extraBufferCapacity = 8)
    val events: SharedFlow<SessionEvent> = _events.asSharedFlow()
    // Collectors bind to their own lifecycle; nothing to unregister.
}
```

Registered-callback case:

❌ **Don't**:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)  // 2.1
}
```

✅ **Do**:

```kotlin
override fun onStart() {
    super.onStart()
    sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
}

override fun onStop() {
    sensorManager.unregisterListener(this)
    super.onStop()
}
```

---

## 2.2 ANR

❌ **Don't**:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val config = runBlocking { repository.loadConfig() }      // 2.2
    val json = File(filesDir, "cache.json").readText()        // 2.2 — file I/O on Main
    prefs.edit().putString("k", v).commit()                   // 2.2 — synchronous write
}
```

✅ **Do**:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    lifecycleScope.launch {
        repeatOnLifecycle(Lifecycle.State.STARTED) {
            viewModel.config.collect(::applyConfig)   // loaded off Main in the repository
        }
    }
}

// data layer
suspend fun loadConfig(): Config = withContext(io) { ... }
suspend fun save(k: String, v: String) = dataStore.edit { it[key] = v }   // DataStore, async
```

---

## 2.3 Coroutines / Flow

❌ **Don't**:

```kotlin
class Repo(private val api: Api) {
    fun observe(): Flow<List<Item>> = flow { emit(api.load()) }
        .stateIn(GlobalScope, SharingStarted.Eagerly, emptyList())   // 2.1 + 2.3
}

viewModelScope.launch(Dispatchers.IO) {          // 2.3 — dispatcher chosen at the call site
    val items = repo.load()
    _state.value = _state.value.copy(items = items)   // 2.5 — non-atomic; also wrong thread
}
```

✅ **Do**:

```kotlin
class Repo @Inject constructor(
    private val api: Api,
    @IoDispatcher private val io: CoroutineDispatcher,
) {
    fun observe(): Flow<List<Item>> = flow { emit(api.load()) }.flowOn(io)
}

// ViewModel
val items: StateFlow<List<Item>> = repo.observe()
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

// or, for imperative updates
viewModelScope.launch {
    val items = repo.load()                      // suspends, switches context internally
    _state.update { it.copy(items = items) }     // atomic
}
```

`WhileSubscribed(5_000)` keeps the upstream alive across a rotation but cancels it when the
screen genuinely goes away; `Eagerly` keeps network/DB work running for a screen nobody is
looking at.

---

## 2.4 Allocation & lists

❌ **Don't**:

```kotlin
override fun onBindViewHolder(holder: VH, position: Int) {
    val fmt = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())   // 2.4 — per row
    holder.date.text = fmt.format(items[position].date)
    holder.itemView.setOnClickListener { onClick(items[position]) } // 2.4 — new lambda per bind
}

fun update(new: List<Item>) {
    items = new
    notifyDataSetChanged()                                          // 2.4
}
```

✅ **Do**:

```kotlin
class ItemAdapter(
    private val onClick: (Item) -> Unit,
) : ListAdapter<Item, ItemAdapter.VH>(DIFF) {

    override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(getItem(position))

    inner class VH(private val binding: ItemBinding) : RecyclerView.ViewHolder(binding.root) {
        init {
            binding.root.setOnClickListener {                       // bound once
                bindingAdapterPosition.takeIf { it != RecyclerView.NO_POSITION }
                    ?.let { onClick(getItem(it)) }
            }
        }
        fun bind(item: Item) { binding.date.text = DATE_FORMATTER.format(item.date) }
    }

    companion object {
        private val DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy")
        private val DIFF = object : DiffUtil.ItemCallback<Item>() {
            override fun areItemsTheSame(a: Item, b: Item) = a.id == b.id
            override fun areContentsTheSame(a: Item, b: Item) = a == b
        }
    }
}
```

Compose equivalent — always key the list:

```kotlin
LazyColumn {
    items(state.items, key = { it.id }) { item -> ItemRow(item, onClick = onClick) }
}
```

---

## 3.3 Fragment lifecycle

❌ **Don't**:

```kotlin
class HomeFragment : Fragment() {
    private lateinit var binding: FragmentHomeBinding     // 3.3 — outlives the view

    override fun onViewCreated(view: View, s: Bundle?) {
        viewModel.state.observe(this) { render(it) }      // 3.3 — `this`, not viewLifecycleOwner
    }
}
```

✅ **Do**:

```kotlin
class HomeFragment : Fragment(R.layout.fragment_home) {
    private var _binding: FragmentHomeBinding? = null
    private val binding get() = requireNotNull(_binding) { "binding accessed outside view lifecycle" }

    override fun onViewCreated(view: View, s: Bundle?) {
        _binding = FragmentHomeBinding.bind(view)
        viewModel.state.observe(viewLifecycleOwner) { render(it) }
    }

    override fun onDestroyView() {
        _binding = null
        super.onDestroyView()
    }
}
```

---

## 3.4 Compose lifecycle

❌ **Don't**:

```kotlin
@Composable
fun ProfileScreen(viewModel: ProfileViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()          // 3.4 — collects while stopped

    LaunchedEffect(state) {                                // 3.4 — restarts on every change
        viewModel.load()
    }

    if (state.navigateToHome) navController.navigate("home")   // 5.3 — re-fires on recomposition
}
```

✅ **Do**:

```kotlin
@Composable
fun ProfileRoute(
    onNavigateHome: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.events.collect { event ->
            when (event) {
                ProfileEvent.OpenHome -> onNavigateHome()   // consumed exactly once
            }
        }
    }

    ProfileScreen(state = state, onAction = viewModel::dispatch)   // stateless, previewable
}
```

---

## 4.1 Null safety

❌ **Don't**:

```kotlin
val user = repository.getUser(id)!!                      // 4.1 — NPE with no context
val name = intent.getStringExtra("name")!!               // 4.1
```

✅ **Do**:

```kotlin
val user = requireNotNull(repository.getUser(id)) { "User $id missing after successful fetch" }
val name = intent.getStringExtra(EXTRA_NAME) ?: run {
    finishWithError(R.string.error_missing_argument)
    return
}
```

---

## 4.3 Sealed hierarchies

❌ **Don't** — the `else` branch hides every future subtype:

```kotlin
when (state) {                                            // 4.3
    is UiState.Loading -> showLoading()
    is UiState.Success -> render(state.data)
    else -> Unit                                          // Error and Empty silently ignored
}
```

✅ **Do** — exhaustive, so a new subtype is a compile error:

```kotlin
when (state) {
    UiState.Loading   -> showLoading()
    UiState.Empty     -> showEmpty()
    is UiState.Success -> render(state.data)
    is UiState.Error   -> showError(state.message, onRetry = viewModel::retry)
}
```

---

## 4.6 Coroutine idioms

❌ **Don't** — swallows cancellation, so the coroutine keeps running after the screen dies:

```kotlin
viewModelScope.launch {
    try {
        val data = repo.load()
        _state.update { it.copy(data = data) }
    } catch (e: Exception) {                              // 4.6 — catches CancellationException
        _state.update { it.copy(error = e.message) }
    }
}
```

✅ **Do**:

```kotlin
viewModelScope.launch {
    try {
        val data = repo.load()
        _state.update { it.copy(data = data) }
    } catch (e: CancellationException) {
        throw e
    } catch (e: Exception) {
        _state.update { it.copy(error = e.toUiText()) }
    }
}
```

Parallel work — `async` must be awaited in the same scope:

❌ **Don't**:

```kotlin
val a = viewModelScope.async { repo.a() }     // 4.6 — failure of one does not cancel the other
val b = viewModelScope.async { repo.b() }
```

✅ **Do**:

```kotlin
val (a, b) = coroutineScope {
    val da = async { repo.a() }
    val db = async { repo.b() }
    da.await() to db.await()
}
```

---

## 5.3 Race conditions

❌ **Don't** — every keystroke fires a request, and responses can arrive out of order:

```kotlin
fun onQueryChanged(q: String) {
    viewModelScope.launch {                               // 5.3
        _state.update { it.copy(results = repo.search(q)) }
    }
}
```

✅ **Do**:

```kotlin
private val query = MutableStateFlow("")

val results: StateFlow<List<Item>> = query
    .debounce(300)
    .distinctUntilChanged()
    .filter { it.length >= 2 }
    .flatMapLatest { q -> repo.searchFlow(q) }            // cancels the previous request
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

fun onQueryChanged(q: String) { query.value = q }
```

Double-tap navigation:

❌ **Don't**: `button.setOnClickListener { navigate() }` — two taps push two destinations.

✅ **Do**: guard on the state, or consume a single-shot event:

```kotlin
fun onSubmit() {
    if (_state.value.isSubmitting) return
    _state.update { it.copy(isSubmitting = true) }
    viewModelScope.launch { ... }
}
```

---

## 5.6 Security

❌ **Don't**:

```kotlin
private const val API_KEY = "AIzaSy..."                   // 5.6 — secret in source
Log.d("Auth", "token=$accessToken")                       // 5.6 — token in logcat
prefs.edit().putString("refresh_token", token).apply()    // 5.6 — plaintext
val pi = PendingIntent.getActivity(ctx, 0, intent, 0)     // 5.6 — mutable PendingIntent
```

✅ **Do**:

```kotlin
// key injected from the build config / a secrets Gradle plugin, not committed
if (BuildConfig.DEBUG) Log.d("Auth", "token acquired (len=${accessToken.length})")

EncryptedSharedPreferences.create(...).edit().putString("refresh_token", token).apply()

val pi = PendingIntent.getActivity(
    ctx, 0, intent,
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
)
```

---

## 6.1 Superseded APIs

| ❌ Don't introduce | ✅ Do use instead |
|---|---|
| `AsyncTask`, `Thread { }.start()` | `suspend fun` + `viewModelScope` / `WorkManager` |
| `startActivityForResult` / `onActivityResult` | `registerForActivityResult(...)` |
| `onBackPressed()` override | `OnBackPressedDispatcher` / Compose `BackHandler` |
| `SharedPreferences` for new state | `DataStore` (Preferences or Proto) |
| `com.google.android.exoplayer2.*` | `androidx.media3.*` |
| Smart Lock / bespoke sign-in | Credential Manager (passkeys) |
| KAPT | KSP |
| `collectAsState()` | `collectAsStateWithLifecycle()` |
| `notifyDataSetChanged()` | `ListAdapter` + `DiffUtil` |
| `LiveData` in new Kotlin code (project-dependent) | `StateFlow` — only if the project has standardised on it |
| `@Parcelize` hand-rolled `Parcelable` | `@Parcelize` |
| Manual `findViewById` chains | ViewBinding / Compose |

Rule: flag a superseded API **only when the project already has the replacement available**.
Introducing `DataStore` into an app that has 40 `SharedPreferences` call sites is a migration
project, not a review comment — in that case the finding is NITPICK with a note, or nothing.

---

## 6.2 Edge-to-edge (targetSdk 35+)

❌ **Don't** — content slides under the status bar and the IME:

```xml
<androidx.constraintlayout.widget.ConstraintLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent">
    <Toolbar android:layout_height="?attr/actionBarSize" ... />   <!-- 6.2 -->
```

✅ **Do**:

```kotlin
// Activity
enableEdgeToEdge()

ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, windowInsets ->
    val bars = windowInsets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime()
    )
    view.updatePadding(top = bars.top, bottom = bars.bottom)
    WindowInsetsCompat.CONSUMED
}
```

Compose: `Modifier.safeDrawingPadding()`, or `Scaffold`'s `contentPadding` — do not hardcode
a status-bar height.

---

## 6.4 Context fit — how the same code gets different severities

The identical defect, judged in three app contexts:

> A 40 ms synchronous JSON parse in `Application.onCreate()`.

| App context | Severity | Reasoning to write in the finding |
|---|---|---|
| Ad-funded utility app, cold start is the KPI, app-open ad shown at launch | CRITICAL | 40 ms on the startup critical path directly costs ad impressions and worsens an already tight start budget |
| Internal enterprise tool, launched twice a day by 200 staff | NITPICK | measurable but with no user-visible or business consequence at this scale |
| Banking app, 5M users, startup already 2.5 s | WARNING | contributes to a known regression trend, but is not the dominant term — worth fixing with the next startup pass |

The technical description is the same in all three. **The `Tác động` and the severity are
not.** That difference is what dimension 6.4 requires in every finding.
