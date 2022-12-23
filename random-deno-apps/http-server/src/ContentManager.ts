import * as p from "https://deno.land/std@0.170.0/path/mod.ts";
import { ContentStatus } from "./ContentStatus.ts";

export class ContentManager {
  configuration;
  record: Record<string, string | Uint8Array> = {};

  constructor(configuration: {
    watchFs: boolean;
    paths: string | [string, string] | [string, string][];
    assumeHtmlIfExtensionIsAbsent: boolean;
  }) {
    this.configuration = configuration;
    this.initialize();
  }

  initialize() {
    const paths = this.configuration.paths;

    // Check if there is duplicate routes.
    if (paths instanceof Array && paths[0] instanceof Array) {
      const ps2 = (paths as Array<[string, string]>).map((e) => e[1]);
      const filteredArray = ps2.filter((route, _i, array) =>
        !(array.filter((s) => s.includes(route) && p.common([s, route])))
      );

      if (filteredArray.length > 0) {
        throw new Error("Possible duplicate route is found.");
      }
    }

    const normalizedPaths =
      (typeof paths == "string"
        ? [[paths, "/"]]
        : (paths instanceof Array && !(paths[0] instanceof Array)
          ? [paths]
          : paths)) as [string, string][];

    // Use lstat to check if path resolves to a folder
    // or not.
    // This also checks whether the file exists.
    normalizedPaths.forEach((path) => {
      const contentPath = path[0], route = path[1];
      const lstat = Deno.lstatSync(contentPath);

      if (!lstat.isDirectory) {
        console.warn(
          new Error(
            "The content path '" + contentPath +
              "' does not resolve to a directory.",
          ),
        );
        return;
      }

      // Check for content inside the resolved directoryfirst.
      const recursiveRead = (path: string, isFile?: boolean) => {
        try {
          const isIndeedFile = isFile ?? Deno.lstatSync(path).isFile;
          if (isIndeedFile) {
            const content = Deno.readFileSync(path);
            const pathToSet = p.join(route, p.relative(contentPath, path));
            this.record[pathToSet] = content;
          } else {
            const dirEntries = Deno.readDirSync(path);
            for (const entry of dirEntries) {
              recursiveRead(p.join(path, entry.name), entry.isFile);
            }
          }
        } catch {
          // Empty.
        }
      };

      recursiveRead(contentPath);
    });

    // Create a filesystem watcher if the server should watch the filesystem.
    if (this.configuration.watchFs) {
      this.registerFsWatcher(normalizedPaths);
    }
  }

  registerFsWatcher(paths: [string, string][]) {
    paths.forEach(async (path) => {
      const fsWatcher = Deno.watchFs(path[0]);

      for await (const fsEvent of fsWatcher) {
        switch (fsEvent.kind) {
          case "create":
          case "modify":
            this.handleFsModification(path[1], fsEvent, path[0]);
            break;
          case "remove":
            this.handleFsRemoval(path[1], fsEvent, path[0]);
            break;
          default:
            // Do nothing.
            break;
        }
      }
    });
  }

  private getPath(fsEvent: Deno.FsEvent, contentPath: string) {
    const path = fsEvent.paths.join("/");
    return path.slice(path.indexOf(contentPath));
  }

  handleFsModification(
    route: string,
    fsEvent: Deno.FsEvent,
    contentPath: string,
  ): void {
    const path = this.getPath(fsEvent, contentPath);
    try {
      const content = Deno.readFileSync(path);
      const pathToSet = p.join(route, path);

      this.record[pathToSet] = content;
    } catch {
      // Empty.
    }
  }

  handleFsRemoval(route: string, fsEvent: Deno.FsEvent, contentPath: string) {
    delete this.record[p.join(route, this.getPath(fsEvent, contentPath))];
  }

  serveContent(urlPath: string) {
    let normalizedUrlPath = urlPath;
    /**
     * The second boolean represents whether the path is a case insensitive
     * match.
     */
    const pathsMatching: Record<string, boolean> = {};

    if (
      !p.extname(urlPath) && this.configuration.assumeHtmlIfExtensionIsAbsent
    ) {
      normalizedUrlPath += ".html";
    }

    for (const path in this.record) {
      if (path.length != normalizedUrlPath.length) continue;

      const pathArray = path.split("/"),
        urlPathArray = normalizedUrlPath.split("/");

      if (pathArray.length != urlPathArray.length) continue;

      let match = true, caseIs = false;

      for (let i = 0; i < pathArray.length; i += 1) {
        if (pathArray[i] != urlPathArray[i]) {
          if (pathArray[i].toLowerCase() == urlPathArray[i]) {
            caseIs = true;
          } else {
            match = false;
            break;
          }
        }
      }

      if (match) {
        pathsMatching[path] = caseIs;
      }
    }

    const o = Object.entries(pathsMatching);

    if (o.length > 0) {
      const caseSensitiveMatch = o.filter((a) => a[1] == false)[0];
      const pathToReturn: string | undefined = caseSensitiveMatch
        ? caseSensitiveMatch[0]
        : (o.length == 1 ? o[0][0] : undefined);

      if (pathToReturn) {
        return {
          "status": ContentStatus.OK,
          "content": this.record[pathToReturn],
          "contentExtension": p.extname(pathToReturn).slice(1),
        };
      }

      return {
        "status": ContentStatus.INTERNAL_SERVER_ERROR,
        "content":
          "Record has no case sensitive match of the provided URL path, and there are multiple case insensitive matches.",
      };
    }

    return {
      "status": ContentStatus.NOT_FOUND,
      "content": "Content not found.",
    };
  }
}
