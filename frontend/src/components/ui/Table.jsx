/** The primary data surface: company library, tracker, people.
 *
 *  Columns are declared, not composed, because every table in the app behaves
 *  identically -- sticky mono header, right-aligned numerics, whole row as the
 *  click target, ghost row actions. Divergence would be a bug, not a feature.
 */

import React from "react";
import { Link } from "react-router-dom";

import styles from "./Table.module.css";

function SortIndicator({ direction }) {
  return <span aria-hidden="true">{direction === "asc" ? "↑" : "↓"}</span>;
}

export default function Table({
  columns,
  rows,
  caption,
  dense = false,
  sort,
  onSortChange,
  emptyState = null,
}) {
  if (!rows.length && emptyState) return emptyState;

  const sortDirectionFor = (key) => (sort?.key === key ? sort.direction : null);
  const hasActions = rows.some((row) => row.actions);

  const toggleSort = (key) => {
    if (!onSortChange) return;
    const current = sortDirectionFor(key);
    onSortChange({ key, direction: current === "asc" ? "desc" : "asc" });
  };

  return (
    <div className={styles.scroller}>
      <table className={`${styles.table} ${dense ? styles.dense : ""}`}>
        {caption && <caption className={`${styles.caption} t-body-sm`}>{caption}</caption>}
        <thead className={styles.head}>
          <tr>
            {columns.map((column) => {
              const direction = sortDirectionFor(column.key);
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={`${styles.headCell} ${column.numeric ? styles.numeric : ""} t-mono-label`}
                  style={column.width ? { width: column.width } : undefined}
                  aria-sort={
                    direction ? (direction === "asc" ? "ascending" : "descending") : undefined
                  }
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      className={`${styles.sortButton} ${direction ? styles.sortActive : ""}`}
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      {direction && <SortIndicator direction={direction} />}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
            {hasActions && (
              <th scope="col" className={`${styles.headCell} ${styles.numeric}`}>
                <span className="u-visually-hidden">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={styles.row}>
              {columns.map((column, columnIndex) => {
                const content = row.cells[column.key];
                const isPrimary = columnIndex === 0;
                return (
                  <td
                    key={column.key}
                    className={[
                      styles.cell,
                      column.numeric ? styles.cellNumeric : "",
                      isPrimary ? styles.cellPrimary : "",
                      column.mono ? "t-mono-data" : "t-body-sm",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    data-label={column.label}
                  >
                    {isPrimary && row.href ? (
                      <Link to={row.href} className={`${styles.rowLink} t-body`}>
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
              {hasActions && (
                <td className={styles.cell} data-label="Actions">
                  {row.actions && (
                    <div
                      className={`${styles.actions} ${
                        row.actionsPersistent ? styles.actionsPersistent : ""
                      }`}
                    >
                      {row.actions}
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
