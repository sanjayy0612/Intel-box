/** Labelled form controls.
 *
 *  Placeholders show a real valid example -- `Zepto`, `quick commerce` -- never
 *  "e.g. ..." and never a restatement of the label.
 */

import React, { useId } from "react";

import styles from "./Field.module.css";

export function TextField({
  label,
  helper,
  error,
  multiline = false,
  id: providedId,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const Control = multiline ? "textarea" : "input";

  return (
    <div className={`${styles.field} ${className}`}>
      <label className={`${styles.label} t-body-sm`} htmlFor={id}>
        {label}
      </label>
      <Control
        id={id}
        className={`${styles.control} ${error ? styles.invalid : ""}`}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className={`${styles.error} t-caption`} role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={helperId} className={`${styles.helper} t-caption`}>
          {helper}
        </p>
      )}
    </div>
  );
}

/** A small set of mutually exclusive options, as radios rather than a select --
 *  the consequence of each choice needs to be readable without opening a menu. */
export function ChoiceField({ label, helper, name, options, value, onChange }) {
  const generatedId = useId();
  const helperId = helper ? `${generatedId}-helper` : undefined;

  return (
    <fieldset className={styles.fieldset} aria-describedby={helperId}>
      <legend className={`${styles.legend} t-body-sm`}>{label}</legend>
      <div className={styles.choices}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`${styles.choice} ${value === option.value ? styles.choiceSelected : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {helper && (
        <p id={helperId} className={`${styles.helper} t-caption`}>
          {helper}
        </p>
      )}
    </fieldset>
  );
}

/** A checkbox that states the consequence in plain language underneath. */
export function ToggleField({ label, helper, checked, onChange, id: providedId }) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const helperId = helper ? `${id}-helper` : undefined;

  return (
    <div className={styles.toggleRow}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={helperId}
      />
      <span className={styles.toggleText}>
        <label className={`${styles.label} t-body-sm`} htmlFor={id}>
          {label}
        </label>
        {helper && (
          <span id={helperId} className={`${styles.helper} t-caption`}>
            {helper}
          </span>
        )}
      </span>
    </div>
  );
}
