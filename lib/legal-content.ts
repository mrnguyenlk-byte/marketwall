import type { Lang } from "@/lib/i18n"

export type LegalSlug =
  | "terms"
  | "privacy"
  | "cookies"
  | "risk-disclosure"
  | "disclaimer"
  | "partner-disclosure"

type Bilingual = Record<Lang, string>

export type LegalSection = {
  heading?: Bilingual
  paragraphs: Bilingual[]
}

export type LegalPage = {
  slug: LegalSlug
  title: Bilingual
  lastUpdated: Bilingual
  sections: LegalSection[]
}

export const legalPages: Record<LegalSlug, LegalPage> = {
  disclaimer: {
    slug: "disclaimer",
    title: { en: "Disclaimer", vi: "Tuyên bố miễn trừ" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        paragraphs: [
          {
            en: "BTrading Market Insights is an independent financial information platform.",
            vi: "BTrading Market Insights là nền tảng thông tin tài chính độc lập.",
          },
          {
            en: "BTrading Market Insights provides market data, analytics, educational resources, platform comparisons and financial market information.",
            vi: "BTrading Market Insights cung cấp dữ liệu thị trường, phân tích, tài liệu giáo dục, so sánh nền tảng và thông tin thị trường tài chính.",
          },
          {
            en: "BTrading Market Insights does not provide investment advice, portfolio management, brokerage services, financial planning, securities recommendations, or trading signals.",
            vi: "BTrading Market Insights không cung cấp tư vấn đầu tư, quản lý danh mục, dịch vụ môi giới, lập kế hoạch tài chính, khuyến nghị chứng khoán hoặc tín hiệu giao dịch.",
          },
          {
            en: "All information is provided for informational and educational purposes only.",
            vi: "Mọi thông tin chỉ nhằm mục đích cung cấp thông tin và giáo dục.",
          },
          {
            en: "Users are solely responsible for their own financial decisions.",
            vi: "Người dùng hoàn toàn chịu trách nhiệm về các quyết định tài chính của mình.",
          },
        ],
      },
    ],
  },

  "risk-disclosure": {
    slug: "risk-disclosure",
    title: { en: "Risk Disclosure", vi: "Công bố rủi ro" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        paragraphs: [
          {
            en: "Financial markets can be highly volatile and involve substantial risk.",
            vi: "Thị trường tài chính có thể biến động mạnh và liên quan đến rủi ro đáng kể.",
          },
          {
            en: "Prices may fluctuate rapidly and investors may experience losses.",
            vi: "Giá có thể biến động nhanh chóng và nhà đầu tư có thể phải chịu tổn thất.",
          },
          {
            en: "BTrading Market Insights does not guarantee the accuracy, completeness or profitability of any information published on this website.",
            vi: "BTrading Market Insights không đảm bảo tính chính xác, đầy đủ hoặc khả năng sinh lời của bất kỳ thông tin nào được xuất bản trên trang web này.",
          },
          {
            en: "Past performance does not guarantee future results.",
            vi: "Hiệu suất trong quá khứ không đảm bảo kết quả trong tương lai.",
          },
          {
            en: "Always conduct your own research before making financial decisions.",
            vi: "Luôn tự nghiên cứu trước khi đưa ra quyết định tài chính.",
          },
        ],
      },
    ],
  },

  "partner-disclosure": {
    slug: "partner-disclosure",
    title: { en: "Partner Disclosure", vi: "Công bố đối tác" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        paragraphs: [
          {
            en: "BTrading Market Insights may receive compensation from selected platform partners when users engage with their services through links available on this website.",
            vi: "BTrading Market Insights có thể nhận khoản bồi thường từ các đối tác nền tảng được chọn khi người dùng tương tác với dịch vụ của họ thông qua các liên kết trên trang web này.",
          },
          {
            en: "Compensation does not influence rankings, comparisons, ratings or editorial content.",
            vi: "Khoản bồi thường không ảnh hưởng đến thứ hạng, so sánh, đánh giá hoặc nội dung biên tập.",
          },
          {
            en: "Our objective is to provide transparent and unbiased information to users.",
            vi: "Mục tiêu của chúng tôi là cung cấp thông tin minh bạch và khách quan cho người dùng.",
          },
        ],
      },
    ],
  },

  terms: {
    slug: "terms",
    title: { en: "Terms of Service", vi: "Điều khoản dịch vụ" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        heading: { en: "1. Acceptance of Terms", vi: "1. Chấp nhận điều khoản" },
        paragraphs: [
          {
            en: "By accessing or using BTrading Market Insights, you agree to these Terms of Service. If you do not agree, please discontinue use of the platform.",
            vi: "Khi truy cập hoặc sử dụng BTrading Market Insights, bạn đồng ý với các Điều khoản Dịch vụ này. Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.",
          },
        ],
      },
      {
        heading: { en: "2. Nature of the Service", vi: "2. Bản chất dịch vụ" },
        paragraphs: [
          {
            en: "BTrading Market Insights is an independent financial information platform offering market information, market analytics, platform comparisons, educational resources and financial research tools.",
            vi: "BTrading Market Insights là nền tảng thông tin tài chính độc lập cung cấp thông tin thị trường, phân tích thị trường, so sánh nền tảng, tài liệu giáo dục và công cụ nghiên cứu tài chính.",
          },
          {
            en: "BTrading Market Insights is not a broker, investment adviser, portfolio manager, or trading platform operator.",
            vi: "BTrading Market Insights không phải là nhà môi giới, cố vấn đầu tư, quản lý danh mục hoặc đơn vị vận hành nền tảng giao dịch.",
          },
        ],
      },
      {
        heading: { en: "3. No Investment Advice", vi: "3. Không cung cấp tư vấn đầu tư" },
        paragraphs: [
          {
            en: "Nothing on BTrading Market Insights constitutes investment, legal, tax or financial advice. All content is provided for informational and educational purposes only.",
            vi: "Không có nội dung nào trên BTrading Market Insights cấu thành tư vấn đầu tư, pháp lý, thuế hoặc tài chính. Mọi nội dung chỉ nhằm mục đích thông tin và giáo dục.",
          },
        ],
      },
      {
        heading: { en: "4. User Responsibilities", vi: "4. Trách nhiệm người dùng" },
        paragraphs: [
          {
            en: "You are solely responsible for evaluating information and making your own financial decisions. You agree to use BTrading Market Insights in compliance with applicable laws.",
            vi: "Bạn hoàn toàn chịu trách nhiệm đánh giá thông tin và đưa ra quyết định tài chính của riêng mình. Bạn đồng ý sử dụng BTrading Market Insights tuân thủ pháp luật hiện hành.",
          },
        ],
      },
      {
        heading: { en: "5. Third-Party Links", vi: "5. Liên kết bên thứ ba" },
        paragraphs: [
          {
            en: "BTrading Market Insights may include links to third-party trading platforms and partners. We are not responsible for third-party services, terms or policies.",
            vi: "BTrading Market Insights có thể bao gồm liên kết đến nền tảng giao dịch và đối tác bên thứ ba. Chúng tôi không chịu trách nhiệm về dịch vụ, điều khoản hoặc chính sách của bên thứ ba.",
          },
        ],
      },
      {
        heading: { en: "6. Limitation of Liability", vi: "6. Giới hạn trách nhiệm" },
        paragraphs: [
          {
            en: "BTrading Market Insights and its affiliates shall not be liable for any loss or damage arising from reliance on information provided on this website.",
            vi: "BTrading Market Insights và các đơn vị liên quan không chịu trách nhiệm về bất kỳ tổn thất hoặc thiệt hại nào phát sinh từ việc dựa vào thông tin trên trang web này.",
          },
        ],
      },
    ],
  },

  privacy: {
    slug: "privacy",
    title: { en: "Privacy Policy", vi: "Chính sách bảo mật" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        heading: { en: "Overview", vi: "Tổng quan" },
        paragraphs: [
          {
            en: "BTrading Market Insights respects your privacy. This policy explains how we collect, use and protect personal information when you use our financial information platform.",
            vi: "BTrading Market Insights tôn trọng quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn sử dụng nền tảng thông tin tài chính của chúng tôi.",
          },
        ],
      },
      {
        heading: { en: "Information We Collect", vi: "Thông tin chúng tôi thu thập" },
        paragraphs: [
          {
            en: "We may collect information you provide through contact forms, email subscription requests, support inquiries and account registration (if enabled in the future).",
            vi: "Chúng tôi có thể thu thập thông tin bạn cung cấp qua biểu mẫu liên hệ, đăng ký email, yêu cầu hỗ trợ và đăng ký tài khoản (nếu được kích hoạt trong tương lai).",
          },
          {
            en: "We may automatically collect technical data such as browser type, device information, pages visited and approximate location through cookies and analytics tools.",
            vi: "Chúng tôi có thể tự động thu thập dữ liệu kỹ thuật như loại trình duyệt, thông tin thiết bị, trang đã truy cập và vị trí gần đúng thông qua cookie và công cụ phân tích.",
          },
        ],
      },
      {
        heading: { en: "Analytics", vi: "Phân tích" },
        paragraphs: [
          {
            en: "BTrading Market Insights uses or may use analytics services such as Vercel Analytics and Google Analytics to understand platform usage, improve performance and enhance user experience. Analytics data is generally aggregated and does not directly identify individual users.",
            vi: "BTrading Market Insights sử dụng hoặc có thể sử dụng dịch vụ phân tích như Vercel Analytics và Google Analytics để hiểu cách sử dụng nền tảng, cải thiện hiệu suất và nâng cao trải nghiệm người dùng. Dữ liệu phân tích thường được tổng hợp và không trực tiếp nhận dạng từng người dùng.",
          },
        ],
      },
      {
        heading: { en: "Cookies", vi: "Cookie" },
        paragraphs: [
          {
            en: "We use cookies and similar technologies as described in our Cookie Policy. You may manage cookie preferences through your browser settings.",
            vi: "Chúng tôi sử dụng cookie và công nghệ tương tự như mô tả trong Chính sách Cookie. Bạn có thể quản lý tùy chọn cookie qua cài đặt trình duyệt.",
          },
        ],
      },
      {
        heading: { en: "How We Use Information", vi: "Cách chúng tôi sử dụng thông tin" },
        paragraphs: [
          {
            en: "We use collected information to operate the platform, respond to contact form submissions, deliver email subscriptions, maintain security, analyze usage and improve our market information services.",
            vi: "Chúng tôi sử dụng thông tin thu thập để vận hành nền tảng, phản hồi biểu mẫu liên hệ, gửi email đăng ký, duy trì bảo mật, phân tích mức sử dụng và cải thiện dịch vụ thông tin thị trường.",
          },
        ],
      },
      {
        heading: { en: "Your Rights", vi: "Quyền của bạn" },
        paragraphs: [
          {
            en: "Depending on your jurisdiction, you may have the right to access, correct, restrict processing of, or request deletion of your personal data.",
            vi: "Tùy theo khu vực pháp lý, bạn có thể có quyền truy cập, chỉnh sửa, hạn chế xử lý hoặc yêu cầu xóa dữ liệu cá nhân của mình.",
          },
          {
            en: "To submit a data deletion request or exercise privacy rights, contact us at privacy@btrading.com.",
            vi: "Để gửi yêu cầu xóa dữ liệu hoặc thực hiện quyền riêng tư, liên hệ privacy@btrading.com.",
          },
        ],
      },
      {
        heading: { en: "Data Retention & Security", vi: "Lưu trữ & bảo mật dữ liệu" },
        paragraphs: [
          {
            en: "We retain personal information only as long as necessary for the purposes described in this policy. We implement reasonable technical and organizational measures to protect data.",
            vi: "Chúng tôi chỉ lưu giữ thông tin cá nhân trong thời gian cần thiết cho các mục đích nêu trong chính sách này. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức hợp lý để bảo vệ dữ liệu.",
          },
        ],
      },
    ],
  },

  cookies: {
    slug: "cookies",
    title: { en: "Cookie Policy", vi: "Chính sách Cookie" },
    lastUpdated: { en: "Last updated: June 2026", vi: "Cập nhật lần cuối: Tháng 6/2026" },
    sections: [
      {
        heading: { en: "What Are Cookies", vi: "Cookie là gì" },
        paragraphs: [
          {
            en: "Cookies are small text files stored on your device when you visit a website. They help websites function properly and understand how visitors interact with content.",
            vi: "Cookie là các tệp văn bản nhỏ được lưu trên thiết bị khi bạn truy cập trang web. Chúng giúp trang web hoạt động đúng và hiểu cách khách truy cập tương tác với nội dung.",
          },
        ],
      },
      {
        heading: { en: "Essential Cookies", vi: "Cookie thiết yếu" },
        paragraphs: [
          {
            en: "Essential cookies are required for core platform functionality, such as security, session management, language preferences and basic navigation. These cookies cannot be disabled without affecting site operation.",
            vi: "Cookie thiết yếu cần thiết cho chức năng cốt lõi của nền tảng, như bảo mật, quản lý phiên, tùy chọn ngôn ngữ và điều hướng cơ bản. Các cookie này không thể tắt mà không ảnh hưởng đến hoạt động của trang.",
          },
        ],
      },
      {
        heading: { en: "Analytics Cookies", vi: "Cookie phân tích" },
        paragraphs: [
          {
            en: "Analytics cookies help us measure traffic and usage patterns through services such as Vercel Analytics and Google Analytics. This information supports platform improvement and is generally collected in aggregated form.",
            vi: "Cookie phân tích giúp chúng tôi đo lường lưu lượng và mẫu sử dụng thông qua các dịch vụ như Vercel Analytics và Google Analytics. Thông tin này hỗ trợ cải thiện nền tảng và thường được thu thập ở dạng tổng hợp.",
          },
        ],
      },
      {
        heading: { en: "Functional Cookies", vi: "Cookie chức năng" },
        paragraphs: [
          {
            en: "Functional cookies enable enhanced features such as saved preferences, interface customization and improved user experience across visits.",
            vi: "Cookie chức năng cho phép các tính năng nâng cao như lưu tùy chọn, tùy chỉnh giao diện và cải thiện trải nghiệm người dùng qua các lần truy cập.",
          },
        ],
      },
      {
        heading: { en: "Managing Cookies", vi: "Quản lý Cookie" },
        paragraphs: [
          {
            en: "You can control or delete cookies through your browser settings. Disabling certain cookies may limit some platform features.",
            vi: "Bạn có thể kiểm soát hoặc xóa cookie qua cài đặt trình duyệt. Việc tắt một số cookie có thể hạn chế một số tính năng của nền tảng.",
          },
        ],
      },
    ],
  },
}

export function getLegalPage(slug: LegalSlug): LegalPage {
  return legalPages[slug]
}
