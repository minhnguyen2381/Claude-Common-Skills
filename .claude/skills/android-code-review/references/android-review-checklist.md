# Android Code Review Checklist

Detailed criteria for each review dimension. Load this file when performing a review
to ensure comprehensive coverage.

Every subsection carries a section code (`1.1`, `2.3`, ...). Cite it in the `dim=` field of
each finding so the reasoning behind a finding is traceable back to a criterion. Evaluate
every changed file against all five dimensions — a dimension with no finding is a normal
outcome, but a dimension that was never considered is a gap.

## 1. Architecture & SOLID

### 1.1 Single Responsibility Principle (SRP)
- Does each class have only one reason to change?
- Are Activities/Fragments doing business logic instead of delegating to ViewModel?
- Are ViewModels doing data access instead of delegating to Repository/UseCase?
- Are Repository implementations mixing multiple data sources without abstraction?

### 1.2 Open/Closed Principle (OCP)
- Can behavior be extended without modifying existing code?
- Are `when` statements on types that could grow using sealed classes/interfaces?
- Are strategies hardcoded instead of injected?

### 1.3 Liskov Substitution Principle (LSP)
- Do subclasses honor the contracts of their parent classes?
- Are abstract methods implemented correctly without violating expectations?

### 1.4 Interface Segregation Principle (ISP)
- Are interfaces focused and minimal?
- Do classes implement interfaces with methods they don't use?
- Are callback interfaces bloated with unused methods?

### 1.5 Dependency Inversion Principle (DIP)
- Do high-level modules depend on abstractions, not concrete implementations?
- Are dependencies injected (constructor injection preferred)?
- Is the DI framework (Hilt/Dagger/Koin) used correctly?
  - Hilt: correct scope annotations (@Singleton, @ViewModelScoped, @ActivityScoped)?
  - Modules providing the right bindings?

### 1.6 Pattern Compliance
- **MVVM**: View observes ViewModel state, ViewModel doesn't reference View, 
  Repository abstracts data sources
- **MVI**: Unidirectional data flow, Intent -> Model -> View, state is immutable
- **Clean Architecture**: Domain layer has no Android dependencies, Use Cases 
  encapsulate business logic, proper layer boundaries

### 1.7 Separation of Concerns
- Is navigation logic in the right place (not in ViewModel)?
- Is UI formatting separate from business logic?
- Are Android framework dependencies isolated from business logic?

## 2. Performance & Memory

### 2.1 Memory Leaks
- **Context references**: Is `Activity` context stored in a long-lived object? 
  Use `applicationContext` for singletons.
- **Inner classes**: Are non-static inner classes holding implicit references to 
  outer class? Use `static` inner class or top-level class.
- **Listeners/Callbacks**: Are listeners registered but never unregistered?
- **View references**: Are Views stored in fields that outlive the View lifecycle?
- **Coroutine scopes**: Are coroutines launched in `GlobalScope` or custom scopes 
  without proper cancellation?
- **Flow collection**: Is `Flow` collected in `lifecycleScope` with `repeatOnLifecycle`
  or using `flowWithLifecycle`?

### 2.2 ANR Risks (Application Not Responding)
- Is any I/O (network, database, file) happening on the Main Thread?
- Are heavy computations (sorting, filtering large lists) on the Main Thread?
- Is `runBlocking` used on the Main Thread?
- Are SharedPreferences committed synchronously with `commit()` instead of `apply()`?

### 2.3 Coroutines/Flow Optimization
- Is the correct dispatcher used? (`Dispatchers.IO` for I/O, `Dispatchers.Default` 
  for CPU-intensive, `Dispatchers.Main` for UI updates)
- Are Flows being collected efficiently? (avoid collecting in `onResume` without 
  lifecycle awareness)
- Is `stateIn`/`shareIn` used appropriately for shared flows?
- Are cold flows being unnecessarily converted to hot flows?
- Is `flowOn` used correctly to switch context?
- Are coroutines properly structured (structured concurrency)?

### 2.4 Allocation Efficiency
- Are objects allocated inside tight loops unnecessarily?
- Are `String` concatenations in loops using `StringBuilder`?
- Are RecyclerView ViewHolders being recycled properly?
- Is `DiffUtil` used for RecyclerView updates instead of `notifyDataSetChanged()`?

### 2.5 Threading
- Are thread-safe collections used when accessed from multiple threads?
- Is `synchronized` or `Mutex` used correctly for shared mutable state?
- Are `LiveData` values posted from background threads using `postValue()` not `setValue()`?

## 3. Lifecycle & State

### 3.1 Configuration Changes (Screen Rotation)
- Is state preserved across configuration changes via ViewModel?
- Are `SavedStateHandle` or `rememberSaveable` (Compose) used for UI state 
  that must survive process death?
- Do Dialogs survive configuration changes or get dismissed/recreated?
- Are Fragment transactions safe across configuration changes?

### 3.2 Process Death Recovery
- Is critical user input saved to `SavedStateHandle` or `onSaveInstanceState`?
- Can the app recover from process death without data loss?
- Are navigation arguments properly saved/restored?
- Is the back stack preserved correctly?

### 3.3 Fragment Lifecycle
- Is `viewLifecycleOwner` used instead of `this` for observing in Fragments?
- Are View references nulled in `onDestroyView`?
- Are Dialogs shown with `childFragmentManager` when appropriate?
- Is the Fragment's view accessed only between `onCreateView` and `onDestroyView`?

### 3.4 Compose Lifecycle (if applicable)
- Are side effects using the correct Effect handler (`LaunchedEffect`, 
  `DisposableEffect`, `SideEffect`)?
- Are keys provided to `LaunchedEffect` and `remember` correctly?
- Is `rememberSaveable` used for state that must survive process death?
- Are recompositions minimized (stable parameters, `remember`, `derivedStateOf`)?

### 3.5 Scope Management
- Are `viewModelScope`, `lifecycleScope`, `repeatOnLifecycle` used appropriately?
- Are long-running operations properly cancelled when scope is destroyed?
- Are WorkManager/Services used for truly background work that must outlive the UI?

## 4. Kotlin Idioms

### 4.1 Null Safety
- Is `!!` (non-null assertion) used? Almost always a code smell - prefer 
  `?.`, `?:`, `let`, `requireNotNull` with clear message
- Are nullable types used only when null is a valid business state?
- Is `lateinit` used appropriately (not for nullable types, initialized before access)?

### 4.2 Scope Functions
- `let` - for null checks and transformations: `value?.let { use(it) }`
- `run` - for object configuration and computing a result
- `with` - for calling multiple methods on an object
- `apply` - for object configuration (returns the object)
- `also` - for side effects (logging, validation)
- Are scope functions nested excessively (max 2 levels)?

### 4.3 Data Classes & Sealed Classes
- Are data classes used for value types / DTOs?
- Are sealed classes/interfaces used for restricted type hierarchies?
- Is `copy()` used for immutable data class updates instead of creating new instances manually?
- Are `when` expressions on sealed types exhaustive (no `else` branch)?

### 4.4 Extension Functions
- Are utility functions that operate on a type written as extensions?
- Are extensions scoped appropriately (file-level vs class-level)?
- Are extensions used to keep the API surface clean?

### 4.5 Collections & Functional Style
- Are collection operations chained efficiently (`map`, `filter`, `flatMap`)?
- Is `asSequence()` used for large collections with multiple operations?
- Is `groupBy`, `associateBy`, `partition` used instead of manual loops?
- Are `first`/`last` used with `OrNull` variants to handle empty collections?

### 4.6 Coroutines Idioms
- Are `suspend` functions used instead of callback-based APIs?
- Is `withContext` used for dispatcher switching instead of launching new coroutines?
- Are `Flow` operators used idiomatically (`map`, `filter`, `combine`, `zip`)?

### 4.7 General
- Is `const val` used for compile-time constants?
- Are `object` declarations used for singletons?
- Is `by lazy` used for lazy initialization?
- Are string templates used instead of concatenation?
- Is destructuring used where it improves readability?

## 5. Edge Cases

### 5.1 Network Errors
- Are all network calls wrapped in try-catch or Result types?
- Is there proper handling for: no internet, timeout, server error (5xx), 
  client error (4xx), malformed response?
- Is retry logic implemented for transient failures?
- Are loading/error/success states properly modeled (sealed class UiState)?

### 5.2 Null & Empty Data
- Are empty lists handled in the UI (empty state)?
- Are null responses from API handled gracefully?
- Are default values sensible and documented?
- Is the difference between "no data" and "loading" clear in the UI?

### 5.3 Race Conditions
- Can rapid button taps cause duplicate requests?
- Can navigation happen while a coroutine is still running?
- Are concurrent modifications to shared state handled?
- Is debouncing used for search input?

### 5.4 Input Validation
- Is user input validated before sending to the API?
- Are edge cases handled (empty string, very long input, special characters)?
- Is input sanitized to prevent injection?

### 5.5 Resource Constraints
- Is behavior correct when storage is full?
- Is behavior correct when permissions are denied?
- Are large images/files handled without OOM?
- Is pagination implemented for large datasets?

### 5.6 Backward Compatibility
- Are new APIs guarded with version checks when needed?
- Are deprecated API usages updated or properly handled?
- Is `minSdk` respected in all code paths?
