"use client";

import { useAppState } from "@/context/AppStateContext";

export default function EmployeesPage() {
  const { state } = useAppState();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">עובדים</h1>
        <p className="mt-1 text-sm text-slate-500">רשימת כוח אדם פעיל לסידור</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 text-right font-medium">שם</th>
              <th className="px-4 py-3 text-right font-medium">תפקיד</th>
              <th className="px-4 py-3 text-right font-medium">יחידה</th>
            </tr>
          </thead>
          <tbody>
            {state.employees.map((emp) => {
              const unit = state.units.find((u) => u.id === emp.primaryUnitId);
              return (
                <tr key={emp.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-slate-100">{emp.name}</td>
                  <td className="px-4 py-3 text-slate-700">{emp.role}</td>
                  <td className="px-4 py-3 text-slate-500">{unit?.name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
