# GoBattleSim

GoBattleSim is an open-sourced Pokemon Go battle simulator, supporting multi-player gym battles, raid battles, and trainer battles (PvP). Its design goals are:
 
 - **Customizable**: Almost everything in GoBattleSim can be configured as users desire, from Pokemon / Move stats to nitty-gritty battle settings.

 - **Fast**: Performance matters, especially in mass simulations.

 - **Flexable**: GoBattleSim generalizes the battle mechanics, and is able to simulate not only *the reality*, but also *the imagination*.

## Public Hosting

GoBattleSim is currently publicly hosted on [GamePress](https://gamepress.gg/):

https://gamepress.gg/pokemongo/gobattlesim

One of its extension tools, Comprehensive DPS Spreadsheet, became a standalone application:

https://gamepress.gg/pokemongo/comprehensive-dps-spreadsheet


## Local Hosting

1. Clone this repository

2. `tar -xf pokemongo.tar`

    - Afterwards, these sub directories should be under the root directory:
        - pokemongo/
        - sites/

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

The simulator engine part of GoBattleSim is [src/GBS_Engine.wasm](./src/GBS_Engine.wasm). You need [emscripten](https://emscripten.org/) to build it from the sources:

- [GoBattleSim-Engine](https://github.com/biowpn/GoBattleSim-Engine.git)

- [GameSolver](https://github.com/biowpn/GameSolver.git)

Place the above repositories on the same directory level as this repository. Make sure `em++` is available from command line. Then run the script:

```
python build-gbs-wasm.py
```

## Testing

*to be added*

Help - Quickstart also includes 7 different pre-defined tutorial configurations which can be also regarded as test cases.

## License

GNU public v3. See the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* In late 2017, [Felix](https://github.com/doublefelix921) and I were researching on the battle mechanics of Pokemon Go (which is definitely not reverse-engineering) and [made some findings](https://gamepress.gg/pokemongo/new-discoveries-theory-battle-mechanics). At that point of time, the well-established simulator PokeBattler hadn't implemented the new mechanics, so we decided to build simulators of our own. Felix's version of simulator is [BattleSim](https://github.com/doublefelix921/battlesim) and mine was GoBattleSim.
