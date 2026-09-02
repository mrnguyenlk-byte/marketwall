# BTRADING SYSTEM LOCK V1

- Status: LOCKED FOR IMPLEMENTATION
- Date: 2026-09-02
- Branch: `feat/btrading-orderflow-platform`
- Management source of truth: `docs/MASTER_PROJECT_STATE.md`
- Scope: Stock Business / Btrading only

## 1. Product identity

**Btrading Market Insights — Order Flow Intelligence cho chứng khoán Việt Nam**

Triết lý sản phẩm: **Dòng tiền đi đâu, ta theo đó.**

Btrading không phải bảng giá tổng hợp và không phải AI tự dự đoán giá. Btrading chuyển dữ liệu thị trường thành bằng chứng có thể kiểm tra về:

1. Bối cảnh thị trường đang ở đâu.
2. Dòng tiền chủ động đang đánh vào đâu.
3. Thanh khoản chờ đang nghiêng về mua, bán hay trung lập.
4. Ngành và mã nào đang có sự tập trung hoặc bất thường.
5. Điều gì đã xảy ra sau mỗi insight.

## 2. Business boundaries

### Btrading

Btrading là business chứng khoán độc lập, có product, data, customer, content, KPI, revenue và roadmap riêng.

### BrokerWiki / Forex

BrokerWiki và các sản phẩm Forex không thuộc workstream này. Không dùng dữ liệu, prompt, KPI hoặc customer funnel Forex trong Btrading.

### BìnhGold

BìnhGold là lớp thương hiệu cá nhân và niềm tin của con người:

- đại diện và giải thích sản phẩm;
- xuất hiện trong nội dung;
- phân phối insight;
- xây cộng đồng;
- không can thiệp thủ công vào dữ liệu hoặc thay đổi kết quả Quant Engine.

## 3. Product tiers

### 3.1 Btrading Daily

Đối tượng: newbie, khách T+ và người không thể theo dõi bảng điện liên tục.

Đầu ra:

- VNINDEX D1 theo cấu trúc SMC;
- hỗ trợ/kháng cự D1;
- Market Flow;
- Sector Flow;
- Stock Flow;
- watchlist cơ hội;
- Daily Insight;
- lịch sử và bằng chứng T+n.

### 3.2 Btrading Intraday

Đối tượng: trader có kinh nghiệm, theo sát thị trường và chấp nhận rủi ro/tần suất cao hơn.

Đầu ra:

- realtime Active Flow;
- Large Active Orders;
- Passive/Waiting Flow;
- acceleration, persistence và absorption;
- intraday alerts;
- event replay.

Không mở bán Intraday dưới nhãn full Order Flow cho đến khi có feed tick và order book đáp ứng contract production.

## 4. Canonical pipeline

```text
MARKET DATA
    |
    +-- Daily OHLC ------------------------------+
    |                                            |
    |                                      SMC D1 CONTEXT
    |
    +-- Matched trades + synchronized bid/ask --> TRADE CLASSIFIER
    |                                            |
    |                                      ACTIVE FLOW ENGINE
    |
    +-- Order-book snapshots/events -----------> PASSIVE FLOW ENGINE
                                                 |
                      +--------------------------+--------------------------+
                      |                                                     |
                 FEATURE ENGINE                                      PRICE RESPONSE
                      |                                                     |
                      +--------------------------+--------------------------+
                                                 |
                                           EVENT ENGINE
                                                 |
                         MARKET -> SECTOR -> STOCK INSIGHT
                                                 |
                                      OPPORTUNITY SCANNER
                                                 |
                         +-----------------------+-----------------------+
                         |                                               |
                    BTRADING UI                                  PROOF / REPLAY
                                                                         |
                                                                  CONTENT ENGINE
                                                                         |
                                                                    BÌNHGOLD
                                                                         |
                                                               FREE -> VIP/BROKER
```

## 5. Data truth levels

Mọi dữ liệu và insight phải có `dataQuality` và `sourceMode`.

### Level A — Verified Order Flow

Yêu cầu:

- matched trade tick có timestamp và sequence/id;
- best bid/ask hoặc order-book state ngay trước trade;
- đồng bộ thời gian đủ để classify side;
- data freshness và gap monitoring đạt chuẩn.

Được phép dùng nhãn: `Active Buy`, `Active Sell`, `Order Flow`, `Large Active Order`.

### Level B — Indicative Flow

Nguồn là snapshot/polling hoặc dữ liệu không đủ đồng bộ để chứng minh side từng giao dịch.

Chỉ được dùng nhãn: `ước lượng`, `indicative`, `snapshot imbalance`, `thanh khoản quan sát được`.

Không được quảng bá như full Order Flow.

### Level C — Context/EOD

OHLC, foreign snapshot/derived, proprietary EOD và dữ liệu chậm.

Chỉ dùng cho Daily Context, lịch sử, heatmap và báo cáo sau phiên.

## 6. Quant Engine V1

### 6.1 Trade classification

```text
tradePrice >= priorAsk -> active_buy
tradePrice <= priorBid -> active_sell
otherwise               -> unknown
```

Không ép `unknown` thành mua hoặc bán.

### 6.2 Core features

- Active Buy / Active Sell.
- Delta = Active Buy - Active Sell.
- Active Ratio = Delta / (Active Buy + Active Sell).
- Normalized Flow theo expected trading value của chính mã.
- Adaptive Large Order theo historical quantile + minimum value floor.
- Large Buy / Large Sell / Large Delta / Large Ratio.
- Large Order Intensity.
- Persistence theo các interval cùng chiều.
- Acceleration so với baseline lịch sử.
- Order Book Imbalance.
- Passive quality: size, persistence, proximity, stability/cancellation.
- Price response và absorption.

### 6.3 Scores

Phải tồn tại riêng:

- `activeScore` 0-100;
- `passiveScore` 0-100;
- `sectorScore` 0-100;
- `contextRisk` độc lập.

Không tạo một điểm duy nhất che mất xung đột Active/Passive.

### 6.4 SMC context

SMC D1 xác định:

- market structure;
- trend;
- support/resistance;
- vùng rủi ro.

SMC không sửa số liệu Active/Passive. Nó chỉ gắn nhãn context cho cơ hội.

### 6.5 Event taxonomy

1. Large Active Buy.
2. Large Active Sell.
3. Persistent Buying.
4. Persistent Selling.
5. Buy Acceleration.
6. Sell Acceleration.
7. Persistent Waiting Buy.
8. Persistent Waiting Sell.
9. Buy Absorption.
10. Sell Absorption.
11. Active + Passive Alignment.
12. Active / Passive Conflict.
13. Sector Rotation.
14. Unusual Money Flow.

### 6.6 Parameters not locked

Các tham số Q95, value floor, interval, persistence duration, book depth, score weights, score thresholds và absorption thresholds là cấu hình có version. Chúng chỉ được promotion lên production sau backtest, walk-forward và out-of-sample.

## 7. Insight contract

Mỗi insight bắt buộc có:

- `insightId`;
- symbol/sector/market scope;
- event type;
- event timestamp;
- source/data quality;
- active/passive/sector scores;
- D1 context;
- reason codes;
- observed price;
- quant config version;
- provider version;
- lifecycle status;
- content eligibility;
- proof/outcome status.

AI chỉ được tạo phần giải thích từ các field đã có. AI output không phải nguồn dữ liệu.

## 8. Proof and Replay Engine

Mọi event đủ điều kiện phải được ghi, không chỉ event thành công.

Outcome bắt buộc:

- T+1, T+2, T+3, T+5, T+10, T+20;
- MFE;
- MAE;
- excess return so với VNINDEX;
- sample size;
- config/provider version.

### Marketing rule

Content Engine được quyền chọn case thành công, rõ ràng và dễ kể để làm showcase. Case phải được đánh dấu là `selected case` hoặc thể hiện là một ví dụ cụ thể.

Mọi claim như win rate, lợi nhuận trung bình, xác suất hoặc hiệu quả hệ thống phải tính từ toàn bộ cohort đủ điều kiện và hiển thị sample size/time window. Không dùng selected cases để đại diện cho hiệu quả tổng thể.

## 9. Application modules

### Free

- Daily Market Context.
- Heatmap/market overview.
- Một phần sector/stock ranking.
- Insight chậm hoặc giới hạn.
- Selected proof cases.
- Daily analysis/content.

### VIP

- Full Active/Passive scores.
- Full opportunity ranking.
- Large-order events.
- Watchlist và alerts.
- Full replay/proof filters.
- Intraday features khi feed đạt Level A.

### Admin/Command Center

- provider/data health;
- event/insight audit;
- proof cohort dashboard;
- content candidate queue;
- human-review queue;
- publishing/retry logs;
- VIP/customer/broker attribution;
- workflow status và incident log.

## 10. System services

### Existing web plane

- Next.js/TypeScript application.
- Vercel deployment.
- Prisma/PostgreSQL business database.
- Existing authentication, watchlist, alerts, settings and automation logs are retained.

### Dedicated market-data plane

Không ingest full-market tick/order-book bằng Vercel request lifecycle.

Production target:

- Linux Collector Worker: provider connection, sequence/gap/freshness validation.
- Stream/Queue: realtime distribution and retry.
- Quant Worker: windows, features, scores and event detection.
- Raw archive: immutable compressed files/object storage.
- PostgreSQL: symbols, configs, insights, proof, customers and operations.
- High-volume analytical store is introduced only when measured volume requires it; raw archive must make migration/recomputation possible.

### Windows plane

Windows VPS remains isolated for AmiBroker, MT5, DataPro and chart-capture workflows. It is not the central Order Flow collector.

## 11. Canonical workflows

### WF-01 Daily Context

Schedule -> validate completed D1 data -> SMC structure -> support/resistance -> market context -> human/automated QA -> website/content.

### WF-02 Realtime Collection

Provider -> authenticate -> subscribe -> timestamp/sequence validation -> normalize -> raw archive -> realtime stream -> health metrics.

### WF-03 Active Flow

Trade + prior bid/ask -> classify -> windows -> delta/ratio/large orders -> persistence/acceleration -> active score.

### WF-04 Passive Flow

Book state/events -> depth/imbalance -> size/persistence/proximity/stability -> cancellation filter -> passive score.

### WF-05 Insight

Active + Passive + Sector + Price Response + D1 Context -> event taxonomy -> reason codes -> rank -> store -> alert/UI.

### WF-06 Proof

Insight created -> observe future sessions -> compute T+n/MFE/MAE/benchmark -> close proof lifecycle -> aggregate cohort statistics.

### WF-07 Content

Eligible insight/proof -> candidate score -> format variants -> factual validation -> human gate for performance claims -> BìnhGold distribution -> attribution analytics.

### WF-08 VIP/Broker Conversion

Traffic -> free account -> behavior/interest -> VIP offer or CTCK route -> attribution -> conversion/revenue reporting. Securities partner terms and communication rules must be approved before activation.

### WF-09 Engineering/Ops

Backlog -> branch -> code/tests -> PR -> review -> preview -> smoke test -> deploy -> monitor -> rollback/incident -> update Master Project State.

## 12. Reliability rules

- Fail closed when data is stale, incomplete, black/corrupt or sequence gaps exceed threshold.
- Idempotency for collection batches, events, proof jobs and publications.
- Retry with bounded attempts and dead-letter/audit state.
- All calculations carry provider/config versions.
- Secrets only in runtime secret stores.
- Destructive production actions require human approval.
- Read/log/test/branch/preview actions may run automatically.

## 13. Repository strategy

### Now

Use `mrnguyenlk-byte/marketwall` as the Btrading implementation repository to avoid delaying delivery.

### Later separation

BrokerWiki/Forex must move to an independent application/repository or independently deployable workspace. Shared brand/CRM/AI contracts may live in a separate shared operations repository. No new Forex feature should deepen coupling inside Btrading.

## 14. Implementation gates

### Gate 0 — Foundation

- Master Project State.
- System Lock V1.
- Quant Spec V1.
- Data Gap Matrix.
- deterministic Quant Core + tests.

### Gate 1 — Indicative Daily MVP

- Daily Context.
- snapshot-based market/sector/stock flow explicitly labeled indicative.
- Event/Proof schema.
- Replay for recorded indicative events.

### Gate 2 — Verified Active Flow

- production tick provider.
- synchronized bid/ask.
- collector and gap monitoring.
- Active Flow verified.

### Gate 3 — Verified Passive Flow

- historical book snapshots/events.
- persistence/cancellation/stability.
- Passive Flow verified.

### Gate 4 — Product/VIP

- ranking, alerts, replay, entitlements and billing.
- performance dashboard based on complete cohorts.

### Gate 5 — Content Growth Engine

- automatic candidate generation.
- factual validation and disclosure.
- publishing, retry, attribution and analytics.

### Gate 6 — Intraday

- Level A data quality.
- latency/SLA monitoring.
- risk disclosures and suitability segmentation.

## 15. Definition of complete system

Hệ thống được coi là hoàn chỉnh khi:

1. Dữ liệu có nguồn, quality level, freshness, gap monitoring và raw archive.
2. Quant Engine deterministic, versioned và reproducible.
3. Insight giải thích được bằng reason codes.
4. Proof Engine theo dõi toàn bộ event đủ điều kiện.
5. UI phân biệt Daily/Intraday và Free/VIP.
6. Content không thể thay đổi dữ liệu gốc hoặc phóng đại aggregate performance.
7. Workflow có idempotency, retry, logs, alerts và human approval cho hành động rủi ro.
8. VIP và broker attribution đo được doanh thu.
9. Mỗi milestone cập nhật `MASTER_PROJECT_STATE.md`.
10. Một phiên AI/Codex mới có thể tiếp tục dự án chỉ bằng repository docs, code, backlog và logs; không phụ thuộc lịch sử chat.
