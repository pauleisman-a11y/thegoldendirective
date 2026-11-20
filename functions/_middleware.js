// Cloudflare Web Analytics beacon injection (SITE VISIBILITY, 2026-11-19)
// Adds the Web Analytics snippet to every HTML page response. No page content changes.
const SNIPPET = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "0d51b02f136848238c6c6798628607e2"}'></script><!-- End Cloudflare Web Analytics -->`;

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  return new HTMLRewriter()
    .on('body', {
      element(el) {
        el.append(SNIPPET, { html: true });
      },
    })
    .transform(response);
}
