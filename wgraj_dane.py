import pandas as pd
import json
import os
import webbrowser
import base64

# ==============================================================================
# ⬇️ TUTAJ WKLEJ ŚCIEŻKĘ DO SWOJEGO PLIKU Z BAZY SSMS (EXCEL .xlsx LUB .csv) ⬇️
# ==============================================================================

SCIEZKA_DO_PLIKU = r"C:\Twoj\Folder\dane_pgeo.xlsx"

# ==============================================================================

def check_environment():
    print("=" * 60)
    print(" 🛠️  ANalityka Środowiska (Diagnostyka Systemu) 🛠️ ")
    print("=" * 60)
    
    # 1. Sprawdzanie bibliotek
    print("[1/3] Sprawdzanie wymaganych bibliotek Pythona...")
    try:
        import pandas
        print("   ✅ Pandas zainstalowany pomyślnie (wersja: " + pandas.__version__ + ")")
    except ImportError:
        print("   ❌ BŁĄD: Brak biblioteki Pandas!")
        print("   -> Zainstaluj wpisując w terminalu: pip install pandas")
        return False
        
    try:
        import openpyxl
        print("   ✅ Openpyxl zainstalowany (obsługa .xlsx)")
    except ImportError:
        print("   ❌ UWAGA: Brak biblioteki openpyxl! Pliki Excel mogą nie działać.")
        print("   -> Zainstaluj wpisując w terminalu: pip install openpyxl")
        return False

    # 2. Sprawdzanie poprawnej ścieżki i lokalizacji
    print("\n[2/3] Sprawdzanie lokalizacji uruchomienia...")
    if not os.path.exists("dist"):
        print("   ❌ BŁĄD: Brak folderu 'dist'. Uruchamiasz skrypt w złym miejscu!")
        print("   -> Musisz uruchomić go z głównego folderu 'pgeo-analytics'.")
        return False
    print("   ✅ Folder 'dist' znaleziony poprawnie.")
    
    # 3. Sprawdzanie czystości i integralności pliku strukturalnego
    print("\n[3/3] Sprawdzanie czystości pliku strukturalnego (index.html)...")
    template_path = os.path.join("dist", "index.html")
    if not os.path.exists(template_path):
        print("   ❌ BŁĄD: Nie znaleziono głównego silnika aplikacji (dist/index.html)!")
        return False
        
    with open(template_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    if "<!doctype html>" not in html_content.lower() or "<html" not in html_content.lower():
        print("   ❌ BŁĄD KRYTYCZNY: Twój plik 'dist/index.html' uległ USZKODZENIU!")
        print("   Prawdopodobnie nadpisał się surowym tekstem w poprzednich próbach.")
        print("   -> ROZWIĄZANIE: Pobierz repozytorium GitHub ponownie (zrób 'git pull' lub pobierz ZIP)!")
        return False
    print("   ✅ Plik 'dist/index.html' jest w pełni zdrowy.")
    
    print("\n✅ DIAGNOSTYKA ZAKOŃCZONA POMYŚLNIE. Aplikacja gotowa do pracy.\n")
    return True


def main():
    if not check_environment():
        input("Naciśnij Enter, aby zamknąć...")
        return
        
    print("=" * 60)
    print(" PGEO ANALYTICS - INIEKTOR BAZY DANYCH (OFFLINE)")
    print("=" * 60)
    print(f"\nRozpoczynam odczyt pliku: {SCIEZKA_DO_PLIKU}")
    
    if not os.path.exists(SCIEZKA_DO_PLIKU):
        print(f"❌ BŁĄD: Nie znaleziono pliku pod wskazaną ścieżką!")
        print("Sprawdź, czy zmieniłeś zmienną SCIEZKA_DO_PLIKU w kodzie rzędzie.")
        input("Naciśnij Enter, aby zamknąć...")
        return
        
    try:
        # 1. ŁADOWANIE DANYCH Z PANDAS (Zjada RAM pythona, zostawia przeglądarkę w spokoju)
        print("⏳ Analizowanie setek tysięcy wierszy... Proszę czekać.")
        if SCIEZKA_DO_PLIKU.lower().endswith('.csv'):
            # Automatyczne rozpoznanie separatora (; lub ,)
            df = pd.read_csv(SCIEZKA_DO_PLIKU, sep=None, engine='python')
        elif SCIEZKA_DO_PLIKU.lower().endswith(('.xls', '.xlsx')):
            df = pd.read_excel(SCIEZKA_DO_PLIKU)
        else:
            print("❌ BŁĄD: Nieobsługiwany format pliku. Użyj .csv lub .xlsx")
            input("Naciśnij Enter, aby zamknąć...")
            return
            
        print(f"✅ Wczytano pomyślnie {len(df)} rekordów z bazy!")
        
        # 2. CZYSZCZENIE DANYCH
        print("⏳ Optymalizowanie i czyszczenie formatów daty...")
        
        # Zamiana NaN/NaT na zjadliwy dla webów null (None)
        df = df.where(pd.notnull(df), None)
        
        # Ochrona przed formatem daty w Pandasie (wymuszenie stringa YYYY-MM-DD HH:MM:ss)
        time_cols = ['dataGodzinaUTC', 'DataGodzinaUTC', 'DataGodzina', 'data', 'Date']
        for col in time_cols:
            if col in df.columns:
                df[col] = df[col].astype(str)
                break
                
        # Konwersja całej DataFrame na słownik Pythonowy, a potem na szybki string JSON
        records = df.to_dict(orient='records')
        json_data = json.dumps(records)
        
        # Enkodowanie w Base64 aby zapobiec psuciu HTML przez znaki w stylu </script> w surowych danych
        b64_data = base64.b64encode(json_data.encode('utf-8')).decode('utf-8')
        
        # 3. WSTRZYKIWANIE DANYCH DO APLIKACJI
        template_path = os.path.join("dist", "index.html")
        if not os.path.exists(template_path):
            print(f"❌ BŁĄD: Nie znaleziono pliku struktury {template_path}.")
            print("Upewnij się, że uruchamiasz ten skrypt będąc w folderze głównym 'pgeo-analytics'.")
            input("Naciśnij Enter, aby zamknąć...")
            return
            
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        print("⏳ Wstrzykiwanie danych (Base64) do silnika przeglądarki...")
        
        # Usuwamy ewentualne stare wstrzyknięcie
        import re
        html_content = re.sub(r'<div id="pgeo-injected-data".*?</div>', '', html_content, flags=re.DOTALL)
        html_content = re.sub(r'<script id="pgeo-data".*?</script>', '', html_content, flags=re.DOTALL)
            
        # Zamiast wstrzykiwać luźny skrypt (który na Windowsie przez zabezpieczenia lub dziwne cudzysłowy może zostać sparsowany jako tekst HTML),
        # wstrzykujemy to strukturalnie jako ukryty element DOM w obrębie <body>.
        # Jest to najbezpieczniejsza istniejąca metoda przekazywania ogromnych danych do Reacta z pominięciem obostrzeń środowiska wykonawczego.
        
        injected_dom_node = f'<div id="pgeo-injected-data" style="display:none;" data-b64="{b64_data}"></div>\n</body>'
        new_html = html_content.replace("</body>", injected_dom_node)
        
        output_path = os.path.join("dist", "dashboard_z_danymi.html")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(new_html)
            
        print("=" * 60)
        print(f"✅ SUKCES! Zbudowano ostateczny, lekki plik analityczny.")
        print("=" * 60)
        print("Uruchamianie dashboardu w domyślnej przeglądarce...")
        
        # 4. URUCHOMIENIE
        webbrowser.open('file://' + os.path.realpath(output_path))
        
    except Exception as e:
        print(f"❌ Wystąpił krytyczny błąd podczas analizy: {e}")
        input("Naciśnij Enter, aby zamknąć...")

if __name__ == "__main__":
    main()
