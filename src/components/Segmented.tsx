"use client";

import { useId } from "react";

type SegmentOption<Value> = { value: Value; label: string };

type SegmentedProps<Value extends string | number> = {
  legend: string;
  name: string;
  value: Value;
  options: readonly SegmentOption<Value>[];
  onChange: (value: Value) => void;
};

// Native radio inputs underneath: arrow-key navigation and screen readers work for free
const Segmented = <Value extends string | number>({
  legend,
  name,
  value,
  options,
  onChange,
}: SegmentedProps<Value>) => {
  const legendId = useId();

  return (
    <div className="segmented">
      <span id={legendId} className="label">
        {legend}
      </span>
      <div role="radiogroup" aria-labelledby={legendId} className="segmented-options">
        {options.map((option) => (
          <label key={option.value} className="segment">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default Segmented;