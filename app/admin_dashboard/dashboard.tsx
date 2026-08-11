import Image from "next/image";

const navItems = [
  { label: "Dashboard", icon: "D", active: true },
  { label: "Curriculum", icon: "C" },
  { label: "Students", icon: "S" },
  { label: "AI Quality", icon: "AI" },
  { label: "Quizzes", icon: "Q" },
  { label: "Settings", icon: "SE" },
];

const stats = [
  {
    label: "Total Students",
    value: "1,240",
    accent: "+12% this month",
    icon: "S",
    color: "text-[#5368ff]",
  },
  {
    label: "Active AI Sessions",
    value: "85",
    accent: "Live now",
    icon: "AI",
    color: "text-[#1fc7e9]",
  },
  {
    label: "Curriculum Progress",
    value: "78%",
    accent: "Grades 10-12",
    icon: "%",
    color: "text-[#7a4dff]",
  },
  {
    label: "AI Quality Score",
    value: "4.8 / 5.0",
    accent: "Excellent",
    icon: "*",
    color: "text-emerald-300",
  },
];

const sessions = [
  {
    id: "#AI-8942",
    name: "Sopheak Mith",
    subject: "Physics",
    reason: "Low confidence answer",
    status: "Amber",
  },
  {
    id: "#AI-8945",
    name: "Vanna Rak",
    subject: "Math",
    reason: "Policy violation (Off-topic)",
    status: "Red",
  },
  {
    id: "#AI-8948",
    name: "Leakena Chan",
    subject: "Chemistry",
    reason: "Repeated hallucination detected",
    status: "Red",
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#070b19] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[280px] shrink-0 border-r border-[#243856] bg-[#070b19] px-7 py-8 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <Image
              src="/AI Tutor_Logo.png"
              alt="Rean AI logo"
              width={50}
              height={50}
              className="h-12 w-12 object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight">Rean AI</span>
          </div>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex h-12 w-full items-center gap-4 rounded-xl px-4 text-left text-sm font-semibold transition ${
                  item.active
                    ? "bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-500 hover:bg-[#101a2b] hover:text-slate-200"
                }`}
              >
                <span className="flex w-7 justify-center text-xs font-extrabold">
                  {item.icon}
                </span>
                {item.label}
                {item.label === "Curriculum" && (
                  <span className="ml-auto text-xs text-slate-500">v</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl border border-[#243856] bg-[#0b1324] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-[#4367ff] to-[#7a4dff] text-sm font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-bold">Admin Panel</p>
              <p className="text-xs text-slate-500">Sign out</p>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-[#243856] bg-[#0b1324] px-5 md:px-10">
            <div className="flex min-w-0 items-center gap-4">
              <Image
                src="/AI Tutor_Logo.png"
                alt="Rean AI logo"
                width={46}
                height={46}
                className="h-11 w-11 shrink-0 object-contain"
                priority
              />
              <label className="relative hidden w-[410px] max-w-[52vw] sm:block">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">
                  /
                </span>
                <input
                  className="h-11 w-full rounded-full border border-[#35507a] bg-black pl-12 pr-5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-[#5368ff]"
                  placeholder="Search dashboard data..."
                />
              </label>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">Charya Som</p>
                <p className="text-xs text-slate-500">Senior Admin</p>
              </div>
              <div
                aria-label="Charya Som admin profile"
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5368ff] bg-gradient-to-br from-[#4367ff] to-[#7a4dff] text-sm font-extrabold text-white shadow-lg shadow-blue-950/30"
              >
                CS
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 md:px-8 lg:py-12">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Dashboard Overview
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Real-time monitoring of AI education ecosystem
                </p>
              </div>

              <div className="flex w-fit rounded-xl border border-[#243856] bg-black p-1">
                <button className="rounded-lg bg-gradient-to-r from-[#4367ff] to-[#7a4dff] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/30">
                  Last 7 Days
                </button>
                <button className="px-5 py-3 text-sm font-bold text-slate-500">
                  Last 30 Days
                </button>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="min-h-[142px] rounded-xl border border-[#243856] bg-[#0b1324] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border border-[#243856] bg-black text-sm font-extrabold ${stat.color}`}
                    >
                      {stat.icon}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        stat.accent.includes("+") ||
                        stat.accent.includes("Live") ||
                        stat.accent.includes("Excellent")
                          ? "text-emerald-300"
                          : "text-slate-500"
                      }`}
                    >
                      {stat.accent}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {stat.value}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
              <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6">
                <div className="mb-7 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">Student Activity</h2>
                  <span className="text-xs font-semibold text-slate-500">
                    Weekly Engagement
                  </span>
                </div>

                <div className="relative h-[255px] overflow-hidden rounded-lg">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(83,104,255,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(83,104,255,.08)_1px,transparent_1px)] bg-[size:25%_100%,100%_25%]" />
                  <div className="absolute left-0 top-3 flex h-[210px] flex-col justify-between text-xs font-bold text-slate-600">
                    <span>800</span>
                    <span>600</span>
                    <span>400</span>
                    <span>200</span>
                  </div>
                  <svg
                    viewBox="0 0 640 245"
                    className="absolute inset-x-8 bottom-7 h-[220px] w-[calc(100%-4rem)] overflow-visible"
                    role="img"
                    aria-label="Student activity line chart"
                  >
                    <defs>
                      <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#5368ff" stopOpacity="0.38" />
                        <stop offset="100%" stopColor="#7a4dff" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 160 C55 126 95 112 140 116 C197 122 206 143 256 126 C302 111 313 42 365 48 C420 53 462 83 490 123 C524 171 554 191 640 180 L640 245 L0 245 Z"
                      fill="url(#lineFill)"
                    />
                    <path
                      d="M0 160 C55 126 95 112 140 116 C197 122 206 143 256 126 C302 111 313 42 365 48 C420 53 462 83 490 123 C524 171 554 191 640 180"
                      fill="none"
                      stroke="#5368ff"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                    {[0, 140, 256, 365, 490, 560, 640].map((cx, index) => {
                      const cy = [160, 116, 126, 48, 123, 169, 180][index];
                      return (
                        <circle
                          key={cx}
                          cx={cx}
                          cy={cy}
                          r="5"
                          fill="#5368ff"
                          stroke="#243856"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-x-8 bottom-0 grid grid-cols-7 text-xs font-bold text-slate-600">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <span key={day}>{day}</span>
                      ),
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#243856] bg-[#0b1324] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-extrabold">Curriculum Status</h2>
                  <span className="text-xs font-semibold text-slate-500">
                    By Subject
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <div
                    className="h-48 w-48 rounded-full"
                    style={{
                      background:
                        "conic-gradient(#5368ff 0 44%, #7a4dff 44% 56%, #1fc7e9 56% 100%)",
                    }}
                  >
                    <div className="m-auto h-28 w-28 translate-y-10 rounded-full bg-[#0b1324]" />
                  </div>
                  <div className="mt-6 flex flex-wrap justify-center gap-5 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-2">
                      <i className="h-3 w-3 bg-[#5368ff]" /> Math
                    </span>
                    <span className="flex items-center gap-2">
                      <i className="h-3 w-3 bg-[#1fc7e9]" /> Physics
                    </span>
                    <span className="flex items-center gap-2">
                      <i className="h-3 w-3 bg-[#7a4dff]" /> Chemistry
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-xl border border-[#243856] bg-[#0b1324]">
              <div className="flex items-center justify-between border-b border-[#243856] px-6 py-5">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">#</span>
                  <h2 className="text-lg font-extrabold">Flagged AI Sessions</h2>
                </div>
                <button className="text-sm font-bold text-[#5368ff]">
                  View All Sessions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-black text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-extrabold">Session ID</th>
                      <th className="px-6 py-4 font-extrabold">Student Name</th>
                      <th className="px-6 py-4 font-extrabold">Subject</th>
                      <th className="px-6 py-4 font-extrabold">Reason</th>
                      <th className="px-6 py-4 font-extrabold">Status</th>
                      <th className="px-6 py-4 text-right font-extrabold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243856]">
                    {sessions.map((session) => (
                      <tr key={session.id} className="text-sm">
                        <td className="px-6 py-5 font-bold text-white">
                          {session.id}
                        </td>
                        <td className="px-6 py-5 font-semibold text-slate-300">
                          {session.name}
                        </td>
                        <td className="px-6 py-5 font-semibold text-slate-300">
                          {session.subject}
                        </td>
                        <td className="px-6 py-5 text-slate-500">
                          {session.reason}
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              session.status === "Red"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right text-sm font-bold text-slate-500">
                          <button className="mr-3 hover:text-slate-200">
                            Open
                          </button>
                          <button className="hover:text-slate-200">...</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-[#243856] px-6 py-4">
                <p className="text-xs font-semibold text-slate-600">
                  Showing latest flagged sessions
                </p>
                <div className="flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#243856] text-slate-500">
                    &lt;
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#243856] text-slate-500">
                    &gt;
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
