/** One run in flight, shared across screens.
 *
 *  /research/new starts the run and navigates to /runs/:id. Without shared
 *  state the detail screen would mount a second hook and start over, losing the
 *  first few log entries -- the part of the run people actually watch.
 */

import React, { createContext, useContext } from "react";

import { useAgentRun } from "../hooks/useAgentRun";

const RunContext = createContext(null);

export function RunProvider({ children }) {
  const value = useAgentRun();
  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useActiveRun() {
  const value = useContext(RunContext);
  if (!value) throw new Error("useActiveRun must be used inside a RunProvider");
  return value;
}
