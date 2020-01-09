
import glob
import os
import shutil
import subprocess


def compile_to(project_dir, build_dir):

    src_dir = os.path.abspath(os.path.join(project_dir, "src"))
    include_path_1 = os.path.abspath(os.path.join(project_dir, "include"))
    include_path_2 = os.path.abspath(os.path.join(project_dir, "thirdparty"))

    procs = []

    for src in os.listdir(src_dir):
        src_name, ext = src.split('.')
        if ext not in ["cpp", "cc"]:
            continue
        src_path = os.path.join(src_dir, src)
        bin_path = os.path.join(build_dir, src_name + ".bc")
        cmd = f"em++ --std=c++11 -O3 -s ALLOW_MEMORY_GROWTH=1 -I{include_path_1} -I{include_path_2} -c {src_path} -o {bin_path}"
        print(cmd)
        p = subprocess.Popen(cmd, shell=True)
        procs.append(p)

    for p in procs:
        p.wait()
        if p.returncode != 0:
            print("error occured")
            exit()


def main():

    GBS_Engine_Dir = "../GoBattleSim-Engine"
    GameSolver_Dir = "../GameSolver/"
    Build_Dir = "build"
    Target_Dir = "src"

    # prepare a clean build dir
    if os.path.isdir(Build_Dir):
        shutil.rmtree(Build_Dir)
    os.mkdir(Build_Dir)

    # compiling
    compile_to(GBS_Engine_Dir, Build_Dir)
    compile_to(GameSolver_Dir, Build_Dir)

    # linking
    bin_paths_str = ""
    for bc in glob.glob(f"{Build_Dir}/*.bc"):
        bin_paths_str += bc + " "

    cmd = f"emcc -O3 {bin_paths_str} -o {Build_Dir}/GBS_Engine.html -s ALLOW_MEMORY_GROWTH=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=[ccall,cwrap]"
    print(cmd)
    p = subprocess.Popen(cmd, shell=True)
    p.wait()

    # release
    if os.path.exists(Target_Dir):
        print("releasing to web GBS ... ", end='')
        shutil.copyfile(f"{Build_Dir}/GBS_Engine.js",
                        f"{Target_Dir}/GBS_Engine.js")
        shutil.copyfile(f"{Build_Dir}/GBS_Engine.wasm",
                        f"{Target_Dir}/GBS_Engine.wasm")
        print("done")


if __name__ == "__main__":
    main()
