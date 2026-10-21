// Cloudflare Pages Function: /feed serves the Mac's Genesis feed from R2.
// The Mac publisher writes feed.json to the public R2 bucket every 30s
// (alongside the unchanged xo.je FTPS upload), so this fetches the bucket
// object directly — no host challenge, no redirect or cookie handling.
// If R2 does not return a usable packet, this answers 502 with the
// upstream status and content type (no upstream body) so the failure
// can be diagnosed, and the page keeps its canned snapshot.
export async function onRequest() {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };
  const fail = (upstreamStatus, upstreamType) =>
    new Response(
      JSON.stringify({ error: "feed unavailable", upstreamStatus, upstreamType }),
      { status: 502, headers }
    );
  try {
    const res = await fetch("https://pub-319afbd637e44b54a4412226d4f651ef.r2.dev/feed.json", {
      headers: { Accept: "application/json" },
    });
    const type = res.headers.get("content-type") || "";
    if (!type.includes("json")) {
      return fail(res.status, type);
    }
    const data = await res.json();
    if (!data || !data.tick) {
      return fail(res.status, type);
    }
    return new Response(JSON.stringify(data), { headers });
  } catch (e) {
    return fail(null, null);
  }
}
