---
name: fix-libads-native-cardview-to-framelayout
description: "Kiem tra cac man hinh dung showAdsNative() hoac showLoadedNative() tu LibAds, xac dinh param container (viewGroupAds hoac layoutToAttachAds) trong XML, kiem dem FrameLayout va CardView holder, chuyen toan bo CardView holder thanh FrameLayout va xoa cardCornerRadius. Dung khi audit ad container dung CardView thay vi FrameLayout, hoac native ad bi clip do CardView."
---

# Fix LibAds Native: CardView -> FrameLayout Holder

## Muc dich

Skill nay kiem tra toan bo project xem cac vi tri goi `showAdsNative()` / `showLoadedNative()` dang dung container loai gi (FrameLayout hay CardView), sau do chuyen het CardView holder thanh FrameLayout de native ad khong bi clip va khong bi loi hien thi.

**Nguyen nhan loi**: `CardView` co thuoc tinh `clipToOutline = true` mac dinh, ket hop voi `cardCornerRadius` se cat goc noi dung ad. Ngoai ra `CardView` khong ho tro `removeAllViews()` + `addView()` clean nhu `FrameLayout`, gay ra cac loi hien thi voi LibAds.

---

## Buoc 1 — Tim tat ca call site showAdsNative / showLoadedNative

Chay grep de lay danh sach file Kotlin goi cac ham nay:

```bash
# Tim toan bo call site
grep -rn "showAdsNative\|showLoadedNative" --include="*.kt" <project-root>/app/src
```

**Cac ham can quet:**
- `Fragment.showAdsNative(...)` — dinh nghia trong `LibAds/NativeUtils.kt`
- `AppCompatActivity.showAdsNative(...)` — dinh nghia trong `LibAds/NativeUtils.kt`
- `Fragment.showLoadedNative(...)` — neu ton tai trong project

Ket qua se la danh sach file `.kt` + so dong goi ham.

---

## Buoc 2 — Xac dinh param container trong moi call site

Voi moi call site tim duoc, doc doan code xung quanh (+-10 dong) de xac dinh gia tri truyen vao cac param:

| Ten param | Mo ta |
|-----------|-------|
| `viewGroupAds` | Container chinh de attach native ad, thuong la `binding.layoutAds` |
| `layoutToAttachAds` | Bien the khac cung la container attach ad |

**Vi du dien hinh:**
```kotlin
showAdsNative(
    configName = "Home-top",
    listSpaceName = listOf("Home-top_native"),
    viewGroupAds = binding.layoutAds,   // <-- param can kiem tra
)
```

Tu gia tri `binding.XXX`, lay ten ID XML la `XXX` (vd: `layoutAds`, `layoutAdsTop`, `layoutAdsNoConsole`).

---

## Buoc 3 — Tim file XML tuong ung va kiem dem loai View

Xac dinh file XML layout cua Fragment/Dialog/Activity chua call site do, roi tim element co `android:id="@+id/<ten-id>"`.

**Chay grep de xac dinh loai View:**
```bash
grep -n "id=\"@+id/layoutAds\"" --include="*.xml" -r <project-root>/app/src/main/res
```

Sau do doc XML tai vi tri tim duoc va xac dinh:
- **FrameLayout** — OK, khong can sua
- **CardView** (`androidx.cardview.widget.CardView`) — CAN CHUYEN THANH FrameLayout

**Tong hop ket qua thanh bang:**

| File XML | ID | Loai hien tai | Can sua? |
|----------|----|---------------|---------|
| `dialog_exit_app.xml` | `layoutAds` | FrameLayout | Khong |
| `fragment_home.xml` | `layoutAds` | FrameLayout | Khong |
| `fragment_xxx.xml` | `layoutAds` | CardView | **Co** |

---

## Buoc 4 — Chuyen CardView thanh FrameLayout trong XML

Voi moi file XML co CardView holder can chuyen:

### Quy tac bien doi

**Truoc (CardView):**
```xml
<androidx.cardview.widget.CardView
    android:id="@+id/layoutAds"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    app:cardCornerRadius="@dimen/_8dp"
    app:cardElevation="4dp"
    app:layout_constraintBottom_toBottomOf="parent"
    app:layout_constraintDimensionRatio="300:70"
    app:layout_constraintEnd_toEndOf="parent"
    app:layout_constraintStart_toStartOf="parent"
    app:layout_constraintTop_toTopOf="parent">

    <TextView ... />

</androidx.cardview.widget.CardView>
```

**Sau (FrameLayout):**
```xml
<FrameLayout
    android:id="@+id/layoutAds"
    android:layout_width="match_parent"
    android:layout_height="0dp"
    app:layout_constraintBottom_toBottomOf="parent"
    app:layout_constraintDimensionRatio="300:70"
    app:layout_constraintEnd_toEndOf="parent"
    app:layout_constraintStart_toStartOf="parent"
    app:layout_constraintTop_toTopOf="parent">

    <TextView ... />

</FrameLayout>
```

### Cac thuoc tinh phai XOA khi chuyen:
- `app:cardCornerRadius="..."`
- `app:cardElevation="..."`
- `app:cardBackgroundColor="..."`
- `app:cardUseCompatPadding="..."`
- `app:cardPreventCornerOverlap="..."`
- `app:contentPadding="..."` (CardView-specific)
- Bat ky `app:card*` nao khac

### Cac thuoc tinh GITU NGUYEN:
- `android:id`
- `android:layout_width` / `android:layout_height`
- `android:layout_margin*`
- `android:background` (neu co — dung nhu cu hoac bo neu khong can)
- `app:layout_constraint*` — tat ca constraint giu nguyen
- `android:visibility`
- `android:padding*` (chuyen tu `app:contentPadding` sang `android:padding` neu can thiet)

### KHONG duoc:
- Xoa children cua CardView khi chuyen
- Thay doi logic Kotlin
- Thay doi file nao khac ngoai XML layout cua holder

---

## Buoc 5 — Bao cao ket qua

Sau khi hoan thanh, tao bao cao theo dinh dang:

```
KET QUA KIEM TRA showAdsNative / showLoadedNative
==================================================

Tong so call site: X
Tong so FrameLayout holder: Y  (OK - khong can sua)
Tong so CardView holder:    Z  (da chuyen thanh FrameLayout)

Cac file da sua:
- app/src/main/res/layout/fragment_xxx.xml  (layoutAds: CardView -> FrameLayout)
- ...

Cac file khong can sua:
- app/src/main/res/layout/fragment_home.xml  (layoutAds: FrameLayout - OK)
- ...
```

---

## Luu y quan trong

- **Chi sua file XML layout** — khong cham vao file Kotlin
- **Kiem tra `xmlns:app`** — dam bao `xmlns:app="http://schemas.android.com/apk/res-auto"` van con trong root element cua file XML sau khi sua (de cac `app:layout_constraint*` khac van hoat dong)
- **Neu CardView co `app:cardCornerRadius` de tao bo tron UI** — trao doi voi user truoc khi xoa, vi co the la intentional design. Tuy nhien voi holder chua native ad, bo goc tron la can thiet de tranh clip ad
- **Neu CardView nam TRONG mot CardView khac** (nested) — chi chuyen cai nao la direct parent chua ad (co id la viewGroupAds / layoutToAttachAds), khong chuyen cac CardView con ben trong template ad
