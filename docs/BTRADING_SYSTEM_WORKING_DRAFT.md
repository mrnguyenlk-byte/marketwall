# Btrading System Working Draft

- Status: DISCOVERY / NOT LOCKED
- Date: 2026-09-02
- Scope: Stock Business / Btrading only
- Management state: `docs/MASTER_PROJECT_STATE.md`

> Tài liệu này là bản làm việc để trao đổi, tối ưu và đơn giản hóa. Không nội dung nào được xem là quyết định cuối cùng cho đến khi người sáng lập xác nhận rõ là “chốt”.

## 1. Cốt lõi hiện tại

Btrading đang được định hướng là **Market Insights cho chứng khoán Việt Nam**, lấy Order Flow làm chủ đề chính với triết lý:

> Dòng tiền đi đâu, ta theo đó.

Các ý cốt lõi đang được giữ để tiếp tục kiểm chứng:

- Tổng quan VNINDEX khung D theo cấu trúc SMC, hỗ trợ và kháng cự.
- Theo dõi lệnh chủ động theo thị trường, ngành và mã cổ phiếu.
- Nghiên cứu lệnh chờ để đánh giá thiên hướng chờ mua, chờ bán hoặc trung lập.
- Sản phẩm Daily/T+ cho số đông.
- Sản phẩm Intraday cho trader có kinh nghiệm và chấp nhận rủi ro cao hơn.
- Bằng chứng hiệu quả phải được lưu và có thể kiểm tra.
- Doanh thu dự kiến từ VIP và khách hàng giao dịch qua liên kết môi giới CTCK Việt Nam.

## 2. Mô hình tối giản đang xem xét

Thay vì xây toàn bộ hệ thống lớn ngay từ đầu, Btrading có thể bắt đầu bằng chuỗi tối thiểu:

```text
D1 MARKET CONTEXT
        +
ACTIVE MONEY-FLOW INSIGHT
        +
SECTOR / STOCK RANKING
        +
PROOF T+n
        ->
DAILY PRODUCT + CONTENT
```

Passive/Waiting Flow, full realtime Order Flow, automation phức tạp và Intraday chỉ được thêm khi dữ liệu và hiệu quả thực tế chứng minh là cần thiết.

## 3. Các lớp đang trao đổi

### A. Customer outcome

- Newbie/T+ cần nhận được quyết định hoặc watchlist đơn giản nào?
- Trader có kinh nghiệm cần thêm thông tin gì để đáng trả phí?
- Insight nào giúp người dùng hành động nhưng không biến Btrading thành dịch vụ hô lệnh thiếu kiểm chứng?

### B. Product surface

- Trang chủ cần giữ module nào?
- Module nào chỉ là dữ liệu tham khảo, module nào là sản phẩm lõi?
- Daily và Intraday có nên là hai gói, hai màn hình hay hai sản phẩm riêng?

### C. Data feasibility

- Dữ liệu hiện có đủ cho snapshot, Daily Context và heatmap.
- Chưa xác nhận đủ tick-by-tick trade, synchronized bid/ask và historical order book để xây full Order Flow.
- Cần kiểm tra dữ liệu trước khi chốt công thức và hạ tầng.

### D. Quant rules

Các khái niệm đang nghiên cứu:

- Active Buy/Sell, Delta, Active Ratio.
- Normalized Flow.
- Adaptive Large Order.
- Persistence, acceleration và price response.
- Passive order size/persistence/proximity/stability.
- Sector/Market Flow.
- Proof T+1/T+3/T+5 và benchmark VNINDEX.

Các ngưỡng, trọng số và công thức vẫn là giả thuyết.

### E. Proof and marketing

- Có thể chọn case thành công để kể chuyện và quảng bá.
- Phải lưu toàn bộ event đủ điều kiện để đánh giá khách quan.
- Claim về win rate hoặc hiệu quả tổng thể phải dựa trên cohort đầy đủ và có sample size.
- Cần thiết kế cách trình bày vừa thuyết phục vừa không làm sai lệch hiệu quả thực tế.

## 4. Nguyên tắc tối ưu và đơn giản hóa

1. Chỉ xây thứ trực tiếp tạo ra giá trị cho người dùng hoặc bằng chứng marketing.
2. Mỗi module phải trả lời một câu hỏi cụ thể của khách hàng.
3. Không xây Intraday trước khi Daily Product có giá trị rõ ràng.
4. Không gọi snapshot polling là Verified Order Flow.
5. Không tạo score phức tạp nếu người dùng không hiểu hoặc không hành động được.
6. Không xây Agent Harness lớn trước khi workflow thủ công đã được mô tả và chạy ổn định.
7. Mọi thành phần mới phải có tiêu chí giữ, bỏ hoặc trì hoãn.

## 5. Quy trình thảo luận trước khi chốt

Ta sẽ đi lần lượt:

1. Chốt kết quả người dùng cần nhận.
2. Chọn bộ sản phẩm tối thiểu.
3. Audit dữ liệu có thể cung cấp sản phẩm đó.
4. Thiết kế quy tắc định lượng tối thiểu.
5. Thiết kế Proof Engine.
6. Thiết kế Content/Marketing loop.
7. Thiết kế VIP và môi giới.
8. Sau cùng mới chốt hạ tầng, automation và Agent Harness.

Mỗi phần sẽ có ba trạng thái:

- `CORE`: ý cốt lõi do founder đưa ra.
- `WORKING`: phương án đang trao đổi/thử nghiệm.
- `APPROVED`: chỉ áp dụng khi founder xác nhận rõ.

## 6. Điều kiện để chuyển sang bản chốt

Chỉ tạo System Specification đã chốt khi:

- sản phẩm tối thiểu được founder duyệt;
- Data Gap Matrix được xác nhận;
- quy tắc Quant V1 đủ đơn giản và backtest được;
- workflow Proof/Content/Revenue rõ ràng;
- hạ tầng được chọn theo nhu cầu thật, không theo thiết kế dư thừa;
- founder ra lệnh rõ: **chốt hệ thống**.
