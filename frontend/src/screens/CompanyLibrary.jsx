/** /companies -- the biggest gap in the old UI. Every profile is persisted with
 *  a 30-day cache and nothing let you browse it. */

import React, { useMemo, useState } from "react";

import { Button, EmptyState, FreshnessDot, SectionHeader, Table, TextField } from "../components/ui";
import { companies } from "../fixtures/library";
import { daysSince, freshnessState } from "../utils/time";
import styles from "./CompanyLibrary.module.css";

const COLUMNS = [
  { key: "name", label: "Company", sortable: true },
  { key: "category", label: "Category", sortable: true },
  { key: "lastResearched", label: "Last researched", sortable: true },
  { key: "people", label: "People", numeric: true, mono: true, sortable: true },
  { key: "outreach", label: "Outreach", sortable: false },
];

const SORT_VALUES = {
  name: (company) => company.name.toLowerCase(),
  category: (company) => company.category.toLowerCase(),
  lastResearched: (company) => daysSince(company.lastResearched) ?? Infinity,
  people: (company) => company.peopleFound,
};

export default function CompanyLibrary() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: "lastResearched", direction: "asc" });

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = companies.filter(
      (company) =>
        !needle ||
        company.name.toLowerCase().includes(needle) ||
        company.category.toLowerCase().includes(needle)
    );

    const read = SORT_VALUES[sort.key] || SORT_VALUES.name;
    const sorted = [...filtered].sort((a, b) => {
      const left = read(a);
      const right = read(b);
      if (left === right) return 0;
      return (left < right ? -1 : 1) * (sort.direction === "asc" ? 1 : -1);
    });

    return sorted.map((company) => {
      const stale = freshnessState(company.lastResearched) === "stale";
      return {
        id: company.slug,
        href: `/companies/${company.slug}`,
        // The colour is a hint; the button is the affordance.
        actionsPersistent: stale,
        actions: stale ? (
          <Button size="small" variant="ghost">
            Re-run
          </Button>
        ) : null,
        cells: {
          name: company.name,
          category: company.category,
          lastResearched: <FreshnessDot lastResearched={company.lastResearched} />,
          people: company.peopleFound,
          outreach: company.outreachStatus,
        },
      };
    });
  }, [query, sort]);

  return (
    <>
      <SectionHeader
        eyebrow="Library"
        title="Your companies"
        actions={
          <Button variant="primary" to="/research/new">
            Run research
          </Button>
        }
      />

      <div className={styles.search}>
        <TextField
          label="Search"
          placeholder="Zepto"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <Table
        columns={COLUMNS}
        rows={rows}
        sort={sort}
        onSortChange={setSort}
        emptyState={
          query ? (
            <EmptyState
              title="Nothing matches that search"
              body={`No company or category contains "${query}".`}
            />
          ) : (
            <EmptyState
              title="Research your first company"
              body="Every company you research is kept here with its brief, competitors, and people."
              action={
                <Button variant="primary" to="/research/new">
                  Run research
                </Button>
              }
            />
          )
        }
      />
    </>
  );
}
