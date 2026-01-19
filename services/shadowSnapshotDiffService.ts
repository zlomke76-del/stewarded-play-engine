import fs from "fs";
import path from "path";

/* ------------------------------------------------------------
   Types
------------------------------------------------------------ */

export type SnapshotDiff = {
  fromSnapshot: string;
  toSnapshot: string;
  added: string[];
  modified: string[];
  removed: string[];
};

/* ------------------------------------------------------------
   Diff service
------------------------------------------------------------ */

export default class ShadowSnapshotDiffService {
  private snapshotRoot: string;

  constructor(snapshotRoot: string) {
    this.snapshotRoot = path.resolve(snapshotRoot);
  }

  /* ------------------------------------------------------------
     PUBLIC API (AUTHORITATIVE)
  ------------------------------------------------------------ */

  computeDiff(toSnapshot: string): SnapshotDiff {
    const snapshots = this.listSnapshots();

    const toIndex = snapshots.indexOf(toSnapshot);
    const fromSnapshot =
      toIndex > 0 ? snapshots[toIndex - 1] : null;

    if (!fromSnapshot) {
      return {
        fromSnapshot: "NONE",
        toSnapshot,
        added: this.listAllFiles(toSnapshot),
        modified: [],
        removed: [],
      };
    }

    return this.diffSnapshots(fromSnapshot, toSnapshot);
  }

  /* ------------------------------------------------------------
     Internal helpers
  ------------------------------------------------------------ */

  private listSnapshots(): string[] {
    if (!fs.existsSync(this.snapshotRoot)) return [];

    return fs
      .readdirSync(this.snapshotRoot)
      .filter(s =>
        fs.statSync(path.join(this.snapshotRoot, s)).isDirectory()
      )
      .sort();
  }

  private diffSnapshots(
    fromSnapshot: string,
    toSnapshot: string
  ): SnapshotDiff {
    const fromFiles = this.fileMap(fromSnapshot);
    const toFiles = this.fileMap(toSnapshot);

    const added: string[] = [];
    const modified: string[] = [];
    const removed: string[] = [];

    for (const file of Object.keys(toFiles)) {
      if (!fromFiles[file]) {
        added.push(file);
      } else if (fromFiles[file] !== toFiles[file]) {
        modified.push(file);
      }
    }

    for (const file of Object.keys(fromFiles)) {
      if (!toFiles[file]) {
        removed.push(file);
      }
    }

    return {
      fromSnapshot,
      toSnapshot,
      added,
      modified,
      removed,
    };
  }

  private fileMap(snapshotId: string): Record<string, string> {
    const root = path.join(this.snapshotRoot, snapshotId);
    const map: Record<string, string> = {};

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(root, full);

        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          const stat = fs.statSync(full);
          map[rel] = `${stat.size}:${stat.mtimeMs}`;
        }
      }
    };

    walk(root);
    return map;
  }

  private listAllFiles(snapshotId: string): string[] {
    const root = path.join(this.snapshotRoot, snapshotId);
    const files: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(root, full);

        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          files.push(rel);
        }
      }
    };

    walk(root);
    return files;
  }
}
