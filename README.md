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

## Testing

In console, do

```
(() => {
    var script= document.createElement('script');
    script.type= 'text/javascript';
    script.src= 'test/GBS_Kernel_test.js';
    document.head.appendChild(script);
})()
```

Help - Quickstart also includes 7 different pre-defined tutorial configurations which can be also regarded as test cases.


## API Usage

[Full API documentation](https://ymenghank.github.io/GoBattleSim/index.html)

At its core, GoBattleSim

1. takes JSON input
2. runs simulation(s)
3. produces JSON output

### Example

The first step is to prepare a nice JSON input. In the GoBattleSim Web environment, when you fill the Pokemon information in the webpage, the following code gets the JSON input:

```
var input = UI.read();
```

Explore the structure of `input` to get a idea of the Player-Party-Pokemon layered configurations.

Next, pass the JSON input to GoBattleSim:

```
var output = GBS.run(input);
```

`GBS.run` runs the simulation and returns the `output` object, which contains some battle performance metrics for each entity. It mimics the structure of `input`.

An alternative to request simulations is:

```
var list_of_output = GBS.request(input);
```

If the input contains some wild cards (such as "*" being some Pokmeon's fast move field, meaning all fast moves), `GBS.request` will parse the wild cards such as PokeQuery and generate permutations of inputs for you. Under the hood, `GBS.parse` is used. Parsing wild card input to `GBS.run` will cause error.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Felix](https://github.com/doublefelix921) and I, two GamePress Pokemon Go staff, were researching on the game mechanics of Pokemon Go (which is definitely not reverse-engineering) and made some findings. At that point of time, the well-established simulator PokeBattler hadn't implemented the new mechanics, so we decided to build simulators of our own. Felix's version of simulator is [BattleSim](https://github.com/doublefelix921/battlesim). I decided to write one that can be hosted easily on GamePress, hence GoBattleSim was born.
