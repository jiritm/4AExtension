//Prvni spusteni
pref("extensions.annotationextension.firstRun", false);
//Defaultni velikost anotacniho okna v pixelech
pref("extensions.annotationextension.defaultHeight", 243);
//Naposledy ulozena velikost okna
pref("extensions.annotationextension.previousHeight", 243);
//"default": otevre anotacni okno v defaultni velikosti
//"previous": otevre anotacni okno v naposledy nastavene velikosti
pref("extensions.annotationextension.heightMode", "previous");
//"open": pri vytvoreni window otevre anotacni okno
//"close": pri vytvoreni window bude anotacni okno zavrene
//"restore": pri vytvoreni window se otevre anotacni okno, pokud bylo pri zavreni otevreno
pref("extensions.annotationextension.startupMode", "restore");
//true: anotacni okno bylo pri zavreni window otevreno
//false: anotacni okno bylo pri zavreni window zavreno
pref("extensions.annotationextension.isOpenedAtShutdown", false);
//newline: jednotlive vybery se budou v anotacnim okne oddelovat novym radkem
//nosepar: ...nebudou se nijak oddelovat
//space:  ..budou se oddelovat mezerou
pref("extensions.annotationextension.separateMode", "newline");
//true: automaticky prihlasi uzivatele pri spusteni
//false: zobrazi se okno s prihlasovacimi udaji pro prihlaseni
pref("extensions.annotationextension.user.autoLogin", false);
//Uzivatelske jmeno
pref("extensions.annotationextension.user.username", "");
//Adresa serveru na ktery se uzivatel prihlasuje
pref("extensions.annotationextension.server.serverAddress", "localhost");
//Cislo portu serveru na ktery se uzivatel prihlasuje
pref("extensions.annotationextension.server.serverPort", 8080);
//Zobrazeni typu v panelu anotace
pref("extensions.annotationextension.annotationPanel.showType", true);
//Zobrazeni autora v panelu anotace
pref("extensions.annotationextension.annotationPanel.showAuthor", true);
//Zobrazeni data v panelu anotace
pref("extensions.annotationextension.annotationPanel.showDate", true);
//Nacteni vnorenych anotaci do panelu
pref("extensions.annotationextension.annotationPanel.viewLevel", 1); 
//Zobrazeni atributu vnorenych anotaci v panelu
pref("extensions.annotationextension.annotationPanel.showViewLevel", 1);
//Duvera v nabidky
pref("extensions.annotationextension.suggestion.confidenceNumber", 0);
//Defaultni barva pozadi fragmentu
pref("extensions.annotationextension.annotationFragment.defaultBackground", "rgba(255,255,51,1)");
//Defaultni barva pisma fragmentu
pref("extensions.annotationextension.annotationFragment.defaultFont", "rgba(0,0,0,1)");