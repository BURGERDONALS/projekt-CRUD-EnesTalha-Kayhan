# stock-tracker
# Aplikacja do śledzenia zapasów

Pełna aplikacja internetowa do zarządzania zapasami produktów z operacjami CRUD w czasie rzeczywistym.
🛠️ Instalacja i uruchomienie

Wymagania
Node.js (wersja 14 lub nowsza)

Instalacja
Skopiuj pliki projektu do folderu

package.json
server.js
index.html
style.css
script.js

Otwórz terminal w folderze projektu i zainstaluj zależności:
npm install

Uruchom backend (serwer):
npm run dev
Serwer zostanie uruchomiony pod adresem http://localhost:5000

Ważna uwaga: Jeśli podzieliłeś pliki na backend i frontend, najpierw wprowadź ścieżkę, w której znajduje się plik package.json.
cd backend

Aby uruchomić frontend, otwórz NOWY TERMINAL i:
npx live-server --port=3000
Aplikacja zostanie uruchomiona pod adresem http://localhost:3000

Sprawdź, czy backend działa: http://localhost:5000/api/products

Czy frontend działa: http://localhost:3000

## 🚀 Zestaw technologii

### Front-end
- **HTML**
- **CSS**
- **JavaScript**

###Back-end
- **Node.js**
- **Express.js**
- **PostgreSQL** -Serwer
- **SQLite** -Lokalny

## 📁 Struktura projektu
projekt-CRUD-EnesTalha-Kayhan/
front
└──├── index.html
   ├── style.css
   └── script.js
backend
└──├── package.json 
   └── server.js

🌐 Punkty końcowe API
GET /api/products – Pobierz wszystkie produkty

POST /api/products – Dodaj nowy produkt

PUT /api/products/:id – Zaktualizuj produkt

DELETE /api/products/:id – Usuń produkt

🔄 Wykrywanie środowiska
Backend
Produkcja: Używa PostgreSQL, jeśli DATABASE_URL lub NODE_ENV=production

Programowanie: Domyślnie używa SQLite

Frontend
Localhost: http://localhost:5000/api/products

Produkcja: https://stock-tracker-linq.onrender.com/api/products

📱 Użycie
Dodaj produkt: Wypełnij formularz i kliknij przycisk „Prześlij”

Edycja produktu: Kliknij przycisk „Edytuj” w tabeli

Usunięcie produktu: Kliknij przycisk „Usuń” w Tabela

Wyczyść formularz: „Resetuj” Zresetuj formularz przyciskiem