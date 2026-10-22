# Clean Architecture — Chapter 30: The Database Is a Detail

## Core Idea
Về mặt kiến trúc, database là **"non-entity"**, là detail, giống tay nắm cửa với kiến trúc ngôi nhà. **Data model** (cấu trúc dữ liệu trong app) thì quan trọng; **database** (phần mềm, tiện ích truy cập dữ liệu) thì không. *"The data is significant. The database is a detail."*

## Frameworks Introduced
- **Data model ≠ Database**: cấu trúc dữ liệu có ý nghĩa kiến trúc; RDBMS chỉ là cơ chế.
- **Relational Databases** (Codd, 1970): thanh lịch, kỷ luật, mạnh mẽ, nhưng vẫn **chỉ là công nghệ**. Kiến thức về cấu trúc bảng chỉ nên nằm ở **hàm tiện ích cấp thấp nhất** của vòng ngoài.
  - Framework cho phép truyền **row/table như object** khắp hệ thống là **lỗi kiến trúc**, vì nó trói use case, business rules, thậm chí UI vào cấu trúc quan hệ.
- **Why are database systems so prevalent? Disks.** Ổ đĩa chậm (ms so với ns), nên cần index, cache, query scheme. Từ đó sinh ra file system (theo document) và RDBMS (theo content).
- **What if there were no disk?** Khi mọi thứ ở RAM, ta tổ chức bằng linked list, tree, hash table, stack, queue và truy cập bằng reference. Thực tế ta *đã* làm vậy: đọc từ DB lên rồi sắp lại thành cấu trúc tiện dùng.
- **Details**: DB chỉ là "big bucket of bits" để di chuyển dữ liệu giữa đĩa và RAM.
- **Performance**: là mối quan tâm kiến trúc, nhưng với lưu trữ thì có thể **đóng gói hoàn toàn** ở cơ chế truy cập cấp thấp, tách khỏi business rules.
- **Anecdote**: startup đo đường T1 dùng random access file + tree/linked list. Marketing và kỹ sư phần cứng đòi RDBMS. Uncle Bob đúng về kỹ thuật nhưng sai về thị trường (khách hàng coi RDBMS là "check box"). Lẽ ra nên **"bolt an RDBMS on the side"** với kênh truy cập hẹp, an toàn, giữ lõi bằng file.

## Key Concepts
- **Data model**: cấu trúc dữ liệu có ý nghĩa nghiệp vụ.
- **Database**: phần mềm lưu trữ, là detail.
- **Row structure leakage**: truyền row/ORM entity vào trong.
- **Bolt on the side**: gắn DB ngoài rìa qua kênh hẹp.

## Mental Models
- Hỏi: "**Nếu dữ liệu nằm hết trong RAM, mình có thiết kế nó thành bảng không?**". Thiết kế domain theo câu trả lời đó.
- Performance lưu trữ là chuyện của **adapter**, không phải của use case.

## Anti-patterns
- **Truyền DB row / ORM entity lên use case và UI**.
- **Thiết kế domain từ schema DB** ("database-first").
- **Use case viết SQL/query builder**.

## 🤖 Android mapping (chuyển thể, không có trong sách)
- **Room là detail**. `@Entity`, `@Dao`, `@TypeConverter`, `RoomDatabase` nằm ở `data/database/` (Satellite2 đã đặt đúng chỗ). Điều cần giữ: **Entity không đi ra khỏi `data`**.
```kotlin
// data/database/entity — detail
@Entity(tableName = "search_history") data class SearchHistoryEntity(@PrimaryKey(autoGenerate = true) val id: Long = 0, val query: String, val createdAt: Long)

// domain — data model thật sự
data class SearchHistoryItem(val query: String, val at: Instant)

// data/repository — bolt-on: kênh hẹp, map ở rìa
class SearchHistoryRepositoryImpl(private val dao: SearchHistoryDao) : SearchHistoryReader, SearchHistoryWriter {
    override fun observeAll() = dao.observeAll().map { rows -> rows.map { SearchHistoryItem(it.query, Instant.ofEpochMilli(it.createdAt)) } }
    override suspend fun save(query: String) = dao.insert(SearchHistoryEntity(query = query, createdAt = System.currentTimeMillis()))
}
```
- **"What if there were no disk?" trên mobile**: phần lớn data của app (danh mục, camera, template) được tải từ API và giữ trong RAM (`CommonViewModel` smart-loading). Room chỉ cần cho lịch sử và cache offline. Đừng ép mọi thứ vào Room "cho chắc".
- **Assets JSON cũng là một "database"**: `CityRepositoryImpl` đọc `allCities.json` qua Gson. Use case không biết điều đó, và đó là đúng.
- **DataStore** = key-value store, cũng là detail; bọc sau `PremiumStatusSource`/`SettingsStore`.
- **Performance** (index Room, paging, cache HTTP 10MB của OkHttp) thuộc về `data`, không làm thay đổi signature domain.

## Key Takeaways
1. Data model quan trọng; database là detail.
2. Không truyền row/ORM entity vào vòng trong.
3. Performance lưu trữ được đóng gói ở tầng truy cập dữ liệu.
4. Nếu buộc phải có DB vì lý do phi kỹ thuật, gắn nó ở rìa qua kênh hẹp.

## Connects To
- **arch-ch23 (Data Mappers, Gateways)**, **arch-ch17 (FitNesse WikiPage)**, **arch-ch14 (Zone of Pain: schema)**.
