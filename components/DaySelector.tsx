"use client";

type Props = {
  selectedDate: string; // YYYY-MM-DD
  onChange: (date: string) => void;
};

function buildDays(): Array<{ dateStr: string; label: string; sub: string }> {
  const days = [];
  const tz = "America/Chicago";
  for (let i = 0; i < 8; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: tz });
    const label =
      i === 0 ? "Today" :
      i === 1 ? "Tomorrow" :
      d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short" });
    const sub = d.toLocaleDateString("en-US", { timeZone: tz, month: "short", day: "numeric" });
    days.push({ dateStr, label, sub });
  }
  return days;
}

export default function DaySelector({ selectedDate, onChange }: Props) {
  const days = buildDays();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {days.map(({ dateStr, label, sub }) => {
        const isSelected = dateStr === selectedDate;
        return (
          <button
            key={dateStr}
            onClick={() => onChange(dateStr)}
            className={`shrink-0 flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
              isSelected
                ? "bg-blue-600/30 border-blue-500/70 text-blue-300"
                : "border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            <span className={`font-semibold ${isSelected ? "text-blue-200" : ""}`}>{label}</span>
            <span className={`text-xs ${isSelected ? "text-blue-400" : "text-slate-500"}`}>{sub}</span>
          </button>
        );
      })}
    </div>
  );
}
