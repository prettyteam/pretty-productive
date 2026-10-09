# Pretty Productive

Taffeta Salon & Spa's daily stylist goals site, served at https://prettyteam.taffetadesign.com/.

- `index.html` — the app. Each person opens a private link (`#s.<id>.<secret>` for a stylist, `#r.<id>.<secret>` for The Pretty Report) and enters a PIN.
- `d/<id>.json` — that person's data, AES-GCM encrypted with a key derived from their link secret + PIN. Unreadable without both.
- `tools/publish.mjs` — seals fresh data into `d/` after each scheduled update. Link secrets and PINs are never stored in this repository.
- `weddings/` — the Taffeta Weddings team app (https://prettyteam.taffetadesign.com/weddings/): timelines, team schedule, calendar invites, artist info and the payout form, with no Claude account needed. The office signs in with the office code; each artist opens her own private link (`#a.<id>.<secret>`). Data lives in the "Taffeta Weddings Team App" Google Sheet through `apps-script/Weddings.gs`, whose web app URL goes in `weddings/config.js`.
