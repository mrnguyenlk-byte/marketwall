# Btrading Master Project State

> Nguồn trạng thái làm việc của nhánh Chứng khoán. Tài liệu này phản ánh quá trình trao đổi hiện tại, không phải bản chốt hệ thống.

- Cập nhật: 2026-09-02
- Trạng thái: **DISCOVERY / OPTIMIZATION / NOT LOCKED**
- Nhánh làm việc: `feat/btrading-orderflow-platform`
- Ưu tiên hiện tại: đơn giản hóa Btrading trước khi hiện thực hóa toàn bộ workflow
- Định hướng đang xem xét: **Btrading Market Insights — lấy Order Flow làm chủ đề chính**
- Triết lý founder: **Dòng tiền đi đâu, ta theo đó**

## 1. Quy ước trạng thái

Mọi nội dung trong workspace/repository phải được gắn một trong bốn trạng thái:

- `CORE`: cốt lõi do founder đưa ra; giữ nguyên ý nghĩa nhưng vẫn có thể làm rõ.
- `WORKING`: phương án đang trao đổi và tối ưu.
- `HYPOTHESIS`: giả thuyết cần dữ liệu/backtest/kiểm chứng.
- `APPROVED`: chỉ áp dụng khi founder xác nhận rõ từng phần.

Hiện tại chưa có tài liệu kiến trúc tổng thể nào ở trạng thái `APPROVED` hoặc `LOCKED`.

## 2. Core input từ founder

### 2.1 Product thesis

- Btrading Market Insights lấy Order Flow làm chủ đề chính.
- Triết lý: dòng tiền đi đâu, ta theo đó.
- Khách hàng chứng khoán Việt Nam chủ yếu giao dịch T+, vì vậy sản phẩm chính cần hỗ trợ quyết định theo khung ngày.
- Tổng quan khung D của VNINDEX dùng cấu trúc SMC và chỉ ra hỗ trợ/kháng cự.
- Insight theo dõi và đánh giá lệnh chủ động theo mã và ngành.
- Lệnh chờ được nghiên cứu để đánh giá chờ mua, chờ bán hoặc trung lập.
- Intraday dành cho khách có kinh nghiệm, muốn tăng tần suất giao dịch và chấp nhận rủi ro cao hơn.
- Khách hàng phải nhìn thấy bằng chứng/case hiệu quả của tín hiệu.
- Nguồn thu dự kiến: VIP và khách hàng giao dịch qua liên kết môi giới CTCK Việt Nam.

### 2.2 Business boundary

- Btrading là nhánh Chứng khoán.
- Forex/BrokerWiki được quản lý riêng.
- BìnhGold là thương hiệu đại diện, giải thích và phân phối nội dung cho cả hai nhánh.

## 3. Working model đang được tối giản

Mô hình tối thiểu đang được xem xét:

```text
VNINDEX D1 CONTEXT
        +
ACTIVE MONEY-FLOW INSIGHT
        +
SECTOR / STOCK RANKING
        +
PROOF T+n
        ->
DAILY PRODUCT + CONTENT
```

Các thành phần sau chưa mặc định phải xây ngay:

- full Passive/Waiting Flow;
- full realtime tick Order Flow;
- Intraday product;
- một score tổng hợp phức tạp;
- queue/worker/agent harness nhiều tầng;
- CRM và billing hoàn chỉnh;
- automation toàn bộ từ ngày đầu.

Chúng chỉ được thêm khi giải quyết trực tiếp một nhu cầu người dùng, tạo bằng chứng hiệu quả hoặc tạo doanh thu rõ ràng.

## 4. Câu hỏi cần chốt theo thứ tự

### Q1 — Kết quả người dùng

- Sau khi mở Btrading, khách T+ cần nhận được chính xác điều gì?
- Một watchlist, một ranking, một insight hay một kế hoạch giao dịch?
- Bao nhiêu thông tin là đủ để hành động mà không gây rối?

### Q2 — Sản phẩm tối thiểu

- Module nào là sản phẩm lõi?
- Module nào chỉ là dữ liệu phụ trợ?
- Phần nào Free, phần nào VIP?
- Có cần tách Daily và Intraday ngay không?

### Q3 — Bằng chứng hiệu quả

- Một insight được xem là thành công theo tiêu chí nào?
- Mốc T+ nào quan trọng nhất với khách hàng mục tiêu?
- Cách chọn case marketing nào vừa thuyết phục vừa không làm sai lệch hiệu quả chung?

### Q4 — Dữ liệu

- Nguồn hiện tại cung cấp chính xác những field nào?
- Dữ liệu nào đủ cho MVP Daily?
- Dữ liệu nào chỉ cần khi triển khai Intraday?
- Chi phí và quyền thương mại của provider là gì?

### Q5 — Quy tắc định lượng

- Quy tắc tối thiểu nào đủ để tạo insight?
- Có cần score 0–100 hay chỉ cần trạng thái/ranking/reason codes?
- Large Order, persistence, acceleration và waiting order có thực sự tăng hiệu quả không?

### Q6 — Workflow thực tế

- Phần nào cần tự động ngay?
- Phần nào nên chạy bán thủ công để kiểm chứng?
- Điểm nào bắt buộc có người duyệt?

### Q7 — Doanh thu

- VIP bán tốc độ, chiều sâu hay tín hiệu?
- Link môi giới được đặt ở đâu trong funnel?
- Cần đo conversion và attribution ở mức nào trong MVP?

## 5. Current infrastructure đã xác nhận

- Web: Next.js + TypeScript.
- Hosting: Vercel.
- Database: Prisma + PostgreSQL.
- Repository: `mrnguyenlk-byte/marketwall`.
- Windows VPS: AmiBroker, MT5, DataPro và chart automation.
- Social publishing: Telegram/Facebook đã có code và log.
- Dữ liệu VN hiện tại phù hợp chủ yếu cho quote snapshot, heatmap, Daily Context, foreign-flow snapshot/derived và proprietary EOD.

## 6. Data reality cần tôn trọng

Hiện chưa có bằng chứng đủ để coi hệ thống đang có:

- tick-by-tick matched trades liên tục cho toàn thị trường;
- bid/ask ngay trước từng trade;
- order-book history có sequence ổn định;
- add/modify/cancel events đủ để đánh giá lệnh chờ bền vững.

Do đó mọi phiên bản dùng snapshot chỉ được gọi là `indicative` hoặc `ước lượng`, không được quảng bá như full verified Order Flow.

## 7. Working hypotheses

Các khái niệm sau đang được nghiên cứu, chưa chốt:

- Active Buy/Sell, Delta và Active Ratio.
- Normalized Flow.
- Adaptive Large Order.
- Persistence và acceleration.
- Order Book Imbalance.
- Passive size/persistence/proximity/stability.
- Price response và absorption.
- Sector/Market Flow.
- Proof T+1/T+3/T+5/T+10/T+20, MFE, MAE và excess return.
- Active/Passive score tách riêng.

Các ngưỡng, trọng số, cửa sổ thời gian và taxonomy event vẫn là `HYPOTHESIS`.

## 8. Nguyên tắc đơn giản hóa

1. Bắt đầu từ customer outcome, không bắt đầu từ hạ tầng.
2. Mỗi module phải trả lời một câu hỏi cụ thể.
3. Không xây score nếu ranking + reason codes đã đủ.
4. Không xây Intraday trước khi Daily chứng minh giá trị.
5. Không xây full Agent Harness trước khi workflow thủ công/bán tự động chạy ổn định.
6. Không mua hạ tầng hoặc data dư thừa trước khi có use case rõ.
7. Mỗi đề xuất phải có quyết định: giữ, bỏ, trì hoãn hoặc thử nghiệm.
8. Mỗi vòng trao đổi chỉ chốt một lớp của hệ thống.

## 9. Current workstreams

### W1 — Product simplification

- [ ] Chốt đầu ra duy nhất mà khách T+ nhận mỗi ngày.
- [ ] Chọn tối đa 3 module lõi cho MVP.
- [ ] Chọn phần Free/VIP ban đầu.

### W2 — Proof design

- [ ] Chọn định nghĩa một insight.
- [ ] Chọn mốc đánh giá T+n chính.
- [ ] Chọn cách trình bày selected cases và full cohort.

### W3 — Data feasibility

- [ ] Lập Data Gap Matrix sau khi MVP được thu gọn.
- [ ] Chỉ đánh giá provider theo field MVP thực sự cần.

### W4 — Quant minimum

- [ ] Viết bộ quy tắc tối thiểu sau khi Q1–Q3 được duyệt.
- [ ] So sánh rule/ranking đơn giản với score phức tạp.

### W5 — Workflow minimum

- [ ] Vẽ workflow thủ công/bán tự động V0.
- [ ] Tự động hóa chỉ sau khi workflow V0 cho kết quả ổn định.

## 10. Blockers hiện tại

Blocker chính không phải code hay hạ tầng. Blocker là chưa chốt:

1. Customer outcome tối thiểu.
2. Ba module MVP.
3. Định nghĩa proof thành công.
4. Quy tắc Free/VIP.

Chưa giải các điểm này thì không triển khai Quant Engine hoặc Agent Harness hoàn chỉnh.

## 11. Next action

Bước tiếp theo duy nhất:

> **Đơn giản hóa Btrading Daily thành một trải nghiệm người dùng cụ thể: khách mở trang mỗi ngày, nhìn gì, hiểu gì và làm gì.**

Sau khi founder duyệt trải nghiệm này, mới chuyển sang chọn module, dữ liệu và quy tắc định lượng.

## 12. Decision log

| Ngày | Nội dung | Trạng thái |
|---|---|---|
| 2026-09-02 | Tách Btrading khỏi Forex/BrokerWiki | CORE |
| 2026-09-02 | Order Flow là chủ đề chính | CORE |
| 2026-09-02 | Daily/T+ là nhóm người dùng chính | CORE |
| 2026-09-02 | Intraday dành cho trader kinh nghiệm | CORE |
| 2026-09-02 | VIP + môi giới CTCK là nguồn thu dự kiến | CORE |
| 2026-09-02 | Tài liệu System Lock trước đó được hủy hiệu lực | APPROVED CORRECTION |
| 2026-09-02 | Tiếp tục tối ưu và đơn giản hóa trước khi chốt | CURRENT MODE |
