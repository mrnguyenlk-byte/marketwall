# BrokerWiki Content Core — Working Draft

- Status: CORE + WORKING
- Date: 2026-09-02
- Scope: BrokerWiki / Forex business

## 1. Core input từ Founder

Nội dung chính của BrokerWiki không chỉ xoay quanh so sánh broker. Trọng tâm content là ba nhóm sản phẩm:

1. **Bot Trade**
2. **Tín hiệu giao dịch**
3. **Copy Trade**

Các sản phẩm này hiện chưa hoàn thiện. Mục tiêu content vẫn là giúp khách hàng nhìn thấy **hiệu quả, lợi nhuận và giá trị thực tế** của từng hệ thống.

## 2. Vai trò của BrokerWiki

BrokerWiki là điểm tập trung và chuyển đổi của nhánh Forex:

```text
BOT / SIGNAL / COPY
        ↓
PROOF & PERFORMANCE
        ↓
CONTENT
        ↓
BROKERWIKI
        ↓
BROKER ACCOUNT / COMMUNITY / CUSTOMER
```

So sánh broker, rebate, bonus và chính sách là lớp hỗ trợ conversion; không phải chủ đề content trung tâm duy nhất.

## 3. Ba trụ content

### A. Bot Trade

Content trả lời:

- Bot hoạt động theo logic nào ở mức người dùng cần hiểu?
- Hiệu quả theo giai đoạn và điều kiện thị trường nào?
- Lợi nhuận, drawdown và rủi ro thực tế ra sao?
- Khi nào bot hoạt động tốt/kém?

Proof tối thiểu:

- tài khoản hoặc dataset xác định;
- thời gian chạy;
- vốn ban đầu;
- lợi nhuận tuyệt đối và phần trăm;
- drawdown;
- số lệnh;
- phí/spread/swap;
- trạng thái backtest, demo, pilot hay live.

### B. Tín hiệu giao dịch

Content trả lời:

- Tín hiệu được phát hiện lúc nào?
- Entry/SL/TP hoặc điều kiện vô hiệu là gì?
- Kết quả sau tín hiệu?
- Hiệu quả theo toàn bộ tập tín hiệu?

Proof tối thiểu:

- timestamp trước khi có kết quả;
- giá/điều kiện lúc phát tín hiệu;
- kết quả từng tín hiệu;
- win rate, expectancy, RR, drawdown và sample size;
- lịch sử đầy đủ để tránh chỉ lưu tín hiệu thắng.

### C. Copy Trade

Content trả lời:

- Người theo dõi thực nhận kết quả gì sau trượt giá và phí?
- Mức vốn/rủi ro phù hợp?
- Hiệu quả giữa master và follower chênh lệch thế nào?
- Drawdown và thời gian phục hồi?

Proof tối thiểu:

- master result;
- follower result;
- slippage;
- phí/commission/swap;
- số tài khoản/nhóm vốn;
- drawdown và risk setting;
- trạng thái pilot hay live.

## 4. Hai luồng content

### Professional Main Channels

- Báo cáo hiệu quả có thời gian, sample size và drawdown.
- Giải thích phương pháp/rủi ro.
- Case study đầy đủ.
- Hướng dẫn chọn sản phẩm phù hợp.
- Báo cáo sự khác biệt giữa backtest/demo/pilot/live.

### Performance Satellite Channels

- Một case lợi nhuận nổi bật.
- Before/after của một tín hiệu.
- Bot/Copy tuần hoặc tháng vừa qua.
- Khoản lợi nhuận hoặc chi phí được tối ưu trong một trường hợp cụ thể.
- CTA về trang proof đầy đủ hoặc danh sách chờ sản phẩm.

## 5. Quy tắc vì sản phẩm chưa hoàn thiện

Không quảng bá sản phẩm chưa hoàn thiện như một dịch vụ live sẵn sàng sử dụng.

Mỗi nội dung phải gắn đúng trạng thái:

- `RESEARCH`
- `BACKTEST`
- `DEMO`
- `PILOT`
- `LIVE`

Chỉ content có proof tương ứng mới được nói về kết quả. Không chuyển kết quả backtest/demo thành claim lợi nhuận live.

Khi sản phẩm chưa mở bán, CTA phù hợp là:

- xem báo cáo thử nghiệm;
- theo dõi quá trình hoàn thiện;
- đăng ký danh sách chờ;
- tham gia pilot có điều kiện;
- xem proof/case đầy đủ.

## 6. Performance truth model

```text
RAW TRADE DATA
      ↓
NORMALIZE FEES / SLIPPAGE / SWAP
      ↓
PERFORMANCE METRICS
      ↓
PROOF RECORD
      ↓
SELECTED SUCCESS CASES + FULL STATISTICS
      ↓
CONTENT
```

Selected cases được dùng để thu hút sự chú ý. Aggregate claims phải dùng toàn bộ cohort phù hợp và nêu rõ thời gian/sample size.

## 7. Các metric cốt lõi

Tối thiểu theo dõi:

- Net profit.
- Return %.
- Maximum drawdown.
- Win rate.
- Risk/reward hoặc expectancy.
- Profit factor.
- Number of trades.
- Active period.
- Fees, spread, swap và slippage.
- Backtest/demo/pilot/live status.

Không chỉ dùng lợi nhuận; lợi nhuận phải đi cùng rủi ro.

## 8. Mô hình module BrokerWiki đang xem xét

```text
BROKERWIKI / FOREX BUSINESS
│
├── PERFORMANCE PRODUCTS
│   ├── Bot Trade
│   ├── Trading Signals
│   └── Copy Trade
│
├── PROOF CENTER
│   ├── Selected Cases
│   ├── Full Statistics
│   └── Status: Backtest/Demo/Pilot/Live
│
├── BROKER SERVICES
│   ├── Broker comparison
│   ├── Rebate / Backcom
│   ├── Bonus / Policy
│   └── Account support
│
└── CONTENT & CONVERSION
    ├── Main channels
    ├── Satellite/seeding channels
    ├── Community
    └── Broker account / waitlist / product conversion
```

## 9. Chưa chốt

- Sản phẩm nào trong ba nhóm làm trước.
- Phương pháp/logic giao dịch của từng sản phẩm.
- Nguồn dữ liệu tài khoản giao dịch.
- Tiêu chuẩn để chuyển từ backtest → demo → pilot → live.
- Mức drawdown/rủi ro được chấp nhận.
- Mô hình giá và broker partner.
- Tần suất content và danh sách kênh.
