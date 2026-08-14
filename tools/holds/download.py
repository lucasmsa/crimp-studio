"""Download hold STLs listed in manifest.json from the Printables API.

Idempotent: files already present in raw/ with the expected size are skipped.
Usage: python3 download.py
"""

import json
import sys
import urllib.request
from pathlib import Path

API = "https://api.printables.com/graphql/"
HERE = Path(__file__).parent
RAW_DIR = HERE / "raw"

DOWNLOAD_LINK_MUTATION = """
mutation($id: ID!, $printId: ID!, $fileType: DownloadFileTypeEnum!, $source: DownloadSourceEnum!) {
  getDownloadLink(id: $id, printId: $printId, fileType: $fileType, source: $source) {
    ok
    errors { field messages }
    output { link ttl }
  }
}
"""


def gql(query: str, variables: dict) -> dict:
    payload = json.dumps({"query": query, "variables": variables}).encode()
    req = urllib.request.Request(
        API,
        data=payload,
        headers={
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0 (crimp-studio holds pipeline)",
            "origin": "https://www.printables.com",
            "referer": "https://www.printables.com/",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = json.load(resp)
    if body.get("errors"):
        raise RuntimeError(body["errors"])
    return body["data"]


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"user-agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as resp, open(dest, "wb") as f:
        while chunk := resp.read(1 << 20):
            f.write(chunk)


def main() -> int:
    manifest = json.loads((HERE / "manifest.json").read_text())
    RAW_DIR.mkdir(exist_ok=True)

    files = manifest["files"]
    for i, entry in enumerate(files, 1):
        dest = RAW_DIR / entry["holdType"] / entry["file"]
        dest.parent.mkdir(exist_ok=True)
        if dest.exists() and dest.stat().st_size > 0:
            print(f"[{i}/{len(files)}] {entry['file']} already present, skipping")
            continue

        data = gql(
            DOWNLOAD_LINK_MUTATION,
            {
                "id": entry["fileId"],
                "printId": entry["printId"],
                "fileType": "stl",
                "source": "model_detail",
            },
        )["getDownloadLink"]
        if not data["ok"]:
            print(f"[{i}/{len(files)}] {entry['file']} FAILED: {data['errors']}")
            return 1

        print(f"[{i}/{len(files)}] {entry['file']} ...")
        download(data["output"]["link"], dest)
        print(f"[{i}/{len(files)}] {entry['file']} done ({dest.stat().st_size / 1e6:.1f} MB)")

    print("all files downloaded")
    return 0


if __name__ == "__main__":
    sys.exit(main())
