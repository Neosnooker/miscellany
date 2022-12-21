import { CommonMIMETypes } from "./CommonMIMETypes.ts";
import { ContentManager } from "./ContentManager.ts";
import { WebserverConfiguration } from "./WebserverConfiguration.ts";

export async function launchWebserver(
  port: number,
  configuration: Partial<WebserverConfiguration>,
) {
  const actualConfiguration = Object.assign({
    "watchFs": true,
    "assumeHtmlIfExtensionIsAbsent": true,
    "contentPath": [[".", "/"]],
    "specialPages": {
      "notFoundFilename": "404.html",
    },
  } as WebserverConfiguration, configuration);

  const server = Deno.listen({ port: port });

  const contentMan = new ContentManager({
    watchFs: actualConfiguration.watchFs,
    paths: actualConfiguration.contentPath,
    assumeHtmlIfExtensionIsAbsent:
      actualConfiguration.assumeHtmlIfExtensionIsAbsent,
  });

  // Connections to the server will be yielded up as an async iterable.
  for await (const conn of server) {
    serveHttp(conn);
  }

  async function serveHttp(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);

    for await (const requestEvent of httpConn) {
      const url = new URL(requestEvent.request.url);

      const body = contentMan.serveContent(
        url.pathname,
      );

      requestEvent.respondWith(
        new Response(body.content, {
          "status": body.status,
          "headers": {
            "Content-Type": CommonMIMETypes[
              (body.contentExtension ?? "TXT").toUpperCase()
                .toUpperCase() as keyof typeof CommonMIMETypes
            ],
          },
        }),
      );
    }
  }
}
