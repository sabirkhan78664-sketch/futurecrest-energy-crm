"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function SelectAllRow({
  allSelected,
  someSelected,
  onToggle,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div
      role="menuitemcheckbox"
      aria-checked={allSelected ? "true" : someSelected ? "mixed" : "false"}
      onClick={onToggle}
      className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={allSelected}
        readOnly
        className="h-4 w-4 rounded border-slate-300"
      />
      Select All
    </div>
  );
}

// Reusable checkbox multi-select dropdown for the Leads filters — one
// component shared by Status/Form/Fuel/Agent/Channel instead of a
// separate one-off dropdown per filter. Built on the existing (until
// now unused) shadcn-style DropdownMenu primitives in
// components/ui/dropdown-menu.tsx, whose CheckboxItem already stays
// open across clicks (closeOnClick defaults to false) and whose
// content is positioned by Base UI's own collision-aware Positioner,
// so it can't overflow the viewport.
export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: Props) {
  const allSelected =
    options.length > 0 && selected.length === options.length;
  const someSelected = selected.length > 0 && !allSelected;

  const displayText =
    selected.length === 0
      ? label
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ??
          selected[0]
        : `${selected.length} selected`;

  function toggleOption(value: string, checked: boolean) {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter((v) => v !== value));
    }
  }

  function handleSelectAll() {
    onChange(allSelected ? [] : options.map((o) => o.value));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white p-3 text-left text-sm text-slate-700"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-h-72 w-64">
        <SelectAllRow
          allSelected={allSelected}
          someSelected={someSelected}
          onToggle={handleSelectAll}
        />

        <DropdownMenuSeparator />

        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) =>
              toggleOption(option.value, checked)
            }
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />

        <div
          onClick={() => onChange([])}
          className="cursor-pointer rounded-md px-1.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Clear All
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
