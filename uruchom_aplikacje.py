import http.server
import socketserver
import json
import urllib.parse
import pandas as pd
import os
import webbrowser
import threading
import time

# ==============================================================================
# ⬇️ TUTAJ WKLEJ ŚCIEŻKĘ DO SWOJEGO PLIKU Z BAZY SSMS (EXCEL .xlsx LUB .csv) ⬇️
# ==============================================================================

SCIEZKA_DO_PLIKU = "mock_data.xlsx"
PORT = 8543

# Zmienna przechowująca przetworzone dane w pamięci (aby nie czytać pliku przy każdym requeście)
PRZETWORZONE_DANE = None

def load_data():
    global PRZETWORZONE_DANE
    print(f"Rozpoczynam odczyt pliku: {SCIEZKA_DO_PLIKU}")
    if not os.path.exists(SCIEZKA_DO_PLIKU):
        raise FileNotFoundError(f"Nie znaleziono pliku: {SCIEZKA_DO_PLIKU}")
        
    print("⏳ Analizowanie setek tysięcy wierszy... Proszę czekać.")
    if SCIEZKA_DO_PLIKU.lower().endswith('.csv'):
        df = pd.read_csv(SCIEZKA_DO_PLIKU, sep=None, engine='python')
    elif SCIEZKA_DO_PLIKU.lower().endswith(('.xls', '.xlsx')):
        df = pd.read_excel(SCIEZKA_DO_PLIKU)
    else:
        raise ValueError("Nieobsługiwany format pliku. Użyj .csv lub .xlsx")
        
    print(f"✅ Wczytano pomyślnie {len(df)} rekordów z bazy!")
    print("⏳ Optymalizowanie i czyszczenie formatów daty...")
    
    df = df.where(pd.notnull(df), None)
    
    time_cols = ['dataGodzinaUTC', 'DataGodzinaUTC', 'DataGodzina', 'data', 'Date']
    for col in time_cols:
        if col in df.columns:
            df[col] = df[col].astype(str)
            break
            
    records = df.to_dict(orient='records')
    PRZETWORZONE_DANE = json.dumps(records).encode('utf-8')
    print("✅ Dane gotowe do wysłania do przeglądarki!")


class PGEOHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serwujemy pliki z folderu dist, domyślnie index.html
        super().__init__(*args, directory="dist", **kwargs)

    def do_GET(self):
        if self.path == '/api/data':
            try:
                if PRZETWORZONE_DANE is None:
                    # Ładuj dane przy pierwszym zapytaniu, lub obsłuż błąd
                    load_data()
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(PRZETWORZONE_DANE)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                error_msg = json.dumps({"error": str(e)})
                self.wfile.write(error_msg.encode('utf-8'))
        else:
            return super().do_GET()

    # Wyłącz logowanie każdego zapytania do konsoli, żeby nie śmiecić
    def log_message(self, format, *args):
        pass

def start_server():
    with socketserver.TCPServer(("", PORT), PGEOHandler) as httpd:
        httpd.serve_forever()

def main():
    print("=" * 60)
    print(" PGEO ANALYTICS - LOKALNY SERWER DANYCH (HTTP)")
    print("=" * 60)
    
    # Sprawdzanie czy projekt przebudowany
    if not os.path.exists("dist") or not os.path.exists("dist/index.html"):
        print("❌ BŁĄD: Brak wybudowanej aplikacji w folderze 'dist/index.html'!")
        print("Prawdopodobnie musisz najpierw zbudować aplikację.")
        input("Naciśnij Enter aby zamknąć...")
        return
        
    try:
        # Odpalamy ładowanie Excela przed uruchomieniem serwera
        load_data()
    except Exception as e:
        print(f"❌ KRYTYCZNY BŁĄD podczas analizy Excela: {e}")
        input("Naciśnij Enter aby zamknąć...")
        return
        
    print("\n⏳ Uruchamianie lokalnego serwera wizualizacji...")
    
    server_thread = threading.Thread(target=start_server)
    server_thread.daemon = True
    server_thread.start()
    
    print(f"✅ Serwer działa w tle! (Port: {PORT})")
    print(f"🌐 Otwieranie przeglądarki automatycznie: http://localhost:{PORT}")
    
    time.sleep(1)
    webbrowser.open(f"http://localhost:{PORT}")
    
    print("\n" + "=" * 60)
    print("APLIKACJA JEST TERAZ AKTYWNA W PRZEGLĄDARCE.")
    print("Nie zamykaj tego okna terminala, dopóki korzystasz z Dashboardu!")
    print("Możesz odświeżać stronę w przeglądarce do woli.")
    print("Aby wyłączyć program, naciśnij CTRL+C w tym oknie.")
    print("=" * 60 + "\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nZamykanie serwera PGEO Analytics... Do widzenia!")

if __name__ == "__main__":
    main()
