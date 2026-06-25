import { fetchHistory } from '$lib/api-client';

const PARAMS = ['ec', 'ph', 'water_temp_c', 'water_level_pct'];

export async function load({ params, url }) {
  const param = PARAMS.includes(url.searchParams.get('param')) ? url.searchParams.get('param') : 'ec';
  try {
    const data = await fetchHistory(params.zoneId, param);
    return { zoneId: params.zoneId, param, points: data.points ?? [], params: PARAMS };
  } catch (err) {
    console.error('history load failed:', err.message);
    return { zoneId: params.zoneId, param, points: [], params: PARAMS };
  }
}
