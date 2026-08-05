/** Four variants, one per job. One primary button per view, maximum. */

import React from "react";
import { Link } from "react-router-dom";

import styles from "./Button.module.css";

const VARIANTS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  destructive: styles.destructive,
  destructiveConfirm: styles.destructiveConfirm,
};

export default function Button({
  variant = "secondary",
  size,
  fullWidth = false,
  to,
  href,
  disabled = false,
  /** Why the control is unavailable. Shown on hover and focus -- a disabled
   *  button with no explanation is a dead end, especially on touch. */
  disabledReason,
  className = "",
  children,
  ...props
}) {
  const classes = [
    styles.button,
    VARIANTS[variant] || styles.secondary,
    size === "small" ? styles.small : "",
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      aria-describedby={props["aria-describedby"]}
      {...props}
    >
      {children}
    </button>
  );
}
