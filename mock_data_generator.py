import pandas as pd
import random
from datetime import datetime, timedelta

def generate_mock_excel(filename="mock_data.xlsx", num_rows=1000):
    start_date = datetime(2026, 1, 1)
    
    data = []
    for i in range(num_rows):
        current_date = start_date + timedelta(hours=i)
        
        lokalizacja = random.choice(["Warszawa", "Kraków", "Gdańsk", "Wrocław", "Poznań"])
        p_rzeczywista = round(random.uniform(10, 100), 2)
        p_hres = round(p_rzeczywista * random.uniform(0.8, 1.2), 2)
        p_korekta = round(p_rzeczywista * random.uniform(0.9, 1.1), 2)
        
        row = {
            "DataGodzinaUTC": current_date.strftime("%Y-%m-%d %H:%M:%S"),
            "Lokalizacja": lokalizacja,
            "P_Rzeczywista": p_rzeczywista,
            "P_HRES": p_hres,
            "P_Korekta": p_korekta,
            "Zachmurzenie": random.randint(0, 100),
            "Temperatura": round(random.uniform(-15, 35), 1),
            "Opad": round(random.uniform(0, 20), 1),
            "PredkoscWiatru": round(random.uniform(0, 25), 1),
            "KierunekWiatru": random.randint(0, 360),
            "WersjaModelu": "v1.0"
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    df.to_excel(filename, index=False)
    print(f"Wygenerowano {filename} z {num_rows} wierszami.")

if __name__ == "__main__":
    generate_mock_excel()
