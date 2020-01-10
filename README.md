# GoBattleSim

A next-generation Pokemon Go battle simulator, supporting multi-player gym battles, raid battles and trainer battles (PvP). It also includes rich functionalities such as Pokemon / Move Editor that allows users to tune the stats of Pokemon / Move with high flexibility.

## Public Hosting

GoBattleSim is currently publicly hosted on [GamePress](https://gamepress.gg/):

https://gamepress.gg/pokemongo/gobattlesim

One of its extension tools, Comprehensive DPS Spreadsheet, became a standalone application:

https://gamepress.gg/pokemongo/comprehensive-dps-spreadsheet


## Local Hosting

1. Clone this repository

2. `tar -xf` the "pokemongo_*.tar" file which contains the necessary assets

3. Set up a simple HTTP server from the root directory, for example with Python3:

    ```
    python -m http.server 80
    ```

4. GoBattleSim as well as other tools can then be accessed via

    ```
    http://127.0.0.1/GBS.html
    http://127.0.0.1/CompDPS.html
    http://127.0.0.1/RangeMapper.html
    ```

## Build

The simulator engine part of GoBattleSim is written in C++ and compiled into [src/GBS_Engine.wasm](./src/GBS_Engine.wasm). If you want to build it from source, you need [emscripten](https://emscripten.org/) as well as the following modules:

- [GoBattleSim-Engine](https://github.com/biowpn/GoBattleSim-Engine.git)

- [GameSolver](https://github.com/biowpn/GameSolver.git)

Place the above modules on the same directory level as this repository.

Make sure `em++` is available from command line. Then run the script:

```
python build-gbs-wasm.py
```

## Testing

*to be added*

Help - Quickstart also includes 7 different pre-defined tutorial configurations which can be also regarded as test cases.

## License

GNU public v3. See the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Felix](https://github.com/doublefelix921) and I, two GamePress Pokemon Go staff, were researching on the game mechanics of Pokemon Go (which is definitely not reverse-engineering) and made some findings. At that point of time, the well-established simulator PokeBattler hadn't implemented the new mechanics, so we decided to build simulators of our own. Felix's version of simulator is [BattleSim](https://github.com/doublefelix921/battlesim). I decided to write one that can be hosted easily on GamePress, hence GoBattleSim was born.
