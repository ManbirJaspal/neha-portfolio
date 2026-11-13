# Builds the 3D assets for the site with Blender (bpy):
#   assets/phone.glb   a modelled phone: titanium body, back glass, camera island, buttons, screen
#   assets/studio.hdr  a studio lighting environment rendered in Cycles, used for reflections
# Run: python tools/blender/build_assets.py [--preview]
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets'); os.makedirs(OUT, exist_ok=True)
PREVIEW = '--preview' in sys.argv

# phone size in scene units (X width, Z height, Y depth; front faces -Y, which is +Z in glTF)
W, H, D = 1.56, 3.22, 0.172
CORNER, EDGE = 0.345, 0.05


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def mat(name, color, metallic=0.0, rough=0.5, emission=None, strength=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = rough
    if emission:
        b.inputs['Emission Color'].default_value = (*emission, 1)
        b.inputs['Emission Strength'].default_value = strength
    return m


def finish(bm, name, mats):
    me = bpy.data.meshes.new(name); bm.normal_update(); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    for m in mats: me.materials.append(m)
    mod = ob.modifiers.new('wn', 'WEIGHTED_NORMAL'); mod.keep_sharp = True; mod.weight = 60
    return ob


def slab(w, h, d, corner, edge, seg_c=22, seg_e=5):
    """Rounded-rectangle prism: corner radius in the XZ plane, small rounded edge front and back."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts: v.co.x *= w; v.co.y *= d; v.co.z *= h
    vert = [e for e in bm.edges if abs((e.verts[0].co - e.verts[1].co).normalized().y) > .99]
    bmesh.ops.bevel(bm, geom=vert, offset=corner, segments=seg_c, profile=.5, affect='EDGES', clamp_overlap=True)
    bm.normal_update(); bm.faces.ensure_lookup_table()
    if edge > 0:
        rim = set()
        for f in bm.faces:
            if abs(f.normal.y) > .99: rim.update(f.edges)
        bmesh.ops.bevel(bm, geom=list(rim), offset=edge, segments=seg_e, profile=.5, affect='EDGES', clamp_overlap=True)
        bm.normal_update()
    return bm


def move(bm, x=0, y=0, z=0):
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector((x, y, z)))


def rounded_plane(w, h, corner, seg=18):
    """Flat rounded rectangle in XZ facing -Y, with 0..1 UVs."""
    bm = bmesh.new(); pts = []
    for cx, cz, a0 in ((w / 2 - corner, h / 2 - corner, 0), (-w / 2 + corner, h / 2 - corner, 90), (-w / 2 + corner, -h / 2 + corner, 180), (w / 2 - corner, -h / 2 + corner, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg); pts.append((cx + math.cos(a) * corner, cz + math.sin(a) * corner))
    centre = bm.verts.new((0, 0, 0)); vs = [bm.verts.new((x, 0, z)) for x, z in pts]
    uv = bm.loops.layers.uv.new('UVMap')
    for i in range(len(vs)):
        f = bm.faces.new((centre, vs[i], vs[(i + 1) % len(vs)]))
        for l in f.loops: l[uv].uv = (l.vert.co.x / w + .5, l.vert.co.z / h + .5)
    return bm


def build_phone():
    reset()
    titanium = mat('Titanium', (0.42, 0.40, 0.44), metallic=1.0, rough=0.32)
    back = mat('BackGlass', (0.035, 0.03, 0.06), metallic=0.0, rough=0.18)
    black = mat('Black', (0.004, 0.004, 0.006), metallic=0.0, rough=0.35)
    lens = mat('Lens', (0.01, 0.01, 0.03), metallic=0.2, rough=0.04)
    screen = mat('Screen', (0.0, 0.0, 0.0), rough=0.1, emission=(1, 1, 1), strength=1.0)

    # body: sides are the titanium band, front and back flats are glass-black
    bm = slab(W, H, D, CORNER, EDGE)
    for f in bm.faces:
        f.material_index = 1 if f.normal.y > .99 else (2 if f.normal.y < -.99 else 0)
    finish(bm, 'Body', [titanium, back, black])

    # screen, set just proud of the front face with a thin bezel
    bz = 0.045
    bm = rounded_plane(W - 2 * bz, H - 2 * bz, CORNER - bz * .7); move(bm, y=-D / 2 - 0.0015)
    finish(bm, 'Screen', [screen])

    # buttons: power on the right; action, volume up, volume down on the left
    for x, z, h in ((W / 2 + .004, .42, .44), (-W / 2 - .004, .98, .15), (-W / 2 - .004, .62, .27), (-W / 2 - .004, .27, .27)):
        bm = slab(.03, h, .07, .014, .008, 4, 2); move(bm, x=x, z=z); finish(bm, 'Button', [titanium])

    # camera island on the back
    ix, iz = .34, H / 2 - .5
    bm = slab(.7, .7, .05, .2, .018, 16, 3); move(bm, x=ix, y=D / 2 + .018, z=iz); finish(bm, 'Island', [back])
    for dx, dz in ((-.16, .16), (-.16, -.16), (.16, 0)):
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=.135, radius2=.135, depth=.06)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
        bmesh.ops.bevel(bm, geom=[e for e in bm.edges if e.is_manifold and len(e.link_faces) == 2 and abs(e.calc_face_angle(0)) > 1], offset=.012, segments=3, affect='EDGES')
        move(bm, x=ix + dx, y=D / 2 + .058, z=iz + dz); finish(bm, 'LensRing', [titanium])
        bm = bmesh.new(); bmesh.ops.create_cone(bm, cap_ends=True, segments=40, radius1=.095, radius2=.095, depth=.012)
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'))
        move(bm, x=ix + dx, y=D / 2 + .09, z=iz + dz); finish(bm, 'LensGlass', [lens])
    # charging port
    bm = slab(.2, .03, .06, .012, 0, 6); move(bm, z=-H / 2 + .006); finish(bm, 'Port', [black])

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'phone.glb'), export_format='GLB', export_apply=True, export_yup=True)
    print('phone.glb', os.path.getsize(os.path.join(OUT, 'phone.glb')))


def emitter(name, size, loc, rot, color, strength, soft=True, edge=.62):
    """A softbox: an emissive plane whose light falls off smoothly toward its edges."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object; ob.name = name; ob.scale = (size[0], size[1], 1)
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs['Color'].default_value = (*color, 1); e.inputs['Strength'].default_value = strength
    if soft:
        tc = nt.nodes.new('ShaderNodeTexCoord'); sub = nt.nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'; sub.inputs[1].default_value = (.5, .5, 0)
        ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'
        mr = nt.nodes.new('ShaderNodeMapRange'); mr.interpolation_type = 'SMOOTHSTEP'
        mr.inputs['From Min'].default_value = .16; mr.inputs['From Max'].default_value = edge; mr.inputs['To Min'].default_value = strength; mr.inputs['To Max'].default_value = 0
        nt.links.new(tc.outputs['UV'], sub.inputs[0]); nt.links.new(sub.outputs[0], ln.inputs[0]); nt.links.new(ln.outputs['Value'], mr.inputs['Value']); nt.links.new(mr.outputs[0], e.inputs['Strength'])
    o = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], o.inputs[0]); ob.data.materials.append(m)
    return ob


def build_studio():
    """A dark studio: a large cool key, violet and warm strips, a ring of thin coloured tubes. Rendered as an equirect HDR."""
    reset(); sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 16 if PREVIEW else 64; sc.cycles.use_denoising = False
    sc.cycles.device = 'CPU'; sc.render.threads_mode = 'AUTO'
    # world: near-black violet, lifting slightly toward the floor
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); ramp = nt.nodes.new('ShaderNodeValToRGB')
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -1; mr.inputs['From Max'].default_value = 1
    ramp.color_ramp.elements[0].color = (0.05, 0.03, 0.13, 1); ramp.color_ramp.elements[1].color = (0.004, 0.003, 0.012, 1); ramp.color_ramp.elements[1].position = .55
    nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], mr.inputs['Value']); nt.links.new(mr.outputs[0], ramp.inputs[0]); nt.links.new(ramp.outputs[0], nt.nodes['Background'].inputs[0])
    R = math.radians
    emitter('key', (8, 4), (2.5, -5, 6), (R(55), 0, R(25)), (1.0, 0.98, 0.96), 16)          # big softbox, front top right
    emitter('fillL', (1.6, 10), (-7.5, -1.5, 1.5), (R(90), 0, R(-78)), (0.45, 0.36, 1.0), 16)  # violet strip, left
    emitter('rimR', (1.3, 10), (7.5, 2.5, 1.5), (R(90), 0, R(72)), (1.0, 0.60, 0.32), 14)      # warm strip, right back
    emitter('back', (12, 1.8), (0, 8, 3.5), (R(80), 0, R(180)), (0.45, 0.72, 1.0), 9)          # cool bar behind
    emitter('top', (5, 5), (0, 0, 9), (R(180), 0, 0), (1, 1, 1), 7, edge=.48)                            # overhead
    emitter('under', (12, 12), (0, 0, -7), (0, 0, 0), (0.5, 0.3, 1.0), 1.0, edge=.48)                      # violet glow from below
    tubes = ((20, (0.36, 0.30, 1.0), 9, 7), (62, (1, 1, 1), 5, 4), (118, (1.0, 0.35, 0.75), 7, 8), (150, (0.3, 0.6, 1.0), 6, 5),
             (205, (1, 0.8, 0.55), 6, 6), (248, (0.36, 0.30, 1.0), 8, 9), (290, (1, 1, 1), 4, 5), (332, (0.3, 0.85, 0.9), 5, 6))
    for i, (deg, col, strength, height) in enumerate(tubes):                                    # thin tubes all around
        a = R(deg); x, y = math.cos(a) * 10.5, math.sin(a) * 10.5
        emitter(f'tube{i}', (.16, height), (x, y, 1.0 + (i % 3) * .8), (R(90), 0, a + R(90)), col, strength * 6, soft=False)
    for i, (x, y, z) in enumerate(((-3.5, -6, 4.5), (5.5, -3, -1.5), (-5, 5, 5), (3, 6, -2))):  # small hot sparks
        ob = emitter(f'spark{i}', (.3, .3), (x, y, z), (0, 0, 0), (1, 1, 1), 90)
        ob.rotation_euler = Vector((x, y, z)).to_track_quat('Z', 'Y').to_euler()
    cam = bpy.data.cameras.new('c'); cam.type = 'PANO'
    try: cam.panorama_type = 'EQUIRECTANGULAR'
    except Exception: cam.cycles.panorama_type = 'EQUIRECTANGULAR'
    co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    co.rotation_euler = (R(90), 0, 0)
    sc.render.resolution_x, sc.render.resolution_y = (1024, 512) if PREVIEW else (2048, 1024)
    sc.render.image_settings.file_format = 'HDR'; sc.render.filepath = os.path.join(OUT, 'studio.hdr')
    bpy.ops.render.render(write_still=True)
    print('studio.hdr', os.path.getsize(os.path.join(OUT, 'studio.hdr')))


def preview_phone():
    """Cycles check render of the phone under the studio, front three-quarter and back."""
    reset(); sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=os.path.join(OUT, 'phone.glb'))
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 40; sc.cycles.use_denoising = False
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
    env = nt.nodes.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(OUT, 'studio.hdr'))
    nt.links.new(env.outputs[0], nt.nodes['Background'].inputs[0])
    cam = bpy.data.cameras.new('c'); cam.lens = 70; co = bpy.data.objects.new('c', cam); sc.collection.objects.link(co); sc.camera = co
    sc.render.resolution_x, sc.render.resolution_y = 520, 640; sc.render.image_settings.file_format = 'PNG'
    for name, pos in (('front', (4.2, -8.5, 1.2)), ('back', (-4.5, 8.5, 1.0))):
        co.location = pos; co.rotation_euler = (Vector((0, 0, 0)) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()
        sc.render.filepath = os.path.join(ROOT, 'tools', 'blender', f'preview-{name}.png'); bpy.ops.render.render(write_still=True)


if __name__ == '__main__':
    build_phone()
    build_studio()
    if PREVIEW: preview_phone()
