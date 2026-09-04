# Pika Runner

Un endless runner minimale per browser, ispirato all'immediatezza del Chrome Dino. Un solo Pokémon, un solo comando: salta gli ostacoli e supera il record locale.

Lo sprite pixel di Pikachu è originale e costruito manualmente nel codice come blocchi su una griglia 28×23. Anche ostacoli, nuvole e terreno sono disegnati dal canvas: il gioco non carica asset grafici esterni.

## Sviluppo

Richiede Node.js 22.

```bash
npm ci
npm run dev
```

Verifiche:

```bash
npm run check
npm run test:e2e
```

## Comandi

- `Spazio` o `↑`: inizia, salta e riprova
- click/tap sul canvas: salta
- pulsante `SALTA`: controllo mobile

## Note legali

Progetto fan-made non commerciale e non ufficiale. Pokémon e i relativi personaggi appartengono ai rispettivi titolari.
