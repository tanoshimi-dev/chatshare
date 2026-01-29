# UGC Safety Features Implementation

Apple App Store Guideline 1.2対応として、ユーザー生成コンテンツ（UGC）の安全機能を実装しました。

## 実装日
2026-01-29

## 概要

Apple App Store審査のためのUGCガイドライン対応機能を実装：
- 利用規約（ToS）同意フロー
- コンテンツ通報機能
- ユーザーブロック機能
- コンテンツフィルター（管理者向け）

---

## Backend (Go)

### 新規ファイル

| ファイル | 説明 |
|---------|------|
| `internal/services/email.go` | SendGridメール通知サービス（管理者アラート用） |
| `internal/handlers/tos.go` | 利用規約ステータス確認・同意エンドポイント |
| `internal/handlers/report.go` | コンテンツ通報システム（管理機能付き） |
| `internal/handlers/block.go` | ユーザーブロック機能 |
| `internal/handlers/content_filter.go` | キーワードベースコンテンツフィルター |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `internal/database/models.go` | `ToSAcceptedAt`/`ToSVersion`をUserに追加、`Report`/`BlockedUser`/`ContentFilter`モデル追加 |
| `internal/database/database.go` | 新モデルのAutoMigrate追加 |
| `internal/config/config.go` | `AdminEmail`と`ToSVersion`設定追加 |
| `internal/router/router.go` | 新規ルート登録 |
| `internal/handlers/chat.go` | ブロックユーザーフィルタリング、コンテンツフィルターチェック追加 |
| `internal/handlers/comment.go` | ブロックユーザーフィルタリング、コンテンツフィルターチェック追加 |

---

## Mobile App (React Native)

### 新規ファイル

| ファイル | 説明 |
|---------|------|
| `src/services/tosService.ts` | ToSステータス確認・同意API |
| `src/services/reportService.ts` | コンテンツ通報API |
| `src/services/blockService.ts` | ユーザーブロックAPI |
| `src/screens/TermsOfServiceScreen.tsx` | ToS表示（同意/拒否） |
| `src/screens/BlockedUsersScreen.tsx` | ブロックユーザー管理 |
| `src/components/ReportModal.tsx` | 通報ダイアログ（理由選択） |

### 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/contexts/AuthContext.tsx` | `tosAccepted`状態と`checkToSStatus`追加 |
| `src/navigation/RootNavigator.tsx` | ログイン後ToS未同意時にToS画面表示 |
| `src/navigation/DrawerNavigator.tsx` | BlockedUsers/Settingsスクリーン追加 |
| `src/screens/TimelineScreen.tsx` | チャットカードにReport/Blockメニュー追加 |
| `src/screens/SettingsScreen.tsx` | Blocked Users/Terms of Serviceメニュー追加 |

---

## Web Frontend (Next.js)

### 新規ファイル

| ファイル | 説明 |
|---------|------|
| `app/terms/page.tsx` | 利用規約ページ |

---

## API Endpoints

### 一般ユーザー向け

| Endpoint | Method | 説明 |
|----------|--------|------|
| `/api/v1/tos/status` | GET | ToS同意ステータス確認 |
| `/api/v1/tos/accept` | POST | 現行ToSへの同意 |
| `/api/v1/reports` | POST | コンテンツ通報作成 |
| `/api/v1/user/blocked-users` | GET | ブロックユーザー一覧 |
| `/api/v1/user/blocked-users/ids` | GET | ブロックユーザーID一覧 |
| `/api/v1/user/blocked-users/:id` | POST | ユーザーブロック |
| `/api/v1/user/blocked-users/:id` | DELETE | ユーザーブロック解除 |
| `/api/v1/user/blocked-users/:id/check` | GET | ブロック状態確認 |

### 管理者向け

| Endpoint | Method | 説明 |
|----------|--------|------|
| `/api/v1/admin/reports` | GET | 通報一覧 |
| `/api/v1/admin/reports/:id` | GET | 通報詳細取得 |
| `/api/v1/admin/reports/:id` | PUT | 通報ステータス更新 |
| `/api/v1/admin/content-filters` | GET | コンテンツフィルター一覧 |
| `/api/v1/admin/content-filters` | POST | コンテンツフィルター作成 |
| `/api/v1/admin/content-filters/:id` | DELETE | コンテンツフィルター削除 |
| `/api/v1/admin/content-filters/:id/toggle` | PUT | コンテンツフィルター有効/無効切替 |

---

## Database Models

### 新規テーブル

```go
// Report - コンテンツ通報
type Report struct {
    ID          string
    ReporterID  string
    ContentType string  // "chat" or "comment"
    ContentID   string
    Reason      string
    Description string
    Status      string  // "pending", "reviewed", "resolved", "dismissed"
    AdminNotes  string
}

// BlockedUser - ユーザーブロック関係
type BlockedUser struct {
    ID        string
    BlockerID string  // ブロックした側
    BlockedID string  // ブロックされた側
}

// ContentFilter - コンテンツフィルターキーワード
type ContentFilter struct {
    ID        string
    Keyword   string
    IsActive  bool
    CreatedBy string
}
```

### User モデル変更

```go
type User struct {
    // 既存フィールド...
    ToSAcceptedAt *time.Time  // ToS同意日時
    ToSVersion    string      // 同意したToSバージョン
}
```

---

## 環境変数

新規追加が必要な環境変数：

```env
# SendGrid (通報通知メール用)
SENDGRID_API_KEY=your_sendgrid_api_key

# 管理者設定
ADMIN_EMAIL=admin@example.com
TOS_VERSION=1.0
```

---

## ユーザーフロー

### ToS同意フロー
1. ユーザーがログイン
2. `AuthContext`が`getToSStatus()`でToS同意状態を確認
3. 未同意の場合、`TermsOfServiceScreen`を表示
4. 同意 → アプリ利用可能 / 拒否 → ログアウト

**重要:** ToS画面は一度同意すれば再表示されません。
- 同意状態はデータベースに保存（`ToSAcceptedAt`, `ToSVersion`）
- 次回ログイン時、バックエンドが同意状態を確認し`accepted: true`を返す
- ToS画面が再表示されるのは、管理者が`TOS_VERSION`を更新した場合のみ

### 通報フロー
1. タイムラインでチャットカードの`...`メニューをタップ
2. 「Report」を選択
3. `ReportModal`で理由を選択し詳細を入力
4. 送信 → 管理者にメール通知

### ブロックフロー
1. タイムラインでチャットカードの`...`メニューをタップ
2. 「Block User」を選択
3. 確認ダイアログで承認
4. ブロックされたユーザーのコンテンツがフィードから除外
5. 設定 > Blocked Usersでブロック解除可能

---

## Breaking Changes

### API

- チャット取得API (`/api/v1/chats`) - ブロックユーザーのコンテンツが自動フィルタリングされる
- コメント取得API - ブロックユーザーのコメントが自動フィルタリングされる
- チャット/コメント作成API - コンテンツフィルターでブロックされる可能性あり

### 認証フロー

- ログイン後、ToS未同意ユーザーはメイン画面にアクセスできない
- `AuthContext`に新しいプロパティ追加: `tosAccepted`, `tosLoading`, `checkToSStatus`, `setTosAccepted`
