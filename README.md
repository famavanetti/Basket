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

## Sincronizzazione online (Firebase) – opzionale
1. console.firebase.google.com → Aggiungi progetto (gratis, senza Analytics).
2. Build → **Firestore Database** → Crea database (modalità produzione, regione europe-west).
3. Firestore → **Regole**, incolla e pubblica:
   `rules_version='2'; service cloud.firestore { match /databases/{d}/documents { match /{document=**} { allow read, write: if request.auth != null; } } }`
4. Build → **Authentication** → Metodo di accesso → abilita **Email/password** → scheda Utenti → Aggiungi utente (es. staff@miasocieta.it + una password lunga). È l'unico account, condiviso dallo staff.
5. Impostazioni progetto (ingranaggio) → Le tue app → icona **</>** (Web) → registra l'app → copia i valori di `firebaseConfig`.
6. Apri `firebase-config.js`, incolla i valori in `FB_CONFIG` e aggiungi `email: "..."` (quella del punto 4). Pubblica su GitHub e cambia la versione in `sw.js`.
7. Su ogni dispositivo: apri l'app **una volta con internet**; alla prima apertura chiede la password dello staff (una sola volta).
Con FB_CONFIG = null l'app torna a funzionare solo con i file.
