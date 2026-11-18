import { ScheduleBoard } from "@/components/schedule/ScheduleBoard";

export default function SchedulePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          סידור עבודה
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          לוח שבועי תפעולי לפי יחידות ומשמרות
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <ScheduleBoard />
      </div>
    </div>
  );
}
