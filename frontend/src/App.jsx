/** Ten routes. Detail lives in tabs and drawers, not in more pages -- every
 *  additional route is something a user has to learn. Section 7. */

import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./app/AppShell";
import { RunProvider } from "./app/RunContext";
import CompanyLibrary from "./screens/CompanyLibrary";
import CompanyProfile from "./screens/CompanyProfile";
import Dashboard from "./screens/Dashboard";
import Landing from "./screens/Landing";
import Login from "./screens/Login";
import NewResearch from "./screens/NewResearch";
import Outreach from "./screens/Outreach";
import RunDetail from "./screens/RunDetail";
import Settings from "./screens/Settings";
import Tracker from "./screens/Tracker";

export default function App() {
  return (
    <BrowserRouter>
      <RunProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<AppShell />}>
            <Route path="/app" element={<Dashboard />} />
            <Route path="/research/new" element={<NewResearch />} />
            <Route path="/runs/:id" element={<RunDetail />} />
            <Route path="/companies" element={<CompanyLibrary />} />
            <Route path="/companies/:slug" element={<CompanyProfile />} />
            <Route path="/outreach" element={<Outreach />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </RunProvider>
    </BrowserRouter>
  );
}
