import fs from "fs";
import path from "path";
import crypto from "crypto";

type SnapshotManifest = {
  snapshotId: string;
  createdAt: string;
  fileCount: number;
  totalBytes: number;
  files: Record<
    string,
    {
      hash: string;
      size: number;
    }
  >;
};

export default class ShadowSnapshotService {
  private shadowRepoPath: string;
  private snapshotRoot: string;
  private ignored: Set<string>;

  constructor(shadowRepoPath: string, ignored?: string[]) {
    this.shadowRepoPath = path.resolve(shadowRepoPath);
    this.snapshotRoot = path.join(this.shadowRepoPath, ".snapshots");
    this.ignored = new Set(
      ignored ?? [".git", ".snapshots", "node_modules", "dist", "build", ".next"]
    );

    if (!fs.existsSync(this.snapshotRoot)) {
      fs.mkdirSync(this.snapshotRoot, { recursive: true });
    }
  }

  /* ------------------------------------------------------------
     Public API
  ------------------------------------------------------------ */

  createSnapshot(): SnapshotManifest {
    const snapshotId = new Date().toISOString();
    const snapshotPath = path.join(this.snapshotRoot, snapshotId);
    const treePath = path.join(snapshotPath, "tree");

    fs.mkdirSync(treePath, { recursive: true });

    const manifest: SnapshotManifest = {
      snapshotId,
      createdAt: snapshotId,
      fileCount: 0,
      totalBytes: 0,
      files: {},
    };

    this.walkAndCopy(
      this.shadowRepoPath,
      treePath,
      manifest,
      this.shadowRepoPath
    );

    const manifestPath = path.join(snapshotPath, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    return manifest;
  }

  /* ------------------------------------------------------------
     Internal
  ------------------------------------------------------------ */

  private walkAndCopy(
    srcRoot: string,
    destRoot: string,
    manifest: SnapshotManifest,
    basePath: string
  ): void {
    const entries = fs.readdirSync(srcRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (this.ignored.has(entry.name)) continue;

      const srcPath = path.join(srcRoot, entry.name);
      const relPath = path.relative(basePath, srcPath);
      const destPath = path.join(destRoot, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        this.walkAndCopy(srcPath, destPath, manifest, basePath);
      } else if (entry.isFile()) {
        const buffer = fs.readFileSync(srcPath);
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");

        fs.writeFileSync(destPath, buffer);

        manifest.fileCount += 1;
        manifest.totalBytes += buffer.length;
        manifest.files[relPath] = {
          hash,
          size: buffer.length,
        };
      }
    }
  }
}
