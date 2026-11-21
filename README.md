# news-image-20261121

[![make.fun](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/c/news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/vantamire/makefun-news-image-20261121/rank.svg)](https://make.fun/c/news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/vantamire/makefun-news-image-20261121/reward.svg)](https://make.fun/c/news-image-20261121)

A program that sums up the world news of Saturday 21 November 2026 in one
image. It draws a newspaper front page — six stories that defined the day —
and writes it to `/output/entry.png`.

Stories: Russian missiles land in Poland; the overnight barrage on Ukraine;
a Houthi missile intercepted over Riyadh; Cyclone Akvan hits Odisha; Wall
Street slides into correction; Bitcoin crashes below $60,000 as the whole
crypto market turns red, with $1.91B liquidated in a day.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Pure Node 22 standard library, no network, deterministic: two runs write
byte-identical PNG files.
