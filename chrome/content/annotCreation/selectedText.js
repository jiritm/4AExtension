/**
 * Soubor: selectedText.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro zpracovani vybraneho textu.
 * Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.selectedText =
{  
  /**
   * Zobrazuje vybrany text dokumentu v policku anotacniho okna
   * Event, ktery spusti tuhle funkci(onmouseup) je nastaven v browserOverlay.xul 
   */ 
  selectText : function()
  {
    try
    {
      var aeSelectedText = annotationExtensionChrome.selectedText;
      aeSelectedText.rangeCount = 0;
      aeSelectedText.activeRange = 0;
      aeSelectedText.highlightText = "";
      aeSelectedText.allRanges = "";
      aeSelectedText.ranges = [];
      aeSelectedText.selectedRanges = "";
      aeSelectedText.selRangeText = "";
      
      aeSelectedText.mergeIntersectRangesInHighlightText();
      
      aeSelectedText.highlightText = window.content.getSelection();  /**< Vybrany text v dokumentu. */
      /*
       * Dalsi moznosti (maji ruzne chovani):
       * content.getSelection();
       * document.commandDispatcher.focusedWindow.getSelection();
       * getBrowserSelection();
       */
      //Spojeni prekrytych ranges
      
      //range je jeden souvisle zvyrazneny blok
      aeSelectedText.rangeCount = aeSelectedText.highlightText.rangeCount;
  
      aeSelectedText.ranges = [];
      //Zpracovani vsech range
      //rangeCount vraci po prvnim vyberu vzdy 1, ikdyz neni nic vybrane
      //TODO: predchozi neplati ve ff verze 17 a buh vi od jake verze:/ - je potreba aeSelectedText.highlightText.getRangeAt(0) != "" smazat a osetrit pro nizsi verze
      if (aeSelectedText.rangeCount > 0 && aeSelectedText.highlightText.getRangeAt(0) != "")
      {
        //Ulozeni ranges pro pripadne obnoveni
        for (var i = 0; i < aeSelectedText.rangeCount; i++)
          aeSelectedText.ranges[i] = aeSelectedText.highlightText.getRangeAt(i);
          
        //URCENI ODDELOVACE MEZI JEDNOTLIVYMI RANGE
        aeSelectedText.separ = "";
        if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "newline")
        {
          aeSelectedText.separ = "\n";
        }
        else if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "space")
        {
          aeSelectedText.separ = " ";
        }
    
        aeSelectedText.allRanges = "";
        
        var i = 0;
        //Ulozeni textu vsech range do jedne promenne
        for(i = 0; i < aeSelectedText.rangeCount; i++)
        {
          aeSelectedText.allRanges += aeSelectedText.highlightText.getRangeAt(i).toString() + aeSelectedText.separ;
        }
        
        //Pokud je aktivni range vyssi nez pocet nove vybranych
        if (aeSelectedText.rangeCount < aeSelectedText.activeRange)
          aeSelectedText.activeRange = aeSelectedText.rangeCount;
          
        //Zobrazeni prvniho range nebo vsech range, podle nastaveni        
        if (aeSelectedText.rangeCount != 1)
        {
          aeSelectedText.activeRange = -1;
          let stringBundle = document.getElementById("annotationextension-string-bundle");
          aeSelectedText.selRangeText = stringBundle.getString("annotationextension.aeSelectedText.selectedText.all");
          aeSelectedText.selectedRanges = aeSelectedText.allRanges;
        }
        else
        {
          aeSelectedText.selRangeText = eval(aeSelectedText.activeRange + 1) + "/" + aeSelectedText.rangeCount;
          aeSelectedText.selectedRanges = aeSelectedText.highlightText.getRangeAt(aeSelectedText.activeRange).toString();
        }
      }
      
      let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(null, "annotationextension-textSelected", null);
    }
    catch(ex)
    {
      alert('annotationWindow.js : selectedText:\n' + ex.message);
    }
  },
  
  /**
   * Zobrazuje vybrany text dokumentu v policku anotacniho okna (vzdy pouze prvni range - predevsim pro editaci)
   * Event, ktery spusti tuhle funkci(onmouseup) je nastaven v browserOverlay.xul (pri editaci)
   */ 
  selectTextOnlyFirstRange : function()
  {
    //TODO: Smazat v teto zakomentovane casti
    try
    {
      var aeSelectedText = annotationExtensionChrome.selectedText;
      aeSelectedText.rangeCount = 0;
      aeSelectedText.activeRange = 0;
      aeSelectedText.highlightText = "";
      aeSelectedText.allRanges = "";
      aeSelectedText.ranges = [];
      aeSelectedText.selectedRanges = "";
      aeSelectedText.selRangeText = "";
      
      aeSelectedText.highlightText = window.content.getSelection();  /**< Vybrany text v dokumentu. */
      /*
       * Dalsi moznosti (maji ruzne chovani):
       * content.getSelection();
       * document.commandDispatcher.focusedWindow.getSelection();
       * getBrowserSelection();
       */
      
      //range je jeden souvisle zvyrazneny blok
      aeSelectedText.rangeCount = aeSelectedText.highlightText.rangeCount;
  
      //Zpracovani vsech range
      //rangeCount vraci po prvnim vyberu vzdy 1, ikdyz neni nic vybrane
      //TODO: predchozi neplati ve ff verze 17 a buh vi od jake verze:/ - je potreba aeSelectedText.highlightText.getRangeAt(0) != "" smazat a osetrit pro nizsi verze
      if (aeSelectedText.rangeCount > 0 && aeSelectedText.highlightText.getRangeAt(0) != "")
      {
        aeSelectedText.rangeCount = 1;
  
        //Ulozeni ranges pro pripadne obnoveni
        for (var i = 0; i < aeSelectedText.rangeCount; i++)
          aeSelectedText.ranges[i] = aeSelectedText.highlightText.getRangeAt(i);
          
        if (aeSelectedText.highlightText.rangeCount > 1)
        {
          aeSelectedText.highlightText.removeAllRanges();
          aeSelectedText.highlightText.addRange(aeSelectedText.ranges[0]);
        }
        
        aeSelectedText.rangeCount = 1;
  
        //Ulozeni ranges pro pripadne obnoveni
        for (var i = 0; i < aeSelectedText.rangeCount; i++)
          aeSelectedText.ranges[i] = aeSelectedText.highlightText.getRangeAt(i);
    
        aeSelectedText.allRanges = "";
        
        var i = 0;
        //Ulozeni textu vsech range do jedne promenne
        for(i = 0; i < aeSelectedText.rangeCount; i++)
        {
          aeSelectedText.allRanges += aeSelectedText.highlightText.getRangeAt(i).toString();
        }
        
        //Pokud je aktivni range vyssi nez pocet nove vybranych
        if (aeSelectedText.rangeCount < aeSelectedText.activeRange)
          aeSelectedText.activeRange = aeSelectedText.rangeCount;
          
        //Zobrazeni prvniho range nebo vsech range, podle nastaveni        
        if (aeSelectedText.rangeCount != 1)
        {
          aeSelectedText.activeRange = -1;
          let stringBundle = document.getElementById("annotationextension-string-bundle");
          aeSelectedText.selRangeText = stringBundle.getString("annotationextension.aeSelectedText.selectedText.all");
          aeSelectedText.selectedRanges = aeSelectedText.allRanges;
        }
        else
        {
          aeSelectedText.selRangeText = eval(aeSelectedText.activeRange + 1) + "/" + aeSelectedText.rangeCount;
          aeSelectedText.selectedRanges = aeSelectedText.highlightText.getRangeAt(aeSelectedText.activeRange).toString();
        }
      }
      
      let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(null, "annotationextension-textSelected", null);
    }
    catch(ex)
    {
      alert('annotationWindow.js : selectedText:\n' + ex.message);
    }
  },
  
  //"Public"
  selectedRanges : "",  /**< Prave vybrany range (String). */
  selRangeText : "",    /**< Text, ktery se muze zobrazit mezi sipkami pro vyber range. (String)*/
  
  //"Private"
  highlightText : "",   /**< Vybrany text. */
  allRanges : "",       /**< Vsechny vybery. (String)*/
  separ : "",           /**< Oddelovac mezi vybery. */
  activeRange : 0,      /**< Zobrazeny range v anotacnim okne. (pokud je -1, zobrazi se vsechny)*/
  rangeCount : 0,       /**< Pocet vybranych range. */
    
  /**
   * @returns true, pokud existuje dalsi range, jinak false
   */ 
  checkNext : function()
  {
    if (this.activeRange >= (this.rangeCount - 1) || this.rangeCount == 0)
    {
      return false;
    }
    
    return true;
  },
  
  /**
   * @returns true, pokud existuje predchozi range, jinak false
   */ 
  checkPrevious : function()
  {
    if (this.activeRange <= -1 || this.rangeCount == 0)
    {
      return false;
    }
    
    return true;
  },
  
     /**
   * Zobrazi v anotacnim okne dalsi nebo predchozi range, pokud je.
   * @param direction {string} Pokud je "next" zobrazi dalsi, pokud "previous", predchozi.
   */ 
  showRange : function(direction)
  {
    //Obsahuje text "All" nebo "Vse" - pro zobrazeni mezi sipkami
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    
    var selRangeText = "";  /**< Text - jaky range je vybran.*/
    var selection = "";     /**< Obsahuje range(s), ktery se ma zobrazit v anotacnim okne. */
    
    if (direction == 'next')
    {
      //Je moznost posunout se na dalsi.
      if (this.checkNext() == true)
      {
        this.activeRange += 1;
      }
      else
      //Umozni "cykleni", pokud je zobrazen posledni vyber, zobrazi vsechny..
      {
        this.activeRange = -1;
      }
    }
    else if(direction == 'previous')
    {
      //Je moznost posunout se na predchozi.
      if (this.checkPrevious() == true)
      {        
        this.activeRange -= 1;
      }
      else
      //Umozni "cykleni", pokud jsou zobrazeny vsechny range, zobrazi posledni..
      {
        this.activeRange = this.rangeCount - 1;
      }
    }
    
    //Zobraz v okne aktualni vyber
    if (this.activeRange == -1)
    //Chci zobrazit vsechny vybery, mezi sipkama se zobrazi text: "all".
    {
      selRangeText = stringBundle.getString("annotationextension.aeSelectedText.selectedText.all");
      selection = this.allRanges; 
    }
    else
    {
      selRangeText = eval(this.activeRange + 1) + "/" + this.rangeCount;
      selection = this.highlightText.getRangeAt(this.activeRange).toString();
    }
    
    this.selRangeText = selRangeText;
    this.selectedRanges = selection;
    
    let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    observerService.notifyObservers(null, "annotationextension-textSelected", null);
  },
  
  /**
   * Zobrazi v textboxu vybrany range
   * @param {int} rangeNumber, poradi range, ktere se ma vybrat
   *                          -1 = vsechny range
   */
  showExactRange : function(rangeNumber)
  {
    try
    {        
      this.activeRange = rangeNumber;
       //Obsahuje text "All" nebo "Vse" - pro zobrazeni mezi sipkami
      let stringBundle = document.getElementById("annotationextension-string-bundle");
      
      var selRangeText = "";  /**< Text - jaky range je vybran.*/
      var selection = "";     /**< Obsahuje range(s), ktery se ma zobrazit v anotacnim okne. */
      
      //Zobraz v okne aktualni vyber
      if (this.activeRange == -1)
      //Chci zobrazit vsechny vybery, mezi sipkama se zobrazi text: "all".
      {
        selRangeText = stringBundle.getString("annotationextension.aeSelectedText.selectedText.all");
        selection = this.allRanges; 
      }
      else
      {
        selRangeText = eval(this.activeRange + 1) + "/" + this.rangeCount;
        if(this.rangeCount > this.activeRange)
          selection = this.highlightText.getRangeAt(this.activeRange).toString();
      }
      
      this.selRangeText = selRangeText;
      this.selectedRanges = selection;
    
      let observerService = Cc["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.notifyObservers(null, "annotationextension-textSelected", null);
    }
    catch(ex)
    {
      alert('selectedText : showExactRange:\n' + ex.message);
    }
  },
  
  /**
   * Spoji protinajici se range ve vybranem textu na strance
   */
  mergeIntersectRangesInHighlightText : function()
  {
    var textSelection = window.content.getSelection();  /**< Vybrany text v dokumentu. */
    var textSelectionCount = textSelection.rangeCount;
    var newRanges = [];
    
    if (textSelection.rangeCount < 1)
      return;
    
    newRanges.push(textSelection.getRangeAt(0));
    textSelection.removeRange(textSelection.getRangeAt(0));
    
    var range1, range2, compare;
    
    while (textSelection.rangeCount > 0)
    {
      //Ulozeni ranges pro pripadne obnoveni
      range1 = newRanges.pop();
      range2 = textSelection.getRangeAt(0);
      
      compare = range1.compareBoundaryPoints(Range.START_TO_END, range2);   
      if (compare == 1)
      {//End 1. je za start 2. (protinaji se)
        newRanges.push(annotationExtensionChrome.rangeCreator.joinTwoRanges(range1, range2));
      }
      else
      {
        newRanges.push(range1);
        newRanges.push(range2);
      }
      
      textSelection.removeRange(textSelection.getRangeAt(0));
    }
    
    textSelection.removeAllRanges();
    for (var i = 0; i < newRanges.length; i++)
      textSelection.addRange(newRanges[i]);
  },
  
  /**
   * Odstrani aktivni(vybrany)range.
   */
  removeActiveRange : function()
  {
    var aeSelectedText = annotationExtensionChrome.selectedText;
    
    var textSelection = window.content.getSelection();  /**< Vybrany text v dokumentu. */
    var textSelectionCount = textSelection.rangeCount;
    
    if (textSelection.rangeCount < 1)
      return;
    
    if (aeSelectedText.activeRange == -1)
      textSelection.removeAllRanges();
    else
      textSelection.removeRange(textSelection.getRangeAt(aeSelectedText.activeRange));
      
    aeSelectedText.selectText();
  }
};