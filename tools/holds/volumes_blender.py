"""Parametric climbing volumes, exported as GLBs for the editor.

Runs inside Blender headless:
  /Applications/Blender.app/Contents/MacOS/Blender --background --python volumes_blender.py

Three families, referenced from real gym volumes:
- tetra: asymmetric four-vertex pyramids (Granito style)
- rail: coffin-profile frustum rails (flat top, beveled sides)
- star: three-winged pyramids (star footprint, raised apex)

Convention matches the hold pipeline: footprint centered in XY, base at z=0,
protrusion toward +Z (export_yup=False keeps Blender axes in the GLB).
Original crimp-studio assets, no external license.
"""

import json
import math
from pathlib import Path

import bmesh
import bpy

HERE = Path(__file__).parent
OUT_DIR = (HERE / ".." / ".." / "apps" / "web" / "public" / "models" / "holds" / "volume").resolve()
VOLUMES_JSON = HERE / "volumes.json"


def tetra(base_points, apex):
    """Asymmetric tetrahedron: triangle base on the wall plus an offset apex."""
    verts = [(x, y, 0.0) for x, y in base_points] + [apex]
    faces = [(0, 1, 2), (0, 1, 3), (1, 2, 3), (2, 0, 3)]
    return verts, faces


def rail(width, length, inset, height):
    """Coffin-profile frustum: base rectangle, inset flat top, sloped sides."""
    hw, hl = width / 2, length / 2
    tw, tl = hw - inset, hl - inset
    verts = [
        (-hw, -hl, 0.0), (hw, -hl, 0.0), (hw, hl, 0.0), (-hw, hl, 0.0),
        (-tw, -tl, height), (tw, -tl, height), (tw, tl, height), (-tw, tl, height),
    ]
    faces = [
        (0, 1, 2, 3), (4, 5, 6, 7),
        (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7),
    ]
    return verts, faces


def ramp(width, length, height):
    """Doorstop wedge: full-height ridge at one end sloping to nothing."""
    hw, hl = width / 2, length / 2
    verts = [
        (-hw, -hl, 0.0), (hw, -hl, 0.0), (hw, hl, 0.0), (-hw, hl, 0.0),
        (-hw, -hl, height), (hw, -hl, height),
    ]
    faces = [
        (0, 1, 2, 3),          # base
        (0, 1, 5, 4),          # tall end
        (4, 5, 2, 3),          # slope
        (0, 3, 4), (1, 2, 5),  # sides
    ]
    return verts, faces


VARIANTS = [
    ("vol_tetra_tall", *tetra([(-0.16, -0.42), (0.16, -0.42), (0.05, 0.42)], (0.02, -0.05, 0.22))),
    ("vol_tetra_squat", *tetra([(-0.30, -0.26), (0.30, -0.26), (0.0, 0.30)], (0.05, 0.0, 0.28))),
    ("vol_tetra_ridge", *tetra([(-0.42, -0.30), (0.42, -0.30), (-0.05, 0.34)], (0.10, -0.02, 0.18))),
    ("vol_rail_long", *rail(0.34, 1.15, 0.10, 0.17)),
    ("vol_ramp", *ramp(0.36, 1.0, 0.24)),
    ("vol_box", *rail(0.62, 0.62, 0.12, 0.20)),
]


def build_and_export(name, verts, faces):
    bpy.ops.wm.read_factory_settings(use_empty=True)

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], list(faces))
    mesh.validate()

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)

    out_path = OUT_DIR / f"{name}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(out_path),
        export_format="GLB",
        export_yup=False,
    )

    bbox = list(zip(*[v for v in verts]))
    size = [
        round(max(axis) - min(axis), 4)
        for axis in bbox
    ]
    return {
        "variant": name,
        "path": f"/models/holds/volume/{name}.glb",
        "pack": "crimp-studio",
        "faces": len(mesh.polygons),
        "sizeMeters": size,
        "fileBytes": out_path.stat().st_size,
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    entries = [build_and_export(name, verts, faces) for name, verts, faces in VARIANTS]
    VOLUMES_JSON.write_text(json.dumps(entries, indent=2))
    print(f"exported {len(entries)} volumes to {OUT_DIR}")
    print(f"wrote {VOLUMES_JSON}")


main()
