import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "../app/chatgpt-auth";

export function ownsLab(user: ChatGPTUser | null): boolean {
  const ownerId = env.PRODUCT_LAB_OWNER_ID?.trim();
  return Boolean(ownerId && user?.userId === ownerId);
}

export async function isOwner(): Promise<boolean> {
  return ownsLab(await getChatGPTUser());
}
