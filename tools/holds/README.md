# Holds pipeline

Fetches climbing hold meshes from Jérémy LAFAYE's Printables packs (generated with
[BHToolset](https://github.com/JeremSparte/BHToolset)) and converts them into
web-ready GLBs for the editor.

All packs are licensed Creative Commons Attribution Share-Alike. Converted GLBs keep
that license; attribution ships in `apps/web/public/models/holds/holds-manifest.json`.
The BHToolset itself is MIT and is not vendored here.

## Usage

```bash
cd tools/holds
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

python3 download.py          # ~390 MB of STLs into raw/ (gitignored), idempotent
.venv/bin/python convert.py  # GLBs into apps/web/public/models/holds/
```

## What convert.py does per mesh

1. Decimate to ~5000 faces (raw print STLs are 100k+ faces).
2. Fix face winding (`trimesh.repair.fix_normals`); without it front faces get culled
   and holds render see-through.
3. Scale mm to m (print STLs are mm; the scene uses meters).
4. Center in XY, translate min Z to 0 so the wall-mount face sits flush and the hold
   protrudes toward +Z. Same convention as `flushBackFace` in `holdGeometry.ts`.
5. Export GLB with vertex normals (`include_normals=True`); without them
   normal-dependent lights (hemisphere) render the mesh black and shading looks flat.
6. Record real-world dimensions in `holds-manifest.json`.

GLBs are uncompressed (~100-200 KB each, lazy-loaded per variant). If total weight
becomes a problem, add a draco pass and configure the decoder path in `useGLTF`.

## Volumes

Volume GLBs are original assets generated parametrically in Blender (no external
license), three families: asymmetric tetras, coffin-profile rails, three-winged
stars. Regenerate with:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --python volumes_blender.py
.venv/bin/python convert.py --codegen-only   # merges volumes.json into manifest + TS
```

## Changing the selection

`manifest.json` lists which files to pull per hold type. File ids come from the
Printables GraphQL API (`https://api.printables.com/graphql/`, anonymous access):
query `userModels(userId: "2080610")`, then `print(id:) { stls { id name fileSize } }`,
then mutation `getDownloadLink(id, printId, fileType: stl, source: model_detail)`.
