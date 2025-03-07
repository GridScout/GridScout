import env from "@gridscout/env";
import { ok, type Result } from "@sapphire/result";

export default class GitHubAPI {
  baseUrl: string;
  apiKey: string;
  repository: string;

  constructor(baseUrl?: string, apiKey?: string, repository?: string) {
    this.baseUrl = baseUrl || "https://api.github.com";
    this.apiKey = apiKey || env.GITHUB_API_KEY;
    this.repository = repository || "f1db/f1db";
  }

  /**
   * Fetches the latest release from the given repository.
   * @returns {Promise<Result<Release, Error>>} The latest release.
   */
  async getLatestRelease(): Promise<Result<Release, Error>> {
    const response = await fetch(
      `${this.baseUrl}/repos/${this.repository}/releases/latest`,
      {
        headers: {
          Authorization: `token ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch latest release: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    return ok({
      tag_name: data.tag_name,
      sqlite_dl: data.assets.find(
        (asset: ReleaseAsset) =>
          asset.name.includes("f1db-sqlite") && asset.name.endsWith(".zip")
      ).browser_download_url,
    });
  }
}

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface Release {
  tag_name: string;
  sqlite_dl: string;
}
