# Worked example: "Bookmarks" feature

A list from Room, delete with a confirm dialog, tap to open the detail screen, and a refresh button that loads API suggestions. Copy this shape for any new feature. `{pkg}` = the app root package.

## data/database/entity/BookmarkEntity.kt

```kotlin
@Entity(tableName = BookmarkEntity.TABLE_NAME)
data class BookmarkEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val title: String,
    val url: String,
    val createdAt: Long,
) {
    companion object {
        const val TABLE_NAME = "bookmark"
    }
}

fun BookmarkEntity.toDtoModel(): BookmarkDtoModel =
    BookmarkDtoModel(
        id = id,
        title = title,
        url = url,
        createdAt = createdAt,
    )
```

## data/database/dao/BookmarkDao.kt

```kotlin
@Dao
interface BookmarkDao {
    @Query("SELECT * FROM ${BookmarkEntity.TABLE_NAME} ORDER BY createdAt DESC")
    fun getAll(): Flow<List<BookmarkEntity>>

    @Query("DELETE FROM ${BookmarkEntity.TABLE_NAME} WHERE id = :id")
    suspend fun deleteById(id: Long)
}
```

## data/model/bookmark/: models, UiState, ContentState, UiEvent

```kotlin
// BookmarkDtoModel.kt (API DTOs carry @SerializedName)
data class BookmarkDtoModel(
    @SerializedName("id")
    val id: Long,
    @SerializedName("title")
    val title: String,
    @SerializedName("url")
    val url: String,
    @SerializedName("created_at")
    val createdAt: Long,
)

// BookmarkUiModel.kt: the mapper lives with the UI model
data class BookmarkUiModel(
    val id: Long,
    val title: String,
    val url: String,
    val createdAt: Long,
    val isSuggested: Boolean = false,
)

fun BookmarkDtoModel.toPresentation(isSuggested: Boolean = false): BookmarkUiModel =
    BookmarkUiModel(
        id = id,
        title = title,
        url = url,
        createdAt = createdAt,
        isSuggested = isSuggested,
    )

// BookmarksUiState.kt: one state object per screen holding source data only; combined values as extensions
data class BookmarksUiState(
    val bookmarksUiState: UiState<List<BookmarkUiModel>> = UiState.None,
    val suggestedUiState: UiState<List<BookmarkUiModel>> = UiState.None,
)

fun BookmarksUiState.getDisplayList(): List<BookmarkUiModel> {
    val suggested = (suggestedUiState as? UiState.Success)?.data.orEmpty()
    val saved = (bookmarksUiState as? UiState.Success)?.data.orEmpty()
    return suggested + saved
}

fun BookmarksUiState.isRefreshing(): Boolean = suggestedUiState is UiState.Loading

fun BookmarksUiState.getContentState(): BookmarksContentState =
    when (bookmarksUiState) {
        is UiState.None, is UiState.Loading -> BookmarksContentState.Loading
        is UiState.Error -> BookmarksContentState.Error
        is UiState.Success ->
            if (getDisplayList().isEmpty()) BookmarksContentState.Empty else BookmarksContentState.Success
    }

// BookmarksContentState.kt: exactly one layout visible at a time
sealed class BookmarksContentState {
    data object Loading : BookmarksContentState()

    data object Error : BookmarksContentState()

    data object Empty : BookmarksContentState()

    data object Success : BookmarksContentState()
}

// BookmarksUiEvent.kt: one-shot effects decided by the ViewModel
sealed class BookmarksUiEvent {
    data object ShowRefreshError : BookmarksUiEvent()

    data object ShowDeleteSuccess : BookmarksUiEvent()
}
```

## data/remote/ApiInterface.kt (add the endpoint)

```kotlin
@GET("api/v1/bookmarks/suggested")
suspend fun getSuggestedBookmarks(): ApiObjectResponseData<List<BookmarkDtoModel>>
```

`ApiObjectResponseData<T>(message, @SerializedName("data") dataResponse: T, status, paging?)` is the standard response wrapper.

## data/repository/bookmarkRepository/

```kotlin
interface BookmarkRepository {
    fun getAllBookmarks(): Flow<Result<List<BookmarkDtoModel>>>

    fun getSuggestedBookmarks(): Flow<Result<List<BookmarkDtoModel>>>

    suspend fun deleteBookmark(id: Long)
}
```

```kotlin
class BookmarkRepositoryImpl(
    private val bookmarkDao: BookmarkDao,
    private val apiInterface: ApiInterface,
) : BookmarkRepository {

    override fun getAllBookmarks(): Flow<Result<List<BookmarkDtoModel>>> =
        bookmarkDao.getAll()
            .map<List<BookmarkEntity>, Result<List<BookmarkDtoModel>>> { entities ->
                Result.Success(entities.map { it.toDtoModel() })
            }
            .catch { e ->
                if (e is CancellationException) throw e
                emit(Result.Error(e))
            }
            .flowOn(Dispatchers.IO)

    override fun getSuggestedBookmarks(): Flow<Result<List<BookmarkDtoModel>>> =
        flow<Result<List<BookmarkDtoModel>>> {
            val result = apiInterface.getSuggestedBookmarks().dataResponse
            Timber.tag(TAG).d("getSuggestedBookmarks: success ${result.size}")
            emit(Result.Success(result))
        }.catch { e ->
            if (e is CancellationException) throw e
            Timber.tag(TAG).d("getSuggestedBookmarks: error $e")
            emit(Result.Error(e))
        }.flowOn(Dispatchers.IO)

    override suspend fun deleteBookmark(id: Long) {
        bookmarkDao.deleteById(id)
    }

    companion object {
        private const val TAG = "BookmarkRepository"
    }
}
```

## domain/usecase/bookmark/

```kotlin
class GetAllBookmarksUseCase(
    private val repository: BookmarkRepository,
) {
    operator fun invoke(): Flow<Result<List<BookmarkDtoModel>>> = repository.getAllBookmarks()
}

class DeleteBookmarkUseCase(
    private val repository: BookmarkRepository,
) {
    suspend operator fun invoke(id: Long) {
        repository.deleteBookmark(id)
    }
}
```

(A simple feature may inject the repository straight into the ViewModel. Add use cases when logic combines repositories or is reused.)

## feature/bookmarks/BookmarksViewModel.kt

```kotlin
class BookmarksViewModel(
    private val getAllBookmarksUseCase: GetAllBookmarksUseCase,
    private val deleteBookmarkUseCase: DeleteBookmarkUseCase,
    private val bookmarkRepository: BookmarkRepository,
) : BaseViewModel<BookmarksUiState, BookmarksUiEvent>(BookmarksUiState()) {

    private var refreshJob: Job? = null

    fun loadBookmarks(forceReload: Boolean = false) {
        // Room Flow keeps emitting: don't stack a second collector when the view is recreated
        val current = getCurrentState().bookmarksUiState
        if (!forceReload && (current is UiState.Loading || current is UiState.Success)) return
        setState { copy(bookmarksUiState = UiState.Loading) }
        handleApiCall(
            apiCall = { getAllBookmarksUseCase() },
            onSuccess = { dtoList ->
                setState { copy(bookmarksUiState = UiState.Success(dtoList.map { it.toPresentation() })) }
            },
            onError = { error ->
                Timber.tag(TAG).e(error, "Failed to load bookmarks")
                setState { copy(bookmarksUiState = UiState.Error(error)) }
            },
        )
    }

    fun refreshSuggested() {
        if (uiState.value.isRefreshing()) return
        refreshJob?.cancel()
        setState { copy(suggestedUiState = UiState.Loading) }
        refreshJob = launchIO {
            bookmarkRepository.getSuggestedBookmarks().collect { result ->
                when (result) {
                    is Result.Success -> {
                        setState {
                            copy(suggestedUiState = UiState.Success(result.data.map { it.toPresentation(isSuggested = true) }))
                        }
                    }

                    is Result.Error -> {
                        setState { copy(suggestedUiState = UiState.Error(result.error)) }
                        setEvent(BookmarksUiEvent.ShowRefreshError)
                    }
                }
            }
        }
    }

    fun deleteBookmark(id: Long) {
        launchIO(
            onError = { error ->
                Timber.tag(TAG).e(error, "Failed to delete bookmark")
            },
        ) {
            deleteBookmarkUseCase(id)
            setEvent(BookmarksUiEvent.ShowDeleteSuccess)
        }
    }

    override fun onCleared() {
        super.onCleared()
        refreshJob?.cancel()
    }

    companion object {
        private const val TAG = "BookmarksViewModel"
    }
}
```

## feature/bookmarks/BookmarksFragment.kt: lifecycle wiring + one-line observers only

```kotlin
class BookmarksFragment :
    BaseFragment<FragmentBookmarksBinding, BookmarksViewModel>(
        FragmentBookmarksBinding::inflate,
        BookmarksViewModel::class,
    ),
    BookmarkAdapter.Listener {

    val adapter = BookmarkAdapter()

    override fun init(view: View, savedInstanceState: Bundle?) {
        initView()
        onBackEvent()
        refreshEvent()
        retryEvent()
    }

    override fun subscribeObserver(view: View) {
        viewModel.uiState
            .map { it.getContentState() }
            .distinctUntilChanged()
            .collectFlowOnView(viewLifecycleOwner) { updateContentState(it) }

        viewModel.uiState
            .map { it.getDisplayList() }
            .distinctUntilChanged()
            .collectFlowOnView(viewLifecycleOwner) { updateDisplayList(it) }

        viewModel.uiState
            .map { it.isRefreshing() }
            .distinctUntilChanged()
            .collectFlowOnView(viewLifecycleOwner) { updateRefreshing(it) }

        viewModel.uiEvent.collectFlowOnView(viewLifecycleOwner) { handleUiEvent(it) }
    }

    override fun onClickItem(item: BookmarkUiModel) {
        navigateToDetail(item.id)
    }

    override fun onDeleteItem(item: BookmarkUiModel) {
        showConfirmDeleteDialog(item)
    }
}
```

## feature/bookmarks/BookmarksFragmentEx.kt: view setup, render functions, events, navigation, dialogs

```kotlin
fun BookmarksFragment.initView() {
    adapter.setListener(this)
    binding.rvBookmarks.adapter = adapter
    viewModel.loadBookmarks()
}

fun BookmarksFragment.updateContentState(contentState: BookmarksContentState) {
    binding.progressBarLoading.isVisible = contentState is BookmarksContentState.Loading
    binding.layoutError.isVisible = contentState is BookmarksContentState.Error
    binding.layoutEmpty.isVisible = contentState is BookmarksContentState.Empty
    binding.rvBookmarks.isVisible = contentState is BookmarksContentState.Success
}

fun BookmarksFragment.updateDisplayList(items: List<BookmarkUiModel>) {
    adapter.submitList(items)
}

fun BookmarksFragment.updateRefreshing(isRefreshing: Boolean) {
    binding.btnRefresh.isEnabled = !isRefreshing
}

fun BookmarksFragment.handleUiEvent(event: BookmarksUiEvent) {
    when (event) {
        is BookmarksUiEvent.ShowRefreshError -> displayToast(getString(R.string.cannot_load_suggested_bookmarks))
        is BookmarksUiEvent.ShowDeleteSuccess -> displayToast(getString(R.string.bookmark_deleted))
    }
}

fun BookmarksFragment.onBackEvent() {
    onSystemBack {
        backEvent()
    }

    binding.ivBack.setPreventDoubleClick {
        backEvent()
    }
}

fun BookmarksFragment.refreshEvent() {
    binding.btnRefresh.setPreventDoubleClickScaleView {
        viewModel.refreshSuggested()
    }
}

fun BookmarksFragment.retryEvent() {
    binding.btnRetry.setPreventDoubleClick {
        viewModel.loadBookmarks(forceReload = true)
    }
}

fun BookmarksFragment.backEvent() {
    navigator.navigateUp()
}

fun BookmarksFragment.navigateToDetail(bookmarkId: Long) {
    navigator.navigateTo(
        R.id.action_bookmarksFragment_to_bookmarkDetailFragment,
        bundleOf(BundleKey.KEY_BOOKMARK_ID to bookmarkId),
    )
}

fun BookmarksFragment.showConfirmDeleteDialog(item: BookmarkUiModel) {
    val dialog = ConfirmDeleteBookmarkDialog.newInstance(
        onConfirm = {
            viewModel.deleteBookmark(item.id)
        },
    )
    safeShowDialog(dialog)
}
```

The detail screen reads the id in its own `initView()`, not through constructor or Koin params:

```kotlin
fun BookmarkDetailFragment.initView() {
    val bookmarkId = arguments?.getLong(BundleKey.KEY_BOOKMARK_ID) ?: return
    viewModel.loadBookmark(bookmarkId)
}
```

## feature/bookmarks/adapter/BookmarkAdapter.kt

```kotlin
class BookmarkAdapter :
    BaseListAdapter<BookmarkUiModel, LayoutItemBookmarkBinding>(
        createDiffCallback(
            areItemsTheSame = { oldItem, newItem -> oldItem.id == newItem.id && oldItem.isSuggested == newItem.isSuggested },
            areContentsTheSame = { oldItem, newItem -> oldItem == newItem },
        ),
    ) {
    interface Listener {
        fun onClickItem(item: BookmarkUiModel)

        fun onDeleteItem(item: BookmarkUiModel)
    }

    private var listener: Listener? = null

    fun setListener(listener: Listener) {
        this.listener = listener
    }

    override fun inflateBinding(
        inflater: LayoutInflater,
        parent: ViewGroup,
        viewType: Int,
    ): LayoutItemBookmarkBinding = LayoutItemBookmarkBinding.inflate(inflater, parent, false)

    override fun bindView(
        binding: LayoutItemBookmarkBinding,
        item: BookmarkUiModel,
        position: Int,
    ) {
        binding.tvTitle.text = item.title
        binding.tvUrl.text = item.url
        // Format display values in the adapter, not in the UiModel
        binding.tvCreatedAt.text = DATE_TIME_FORMAT.format(Date(item.createdAt))
        binding.ivDelete.isVisible = !item.isSuggested

        binding.root.setPreventDoubleClick {
            listener?.onClickItem(item)
        }

        binding.ivDelete.setPreventDoubleClick {
            listener?.onDeleteItem(item)
        }
    }

    companion object {
        private val DATE_TIME_FORMAT = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
    }
}
```

For mixed row types (content + ads/header), use a `sealed class XxxItem { data class Content(..); data class Ads(..) }`, `BaseListAdapter<XxxItem, ViewBinding>`, `getItemViewType` with `ITEM_VIEW_TYPE_*` constants, and `when (binding) { is LayoutItemXBinding -> … }` in `bindView`.

## feature/bookmarks/dialog/ConfirmDeleteBookmarkDialog.kt

Custom layout `dialog_confirm_delete_bookmark.xml`: a root `ConstraintLayout` with the card as its first child, plus `tvTitle`, `btnCancel` and `btnDelete`.

```kotlin
class ConfirmDeleteBookmarkDialog :
    BaseDialogFragment<DialogConfirmDeleteBookmarkBinding>(DialogConfirmDeleteBookmarkBinding::inflate) {

    private var onConfirm: (() -> Unit)? = null

    override fun addEvent(savedInstanceState: Bundle?) {
        super.addEvent(savedInstanceState)

        binding.btnCancel.setPreventDoubleClick {
            dismiss()
        }

        binding.btnDelete.setPreventDoubleClickScaleView {
            onConfirm?.invoke()
            dismiss()
        }
    }

    companion object {
        fun newInstance(onConfirm: () -> Unit): ConfirmDeleteBookmarkDialog =
            ConfirmDeleteBookmarkDialog().apply {
                this.onConfirm = onConfirm
            }
    }
}
```

If the dialog must survive recreation or talk back to its host often, use `interface Listener` + `setListener()` and resolve it via `(parentFragment as? Listener) ?: listener`.

## DI registration

```kotlin
// DatabaseModule
single<BookmarkDao> { get<AppDatabase>().bookmarkDao() }

// RepositoryModule
singleOf(::BookmarkRepositoryImpl) bind BookmarkRepository::class

// UseCaseModule
val bookmarkUseCaseModule =
    module {
        factory { GetAllBookmarksUseCase(get()) }
        factory { DeleteBookmarkUseCase(get()) }
    }

// ViewModelModule
viewModelOf(::BookmarksViewModel)
```

## Navigation + resources

- `nav_main.xml`: `<action android:id="@+id/action_bookmarksFragment_to_bookmarkDetailFragment" app:destination="@id/bookmarkDetailFragment" />`
- `BundleKey.KEY_BOOKMARK_ID`
- Layout `fragment_bookmarks.xml` ids: `ivBack`, `btnRefresh`, `rvBookmarks`, `progressBarLoading`, `layoutEmpty`, `layoutError`, `btnRetry`. Every text is `@string/…`, every color `@color/…`, every size `@dimen/_Xdp`.
