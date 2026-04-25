const PRIMARY_HOST = "zo2y.com";
const WWW_HOST = "www.zo2y.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === WWW_HOST) {
    url.hostname = PRIMARY_HOST;
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
