export function IconUploadField() {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#8da7d8]">
        Subject Icon
      </span>
      <button
        type="button"
        className="group flex h-28 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#3b5d8f] bg-[#101a2b] text-center text-sm font-medium text-slate-300 transition hover:border-[#7d8dff] hover:bg-[#121f35] hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#5368ff]/25"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#6f7cff]/40 bg-[#5368ff]/15 text-[#aeb8ff] shadow-[0_10px_30px_rgba(83,104,255,0.2)] transition group-hover:border-[#8f99ff] group-hover:text-white">
          <UploadIcon />
        </span>
        <span>Click to upload or drag and drop SVG / PNG</span>
      </button>
    </label>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 15.75V5.5m0 0L8.25 9.25M12 5.5l3.75 3.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M5.75 14.25v2.5a2 2 0 0 0 2 2h8.5a2 2 0 0 0 2-2v-2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
