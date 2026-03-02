export const generateMockData = () => {
  const data = [];
  const locations = [
    'PGED_Bialystok', 'PGED_Lodz_miasto', 'PGED_Lodz_teren', 'PGED_Zamosc',
    'PGED_Rzeszow', 'PGED_Warszawa', 'PGED_Lublin', 'PGED_Skarzysko_Kamienna'
  ];

  // Zaczynamy od lutego 2025, żeby 365 dni objęło 2026-01 (domyślny filtr)
  const startDate = new Date('2025-02-01T00:00:00Z');
  const daysToGenerate = 365; // Ostatnie 12 miesięcy

  locations.forEach(lokalizacja => {
    // Generowanie stałych błędów dziennych/całkowitych na potrzeby dashboardu
    const totalRecords = daysToGenerate * 24;
    let sumAbsErrKorekta = 0;
    let sumAbsErrHRES = 0;

    const locationData = [];

    for (let day = 0; day < daysToGenerate; day++) {
      let dailySumMapeKorekta = 0;
      let dailySumMapeHRES = 0;
      let validMapeHours = 0;

      for (let hour = 0; hour < 24; hour++) {
        const currentDate = new Date(startDate.getTime());
        currentDate.setUTCDate(currentDate.getUTCDate() + day);
        currentDate.setUTCHours(hour);

        // Symulacja cyklu dobowego PV (promieniowanie w dzień, w nocy brak)
        const isDaytime = hour > 6 && hour < 18;
        const peakHour = 12;
        const solarIntensity = Math.max(0, 1 - Math.abs(hour - peakHour) / 6); // 0 do 1

        // Zmienne pogodowe
        const zachmurzenie = isDaytime ? Math.random() * 100 : 0;
        const cps_cn = isDaytime ? solarIntensity * 800 : 0; // max ~800 W/m2 w słońcu zimą/wiosną
        const cps = isDaytime ? cps_cn * (1 - zachmurzenie / 150) : 0; // promieniowanie uwzględniające chmury

        const temp = -5 + Math.random() * 15 + (isDaytime ? 5 : 0); // od -5 do 15 C
        const opady_pow_all = Math.random() > 0.8 ? Math.random() * 5 : 0;
        const w_sniegu = Math.random() > 0.9 ? Math.random() * 10 : 0;

        // Baza PV rzeczywista - OSD
        // Uproszczony model: bazowa moc * intensywność słoneczna
        const basePV = 50 + Math.random() * 10;
        const Val_Historia = isDaytime ? basePV * solarIntensity * (cps / (cps_cn || 1)) + (Math.random() * 5) : 0;

        // Model Fundamentalny (HRES)
        // Ma większy błąd, radzi sobie gorzej z dużym zachmurzeniem i śniegiem
        const errFactorHRES = 1 + (zachmurzenie / 100) * 0.3 + (w_sniegu > 0 ? 0.2 : 0);
        const Val_HRES = isDaytime ? Val_Historia * errFactorHRES * (0.8 + Math.random() * 0.4) : 0;

        // Model Korekta
        // Uczy się na błędach, jest bliżej historii
        const Val_Korekta = isDaytime ? Val_Historia * (0.95 + Math.random() * 0.1) : 0;

        // Obliczenia błędów godzinowych
        const Blad_Abs_Korekta = Math.abs(Val_Korekta - Val_Historia);
        const Blad_Abs_HRES = Math.abs(Val_HRES - Val_Historia);

        sumAbsErrKorekta += Blad_Abs_Korekta;
        sumAbsErrHRES += Blad_Abs_HRES;

        // Do MApe
        if (Val_Historia > 0.1) {
          const mapeKorBase = Math.abs(Val_Korekta - Val_Historia) / Math.abs(Val_Historia);
          const mapeHresBase = Math.abs(Val_HRES - Val_Historia) / Math.abs(Val_Historia);

          dailySumMapeKorekta += mapeKorBase;
          dailySumMapeHRES += mapeHresBase;
          validMapeHours++;
        }

        locationData.push({
          dataGodzinaUTC: currentDate.toISOString().replace('T', ' ').replace('Z', '.000'),
          lokalizacja,
          Val_Korekta: Number(Val_Korekta.toFixed(2)),
          Val_HRES: Number(Val_HRES.toFixed(2)),
          Val_Historia: Number(Val_Historia.toFixed(2)),
          Blad_Abs_Korekta: Number(Blad_Abs_Korekta.toFixed(2)),
          Blad_Abs_HRES: Number(Blad_Abs_HRES.toFixed(2)),
          cps: Number(cps.toFixed(2)),
          cps_cn: Number(cps_cn.toFixed(2)),
          temp: Number(temp.toFixed(2)),
          zachmurzenie: Number(zachmurzenie.toFixed(2)),
          opady_pow_all: Number(opady_pow_all.toFixed(2)),
          w_sniegu: Number(w_sniegu.toFixed(2)),
        });
      }

      // Po wyliczeniu dnia, aktualizujemy Mape Dobowe dla tego dnia
      const dailyMapeKorekta = validMapeHours > 0 ? dailySumMapeKorekta / validMapeHours : 0;
      const dailyMapeHRES = validMapeHours > 0 ? dailySumMapeHRES / validMapeHours : 0;

      // Przypisanie dobie metryk
      for (let hour = 0; hour < 24; hour++) {
        locationData[day * 24 + hour].MAPE_Korekta_Doba = Number(dailyMapeKorekta.toFixed(4));
        locationData[day * 24 + hour].MAPE_HRES_Doba = Number(dailyMapeHRES.toFixed(4));
      }
    }

    // Po wyliczeniu całego miesiąca, uzupełnienie MAE per lokalizacja
    const maeKorekta = sumAbsErrKorekta / totalRecords;
    const maeHres = sumAbsErrHRES / totalRecords;

    locationData.forEach(row => {
      row.MAE_Korekta = Number(maeKorekta.toFixed(2));
      row.MAE_HRES = Number(maeHres.toFixed(2));
    });

    data.push(...locationData);
  });

  return data;
};
