# ClaudeSkillCommon

Kho skills và commands dùng chung cho Claude Code (`.claude`) và Codex/agents runtime (`.agents`).

## Cấu trúc repo

```text
ClaudeSkillCommon/
├── .claude/
│   ├── commands/           # Slash commands (vd. review-android.md)
│   ├── skills/             # Skill bundles (android-code-review, git-workflow, ...)
│   └── settings.local.json # Permissions cụ thể máy — không deploy mặc định
└── scripts/
    ├── deploy-claude-agents.cmd   # Launcher (khuyên dùng trên Windows)
    ├── deploy-claude-agents.ps1
    └── deploy-claude-agents.sh    # Bản tương đương cho Linux/macOS
```

Khi deploy sang project khác, script tạo **hai thư mục giống nhau**:

| Thư mục đích | Dùng cho |
|---|---|
| `{project}/.claude/` | Claude Code |
| `{project}/.agents/` | Codex / agents runtime |

## Yêu cầu

- Windows: PowerShell 5.1 trở lên (hoặc PowerShell 7+)
- Linux/macOS: Bash 4+ (có sẵn trên hầu hết distro/macOS)
- Quyền ghi vào thư mục project đích

## Cách dùng (Windows)

Chạy từ thư mục gốc repo `ClaudeSkillCommon`.

> **Windows mặc định chặn chạy `.ps1`** (`running scripts is disabled`). Dùng file **`.cmd`** bên dưới — không cần đổi Execution Policy.

### Deploy thông thường (khuyên dùng)

Copy skills/commands sang project đích (cả `.claude` và `.agents`):

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp"
```

Hoặc PowerShell (nếu Execution Policy cho phép):

```powershell
.\scripts\deploy-claude-agents.ps1 -TargetPath "D:\AndroidStudioProjects\MyApp"
```

### Xem trước (không ghi file)

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp" -WhatIf
```

### Kèm `settings.local.json`

Mặc định script **bỏ qua** `settings.local.json` vì file này chứa permissions gắn với máy cụ thể. Chỉ bật khi bạn chủ đích muốn copy:

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp" -IncludeSettings
```

### Chỉ định nguồn khác

Mặc định nguồn là `.claude` trong repo này. Có thể override:

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp" -SourcePath "F:\ClaudeSkillCommon\.claude"
```

## Cách dùng (Linux/macOS)

Chạy từ thư mục gốc repo `ClaudeSkillCommon`.

### Deploy thông thường (khuyên dùng)

```bash
./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp"
```

Cũng có thể truyền target như tham số vị trí đầu tiên:

```bash
./scripts/deploy-claude-agents.sh "/home/user/AndroidStudioProjects/MyApp"
```

### Xem trước (không ghi file)

```bash
./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp" --dry-run
```

### Kèm `settings.local.json`

```bash
./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp" --include-settings
```

### Chỉ định nguồn khác

```bash
./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp" --source-path "/home/user/ClaudeSkillCommon/.claude"
```

### Bỏ qua cập nhật `.gitignore`

```bash
./scripts/deploy-claude-agents.sh --target-path "/home/user/AndroidStudioProjects/MyApp" --skip-gitignore
```

> Nếu chưa có quyền chạy: `chmod +x scripts/deploy-claude-agents.sh`.

## Tham số

| Windows (`-Param`) | Linux/macOS (`--param`) | Bắt buộc | Mặc định | Mô tả |
|---|---|---|---|---|
| `-TargetPath` | `--target-path`, `-t`, hoặc vị trí đầu tiên | Có | — | Đường dẫn project đích |
| `-SourcePath` | `--source-path`, `-s` | Không | `{repo}/.claude` | Thư mục nguồn cần copy |
| `-IncludeSettings` | `--include-settings` | Không | Tắt | Copy thêm `settings.local.json` |
| `-SkipGitIgnore` | `--skip-gitignore` | Không | Tắt | Không cập nhật `.gitignore` project đích |
| `-WhatIf` | `--dry-run` | Không | — | Chỉ in preview, không ghi file |

## Hành vi sync

Script dùng chế độ **merge-only**:

- Ghi đè file trùng tên giữa source và target
- **Không xóa** file thừa đã có trong target (vd. file custom chỉ tồn tại ở project đích)

Mỗi lần chạy, output mẫu:

```text
Deploy agent skills
  Source : F:\ClaudeSkillCommon\.claude
  Target : D:\AndroidStudioProjects\MyApp
  Include settings.local.json: False

-> D:\AndroidStudioProjects\MyApp\.claude
   Copied : 186
   Skipped: 1
-> D:\AndroidStudioProjects\MyApp\.agents
   Copied : 186
   Skipped: 1

Done. 2 destinations updated (372 files copied, 2 skipped).

Updated .gitignore (added: .agents/, .claude/).
```

(`Skipped: 1` là `settings.local.json` khi không dùng `-IncludeSettings`.)

### Bỏ qua cập nhật `.gitignore`

Nếu project đích cần commit `.claude/` hoặc `.agents/`:

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp" -SkipGitIgnore
```

## `.gitignore` project đích

Sau deploy, script **tự kiểm tra và bổ sung** các dòng còn thiếu vào `.gitignore` project đích (hoặc tạo file mới nếu chưa có):

```gitignore
# ClaudeSkillCommon deploy (auto-added)
.agents/
.claude/
```

- Chạy lại deploy **không duplicate** dòng đã có (idempotent).
- `-WhatIf` in preview các dòng sẽ thêm, không ghi file.
- Nếu `.claude/` hoặc `.agents/` **đã được git track** trước đó, thêm vào `.gitignore` không tự untrack — chạy thủ công:

```bat
git rm -r --cached .claude .agents
```

## Ví dụ workflow

```powershell
# 1. Cập nhật skills trong ClaudeSkillCommon (commit/push nếu cần)
cd F:\ClaudeSkillCommon

# 2. Xem trước thay đổi sẽ deploy
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\Satellite" -WhatIf

# 3. Deploy thật
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\Satellite"
```

## Execution Policy bị chặn (Windows)

Lỗi:

```text
running scripts is disabled on this system
```

**Cách 1 — Dùng launcher `.cmd` (khuyên dùng, không đổi policy):**

```bat
.\scripts\deploy-claude-agents.cmd -TargetPath "D:\AndroidStudioProjects\MyApp"
```

**Cách 2 — Bypass một lần trong PowerShell:**

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-claude-agents.ps1 -TargetPath "D:\AndroidStudioProjects\MyApp"
```

**Cách 3 — Cho phép script local vĩnh viễn (chỉ user hiện tại):**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Sau đó chạy lại `.\scripts\deploy-claude-agents.ps1` như bình thường.

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `running scripts is disabled` | Execution Policy chặn `.ps1` (Windows) | Dùng `deploy-claude-agents.cmd` hoặc xem mục trên |
| `Permission denied` khi chạy `.sh` (Linux/macOS) | File chưa có quyền thực thi | `chmod +x scripts/deploy-claude-agents.sh` |
| `Source path not found` | `-SourcePath`/`--source-path` sai hoặc chạy script ngoài repo | Chạy từ `ClaudeSkillCommon` hoặc truyền đúng source path |
| `missing skills/ subdirectory` | Thư mục nguồn không phải `.claude` hợp lệ | Kiểm tra đường dẫn nguồn có `skills/` |
| `Access denied` / `Permission denied` khi ghi target | Không có quyền ghi target | Mở terminal với quyền phù hợp hoặc chọn path khác |

## Phạm vi

Script **không**:

- Tạo `.cursor/` (Cursor dùng convention riêng)
- Convert commands sang skills
- Commit/push git
- Untrack file đã commit trong project đích (chỉ append `.gitignore`)
