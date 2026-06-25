import { fetchHistory } from '$lib/api-client';
const SIGNALS = { ec: 'ec', ph: 'ph', temp: 'water_temp_c', level: 'water_level_pct' };

export async function load({ params }) {
  const entries = await Promise.all(
    Object.entries(SIGNALS).map(async ([key, apiParam]) => {
      try { const d = await fetchHistory(params.id, apiParam); return [key, (d.points || []).map((p) => p.value)]; }
      catch { return [key, []]; }
    })
  );
  return { id: params.id, history: Object.fromEntries(entries) };
}
