# Social Account Control Center — Working Draft

- Status: CORE + WORKING
- Date: 2026-09-02
- Scope: BTrading Company OS

## Core requirement

Founder không phải đăng nhập lặp lại, tự lấy API key hoặc tự chỉnh từng tài khoản mạng xã hội cho các tác vụ hằng ngày.

Hệ thống cần một **Social Account Control Center** quản lý tập trung quyền truy cập, trạng thái kết nối, lịch đăng, nội dung, log và sự cố của các kênh.

## Operating model

```text
FOUNDER OWNERSHIP
      ↓ one-time authorization
BUSINESS ACCOUNT STRUCTURE
      ↓
OAUTH / BOT / OA CONNECTIONS
      ↓
CENTRAL SECRET VAULT
      ↓
SOCIAL ACCOUNT REGISTRY
      ↓
PUBLISH / EDIT / READ METRICS / MODERATE
      ↓
AUDIT LOG + TOKEN HEALTH + REAUTH ALERT
```

## Account registry

Mỗi tài khoản phải có:

- platform;
- business/brand owner;
- account/page/channel id;
- role/permission;
- connection method;
- scopes;
- token expiry/health;
- allowed actions;
- content stream: professional hoặc performance;
- business stream: Btrading hoặc BrokerWiki;
- last successful action;
- last error;
- reauthorization owner;
- emergency recovery method.

Không lưu mật khẩu, token hoặc secret trong GitHub/docs/chat.

## Control levels

### Automatic

- đăng nội dung đã qua rule;
- lên lịch;
- đọc analytics;
- cập nhật trạng thái;
- retry lỗi tạm thời;
- cảnh báo token sắp hết hạn;
- lưu audit log.

### Approval required

- đổi tên/tài khoản/branding;
- xóa nội dung hoặc tài khoản;
- thay quyền admin;
- thay payment/ads settings;
- publish claim tài chính nhạy cảm;
- reauthorize owner identity;
- hành động không thể rollback.

## Platform strategy

- Meta: business portfolio/Page access + official API where approved.
- YouTube: channel permissions for human operation; OAuth owner/service identity for API workflows.
- TikTok: Business Center for asset control; approved official posting integration or draft/manual-finalization fallback.
- Telegram: bot token + channel admin rights.
- Zalo: Official Account + developer app/OpenAPI.

## One-time founder setup

Founder chỉ thực hiện một lần cho từng nền tảng:

1. Xác nhận quyền sở hữu.
2. Thêm business/admin recovery identity.
3. Kết nối app/OAuth hoặc bot/OA.
4. Bật 2FA và lưu recovery codes trong vault.
5. Phê duyệt scopes.

Sau đó hệ thống chịu trách nhiệm vận hành thường ngày, token health và cảnh báo reauthorization.

## Non-negotiable constraints

- Không dùng browser automation trái điều khoản để né OAuth/2FA.
- Không chia sẻ mật khẩu cá nhân cho agent.
- Không hứa quyền vĩnh viễn; nền tảng có thể thu hồi token hoặc yêu cầu xác minh lại.
- Luôn giữ ít nhất hai human admins/recovery paths cho tài sản quan trọng.
- Mọi hành động phải có actor, timestamp, payload hash/result và rollback/incident record khi phù hợp.

## Success condition

Founder chỉ cần can thiệp khi nền tảng yêu cầu xác minh chủ tài khoản, thay đổi quyền sở hữu, hoặc phê duyệt hành động rủi ro cao. Các công việc đăng, sửa, lên lịch, đọc số liệu và theo dõi lỗi được quản lý từ một control center duy nhất.
