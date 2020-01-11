
import argparse
import glob
import os
import shutil
import subprocess

COMIPLE_FLAGS = ""


def compile_to(project_dir, build_dir):

    src_dir = os.path.abspath(os.path.join(project_dir, "src"))
    include_paths = [
        os.path.abspath(os.path.join(project_dir, "include")),
        os.path.abspath(os.path.join(project_dir, "thirdparty")),
        os.path.abspath(os.path.join(project_dir, "config"))
    ]
    include_path_arg = " ".join([f"-I{path}" for path in include_paths])

    procs = []

    for src in os.listdir(src_dir):
        src_name, ext = src.split('.')
        if ext not in ["cpp", "cc"]:
            continue
        src_path = os.path.join(src_dir, src)
        bin_path = os.path.join(build_dir, src_name + ".bc")
        cmd = f"em++ --std=c++11 {COMIPLE_FLAGS} -s ALLOW_MEMORY_GROWTH=1 {include_path_arg} -c {src_path} -o {bin_path}"
        print(cmd)
        p = subprocess.Popen(cmd, shell=True)
        procs.append(p)

    for p in procs:
        p.wait()
        if p.returncode != 0:
            print("error occured")
            exit()


def main():

    global COMIPLE_FLAGS

    parser = argparse.ArgumentParser()
    parser.add_argument("projects", type=str, nargs='*', default=["../GoBattleSim-Engine/", "../GameSolver/"],
                        help="path(s) to wasm projects to build")
    parser.add_argument("--type", choices=["debug", "release"], default="release",
                        help="build type")
    parser.add_argument("-o", "--out", default="src",
                        help="wasm file output directory")
    args = parser.parse_args()

    Build_Dir = "build"
    Target_Dir = args.out

    if args.type == "release":
        COMIPLE_FLAGS = "-O3"
    else:
        COMIPLE_FLAGS = "-s ASSERTIONS=1"

    # prepare a clean build dir
    if os.path.isdir(Build_Dir):
        shutil.rmtree(Build_Dir)
    os.mkdir(Build_Dir)

    # compiling
    for project_dir in args.projects:
        compile_to(project_dir, Build_Dir)

    # linking
    bin_paths_str = ""
    for bc in glob.glob(f"{Build_Dir}/*.bc"):
        bin_paths_str += bc + " "

    cmd = f"emcc {COMIPLE_FLAGS} {bin_paths_str} -o {Build_Dir}/GBS_Engine.html -s ALLOW_MEMORY_GROWTH=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=[ccall,cwrap,getValue,setValue]"
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
