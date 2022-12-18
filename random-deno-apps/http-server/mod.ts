import { ContentTypeByExtension } from "./servermodule/ContentType.ts";
import { FileReader } from "./servermodule/FileReader.ts";

const fileReader = new FileReader("./files", true);
const server = Deno.listen({ port: 8080 });

const serveHttp = async (conn: Deno.Conn) => {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    let pathname = new URL(requestEvent.request.url).pathname;

    if (pathname == "/" || !pathname) {
      pathname = "/index.html";
    }

    const body = fileReader.getWhatToServe(
      pathname,
    );

    if (body != undefined) {
      requestEvent.respondWith(
        new Response(body, {
          status: 200,
          headers: {
            "Content-Type": ContentTypeByExtension[
              pathname.split(".")
                .pop()! as keyof typeof ContentTypeByExtension
            ] ?? "text/plain",
          },
        }),
      );
    } else {requestEvent.respondWith(
        new Response("The requested file could not be found.", {
          status: 404,
        }),
      );}
  }
};

console.debug(`HTTP webserver running.  Access it at:  http://localhost:8080/`);

for await (const conn of server) {
  serveHttp(conn);
}
