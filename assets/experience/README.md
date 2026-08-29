# Experience photos

Ten slots, one per role. Each is an empty designed frame until a photo
lands in it.

To fill one, drop the file in this folder and add an `<img>` as the first
child of that role's `<figure>` in index.html — the placeholder hides
itself, no CSS change needed:

    <figure class="ov-figure" data-slot="nio">
      <img src="assets/experience/nio.jpg" alt="Short description">
      <div class="ov-slot">...</div>        <!-- leave it; it auto-hides -->
      <figcaption>NIO · Chengdu community team, 2022</figcaption>
    </figure>

Slots, in page order:

| data-slot       | role                                   |
|-----------------|----------------------------------------|
| covestro        | Covestro, APAC strategic marketing     |
| netease         | NetEase, overseas KOL                  |
| nio             | NIO, user strategy                     |
| tiaogezi        | Tiaogezi Media, new media content      |
| gps             | GPS society, head of publicity         |
| jinsha          | Jinsha musical, production manager     |
| chemist         | Chemist Warehouse                      |
| goodneighbour   | Good Neighbour supermarket             |
| haidilao        | Haidilao                               |
| bvmarket        | BV Asian Market                        |

Landscape suits the frame best: 16:10 for the three lead photos, 16:7 for
the roles inside New Media and Frontline. Anything wider than about
1600px is more than the layout can use.
