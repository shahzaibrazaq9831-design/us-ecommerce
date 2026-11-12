"use client";

import Link from "next/link";
import { Ruler, Sparkles, Scissors } from "lucide-react";
import {
  measurementFields,
  standardSizes,
  stitchingOptionCopy,
  stitchingOptions,
  type MeasurementUnit,
  type MeasurementValues,
  type Product,
  type StitchingOption,
} from "@/lib/products";

/** Everything the customer chose in the stitching selector. */
export interface StitchingSelection {
  /** How the piece is made. */
  stitching: StitchingOption;
  /** The ready-made size, for standard stitching. */
  size: string;
  /** The unit the custom measurements are typed in. */
  unit: MeasurementUnit;
  /** The custom measurements, keyed by measurement. */
  measurements: MeasurementValues;
  /** Anything the customer wants us to know. */
  notes: string;
}

/** An empty selection — the starting point for the selector. */
export function emptySelection(): StitchingSelection {
  return {
    stitching: "standard",
    size: "",
    unit: "in",
    measurements: {
      bust: "",
      waist: "",
      hip: "",
      shoulder: "",
      sleeveLength: "",
      dressLength: "",
    },
    notes: "",
  };
}

/** The icon shown next to each stitching option. */
const OPTION_ICONS: Record<StitchingOption, typeof Scissors> = {
  unstitched: Scissors,
  standard: Sparkles,
  custom: Ruler,
};

interface StitchingSelectorProps {
  product: Product;
  value: StitchingSelection;
  onChange: (next: StitchingSelection) => void;
  /** Messages for the fields that need attention, keyed by field name. */
  errors?: Record<string, string>;
}

/**
 * The stitching selector on the product page.
 *
 * The three ways a piece can be made sit in one row, and the panel below
 * them holds the details for the chosen way. Every panel stays mounted
 * and sits in the same grid cell, so the block keeps the height of the
 * tallest panel — switching between unstitched, standard and custom
 * never moves the page.
 */
export default function StitchingSelector({
  product,
  value,
  onChange,
  errors = {},
}: StitchingSelectorProps) {
  const available = product.stitching.length > 0 ? product.stitching : stitchingOptions;

  const patch = (changes: Partial<StitchingSelection>) =>
    onChange({ ...value, ...changes });

  const setMeasurement = (key: keyof MeasurementValues, next: string) =>
    patch({
      measurements: { ...value.measurements, [key]: next },
    });

  /** Switching between inches and centimetres keeps the numbers the customer typed. */
  const changeUnit = (unit: MeasurementUnit) => {
    if (unit === value.unit) return;

    const factor = unit === "cm" ? 2.54 : 1 / 2.54;
    const converted: MeasurementValues = { ...value.measurements };
    for (const field of measurementFields) {
      const raw = (value.measurements[field.key] ?? "").trim();
      if (raw === "") continue;
      const amount = Number(raw);
      if (!Number.isFinite(amount)) continue;
      converted[field.key] = String(Math.round(amount * factor * 10) / 10);
    }

    patch({ unit, measurements: converted });
  };

  return (
    <fieldset className="stitching-selector">
      <legend className="stitching-legend">
        How would you like it made?
        {value.stitching && (
          <span className="stitching-legend-value">
            {stitchingOptionCopy[value.stitching].title}
          </span>
        )}
      </legend>

      {/* The three ways a piece can be made. */}
      <div className="stitching-options" role="radiogroup" aria-label="Stitching">
        {available.map((option) => {
          const copy = stitchingOptionCopy[option];
          const Icon = OPTION_ICONS[option];
          const selected = value.stitching === option;

          return (
            <label
              key={option}
              className={`stitching-option${selected ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="stitching"
                value={option}
                checked={selected}
                onChange={() => patch({ stitching: option })}
              />
              <span className="stitching-option-icon" aria-hidden="true">
                <Icon size={18} strokeWidth={1.6} />
              </span>
              <span className="stitching-option-body">
                <span className="stitching-option-title">{copy.title}</span>
                <span className="stitching-option-summary">{copy.summary}</span>
              </span>
            </label>
          );
        })}
      </div>

      {errors.stitching && (
        <p className="stitching-error" role="alert">
          {errors.stitching}
        </p>
      )}

      {/* The details of the chosen way. All three panels share one cell, so
          the block keeps a fixed height and the page never shifts. */}
      <div className="stitching-panels">
        <div
          className="stitching-panel"
          aria-hidden={value.stitching !== "unstitched"}
          inert={value.stitching !== "unstitched"}
          data-hidden={value.stitching !== "unstitched"}
        >
          <p className="stitching-panel-copy">
            {stitchingOptionCopy.unstitched.detail}
          </p>
        </div>

        <div
          className="stitching-panel"
          aria-hidden={value.stitching !== "standard"}
          inert={value.stitching !== "standard"}
          data-hidden={value.stitching !== "standard"}
        >
          <p className="stitching-panel-copy">
            {stitchingOptionCopy.standard.detail}
          </p>
          <div className="stitching-size-row">
            <label className="stitching-field">
              <span className="stitching-field-label">
                Size
                {value.size && (
                  <span className="stitching-field-value">{value.size}</span>
                )}
              </span>
              <select
                className="stitching-select"
                value={value.size}
                onChange={(event) => patch({ size: event.target.value })}
                aria-invalid={Boolean(errors.size)}
              >
                <option value="">Choose a size…</option>
                {standardSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/size-guide" className="stitching-size-guide">
              <Ruler size={16} strokeWidth={1.7} aria-hidden="true" />
              Size guide
            </Link>
          </div>
          {errors.size && (
            <p className="stitching-error" role="alert">
              {errors.size}
            </p>
          )}
        </div>

        <div
          className="stitching-panel"
          aria-hidden={value.stitching !== "custom"}
          inert={value.stitching !== "custom"}
          data-hidden={value.stitching !== "custom"}
        >
          <p className="stitching-panel-copy">
            {stitchingOptionCopy.custom.detail}
          </p>

          <div className="stitching-unit" role="radiogroup" aria-label="Measurement unit">
            <span className="stitching-unit-label">Measurements in</span>
            {(["in", "cm"] as const).map((unit) => (
              <label
                key={unit}
                className={`stitching-unit-option${value.unit === unit ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="measurement-unit"
                  value={unit}
                  checked={value.unit === unit}
                  onChange={() => changeUnit(unit)}
                />
                {unit === "in" ? "inches" : "cm"}
              </label>
            ))}
          </div>

          <div className="stitching-measurements">
            {measurementFields.map((field) => (
              <label key={field.key} className="stitching-field">
                <span className="stitching-field-label">
                  {field.label}
                  <span className="stitching-field-hint">{field.hint}</span>
                </span>
                <span className="stitching-field-input">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={value.measurements[field.key]}
                    onChange={(event) =>
                      setMeasurement(field.key, event.target.value)
                    }
                    aria-invalid={Boolean(errors[field.key])}
                    placeholder="—"
                  />
                  <span className="stitching-field-unit">{value.unit}</span>
                </span>
                {errors[field.key] && (
                  <span className="stitching-error" role="alert">
                    {errors[field.key]}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Notes for every way of making the piece. */}
      <label className="stitching-notes">
        <span className="stitching-field-label">Notes (optional)</span>
        <textarea
          rows={3}
          value={value.notes}
          onChange={(event) => patch({ notes: event.target.value })}
          placeholder="Anything we should know — a deeper neckline, a shorter length, a delivery date…"
        />
      </label>
    </fieldset>
  );
}
