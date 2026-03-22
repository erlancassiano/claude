import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// Pure function tests — no DOM needed
test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.tsx" })).toBe("Creating /App.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/Button.tsx" })).toBe("Editing /Button.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/index.ts" })).toBe("Editing /index.ts");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.tsx" })).toBe("Viewing /App.tsx");
});

test("getToolLabel: str_replace_editor undo_edit", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.tsx" })).toBe("Undoing edit to /App.tsx");
});

test("getToolLabel: str_replace_editor create with no path falls back", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/old.tsx" })).toBe("Renaming /old.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/old.tsx" })).toBe("Deleting /old.tsx");
});

test("getToolLabel: unknown tool returns toolName", () => {
  expect(getToolLabel("some_other_tool", { command: "foo" })).toBe("some_other_tool");
});

test("getToolLabel: known tool with unknown command returns toolName", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd" })).toBe("str_replace_editor");
});

// Component rendering tests
test("ToolCallBadge shows label and green dot when state=result", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.tsx" }}
      state="result"
    />
  );
  expect(screen.getByText("Creating /App.tsx")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows label and spinner when state=call", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/Button.tsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Editing /Button.tsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeDefined();
  expect(document.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when state=partial-call", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/old.tsx" }}
      state="partial-call"
    />
  );
  expect(screen.getByText("Deleting /old.tsx")).toBeDefined();
  expect(document.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge falls back to toolName for unknown tool", () => {
  render(
    <ToolCallBadge
      toolName="custom_tool"
      args={{}}
      state="result"
    />
  );
  expect(screen.getByText("custom_tool")).toBeDefined();
});
