"use client";

interface Filters {
  productName: string;
  machineName: string;
  packType: string;
}

interface Props {
  filters: Filters;
  options: {
    productNames: string[];
    machineNames: string[];
    packTypes: string[];
  };
  onChange: (filters: Filters) => void;
}

export default function FilterBar({ filters, options, onChange }: Props) {
  const hasActive =
    filters.productName || filters.machineName || filters.packType;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
        <Select
          label="製品名"
          value={filters.productName}
          options={options.productNames}
          onChange={(v) => onChange({ ...filters, productName: v })}
        />
        <Select
          label="機械名"
          value={filters.machineName}
          options={options.machineNames}
          onChange={(v) => onChange({ ...filters, machineName: v })}
        />
        <Select
          label="パック形態"
          value={filters.packType}
          options={options.packTypes}
          onChange={(v) => onChange({ ...filters, packType: v })}
        />
      </div>
      {hasActive && (
        <button
          onClick={() => onChange({ productName: "", machineName: "", packType: "" })}
          className="text-xs text-blue-500 underline"
        >
          絞り込みをリセット
        </button>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex-shrink-0 snap-start text-sm px-3 py-2 rounded-full border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
        value
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-600 border-gray-200"
      }`}
    >
      <option value="">{label} ▾</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
