# GoBattleSim

A next-generation Pokemon GO Battle simulator, supporting multi-player gym battles, raid battles and trainer battles (PvP). It also includes rich functionalities such as Pokemon / Move Editor that allows users to tune the stats of Pokemon / Move with high flexibility.

## Getting Started

GoBattleSim is currently hosted on https://pokemongo.gamepress.gg/gobattlesim

One of its extension tool, Comprehensive DPS Spreadsheet, became standalone application and is hosted on https://pokemongo.gamepress.gg/comprehensive-dps-spreadsheet

### Prerequisites

A modern browser such as Google Chrome, FireFox, Microsoft Edge, iOS / Mac OS Safari. GoBattleSim has been tested to function on these browsers. Other browsers might also support it. Internet Explorer, however, is known to NOT support GoBattleSim.

Internet connection.

Then you are good to go!

## Running the tests

Help - Quickstart includes 7 different pre-defined tutorial configurations which can be also regarded as test cases. Click any one of them, then click "Go".


## API Usage

When you are visiting the webpage, all modules will have been loaded and you will be in the GoBattleSim Web environment. You may use the browser console to directly access the simulator modules, running simulations in batch as you like.

[Full API documentation](https://ymenghank.github.io/GoBattleSim/index.html)

### Example

The core GoBattleSim simulator takes input in JSON, runs simulations, and produces output in JSON. The first step is to prepare a nice JSON input. In the GoBattleSim Web environment, when you fill the Pokemon information in the webpage, the following code gets the input:

```
var input = UI.read();
```

Explore the structure of `input` to get a idea of the Player-Party-Pokemon layered design and attribute names. There are a lot to specify.

Next, pass the input to the simulator via the following line of code:

```
var output = GBS.run(input);
```

`GBS.run` runs the simulation and returns the output object. The `output` object contains some battle performance metrics for each entity. It mimics the structure of `input`.

An alternative to request simulations is:

```
var list_of_output = GBS.request(input);
```

If the input contains some wild cards (such as "*" being some Pokmeon's fast move field, meaning all fast moves), ```GBS.request``` will parse the wild cards such as PokeQuery and generate permutations of inputs for you. Under the hood, ```GBS.parse``` is used. Parsing wild card input to `GBS.run` will cause error.


## Contributing

If you are interested in helping to make GoBattleSim even better, feel free to contact me via reddit message u/biowpn.

## Versioning

I use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/BIOWP/GoBattleSim/tags). 

## Authors

* **Hank Meng** - *Initial work*

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* [Felix](https://github.com/doublefelix921) and I, two GamePress Pokemon Go staff, were researching on the game mechanics of Pokemon Go (which is definitely not reverse-engineering) and made some findings. At that point of time, the well-established simulator PokeBattler hadn't implemented the new mechanics, so we decided to build simulators of our own. Felix's version of simulator is [BattleSim](https://github.com/doublefelix921/battlesim). I decided to write one that can be hosted easily on GamePress, hence GoBattleSim was born.