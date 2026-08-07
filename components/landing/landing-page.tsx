import Image from "next/image"
import Link from "next/link"

import { BTRADING_LINKS } from "@/lib/brand-links"

const contentChannels = [
  { label: "YouTube", className: "bg-[#ff0033]", href: BTRADING_LINKS.youtube },
  {
    label: "TikTok",
    className:
      "bg-[linear-gradient(135deg,#22d3ee_0_3%,#111_4%_93%,#ff3b6b_94%)]",
    href: BTRADING_LINKS.tiktok,
  },
  { label: "Facebook", className: "bg-[#1877f2]", href: BTRADING_LINKS.facebook },
]

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070a0f] text-[#f4f7fb]">
      <div className="mx-auto w-[min(1120px,calc(100%-42px))]">
        <nav className="flex h-[78px] items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-[.4px]">
            <Image src="/brand/logo.png" alt="BTrading" width={37} height={37} priority />
            <span>
              BTRADING
              <small className="block text-[9px] tracking-[1.6px] text-[#e8bc55]">
                MARKET INSIGHTS
              </small>
            </span>
          </Link>
          <div className="hidden items-center gap-7 text-[13px] text-slate-300 md:flex">
            <a href="#ecosystem">Hệ sinh thái</a>
            <a href="#academy">Học viện</a>
            <a href="#analysis">Phân tích</a>
          </div>
          <a
            href="#contact"
            className="rounded-lg border border-white/15 px-4 py-2.5 text-[13px] font-extrabold text-slate-100"
          >
            Liên hệ trực tiếp →
          </a>
        </nav>

        <section className="relative py-16 text-center sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-[-112px] h-[430px] w-[430px] -translate-x-1/2 rounded-full border border-[#e8bc55]/15 shadow-[0_0_85px_rgba(232,188,85,.075),inset_0_0_85px_rgba(232,188,85,.035)]" />
          <div className="relative">
            <Image
              src="/brand/logo.png"
              alt="BTrading Market Insights"
              width={132}
              height={132}
              priority
              className="mx-auto mb-5 drop-shadow-2xl"
            />
            <p className="text-[11px] font-extrabold tracking-[2px] text-[#f4d77e]">
              BTRADING MARKET INSIGHTS
            </p>
            <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-extrabold leading-[1.03] tracking-[-.06em] sm:text-7xl">
              Trang bị lợi thế
              <br />
              cho <span className="text-[#f4d77e]">trader hiện đại.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Kiến thức, phân tích thị trường và công cụ theo dõi được tổ chức
              trong một hệ sinh thái để bạn đầu tư có cơ sở hơn.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a
                href={BTRADING_LINKS.zalo}
                className="rounded-lg bg-[linear-gradient(135deg,#f3d57b,#d99c39)] px-4 py-3 text-[13px] font-extrabold text-[#171108]"
              >
                Nhận hỗ trợ trực tiếp
              </a>
              <a
                href="#analysis"
                className="rounded-lg border border-white/15 px-4 py-3 text-[13px] font-extrabold"
              >
                Xem bản tin hằng ngày
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Trao đổi cùng BTrading về hành trình giao dịch hoặc hợp tác đối tác
            </p>
          </div>
        </section>
      </div>

      <section className="border-y border-white/10 bg-white/[.025]">
        <div className="mx-auto grid w-[min(1120px,calc(100%-42px))] gap-4 py-6 sm:grid-cols-2 sm:gap-12">
          <div>
            <b className="block">Học đúng, theo dõi đúng.</b>
            <span className="text-sm text-slate-400">
              Nội dung có cấu trúc giúp trader xây dựng góc nhìn độc lập.
            </span>
          </div>
          <div>
            <b className="block">Không chỉ là một dashboard.</b>
            <span className="text-sm text-slate-400">
              BTrading kết nối học viện, phân tích và công cụ thị trường.
            </span>
          </div>
        </div>
      </section>

      <section id="ecosystem" className="mx-auto w-[min(1120px,calc(100%-42px))] py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[1.8px] text-[#e8bc55]">
          BTRADING ECOSYSTEM
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
          Ba mảnh ghép cho hành trình đầu tư có phương pháp.
        </h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Tất cả được tổ chức rõ ràng, để người mới có điểm bắt đầu và trader có
          nơi theo dõi mỗi ngày.
        </p>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            ["01 / ACADEMY", "Học viện", "Chuỗi bài học từ nền tảng thị trường đến phương pháp quan sát và kỷ luật giao dịch."],
            ["02 / DAILY INSIGHT", "Bản tin & phân tích", "Tóm lược các diễn biến đáng chú ý, VN-Index, Gold và các biến số vĩ mô."],
            ["03 / DASHBOARD", "Công cụ theo dõi", "Heatmap và dữ liệu thị trường được tập trung tại một nơi khi cần đi sâu hơn."],
          ].map(([number, title, copy]) => (
            <article key={number} className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(25,35,49,.75),rgba(10,15,23,.67))] p-6">
              <p className="font-mono text-xs font-bold tracking-wider text-[#f4d77e]">{number}</p>
              <h3 className="mt-7 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="academy" className="mx-auto w-[min(1120px,calc(100%-42px))] py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-[11px] font-extrabold tracking-[1.8px] text-[#e8bc55]">FOR EVERY TRADER</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
              Từ người mới đến trader có phương pháp.
            </h2>
            <p className="mt-3 max-w-xl text-slate-400">
              Một lộ trình đơn giản, thực dụng: hiểu nền tảng, quan sát bối cảnh,
              sau đó xây dựng quy trình riêng.
            </p>
          </div>
          <ol className="border-l border-white/10">
            {[
              ["Hiểu thị trường", "Nền tảng cần thiết để bắt đầu một cách tự tin hơn."],
              ["Đọc bối cảnh", "Kết nối biểu đồ, sự kiện và xu hướng thay vì nhìn tín hiệu rời rạc."],
              ["Giữ kỷ luật", "Biến kiến thức thành quy trình theo dõi và quản trị rủi ro."],
            ].map(([title, copy]) => (
              <li key={title} className="relative pb-6 pl-7 last:pb-0 before:absolute before:left-[-5px] before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-[#e8bc55] before:shadow-[0_0_0_5px_rgba(232,188,85,.11)]">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-8 flex flex-col gap-5 rounded-xl border border-red-500/45 bg-[radial-gradient(55%_160%_at_100%_0%,rgba(224,57,57,.18),transparent_60%),linear-gradient(120deg,#201116,#0e121a)] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="grid h-8 w-11 place-items-center rounded-lg bg-[#e63535] text-sm">▶</span>
            <div>
              <h3 className="font-bold">BTrading Academy trên YouTube</h3>
              <p className="mt-1 text-sm text-slate-300">Video kiến thức, góc nhìn thị trường và các bài học dành cho trader.</p>
            </div>
          </div>
          <a href={BTRADING_LINKS.youtube} target="_blank" rel="noreferrer" className="rounded-lg bg-[linear-gradient(135deg,#f3d57b,#d99c39)] px-4 py-3 text-center text-[13px] font-extrabold text-[#171108]">
            Khám phá học viện →
          </a>
        </div>
      </section>

      <section id="analysis" className="mx-auto w-[min(1120px,calc(100%-42px))] py-16 sm:py-20">
        <p className="text-[11px] font-extrabold tracking-[1.8px] text-[#e8bc55]">DAILY ANALYSIS</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
          Bắt đầu phiên với bối cảnh, không phải cảm tính.
        </h2>
        <p className="mt-3 whitespace-nowrap text-slate-400 max-sm:whitespace-normal">
          Bản tin BTrading tập trung vào điều vừa xảy ra, điều sắp diễn ra và những vùng thị trường cần quan sát.
        </p>
      </section>

      <section id="contact" className="mx-auto w-[min(1120px,calc(100%-42px))]">
        <div className="mb-14 flex flex-col gap-7 rounded-2xl border border-[#e8bc55]/35 bg-[radial-gradient(60%_170%_at_100%_0%,rgba(52,94,143,.26),transparent_58%),linear-gradient(105deg,#1a1810,#0d141e_62%)] p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-extrabold tracking-[1.8px] text-[#e8bc55]">KẾT NỐI CÙNG BTRADING</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-[-.045em]">Chọn kênh phù hợp, nhận hỗ trợ nhanh hơn.</h2>
            <p className="mt-3 text-slate-300">Theo dõi nội dung trên YouTube, TikTok, Facebook và Telegram. Khi cần trao đổi trực tiếp về hỗ trợ khách hàng hoặc hợp tác đối tác, hãy nhắn Zalo hoặc Telegram cho BTrading.</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[330px]">
            <p className="col-span-full text-[10px] font-extrabold tracking-[1.35px] text-slate-400">KÊNH NỘI DUNG</p>
            {contentChannels.map((channel) => (
              <a key={channel.label} href={channel.href} className={"rounded-lg px-2 py-3 text-center text-xs font-extrabold text-white " + channel.className}>
                {channel.label}
              </a>
            ))}
            <p className="col-span-full mt-2 text-[10px] font-extrabold tracking-[1.35px] text-slate-400">LIÊN HỆ TRỰC TIẾP</p>
            <a href={BTRADING_LINKS.zalo} className="rounded-lg bg-[#0068ff] px-2 py-3 text-center text-xs font-extrabold text-white">Zalo</a>
            <a href={BTRADING_LINKS.telegram} className="col-span-2 rounded-lg bg-[#229ed9] px-2 py-3 text-center text-xs font-extrabold text-white">Telegram</a>\n            <a href={BTRADING_LINKS.phone} className="col-span-full rounded-lg bg-[#e8bc55] px-2 py-3 text-center text-xs font-extrabold text-[#171108]">Gọi 0922 222 889</a>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 py-7 text-xs text-slate-500">
        <div className="mx-auto flex w-[min(1120px,calc(100%-42px))] flex-col justify-between gap-3 sm:flex-row">
          <span>© 2026 BTrading · Market Insights</span>
          <span>Thông tin chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.</span>
        </div>
      </section>
    </main>
  )
}
