import * as p from "https://deno.land/std@0.170.0/path/mod.ts";
import { ContentStatus } from "./ContentStatus.ts";

export class ContentManager {
  configuration;
  record: Record<string, string> = {};

  constructor(configuration: {
    watchFs: boolean;
    path: string;
    assumeHtmlIfExtensionIsAbsent: boolean;
  }) {
    this.configuration = configuration;
    this.initialize();
  }

  initialize() {
    // Use lstat to check if path resolves to a folder
    // or not.
    // This also checks whether the file exists.
    const path = this.configuration.path;
    const lstat: Deno.FileInfo = Deno.lstatSync(path);

    if (!lstat.isDirectory) {
      throw new Error("The provided path does not resolve to a directory.");
    }

    // Check for content inside the resolved directoryfirst.
    const recursiveRead = (path: string, isFile?: boolean) => {
      try {
        const isIndeedFile = isFile ?? Deno.lstatSync(path).isFile;
        if (isIndeedFile) {
          const content = Deno.readTextFileSync(path);
          const normalizedPath = p.relative(this.configuration.path, path);
          // Path does not seem to be prefixed with '/'.
          this.record["/" + normalizedPath] = content;
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

    recursiveRead(this.configuration.path);

    // Create a filesystem watcher if the server should watch the filesystem.
    if (this.configuration.watchFs) {
      this.registerFsWatcher(path);
    }
  }

  async registerFsWatcher(path: string) {
    const fsWatcher = Deno.watchFs(path);

    for await (const fsEvent of fsWatcher) {
      fsEvent.paths;
      switch (fsEvent.kind) {
        case "create":
        case "modify":
          this.handleFsModification(fsEvent);
          break;
        case "remove":
          this.handleFsRemoval(fsEvent);
          break;
        default:
          // Do nothing.
          break;
      }
    }
  }

  private getPath(fsEvent: Deno.FsEvent) {
    return fsEvent.paths.slice(fsEvent.paths.indexOf(".")).join("/");
  }

  handleFsModification(fsEvent: Deno.FsEvent): void {
    const path = this.getPath(fsEvent);
    try {
      const content = Deno.readTextFileSync(path);
      this.record[path] = content;
    } catch {
      // Empty.
    }
  }

  handleFsRemoval(fsEvent: Deno.FsEvent) {
    delete this.record[this.getPath(fsEvent)];
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
      const pathToReturn: string | undefined = o.filter((a) =>
        a[1] == false
      )[0][0] ??
        (o.length == 1 ? o[0][0] : undefined);

      if (pathToReturn) {
        return {
          "status": ContentStatus.OK,
          "content": this.record[pathToReturn],
          "contentExtension": p.extname(pathToReturn).slice(1),
        };
      } else {
        return {
          "status": ContentStatus.INTERNAL_SERVER_ERROR,
          "content":
            "Record has no case sensitive match of the provided URL path, and there are multiple case insensitive matches.",
        };
      }
    }

    return {
      "status": ContentStatus.NOT_FOUND,
      "content": "Content not found.",
    };
  }
}
