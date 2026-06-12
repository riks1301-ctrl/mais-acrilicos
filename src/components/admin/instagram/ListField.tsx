"use client";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
};

export function ListField({ label, values, onChange, placeholder, hint }: Props) {
  function update(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function add() {
    onChange([...values, ""]);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button type="button" onClick={add} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          + Adicionar
        </button>
      </div>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => update(index, e.target.value)}
              placeholder={placeholder}
              className={cn("flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20")}
            />
            <button type="button" onClick={() => remove(index)} className="rounded-xl px-3 text-sm text-red-600 hover:bg-red-50">
              Remover
            </button>
          </div>
        ))}
        {values.length === 0 && (
          <button type="button" onClick={add} className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600">
            Clique para adicionar item
          </button>
        )}
      </div>
    </div>
  );
}
