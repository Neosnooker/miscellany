export class FileReader {
  private readonly directoryPath: string;
  private fsWatcher?: Deno.FsWatcher;
  private record: Record<string, string>;

  private joinPath = (...s: string[]) => {
    return s.map((str) => str.startsWith("/") ? str.slice(1) : str).map((
      str,
    ) => str.endsWith("/") ? str.slice(0, -1) : str).join("/");
  };

  constructor(directoryPath: string, checkUpdates: boolean = false) {
    this.directoryPath = directoryPath;

    if (checkUpdates) {
      this.initializeFsWatcher();
    }

    this.record = {};

    const recursive = (parentPath: string) => {
      for (const entry of Deno.readDirSync(parentPath)) {
        if (entry.isDirectory) {
          recursive(this.joinPath(parentPath, entry.name));
        } else if (entry.isFile) {
          const currentPath = this.joinPath(parentPath, entry.name);
          const content = Deno.readFileSync(currentPath);
          this.record[currentPath.slice(directoryPath.length)] =
            new TextDecoder().decode(content);
        }
      }
    };

    recursive(directoryPath);
  }

  handleFileModification(path: string) {
    try {
      const newContent = Deno.readFileSync(
        this.joinPath(this.directoryPath, path),
      );
      this.record[path] = new TextDecoder().decode(newContent);
    } catch {
      // Empty.
    }
  }

  handleFileDeletion(path: string) {
    delete this.record[path.slice(this.directoryPath.length)];
  }

  async initializeFsWatcher() {
    this.fsWatcher = Deno.watchFs(this.directoryPath);

    for await (const event of this.fsWatcher) {
      const path =
        event.paths.join("/").split(this.joinPath(this.directoryPath))[1];
      switch (event.kind) {
        case "remove":
          this.handleFileDeletion(path);
          break;
        case "create":
        case "modify":
          this.handleFileModification(path);
          break;
        default:
          break;
      }
    }
  }

  getWhatToServe(fileName: string) {
    return this.record[fileName];
  }
}
