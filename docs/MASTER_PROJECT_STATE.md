# Btrading Master Project State

> Nguồn sự thật quản trị của nhánh Chứng khoán. Mọi milestone phải cập nhật tài liệu này trước khi đóng.

- Cập nhật: 2026-09-02
- Trạng thái: IN PROGRESS
- Nhánh triển khai: `feat/btrading-orderflow-platform`
- Ưu tiên hiện tại: Btrading; không trộn BrokerWiki/Forex vào workstream này
- Định vị: **Btrading Market Insights — Order Flow Intelligence cho chứng khoán Việt Nam**
- Triết lý: **Dòng tiền đi đâu, ta theo đó**

## 1. Current phase

**Phase 0 — Foundation, data audit và Quant Core scaffolding**

Mục tiêu của phase:

1. Khóa ngôn ngữ nghiệp vụ và Quant Specification V1.
2. Xác định chính xác dữ liệu đang có và dữ liệu còn thiếu.
3. Tạo Quant Core thuần TypeScript, có unit test, không phụ thuộc AI.
4. Thiết kế schema cho Event/Proof Engine.
5. Chỉ nối dữ liệu production sau khi provider đáp ứng contract tối thiểu.

## 2. Decisions locked

1. Btrading là business chứng khoán độc lập.
2. BìnhGold là lớp thương hiệu/niềm tin và phân phối nội dung, không phải Quant Engine.
3. Hai chế độ sản phẩm:
   - **Btrading Daily**: khách T+, newbie và người không theo bảng điện liên tục.
   - **Btrading Intraday**: trader kinh nghiệm, bám sát thị trường, chấp nhận rủi ro cao hơn.
4. Pipeline lõi:
   `VNINDEX D1 SMC Context -> Active Flow + Passive Flow -> Insight -> Scanner -> Proof/Replay -> Content`.
5. SMC D1 là context; không được bóp méo điểm Order Flow.
6. Active Score và Passive Score phải hiển thị tách riêng.
7. AI chỉ giải thích, xếp hạng nội dung, vận hành và cá nhân hóa; AI không được bịa dữ liệu hay tự thay Quant rule.
8. Tất cả event phải được lưu để đánh giá. Marketing được chọn case nổi bật, nhưng claim hiệu quả tổng thể phải dùng toàn bộ tập mẫu đủ điều kiện.
9. Nguồn thu mục tiêu:
   - Btrading VIP.
   - Doanh thu môi giới từ khách hàng mở/giao dịch qua liên kết CTCK Việt Nam.

## 3. Quant concepts locked

- Trade classification bằng giá khớp so với bid/ask ngay trước giao dịch.
- Side không xác định phải là `unknown`, không ép Buy/Sell.
- Active Buy, Active Sell, Delta, Active Ratio.
- Normalized Flow theo thanh khoản kỳ vọng của chính mã.
- Large Order adaptive theo phân phối lịch sử của từng mã và có minimum floor.
- Large Buy/Sell, Large Delta/Ratio, Large Order Intensity.
- Persistence và Acceleration.
- Order Book Imbalance.
- Passive order quality: Size, Persistence, Proximity, Stability/Cancellation.
- Sector Flow + Breadth; Market Flow + sector breadth.
- Price response và absorption.
- Proof outcomes: T+1/T+2/T+3/T+5/T+10/T+20, MFE, MAE, excess return so với VNINDEX.

## 4. Hypotheses — chưa khóa

Các giá trị sau chỉ là cấu hình khởi đầu, không phải chân lý production:

- Large-order quantile: Q95.
- Minimum large-order value floor.
- Cửa sổ 1/5/15/30 phút.
- Thời gian tối thiểu của passive liquidity.
- Số level order book sử dụng.
- Trọng số Active Score/Passive Score.
- Ngưỡng Strong Buy/Sell.
- Điều kiện absorption.

Phải hiệu chỉnh bằng backtest, walk-forward và out-of-sample.

## 5. Current infrastructure

- Web application: Next.js + TypeScript.
- Hosting: Vercel.
- Database layer: Prisma + PostgreSQL.
- Repository: `mrnguyenlk-byte/marketwall`.
- Windows VPS: AmiBroker, MT5, DataPro và daily-analysis automation.
- Social publishing: Telegram và Facebook đã có code tích hợp.
- Dữ liệu VN hiện hữu: quote snapshot từ KBS/VPS; lịch sử OHLC qua vnstock bridge/proxy; tự doanh EOD từ CafeF.

## 6. Current data reality

Dữ liệu hiện tại đủ cho:

- Market overview và heatmap.
- Quote snapshot.
- Bid/ask top levels tại thời điểm poll.
- Foreign flow ở mức snapshot/ước lượng tùy provider.
- Proprietary trading EOD.
- Daily SMC/context dựa OHLC.

Dữ liệu hiện tại **chưa đủ để tuyên bố full Order Flow production**, vì chưa có bằng chứng về:

- Tick-by-tick matched trades liên tục.
- Bid/ask context ngay trước từng trade.
- Order-book snapshots/history có sequence ổn định.
- Add/modify/cancel events hoặc độ phân giải đủ để đo stability/spoofing.

## 7. Active workstreams

### W1 — Quant Core

- [x] Khóa specification nghiệp vụ V1.
- [ ] Tạo types và pure functions.
- [ ] Unit tests cho classifier, delta, ratios, OBI và event mapping.
- [ ] Tạo configuration contract để calibration không cần sửa code.

### W2 — Data contract

- [ ] Chuẩn hóa `TradeTick`, `OrderBookSnapshot`, `DailyContext`, `FlowWindow`.
- [ ] Viết provider capability probe.
- [ ] Lập Data Gap Matrix.
- [ ] Chọn data provider production.

### W3 — Persistence/Proof

- [ ] Prisma models cho raw/derived event data.
- [ ] Event idempotency.
- [ ] Outcome worker cho T+n/MFE/MAE/excess return.
- [ ] Replay API.

### W4 — Product/API

- [ ] Flow summary API theo market/sector/symbol.
- [ ] Insight ranking API.
- [ ] Daily UI.
- [ ] Intraday UI sau khi data contract đạt chuẩn.

### W5 — Content workflow

- [ ] Content candidate ranking từ event/proof database.
- [ ] Human-review gate cho claim hiệu quả.
- [ ] Publisher pipeline và retry/audit log.

## 8. Blockers

### B1 — Production market-data feed

Cần provider có tối thiểu:

- tick trades có timestamp và sequence/id;
- best bid/ask hoặc book snapshot đồng bộ với trade;
- order-book depth và lịch sử;
- quyền lưu trữ và sử dụng dữ liệu cho sản phẩm thương mại.

Không mở bán Intraday Order Flow trước khi blocker này được giải quyết.

### B2 — Broker conversion contract

Cần chuẩn hóa đối tác CTCK, tracking link, attribution, chính sách hoa hồng và quy định truyền thông trước khi bật funnel môi giới.

## 9. Next actions

1. Commit Quant Core V1 scaffold và unit tests.
2. Commit `BTRADING_ORDER_FLOW_SPEC_V1.md`.
3. Commit `DATA_GAP_MATRIX.md`.
4. Thiết kế Prisma schema Event/Proof V1.
5. Chạy build/lint/test trên PR.
6. Sau khi CI xanh, nối quote snapshot vào chế độ `indicative` — tuyệt đối không gắn nhãn full Order Flow.
7. Đánh giá/chọn provider tick + order book.

## 10. Definition of done — Phase 0

Phase 0 chỉ hoàn thành khi:

- Quant Core deterministic có test.
- Data contracts ổn định.
- Data Gap Matrix được xác nhận.
- Provider requirements được khóa.
- Event/Proof schema được review.
- Không có UI hoặc content nào tuyên bố tín hiệu full Order Flow dựa trên snapshot polling.

## 11. Decision log

| Ngày | Quyết định | Trạng thái |
|---|---|---|
| 2026-09-02 | Tách Stock/Btrading khỏi Forex/BrokerWiki | Locked |
| 2026-09-02 | Order Flow là chủ đề và lợi thế lõi | Locked |
| 2026-09-02 | SMC D1 là context, không trộn vào Flow score | Locked |
| 2026-09-02 | Daily trước, Intraday sau khi đủ dữ liệu | Locked |
| 2026-09-02 | Proof Engine lưu toàn bộ event | Locked |
| 2026-09-02 | Q95 và score weights chỉ là hypothesis | Locked as hypothesis |
