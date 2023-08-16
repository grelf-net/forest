# forest
Java demonstration of the Relf Terrain Generator, in the form of a partial conversion of The Forest (grelf.itch.io/forest) from Javascript. Partial because this is work in progress. You can explore the terrain both above and under ground but not yet run orienteering courses.

The zip file contains complete sources, the built JAR file you should be able to run, and all of the images required when the program runs. The licence is MIT because I really want people to use my algorithms and take them further.

I am just a hobbyist these days (retired) so you only require Java SE8 for compiling the sources.

The class net.grelf.forest.Terrain is the generator for above ground. You can find the underground generator in net.grelf.forest.Mine and you should see that complicated dungeon layouts can be made extremely simply and fast.

RTG generates limitless terrain in real time as an observer moves around in it or scrolls a map. There are no chunks, tiles or mesh in the terrain itself: the observer can move smoothly by any amount in any direction, aided by compass and map. (Tiles are used in the scene view however.)

I devised the RTG algorithms in the early 1980s, when the first versions of The Forest were published for very small computers. They are therefore small and fast.

I see the new Java version as a kind of reference implementation because it has much clearer structure than earlier versions, for others to understand.
