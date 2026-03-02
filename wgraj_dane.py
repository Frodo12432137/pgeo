import pandas as pd
import json
import os
import webbrowser

# ==============================================================================
# ⬇️ TUTAJ WKLEJ ŚCIEŻKĘ DO SWOJEGO PLIKU Z BAZY SSMS (EXCEL .xlsx LUB .csv) ⬇️
# ==============================================================================

SCIEZKA_DO_PLIKU = r"C:\Twoj\Folder\dane_pgeo.xlsx"

# ==============================================================================

def main():
    print("=" * 60)
    print(" PGEO ANALYTICS - INIEKTOR BAZY DANYCH (OFFLINE)")
    print("=" * 60)
    print(f"\nRozpoczynam odczyt pliku: {SCIEZKA_DO_PLIKU}")
    
    if not os.path.exists(SCIEZKA_DO_PLIKU):
        print(f"❌ BŁĄD: Nie znaleziono pliku pod wskazaną ścieżką!")
        print("Sprawdź, czy zmieniłeś zmienną SCIEZKA_DO_PLIKU w kodzie tego skryptu.")
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
        
        # 3. WSTRZYKIWANIE DANYCH DO APLIKACJI
        template_path = os.path.join("dist", "index.html")
        if not os.path.exists(template_path):
            print(f"❌ BŁĄD: Nie znaleziono pliku struktury {template_path}.")
            print("Upewnij się, że uruchamiasz ten skrypt będąc w folderze głównym 'pgeo-analytics'.")
            input("Naciśnij Enter, aby zamknąć...")
            return
            
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
            
        print("⏳ Wstrzykiwanie danych do silnika przeglądarki...")
        # Szukamy nagłówka i doklejamy twardą zmienną window.__INJECTED_SQL_DATA__
        # Zabezpieczenie przed podwójnym wstrzyknięciem:
        if "window.__INJECTED_SQL_DATA__" in html_content:
            # Usuwamy stare wstrzyknięcie
            import re
            html_content = re.sub(r'<script id="pgeo-data">.*?</script>', '', html_content, flags=re.DOTALL)
            
        script_tag = f'\n<script id="pgeo-data">window.__INJECTED_SQL_DATA__ = {json_data};</script>\n</head>'
        new_html = html_content.replace("</head>", script_tag)
        
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
