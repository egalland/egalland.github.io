export type AppTransport = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type LocalDraft = { scope: "market" | "analyst"; ownerId: string; data: Record<string, unknown> };
export type LocalDraftBridge = {
  read: (scope: LocalDraft["scope"], ownerId: string, meetingDate?: string) => LocalDraft | null;
  write: (draft: LocalDraft) => void;
  pending?: (key: string, pending: boolean) => void;
  readPreference?: (key: string) => string | undefined;
  writePreference?: (key: string, value: string) => void;
  openFiles?: () => void;
  saveFile?: (saveAs?: boolean) => Promise<boolean>;
};

export * from "../offline/app-transport";
