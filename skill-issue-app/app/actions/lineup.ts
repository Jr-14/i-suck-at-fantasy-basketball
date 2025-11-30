"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addPlayerToLineup,
  createLineup,
  removePlayerFromLineup,
} from "@/db/queries";
import { fetchPlayerGameLogs, fetchPlayerIndex } from "@/lib/nba-api";

function parsePlayerId(formData: FormData) {
  const value = formData.get("playerId");
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseLineupId(formData: FormData) {
  const value = formData.get("lineupId");
  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function addPlayerToLineupAction(formData: FormData) {
  const playerId = parsePlayerId(formData);
  const lineupId = parseLineupId(formData);
  if (!playerId || !lineupId) return;

  // Ensure base player data and game logs are cached + upserted before showing in lineup.
  await fetchPlayerIndex({ persistToDb: true });
  await fetchPlayerGameLogs(playerId);

  await addPlayerToLineup(lineupId, playerId);

  revalidatePath("/browse");
  revalidatePath("/lineup");
  revalidatePath("/lineups");
}

export async function removePlayerFromLineupAction(formData: FormData) {
  const playerId = parsePlayerId(formData);
  const lineupId = parseLineupId(formData);
  if (!playerId || !lineupId) return;

  await removePlayerFromLineup(lineupId, playerId);

  revalidatePath("/browse");
  revalidatePath("/lineup");
  revalidatePath("/lineups");
}

export async function createLineupAction(formData: FormData) {
  const name = formData.get("name");
  const value = typeof name === "string" ? name : "My lineup";
  const lineup = await createLineup(value);
  revalidatePath("/browse");
  revalidatePath("/lineup");
  revalidatePath("/lineups");
  return lineup;
}

export async function createLineupAndRedirectAction(formData: FormData) {
  const name = formData.get("name");
  const value = typeof name === "string" && name.trim().length > 0 ? name : "My lineup";
  const redirectTo = formData.get("redirectTo");
  const targetPath =
    typeof redirectTo === "string" && redirectTo.startsWith("/") ? redirectTo : "/lineup";

  const lineup = await createLineup(value);

  const url = new URL(`http://localhost${targetPath}`);
  url.searchParams.set("lineupId", String(lineup.id));

  redirect(url.pathname + url.search);
}
