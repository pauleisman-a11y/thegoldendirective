// Cloudflare Pages Function: /feed proxies the Mac's Genesis feed.
// The xo.je host gates first-time requests behind a redirect + cookie
// step (?i=1) that a plain edge fetch does not complete on its own, so
// this follows one redirect manually, carrying any Set-Cookie it was
// given, and only then reads the JSON. If the upstream still does not
// return a usable packet, this answers 502 with the upstream status
// and content type (no upstream body) so the failure can be diagnosed,
// and the page keeps its canned snapshot.
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
    const first = await fetch("https://thegoldendirective.xo.je/feed.php", {
      redirect: "manual",
      headers: { Accept: "application/json" },
    });
    let res = first;
    if (first.status >= 300 && first.status < 400) {
      const location = first.headers.get("location");
      const cookie = first.headers.get("set-cookie");
      if (location) {
        const url = new URL(location, "https://thegoldendirective.xo.je/feed.php").href;
        res = await fetch(url, {
          redirect: "manual",
          headers: {
            Accept: "application/json",
            ...(cookie ? { Cookie: cookie.split(";")[0] } : {}),
          },
        });
      }
    }
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
