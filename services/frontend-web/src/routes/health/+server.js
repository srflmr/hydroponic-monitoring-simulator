export async function GET() {
  const base = process.env.DASHBOARD_API_INTERNAL_URL || 'http://dashboard-api:3010';
  try {
    const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error('dashboard-api unhealthy');
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ status: 'unavailable' }), {
      status: 503, headers: { 'content-type': 'application/json' },
    });
  }
}
