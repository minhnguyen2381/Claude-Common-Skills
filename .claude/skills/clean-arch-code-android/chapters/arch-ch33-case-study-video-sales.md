# Clean Architecture — Chapter 33: Case Study: Video Sales

## Core Idea
Ghép mọi nguyên tắc vào một case study (giống cleancoders.com). Quy trình: **xác định actor (SRP)**, rồi **use case**, rồi **kiến trúc component theo actor × tầng (View/Presenter/Interactor/Controller)**, rồi **quản lý dependency theo Dependency Rule**. Hai chiều tách biệt: **actor** (lý do thay đổi khác nhau) và **level** (tốc độ thay đổi khác nhau).

## Frameworks Introduced
- **The Product**: bán video trên web cho cá nhân (giá stream / giá download sở hữu) và doanh nghiệp (license stream theo lô, giảm giá số lượng). Tác giả cung cấp video và tài liệu; admin quản lý series, video, giá.
- **Use Case Analysis**: **4 actor chính** là Viewer, Purchaser, Author, Admin. Theo SRP, đây là 4 nguồn thay đổi chính, nên phân vùng để thay đổi cho một actor không ảnh hưởng actor khác.
  - **Abstract use case** (nét đứt): `View Catalog` là policy chung; `View Catalog as Viewer` và `View Catalog as Purchaser` kế thừa nó. Không bắt buộc, nhưng nhận ra sự giống nhau sớm là khôn ngoan.
- **Component Architecture**: mỗi actor có bộ Views, Presenters, Interactors, Controllers riêng (mỗi cái là một jar/dll tiềm năng). Có component đặc biệt **Catalog View** và **Catalog Presenter** chứa abstract class cho abstract use case.
  - **Có thật sự giao nhiều jar không?** Có và không: tách **môi trường build** theo cách này, nhưng **giữ quyền gộp** thành ít deliverable hơn (ví dụ 5 jar theo tầng; hoặc 2 jar: views+presenters / phần còn lại). Giữ lựa chọn deploy mở.
- **Dependency Management**: flow of control đi phải sang trái (controller → interactor → presenter → view), nhưng **phần lớn mũi tên chĩa trái sang phải** về phía policy cao. Quan hệ **using** cùng chiều flow; quan hệ **inheritance** ngược chiều flow, chính là OCP để chi tiết cấp thấp không lan lên.
- **Two dimensions of separation**: (1) **actor** theo SRP, (2) **Dependency Rule** theo level.

## Key Concepts
- **Actor-based partitioning**.
- **Abstract use case**.
- **Build partitioning vs deployment grouping**.
- **Using arrows (with flow) / inheritance arrows (against flow)**.

## Mental Models
- Ma trận **actor × layer**: mỗi ô là một component tiềm năng.
- "**Tách khi build, gộp khi deploy**", để giữ quyền chọn.

## Anti-patterns
- **Phân vùng chỉ theo tầng** (mọi actor dùng chung presenter/interactor).
- **Cố định cách deploy từ đầu**.

## Worked Example
```
Actors: Viewer | Purchaser | Author | Admin
Layers: Views | Presenters | Interactors | Controllers  (+ Utilities, Database)
Components: ViewerViews, PurchaserViews, AuthorViews, AdminViews,
            CatalogView (abstract) ← ViewerCatalogView, PurchaserCatalogView, ...
Deploy options: 1 jar/ô  |  5 jar theo tầng  |  2 jar (UI side / rest)
```

## 🤖 Android mapping (chuyển thể, không có trong sách)
Áp quy trình cho một app kiểu Satellite2 (map/camera/phone locator, có premium và ads):
1. **Actors**: End-user (xem camera/street view/tra số), Purchaser (mua premium IAP), Monetization team (ads placement, remote config), Content admin (cập nhật camera/famous places qua backend).
2. **Use cases** (ví dụ): Browse cameras by category · Search cameras · Watch camera · View street view 360 · Lookup phone number · Purchase premium · Restore purchase · Show interstitial at checkpoint.
   - **Abstract use case**: `Browse Catalog` (danh mục + paging + filter) cho LiveCamera, StreetView famous places, Templates. Sách khuyên **nhận ra** sự giống nhau; arch-ch16 nhắc **cẩn thận duplication giả**. Chỉ trừu tượng phần policy chung (paging/filter), không gộp màn hình.
3. **Component architecture (Gradle, khi đủ lớn)**:
```
:feature:camera     (ui + presenter/ViewModel + usecase của End-user/camera)
:feature:streetview
:feature:locator
:feature:premium    (Purchaser)
:core:catalog       (abstract Browse Catalog: PagingPolicy, CatalogFilter)
:core:domain        (entities, repository interfaces)
:core:data          (Retrofit, Room, DataStore impls)
:LibAds             (Monetization actor)
:app                (Main: Koin, Application, MainActivity, nav graph)
```
   Hoặc **giữ một `:app`** nhưng tổ chức package đúng như trên ("tách khi build, gộp khi deploy"). Tách module khi build chậm hoặc có team riêng.
4. **Dependency**: `:feature:*` → `:core:domain` ← `:core:data`; `:app` → mọi thứ. `using` (Fragment → ViewModel → UseCase) cùng chiều flow; `implements` (`RepositoryImpl : Repository`) ngược chiều.

## Key Takeaways
1. Bắt đầu từ actor (SRP), rồi use case.
2. Component = actor × layer; abstract use case cho policy chung.
3. Tách build theo component, giữ quyền gộp khi deploy.
4. Hai trục: actor (lý do đổi) và level (tốc độ đổi).

## Connects To
- **arch-ch07 (SRP/actor)**, **arch-ch22 (Clean Architecture)**, **arch-ch34 (Package structures)**.
