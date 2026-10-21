// Cloudflare Pages Function: /feed proxies the Mac's Genesis feed.
// The xo.je host's browser check blocks a fresh visitor's cross-origin
// fetch from pages.dev, so the edge fetches feed.php server-side and
// returns the JSON. If the upstream does not return a usable packet,
// this answers 502 and the page keeps its canned snapshot.
export async function onRequest() {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  };
  try {
    const upstream = await fetch("https://thegoldendirective.xo.je/feed.php", {
      headers: { Accept: "application/json" },
    });
    const data = JSON.parse(await upstream.text());
    if (!data || !data.tick) {
      return new Response(JSON.stringify({ error: "bad upstream packet" }), {
        status: 502,
        headers,
      });
    }
    return new Response(JSON.stringify(data), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: "feed unavailable" }), {
      status: 502,
      headers,
    });
  }
}
