# news-image-20261121

[![make.fun](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/c/news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/vantamire/makefun-news-image-20261121/rank.svg)](https://make.fun/c/news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/vantamire/makefun-news-image-20261121/reward.svg)](https://make.fun/c/news-image-20261121)

A program that sums up the world news of Saturday 21 November 2026 in one
image. It draws a newspaper front page as an orbit — 22 stories that
defined the day — and writes it to `/output/entry.png`.

Six headline stories are circular illustrated medallions around the sides:
Russian missiles land in Poland; the overnight barrage on Ukraine; a Houthi
missile intercepted over Riyadh; Cyclone Akvan hits Odisha; Wall Street
slides into correction; Bitcoin crashes below $60,000 as the whole crypto
market turns red, with $1.91B liquidated in a day. In the middle, a central
box lists 13 more verified stories in words only, one marked line each — Anthropic's IPO debut,
gold and oil moves, the Nasdaq slide, EU and UK military aid for Ukraine,
the US Senate's Iran war-powers vote, Trump's pardon of Pete Rose, a tanker
hit off Hormuz, two Danes charged in a Russian plot, the Thaci verdict in
The Hague, Argentina's disability law, and US sanctions on four Iranians —
and the footer ticker adds three more: the JPMorgan/Visa/Mastercard
cyberattack, the ICJ's Myanmar genocide ruling, and the Trump-Xi-Putin
summit.

Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Pure Node 22 standard library, no network, deterministic: two runs write
byte-identical PNG files.
