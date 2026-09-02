# BTrading Company OS V0.1 — Start Here

- Workspace branch: `workspace/btrading-company-os-v0.1`
- Status: **Discovery / Optimization / Not Locked**
- Founder: Bình Nguyễn
- AI role: Chief of Staff / Product Lead / Project Manager / Executor

## 1. Mục tiêu của workspace

Tạo một nơi duy nhất để AI có thể hiểu, quản lý và từng bước triển khai toàn bộ hệ sinh thái BTrading mà không phụ thuộc vào trí nhớ của một cuộc chat.

Founder đưa ra cốt lõi và kết quả mong muốn. AI chịu trách nhiệm mặc định cho việc nghiên cứu, chọn phương án, chuẩn hóa, lập kế hoạch, thực hiện, kiểm thử, theo dõi và cải thiện.

Founder chỉ phải duyệt các quyết định ảnh hưởng lớn đến tiền, pháp lý, thương hiệu, dữ liệu production, quyền tài khoản hoặc thay đổi khó rollback.

## 2. Cách quản trị đã chốt

```text
1 WORKSPACE
1 COMPANY MAP trực quan
1 CHIEF OF STAFF AI
1 EXECUTIVE DASHBOARD ngắn gọn
GitHub / database / logs = bộ nhớ dài hạn
Harness = công cụ + quyền + knowledge
Graph = workflow
Loop = đo kết quả + cải tiến
```

Không đưa Founder các bản đồ dài hoặc quá nhiều lựa chọn trừ khi được yêu cầu.

Báo cáo mặc định:

```text
MỤC TIÊU
ĐÃ LÀM
KẾT QUẢ THỰC
RỦI RO / BLOCKER
CẦN FOUNDER QUYẾT ĐỊNH: Không / Một câu hỏi
```

## 3. Cấu trúc công ty đang thảo luận

```text
BTRADING COMPANY
│
├── BTRADING MARKET INSIGHTS
│   └── Chứng khoán Việt Nam / Order Flow / Proof / VIP / môi giới CTCK
│
├── BROKERWIKI / FOREX PERFORMANCE
│   └── Bot Trade / Tín hiệu / Copy Trade / Proof / broker conversion
│
├── BÌNHGOLD GROWTH ENGINE
│   ├── Luồng chuyên nghiệp cho kênh chính
│   └── Luồng hiệu suất cho kênh vệ tinh/seeding
│
└── COMPANY OPERATIONS ENGINE
    └── AI / Tech / Data / Automation / Finance / Monitoring
```

Lưu ý: cấu trúc module kinh doanh vẫn đang tối ưu. Không được coi là bản khóa cuối cùng.

## 4. Cốt lõi đã nhận từ Founder

### BTrading Market Insights

- Order Flow là chủ đề chính.
- Triết lý: “Dòng tiền đi đâu, ta theo đó”.
- Khách hàng chính ban đầu là người giao dịch T+ theo khung ngày.
- Tổng quan VNINDEX khung D theo SMC, hỗ trợ và kháng cự.
- Insight theo dõi lệnh chủ động theo thị trường, ngành và mã.
- Lệnh chờ được nghiên cứu để đánh giá chờ mua/chờ bán/trung lập.
- Intraday dành cho trader có kinh nghiệm và chấp nhận rủi ro cao hơn.
- Khách hàng phải nhìn thấy case và bằng chứng hiệu quả.
- Doanh thu dự kiến từ VIP và môi giới CTCK Việt Nam.

### BrokerWiki / Forex

- Content trung tâm xoay quanh Bot Trade, Tín hiệu và Copy Trade.
- Các sản phẩm chưa hoàn thiện.
- Nội dung phải cho khách thấy hiệu quả, lợi nhuận và giá trị thực tế.
- Mọi kết quả phải gắn trạng thái Research / Backtest / Demo / Pilot / Live.
- So sánh broker, rebate, bonus và chính sách là lớp hỗ trợ conversion.

### Content marketing

Hai luồng tách biệt:

1. Kênh chính: chuyên nghiệp, xây uy tín dài hạn.
2. Kênh vệ tinh/seeding: ngắn, nhanh, ưu tiên case, hiệu quả và lợi nhuận.

Mỗi nền tảng phải có form content riêng. Không đăng cùng một nội dung y hệt lên mọi kênh.

## 5. Kiến trúc vận hành được khuyến nghị

```text
CHATGPT WORKSPACE = Command Center
UBUNTU VPS = Always-on Control Plane
LOCAL PC = Authenticated Interactive Worker
GITHUB = Source of Truth kỹ thuật
DATABASE / LOGS = trạng thái và bằng chứng vận hành
```

### Ubuntu VPS

- scheduler;
- queue/workflow state;
- API integrations;
- monitoring;
- publishing qua API;
- health checks;
- dispatch local jobs.

### Máy tính hiện tại

- Chrome đã đăng nhập;
- thao tác web qua browser skill khi API không đủ;
- project/file local;
- desktop apps;
- video/media processing;
- OAuth/2FA khi nền tảng bắt buộc.

Nguyên tắc: **API trước → browser automation sau → con người cuối cùng.**

Không trích xuất cookie/mật khẩu Chrome lên VPS. Không dùng browser automation để né OAuth/2FA hoặc điều khoản nền tảng.

## 6. Social Account Control Center

Mục tiêu: Founder xác thực một lần cho từng nền tảng; hệ thống quản lý vận hành thường ngày.

Phải quản lý tập trung:

- account/page/channel registry;
- business ownership;
- API/OAuth/bot/OA/browser connection;
- allowed actions;
- token health và reauthorization;
- publish/schedule/edit khi API cho phép;
- analytics;
- audit log;
- recovery path.

Founder chỉ can thiệp khi nền tảng yêu cầu xác minh danh tính, 2FA, đổi quyền sở hữu hoặc hành động rủi ro cao.

## 7. Tài sản đã biết

- GitHub repos:
  - `mrnguyenlk-byte/marketwall`
  - `mrnguyenlk-byte/financial-market-dashboard`
  - `mrnguyenlk-byte/BTradingAcademyStudio`
- Vercel project: `marketwall`
- Supabase/PostgreSQL project đã kết nối
- Windows/local environment có Chrome sessions và project files
- Ubuntu VPS có sẵn để phục vụ Btrading
- Windows VPS có AmiBroker / MT5 / DataPro / automation
- Các kênh đã biết trong code: website, Facebook, YouTube, Telegram, Zalo, TikTok

## 8. Tài liệu tham chiếu

- `docs/MASTER_PROJECT_STATE.md`
- `docs/AI_ASSISTANT_OPERATING_CONTRACT.md`
- `docs/BTRADING_SYSTEM_WORKING_DRAFT.md`
- `docs/BINHGOLD_CONTENT_ENGINE_WORKING_DRAFT.md`
- `docs/BROKERWIKI_CONTENT_CORE_WORKING_DRAFT.md`
- `docs/SOCIAL_ACCOUNT_CONTROL_CENTER_WORKING_DRAFT.md`
- `docs/BTRADING_SYSTEM_ARCHITECTURE.md`
- `docs/DATA_AUDIT_REPORT.md`

Tài liệu có chữ `WORKING_DRAFT` chưa được khóa.

## 9. Quy tắc làm việc bắt buộc

1. Không tự khóa module hoặc workflow trước khi Founder nói rõ “chốt”.
2. Mỗi lần chỉ xử lý một module hoặc một quyết định lớn.
3. AI phải đưa phương án khuyến nghị, không đẩy toàn bộ lựa chọn cho Founder.
4. Phải giảm độ phức tạp, không chuyển độ phức tạp sang Founder.
5. Chưa tự động hóa quy trình chưa được mô tả và chạy ổn định.
6. Mọi thay đổi phải có kiểm tra, bằng chứng và khả năng rollback phù hợp.
7. Mọi milestone phải cập nhật source of truth.

## 10. Bước đầu tiên trong workspace mới

Không đi ngay vào code.

Bước đầu tiên là hoàn thiện **Company Map cấp module**, từng module một, theo mẫu:

```text
Tên module
Mục tiêu
Đầu ra
Khách hàng/người dùng
Nguồn dữ liệu
Kênh phân phối
Nguồn doanh thu
Tiêu chuẩn thành công
Quan hệ với module khác
Trạng thái: Core / Working / Approved
```

Module đầu tiên cần tiếp tục thảo luận: **Kênh phân phối và Social Account Control Center**, sau đó mới quay lại BTrading Market Insights và BrokerWiki.
