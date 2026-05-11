import { ACTIVITY_CATEGORIES, activityLabels } from "@/domain/activity";

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  help,
  min,
  max,
  step,
  inputMode,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  help?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[#061b31]">
      <span>{label}</span>
      <input
        autoComplete={autoComplete}
        className="w-full rounded-[6px] border border-[#d8dfe8] bg-white px-3 py-2 text-sm text-[#061b31] outline-none transition placeholder:text-[#64748d] focus:border-[#0c8c5e] focus:ring-2 focus:ring-[#0c8c5e]/15"
        defaultValue={defaultValue ?? ""}
        inputMode={inputMode}
        max={max}
        min={min}
        name={name}
        required={required}
        step={step}
        type={type}
      />
      {help ? <span className="block text-xs font-normal text-[#64748d]">{help}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  help?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[#061b31]">
      <span>{label}</span>
      <textarea
        className="min-h-24 w-full rounded-[6px] border border-[#d8dfe8] bg-white px-3 py-2 text-sm text-[#061b31] outline-none transition focus:border-[#0c8c5e] focus:ring-2 focus:ring-[#0c8c5e]/15"
        defaultValue={defaultValue ?? ""}
        name={name}
      />
      {help ? <span className="block text-xs font-normal text-[#64748d]">{help}</span> : null}
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  help,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: Array<{ label: string; value: string }>;
  help?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm font-medium text-[#061b31]">
      <span>{label}</span>
      <select
        className="w-full rounded-[6px] border border-[#d8dfe8] bg-white px-3 py-2 text-sm text-[#061b31] outline-none transition focus:border-[#0c8c5e] focus:ring-2 focus:ring-[#0c8c5e]/15"
        defaultValue={defaultValue ?? options[0]?.value}
        name={name}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {help ? <span className="block text-xs font-normal text-[#64748d]">{help}</span> : null}
    </label>
  );
}

export const activityOptions = ACTIVITY_CATEGORIES.map((category) => ({
  value: category,
  label: activityLabels[category],
}));
