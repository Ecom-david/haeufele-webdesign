/* Alle Designs an einer Stelle. fertig:true = Design steht. Fertige Designs öffnen sich als Beispiel-Seite unter templates/<id>/index.html (20N-FIX4, 17.11.2026). */
window.TEMPLATES = [
  {id:'elektro', gewerk:'Elektro', name:'Quandel Elektrotechnik', text:'Schwarz-Gelb wie ein Prüfgerät: Installationsplan zum Durchklicken, Verteiler im Detail und Wallbox-Rechner.', grund:'#121212', akzent:'#F2C230', b:['#F2C230','#3a3215'], fertig:true},
  {id:'pv', gewerk:'Photovoltaik & Wärmepumpe', name:'Sonnfeld Energie', text:'Klares Design in Himmelblau: Aufbau eines Solarmoduls in Lagen, Energiefluss im Haus und ein Ertragsrechner für das eigene Dach.', grund:'#0b1218', akzent:'#9FD3F2', b:['#9FD3F2','#14324a'], fertig:true},
  {id:'schreiner', gewerk:'Schreinerei', name:'Ostrander Holzwerkstatt', text:'Warmes Eichen-Design: Sideboard in 3D mit vier Holzarten, Einbauschrank-Planer und Werkstatt zum Umsehen.', grund:'#140f0b', akzent:'#D9A55B', b:['#D9A55B','#3a2616'], fertig:true},
  {id:'sanitaer', gewerk:'Heizung & Sanitär', name:'Seegmaier Haustechnik', text:'Ruhiges Petrol: Badplanung Schritt für Schritt, Wärmepumpe im Explosionsbild und Heizkosten-Vergleich über 20 Jahre.', grund:'#0c1515', akzent:'#5FB8AE', b:['#5FB8AE','#123430'], fertig:true},
  {id:'fliesen', gewerk:'Fliesen & Bad', name:'Kachelwerk Brandl', text:'Dunkles Design in Kupfer und Schiefer: Leistungen vom Abdichten bis zur fertigen Dusche, Fliesenrechner und Duschecke in 3D zum Selbst-Zusammenstellen.', grund:'#16130f', akzent:'#C9895B', b:['#C9895B','#3b2a1e'], fertig:true},
  {id:'dach', gewerk:'Dach & Spengler', name:'Dachbau Halvering', text:'Dachaufbau Schicht für Schicht: Sparren, Dämmung, Lattung, Ziegel.', grund:'#160d0b', akzent:'#D4664A', b:['#D4664A','#3b1a12'], fertig:false},
  {id:'naturstein', gewerk:'Naturstein', name:'Steinwerk Ohlmann', text:'Material-Konfigurator: Granit, Kalkstein, Schiefer im Vergleich.', grund:'#121110', akzent:'#C8BBA4', b:['#C8BBA4','#2e2a24'], fertig:false},
  {id:'fenster', gewerk:'Fenster & Türen', name:'Fensterbau Lindqvist', text:'Haustür im Schnitt: Aufbau, Dichtungen, Wärmedämmung.', grund:'#100f0d', akzent:'#B88E5E', b:['#B88E5E','#2f2418'], fertig:false}
];

/* Auf der Seite nur fertige, klickbare Templates zeigen (10.11.) */
window.TEMPLATES = window.TEMPLATES.filter(function (t) { return t.fertig; });
