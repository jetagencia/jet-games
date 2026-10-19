# JETJump — configuración automática del proyecto de Unreal (ejecutar dentro del editor).
#
# Qué hace:
#   1. Busca el Skeletal Mesh del caballo y sus clips (idle, walk, trot, canter, gallop, jump).
#   2. Crea /Game/JETJump/BP_JetCaballo (hijo de JetHorsePawn) con esa malla y esos clips.
#   3. Crea /Game/JETJump/BP_JetGameMode (hijo de JetGameMode) con ese Pawn por defecto.
#   4. Pone BP_JetGameMode como GameMode del mapa abierto y como GameMode por defecto del proyecto.
#
# Cómo correrlo:
#   Edit → Plugins → activar "Python Editor Script Plugin" (viene con el motor, gratis) → reiniciar.
#   Abrir el mapa del juego. Tools → Execute Python Script → elegir este archivo.
#   O en la consola (Output Log, modo Python): py "C:/ruta/Setup_JETJump.py"
#
# Si el mesh o los clips se detectan mal, poné las rutas a mano en las variables de abajo.

import unreal

HORSE_MESH_PATH = ""      # ej. "/Game/Horse/SK_Horse.SK_Horse"; vacío = buscar
ANIM_PATHS = {            # ej. "walk": "/Game/Horse/Anims/A_Horse_Walk"; vacío = buscar por nombre
    "idle": "", "walk": "", "trot": "", "canter": "", "gallop": "", "jump": "", "refuse": "",
}
OUT_DIR = "/Game/JETJump"
KEYWORDS = {
    "idle": ["idle", "stand", "breath"],
    "walk": ["walk", "paso"],
    "trot": ["trot", "trote"],
    "canter": ["canter", "galope", "lope"],
    "gallop": ["gallop", "run", "sprint"],
    "jump": ["jump", "salto", "leap"],
    "refuse": ["refuse", "rear", "stop", "buck"],
}

log = unreal.log
warn = unreal.log_warning
registry = unreal.AssetRegistryHelpers.get_asset_registry()
tools = unreal.AssetToolsHelpers.get_asset_tools()
eal = unreal.EditorAssetLibrary


def list_assets(class_name):
    try:  # UE 5.1+
        f = unreal.ARFilter(class_paths=[unreal.TopLevelAssetPath("/Script/Engine", class_name)], recursive_paths=True, package_paths=["/Game"])
    except Exception:  # UE 5.0
        f = unreal.ARFilter(class_names=[class_name], recursive_paths=True, package_paths=["/Game"])
    return list(registry.get_assets(f))


def find_mesh():
    if HORSE_MESH_PATH:
        return unreal.load_asset(HORSE_MESH_PATH)
    meshes = list_assets("SkeletalMesh")
    if not meshes:
        return None
    # preferir nombres con "horse"/"caballo"; si no, el que tenga más clips
    scored = []
    for a in meshes:
        n = str(a.asset_name).lower()
        s = 10 if ("horse" in n or "caballo" in n or "equ" in n) else 0
        scored.append((s, n, a))
    scored.sort(key=lambda t: (-t[0], t[1]))
    return scored[0][2].get_asset()


def find_anims(mesh):
    out = {}
    skel = mesh.get_editor_property("skeleton") if mesh else None
    seqs = list_assets("AnimSequence")
    mine = []
    for a in seqs:
        seq = a.get_asset()
        try:
            if skel and seq.get_editor_property("skeleton") != skel:
                continue
        except Exception:
            pass
        mine.append(seq)
    for key, words in KEYWORDS.items():
        if ANIM_PATHS.get(key):
            out[key] = unreal.load_asset(ANIM_PATHS[key])
            continue
        best = None
        for seq in mine:
            n = seq.get_name().lower()
            if any(w in n for w in words):
                # evitar que "walk" tome "walk_to_trot", y que "jump" tome "jump_land" antes que "jump"
                if best is None or len(n) < len(best.get_name()):
                    best = seq
        out[key] = best
    return out


def make_bp(name, parent, out_dir=OUT_DIR):
    path = f"{out_dir}/{name}"
    if eal.does_asset_exist(path):
        log(f"[JETJump] {path} ya existe, se reutiliza")
        return unreal.load_asset(path)
    factory = unreal.BlueprintFactory()
    factory.set_editor_property("parent_class", parent)
    bp = tools.create_asset(name, out_dir, unreal.Blueprint, factory)
    log(f"[JETJump] creado {path}")
    return bp


def set_component_props(bp, component_class, props):
    """Modifica la plantilla de un componente heredado del Blueprint (p. ej. el Mesh)."""
    done = False
    try:
        sds = unreal.get_engine_subsystem(unreal.SubobjectDataSubsystem)
        for h in sds.k2_gather_subobject_data_for_blueprint(bp):
            data = sds.k2_find_subobject_data_from_handle(h)
            obj = unreal.SubobjectDataBlueprintFunctionLibrary.get_object(data)
            if isinstance(obj, component_class):
                for k, v in props.items():
                    if v is None:
                        continue
                    try:
                        obj.set_editor_property(k, v)
                    except Exception as e:
                        warn(f"[JETJump] no pude poner {k}: {e}")
                done = True
    except Exception as e:
        warn(f"[JETJump] SubobjectDataSubsystem no disponible ({e}); uso el CDO")
    if not done:
        cdo = unreal.get_default_object(bp.generated_class())
        for comp in cdo.get_components_by_class(component_class):
            for k, v in props.items():
                if v is None:
                    continue
                try:
                    comp.set_editor_property(k, v)
                except Exception as e:
                    warn(f"[JETJump] no pude poner {k}: {e}")
            done = True
    return done


def set_cdo_props(bp, props):
    cdo = unreal.get_default_object(bp.generated_class())
    for k, v in props.items():
        if v is None:
            continue
        try:
            cdo.set_editor_property(k, v)
        except Exception as e:
            warn(f"[JETJump] no pude poner {k} en {bp.get_name()}: {e}")


def compile_and_save(bp):
    try:
        unreal.BlueprintEditorLibrary.compile_blueprint(bp)
    except Exception as e:
        warn(f"[JETJump] compile: {e}")
    eal.save_loaded_asset(bp)


def main():
    if not hasattr(unreal, "JetHorsePawn"):
        warn("[JETJump] el plugin JETJumpSim no está compilado o no está activo (Edit → Plugins).")
        return
    if not eal.does_directory_exist(OUT_DIR):
        eal.make_directory(OUT_DIR)

    mesh = find_mesh()
    if mesh:
        log(f"[JETJump] caballo: {mesh.get_path_name()}")
    else:
        warn("[JETJump] no encontré ningún Skeletal Mesh en /Game: el Pawn queda sin malla (asignala en BP_JetCaballo).")
    anims = find_anims(mesh) if mesh else {}
    for k, v in anims.items():
        log(f"[JETJump] clip {k}: {v.get_path_name() if v else '(no encontrado)'}")

    # ---- Pawn
    pawn_bp = make_bp("BP_JetCaballo", unreal.JetHorsePawn)
    mesh_props = {}
    if mesh:
        # UE 5.1+ usa skeletal_mesh_asset; versiones anteriores skeletal_mesh
        mesh_props["skeletal_mesh_asset"] = mesh
    if mesh_props and not set_component_props(pawn_bp, unreal.SkeletalMeshComponent, mesh_props):
        set_component_props(pawn_bp, unreal.SkeletalMeshComponent, {"skeletal_mesh": mesh})
    set_cdo_props(pawn_bp, {
        "idle_anim": anims.get("idle"), "walk_anim": anims.get("walk"), "trot_anim": anims.get("trot"),
        "canter_anim": anims.get("canter"), "gallop_anim": anims.get("gallop"), "jump_anim": anims.get("jump"),
        "refuse_anim": anims.get("refuse"),
        # sin Animation Blueprint: los clips los maneja el Pawn según la simulación
        "force_simple_animation": True,
    })
    if mesh:
        try:
            bounds = mesh.get_editor_property("imported_bounds")
            h = float(bounds.box_extent.z) * 2.0
            if 80.0 < h < 400.0:
                set_cdo_props(pawn_bp, {"withers_height_cm": h * 0.8})
                log(f"[JETJump] altura estimada del modelo {h:.0f} cm")
        except Exception:
            pass
    compile_and_save(pawn_bp)

    # ---- GameMode
    gm_bp = make_bp("BP_JetGameMode", unreal.JetGameMode)
    set_cdo_props(gm_bp, {"default_pawn_class": pawn_bp.generated_class(), "hud_class": unreal.JetHUD})
    compile_and_save(gm_bp)

    # ---- Mapa abierto: GameMode Override
    try:
        world = unreal.UnrealEditorSubsystem().get_editor_world()
    except Exception:
        world = unreal.EditorLevelLibrary.get_editor_world()
    try:
        ws = unreal.GameplayStatics.get_actor_of_class(world, unreal.WorldSettings)
        ws.set_editor_property("default_game_mode", gm_bp.generated_class())
        log("[JETJump] GameMode Override del mapa: BP_JetGameMode")
        try:
            unreal.EditorLevelLibrary.save_current_level()
        except Exception:
            pass
    except Exception as e:
        warn(f"[JETJump] no pude poner el GameMode en el mapa: {e}. Ponelo a mano en World Settings.")

    # ---- Proyecto: GameMode por defecto
    try:
        gms = unreal.get_default_object(unreal.GameMapsSettings)
        gms.set_editor_property("global_default_game_mode", unreal.SoftClassPath(gm_bp.generated_class().get_path_name()))
        log("[JETJump] GameMode por defecto del proyecto: BP_JetGameMode")
    except Exception as e:
        warn(f"[JETJump] GameMode por defecto del proyecto no cambiado ({e}); alcanza con el del mapa.")

    # ---- Player Start
    try:
        starts = unreal.GameplayStatics.get_all_actors_of_class(world, unreal.PlayerStart)
        if not starts:
            unreal.EditorLevelLibrary.spawn_actor_from_class(unreal.PlayerStart, unreal.Vector(0, 0, 200))
            log("[JETJump] agregué un Player Start")
    except Exception as e:
        warn(f"[JETJump] Player Start: {e}")

    log("[JETJump] listo: dale Play. R reinicia, C cambia la cámara, espacio salta.")


main()
