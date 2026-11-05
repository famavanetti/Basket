# Referto Basket – app staff
Pubblicazione: GitHub → Settings → Pages → Deploy from branch → main / (root).
PIN: modifica `PIN_CORRETTO` in `app.js` (default 1234). Dopo ogni modifica cambia `V='referto-v2'` in `sw.js` (v2, v3…) per aggiornare l'app sui telefoni.
Installazione: apri il link dal telefono → Installa / Aggiungi a schermata Home.

Dopo ogni modifica cambia `V` in `sw.js` (ora v3).

## Archivio e statistiche
- A fine gara il referto si salva nell'archivio del tablet insieme ai dati (punti, tiri liberi, falli, cambi) e compare il tasto **Invia al PC**.
- Sul PC: Home → **Archivio e statistiche** → *Importa file partite* (puoi scegliere più file insieme).
- Per avere solo la propria squadra sul tablet: Anagrafica → scegli la squadra → *Esporta solo ...*, poi sul tablet *Importa Excel*.
- Le partite giocate con la versione precedente non hanno i dati per le statistiche.
