
# PokeQuery

In this document, all PokeQuery search features are summarized and compared with the The [official in-game search features](https://niantic.helpshift.com/a/pokemon-go/?s=finding-evolving-hatching&f=searching-and-filtering-your-pokemon-inventory-1573844715&p=web).

## Unit Filters

| Feature | Format | Supported in GoBattleSim | Supported in Pokemon Go |
| ------- | ------ | ------------------------ | ----------------------- |
| Combat Power (CP) | `cp{number\|range}` | Yes | Yes |
| Distance  | `distance{number\|range}` | - | Yes |
| Evolutionary family  | `+{string}` | Yes | Yes<sup>[1]</sup> |
| Health Points (HP) | `hp{number\|range}` | Yes | Yes |
| Name | `{string}` | Yes | Yes |
| Nickname | `{string}` | Yes | Yes |
| Pokedex number | `{number\|range}` | Yes | Yes |
| Pokemon type | `{PokeType}` | Yes, Extended<sup>[2]</sup> | Yes |
| Region | `{string}` | Yes, Extended<sup>[3]</sup> | Yes |
| Move | `@{string}` | Yes | Yes |
| Move type | `@{PokeType}` | Yes | Yes |
| Move stats | `@power{number\|range}` | Yes | No |
|  | `@duration{number\|range}` | Yes | No |
|  | `@energy{number\|range}` | Yes | No |
| Move with effect | `@effect` | Yes | No |
| Special Moves | `@special` | Yes | Yes |
| Exclusive Moves | `@exclusive` | Yes | No<sup>[4]</sup> |
| Legacy Moves | `@legacy` | Yes | No<sup>[4]</sup> |
| Current Moves | `@current` | Yes | No |
| Types of Quick and Charged Attacks | `@1{string}` | Yes | Yes |
|  | `@2{string}` | Yes | Yes |
|  | `@3{string}` | Yes | Yes |
| Both Quick and Charged Attacks | `@*{string}` | Yes | No |
| Weather-boosted | `@weather` | Yes<sup>[5]</sup> | Yes |
| STAB | `@stab` | Yes | No |
| Appraisal | `{number\|range}*` | No | Yes |
| IVs | `atkiv{number\|range}` | Yes | No |
|  | `defiv{number\|range}` | Yes | No |
|  | `stmiv{number\|range}` | Yes | No |
| Level | `level{number\|range}` | Yes | No |
| Base Stats | `baseAtk{number\|range}` | Yes | No |
|  | `baseDef{number\|range}` | Yes | No |
|  | `baseStm{number\|range}` | Yes | No |
| GamePress rating | `rating{number\|range}` | Yes | - |
| Evolvable Pokemon | `evolve` | Yes | Yes |
| Legendary Pokemon | `legendary` | Yes | Yes |
| Mythical Pokemon | `mythical` | Yes | Yes |
| Item-based evolutions | `item` | No | Yes |
| Alolan Pokemon | `alolan` | Yes | Yes |
| Egg-exclusive Pokemon | `eggsonly` | Yes | Yes |
| Gym defenders | `defender` | - | Yes |
| Hatched Pokemon | `hatched` | - | Yes |
| Lucky Pokemon | `lucky` | No | Yes |
| Purified Pokemon | `Purified` | No | Yes |
| Shadow Pokemon | `Shadow` | Yes<sup>[6]</sup> | Yes |
| Shiny Pokemon | `shiny` | - | Yes |
| Special Event Pokemon | `costume` | No | Yes |
| Traded Pokemon | `traded` | - | Yes |
| User Pokemon | `$` | Yes | - |
| Raid Boss Tier | `%{number}` | Yes | No |
| Current Raid Boss | `%current` | Yes | No |
| Legacy Raid Boss | `%legacy` | Yes | No |
| DPS / TDO | `dps{number\|range}` | Yes<sup>[7]</sup> | - |
|  | `tdo{number\|range}` | Yes<sup>[7]</sup> | - |

Note:

1. Per official documentation: 

    > ...this only works for Pokémon currently in your list. Searching for +Pikachu will not return anything if you don’t currently have any Pikachu.

   There is no such restriction in GoBattleSim, though.

2. In addition to the 18 PokeTypes, `none` is supported too, allowing to search for single-typed Pokémon.

3. All 8 regions up to `galar` are supported.

4. The `@special` search in Pokemon Go doesn't distinguish exclusive moves (only obtainable during events) from legacy moves (once naturally learnable).

5. Requires a global variable for weather setting.

6. Match name/nickname containing "shadow ".

7. Only available in the DPS Spreadsheet.


## Combining Filters & Others

| Feature | Format | Supported in GoBattleSim | Supported in Pokemon Go |
| ------- | ------ | ------------------------ | ----------------------- |
| Range Expression `{range}` | `{number}-{number}` | Yes | Yes |
| | `{number}-` | Yes | Yes |
|  | `-{number}` | Yes | Yes |
| AND statement | `{expr1} & {expr2}` | Yes | Yes |
| | `{expr1} \| {expr2}` | Yes | Yes |
| OR statement | `{expr1} , {expr2}` | Yes | Yes |
| | `{expr1} : {expr2}` | Yes | Yes |
| | `{expr1} ; {expr2}` | Yes | Yes |
| NOT statement | `!{expr}` | Yes | Yes |
| Override Precedence | `({expr})` | Yes | No |

Note: In the Pokemon Go app, the precedence is `NOT > OR > AND`, where in GoBattleSim it's `NOT > AND > OR`.
