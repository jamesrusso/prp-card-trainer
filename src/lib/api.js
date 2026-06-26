/* Supabase data + auth helpers. */
import { supabase } from "../supabaseClient.js";
import { rowToCard, cardToRow, cleanSteps } from "./cards.js";
import fallback from "../data/cards.json";

/** Public read of the deck (ordered). Falls back to the bundled deck if Supabase isn't configured. */
export async function fetchCards() {
  if (!supabase) return fallback.cards.map((c, i) => ({ ...c, id: "local-" + i }));
  const { data, error } = await supabase.from("cards").select("*").order("position", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToCard);
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_e, s) => cb(s));
  return () => data.subscription.unsubscribe();
}
export async function sendMagicLink(email) {
  if (!supabase) throw new Error("Supabase not configured");
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
}
export async function signOut() {
  if (supabase) await supabase.auth.signOut();
}
/** True only if the signed-in user's email is on the editors allow-list (enforced server-side by RLS). */
export async function isEditor() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("is_editor");
  if (error) return false;
  return !!data;
}

/** Update one existing card's content (not its position). Used by the in-quiz quick edit. */
export async function saveCard(card) {
  if (!supabase) throw new Error("Supabase not configured");
  if (!card.id || String(card.id).startsWith("local-"))
    throw new Error("This card isn't in the cloud yet — add it from the Editor first.");
  const row = {
    eyebrow: (card.eyebrow || "").trim(),
    title: (card.title || "").trim(),
    subtitle: (card.subtitle || "").trim(),
    two_col: !!card.columns,
    steps: cleanSteps(card.steps),
  };
  const { error } = await supabase.from("cards").update(row).eq("id", card.id);
  if (error) throw error;
  return rowToCard({ id: card.id, ...row });
}

/** Persist the full deck: update existing rows, insert new ones, delete removed ones, renumber positions. */
export async function saveDeck(cards, removedIds = []) {
  if (!supabase) throw new Error("Supabase not configured");
  const ops = cards.map((c, i) => {
    const row = cardToRow(c, i + 1);
    return c.id && !String(c.id).startsWith("local-")
      ? supabase.from("cards").update(row).eq("id", c.id)
      : supabase.from("cards").insert(row);
  });
  for (const id of removedIds) ops.push(supabase.from("cards").delete().eq("id", id));
  const results = await Promise.all(ops);
  const failed = results.find(r => r.error);
  if (failed) throw failed.error;
  return fetchCards();
}
