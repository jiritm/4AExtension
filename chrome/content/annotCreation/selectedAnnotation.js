/**
 * Soubor: textSelection.js
 * Autor: Jiri Trhlik
 * Datum: 6.2.2011
 * Popis: Funkce pro vyber anotace do textboxu vyberu textu - pri editaci anotace.
 *        Ulozeni jednotlivych anotaci pro atribut
 * Posledni uprava: 5.6.2012
 */

/**
 * Konstruktor
 */
annotationExtensionChrome.selectedAnnotation = function(uri)
{
  //Inicializace
  this.annotations = new Array();
  this.uri = uri;
  this.activeAnnotation = 0;
};

annotationExtensionChrome.selectedAnnotation.prototype =
{
  multipleAnnotation : true,
  aLinks : false,
  uri : null,
  annotations : null,     /**< Pole anotaci (v anotaci je vice vnorenych anotaci se stejnym nazvem
                                            kazda anotace bude pri editaci zde).
                              Pokud jsou v atributu vnorene anotace pole obsahuje objekty Annotations
                              - kazda anotace muze mit pouze jeden range.
                              Pokud jsou v atributu odkazy (aLink) pole obsahuje retezce "aLinku" */
  
  activeAnnotation : 0,  /**< Prave zobrazena anotace v textboxu. */
  
  /**
   * Pocet anotaci ve vyberu
   * @returns {Int} this.annotations.length
   */
  len : function()
  {
    return this.annotations.length;
  },
  
  /**
   * Vrátí anotaci z pole annotations
   * @params {Int} index, index anotace v annotations
   */
  getAnnotation : function(index)
  {
    if (index >= 0 && index < this.len())
    {
      return this.annotations[index];
    }
    else
      return null;
  },
  
  /**
   * Nastaveni objektu, ze obsahuje odkazy na anotace
   */
  setALink : function()
  {
    this.aLinks = true;
  },
  
  /**
   * Zda objekt obsahuje odkazy na anotace
   */
  isALink : function()
  {
    return this.aLinks;
  },
  
  /**
   * Prida anotoci do vyberu
   * @param {Annotation} annot, anotace, ktera se ma pridat do vyberu
   * @param {Int} selectAnnot, jaka anotace se ma po vlozeni vybrat
   *              -1 vsechny
   *              0 prave vlozena
   *              jinak se neprovede nic
   * @param {Bool} showButtons, pokud se ma pokusit pri pridani zobrazit i tlacitka
   *               na vyber anotace apod. (pokud pridavam anotaci pokud vybiram
   *               vnorenou nastavuje se na false)
   */
  addAnnotation : function(annot, selecAnnot)
  {
    this.annotations.push(annot);
    
    if (selecAnnot != undefined)
    {
      if (selecAnnot == -1)
        this.showExactAnnotation(-1);
      else if (selecAnnot == 0)
        this.showExactAnnotation(this.len() - 1);
    }
  },
  
  /**
   * Prida prazdnou anotoci do vyberu a da uzivateli vybrat text
   * (simuluje kliknuti na tlacitko vybrat text anotace)
   */
  addAnnotationAndClickSelectButton : function()
  {
    if (this.isALink())
    {
      var annotationObj = "";
      this.addAnnotation(annotationObj, 0);
    }
    else
    {
      var annotationObj = new annotationExtensionChrome.annotation("");
      annotationObj.selectedRange = 0;
      annotationObj.fragments = new annotationExtensionChrome.fragments(null, null);
      annotationObj.ranges = new Array();
      this.addAnnotation(annotationObj, 0);
    }
    
    annotationExtensionChrome.bottomAnnotationWindow.selectNestedAnnotation(this.uri);
  },
  
  /**
   * Smaze anotoci z vyberu
   * @param {Annotation} annot, anotace, ktera se ma pridat do vyberu
   */
  deleteAnnotation : function(index)
  {
    if (index >= 0 && index < this.len())
    {
      this.annotations.splice(index, 1);
      
      if (this.len() <= 1)
      {
        this.activeAnnotation = 0;
        this.hideSelectAnnotBoxForSelectAnnotation();
      }
      else if (index == this.activeAnnotation || this.activeAnnotation >= this.len())
      {
        this.activeAnnotation = -1;
      }
      
      if (this.len() > 0) //Existuje alespon jedna anotace
        this.showExactAnnotation(this.activeAnnotation);
      else
        this.setSelectedText("");
        
      if (this.len() <= 0)
      {
        this.hideDeleteButton();
        this.hideSelectNestedButton();
        if(this.isALink())
          deleteALinkFromUiById(this.uri);
      }
    }
  },
  
  /**
   * Smaze aktivni anotoci z vyberu
   */
  deleteActiveAnnotation : function()
  {
    if (this.activeAnnotation == -1)
      this.deleteAllAnnotations();
    else
      this.deleteAnnotation(this.activeAnnotation);
  },
  
  /**
   * Smaze vsechny anotace ve vyberu
   * @param {Annotation} annot, anotace, ktera se ma pridat do vyberu
   */
  deleteAllAnnotations : function()
  {
    this.annotations = [];
    this.activeAnnotation = 0;
    this.hideSelectAnnotBoxForSelectAnnotation();
    this.hideDeleteButton();
    this.hideSelectNestedButton();
    this.setSelectedText("");
    if(this.isALink())
      deleteALinkFromUiById(this.uri);
  },
  
  /**
   * Ulozi vybranou anotaci
   */
  saveActiveAnnotation : function()
  {
    if (this.activeAnnotation >= 0 && this.activeAnnotation < this.len())
    {
      if (this.isALink())
      {
        var activeAnnot = this.getAnnotation(this.activeAnnotation);
        if (activeAnnot == "")
          this.deleteActiveAnnotation();
          
        if (this.len() > 1)
          this.showSelectAnnotBoxForSelectAnnotation();
        
        this.showAddDeleteBox();
        if (this.len <= 0)
          this.hideDeleteButton();
        if (this.activeAnnotation >= 0 && this.activeAnnotation < this.len())
        {
          this.showAddDeleteBox();
          this.showDeleteButton();
        }
        
        this.showExactAnnotation(this.activeAnnotation);
      }
      else
      {
        var deleteAnnot = false;
        if (annotationExtensionChrome.selectedText.allRanges == "")
        {//Neni nic vybrano, chci smazat tuto anotaci
          this.deleteAnnotation(this.activeAnnotation);
          deleteAnnot = true;
        }
        
        if (this.len() > 1)
          this.showSelectAnnotBoxForSelectAnnotation();
          
        this.showAddDeleteBox();
        if (this.len <= 0)
          this.hideDeleteButton();
          
        if (deleteAnnot)
          return;
        
        this.annotations[this.activeAnnotation].selectedRange = 0;
        this.annotations[this.activeAnnotation].ranges = annotationExtensionChrome.selectedText.ranges;
        //V podstate se vzdy ulozi pouze prvni range
        var selRanges = this.annotations[this.activeAnnotation].ranges;
        this.annotations[this.activeAnnotation].fragments = new annotationExtensionChrome.fragments(selRanges, 0);
      }
    }
  },
  
  /**
   * "Obnovi" prave vybranou anotaci -> vyber textu na strance pro anotaci
   * vola se pokud vybiram text pro anotaci
   */
  restoreActiveAnnotation : function()
  {
    if (this.activeAnnotation >= 0 && this.activeAnnotation < this.len())
    {
      if (this.isALink())
      {
        this.hideSelectAnnotBoxForSelectAnnotation();
        this.hideAddDeleteBox();
      }
      else
      {
        this.hideSelectAnnotBoxForSelectAnnotation();
        this.hideAddDeleteBox();
        
        var selection = window.content.getSelection();
        selection.removeAllRanges();
        
        var savedAnnotation = this.getAnnotation(this.activeAnnotation);
        
        if (savedAnnotation != null && savedAnnotation.fragments != undefined && savedAnnotation.fragments != null)
        {
          var ranges = new Array();
            
          for (var i = 0; i < savedAnnotation.fragments.rangesFragments.length; i++)
          {
            var oneRange = annotationExtensionChrome.rangeCreator.createRangeFromFragments(savedAnnotation.fragments.rangesFragments[i]);
            if (oneRange != null)
              ranges.push(oneRange);
          }  
          
          for (var i = 0; i < ranges.length; i++)
          {
            selection.addRange(ranges[i]);
          }
        }
    
        annotationExtensionChrome.selectedText.selectText();
      }
    }
  },
  
  /**
   * Nastavi vybrane anotaci aLink
   * @param {String} aLink, alink, ktery se nastavi
   */
  setALinkToActiveAnnotation : function(aLink)
  {
    if (this.activeAnnotation >= 0 && this.activeAnnotation < this.len())
    {
      this.annotations[this.activeAnnotation] = aLink;
    }
  },
  
  /**
   * @returns true, pokud existuje dalsi anotace k zobrazeni, jinak false
   */ 
  checkNext : function()
  {
    if (this.activeAnnotation >= (this.len() - 1) || this.len() == 0)
    {
      return false;
    }
    
    return true;
  },
  
  /**
   * @returns true, pokud existuje predchozi anotace k zobrazeni, jinak false
   */ 
  checkPrevious : function()
  {
    if (this.activeAnnotation <= -1 || this.len() == 0)
    {
      return false;
    }
    
    return true;
  },
  
  /**
   * Zobrazi v anotacnim okne dalsi nebo predchozi anotaci, pokud je.
   * @param direction {string} Pokud je "next" zobrazi dalsi, pokud "previous", predchozi.
   */ 
  showAnnotation : function(direction)
  {    
    if (direction == 'next')
    {
      //Je moznost posunout se na dalsi.
      if (this.checkNext() == true)
      {
        this.activeAnnotation += 1;
      }
      else
      //Umozni "cykleni", pokud je zobrazena posledni anotace, zobrazi vsechny..
      {
        this.activeAnnotation = -1;
      }
    }
    else if(direction == 'previous')
    {
      //Je moznost posunout se na predchozi.
      if (this.checkPrevious() == true)
      {        
        this.activeAnnotation -= 1;
      }
      else
      //Umozni "cykleni", pokud jsou zobrazeny vsechny anotace, zobrazi posledni..
      {
        this.activeAnnotation = this.len() - 1;
      }
    }
    
    this.showExactAnnotation(this.activeAnnotation);
  },
  
  /**
   * Zobrazi v textboxu vybranou anotaci
   * @param {int} annotNumber, poradi anotace, ktere se ma vybrat (z pole annotations)
   *                          -1 = vsechny anotace
   */
  showExactAnnotation : function(annotNumber)
  {
    try
    {
      if (annotNumber < -1 || annotNumber >= this.len())
      {
        return;
      }
      
      this.activeAnnotation = annotNumber;
       //Obsahuje text "All" nebo "Vse" - pro zobrazeni mezi sipkami
      let stringBundle = document.getElementById("annotationextension-string-bundle");
      
      var selAnnotText = "";  /**< Text - jaka annot je vybrana.*/
      var selection = "";     /**< Obsahuje range(s), ktery se ma zobrazit v anotacnim okne. */
      
      //Zobraz v okne aktualni vyber
      if (this.activeAnnotation == -1)
      //Chci zobrazit vsechny anotace, mezi sipkama se zobrazi text: "all".
      {
        selAnnotText = stringBundle.getString("annotationextension.aeSelectedText.selectedText.all");
        if (this.isALink())
        {
          if (this.len() > 0)
            setALinkToUiById(this.uri, this.annotations);
        }
        else
        {
          selection = this.getAllAnnotationsText();
          //Pokud mam zobrazeno vse, neni mozne upravovat vyber...
          this.hideSelectNestedButton();
          this.setSelectedText(selection);
        }
        
        if (this.len() > 1)
          this.showSelectAnnotBoxForSelectAnnotation();
    
        this.showAddDeleteBox();
        this.showDeleteButton();
        this.hideSelectNestedButton();
      }
      else
      {
        selAnnotText = eval(this.activeAnnotation + 1) + "/" + this.len();
        if (this.isALink())
        {
          var annot = this.getAnnotation(this.activeAnnotation);
          if (annot != "")
            setALinkToUiById(this.uri, [this.annotations[this.activeAnnotation]]);
          else
            deleteALinkFromUiById();
        }
        else
        {
          if(this.len() > this.activeAnnotation)
            selection = this.getAnnotationText(this.activeAnnotation);
          this.setSelectedText(selection);
        }
    
        if (this.len() > 1)
          this.showSelectAnnotBoxForSelectAnnotation();
    
        this.showAddDeleteBox();
        this.showDeleteButton();
        this.showSelectNestedButton();
      }
      
      this.setAnnotSelectedLabel(selAnnotText);
      
    }
    catch(ex)
    {
      alert('selectedAnnotation : showExactAnnotation:\n' + ex.message);
    }
  },
  
  /**
   * Nastavi uziv. rozhrani atributu mezi sipkami text
   * @param {String} selAnnotText, text, ktery se nastavi
   */
  setAnnotSelectedLabel : function(selAnnotText)
  {
    if (this.uri == "")
      var annotSelectLabel = 'aeSelectedAnnotLabel';
    else
      var annotSelectLabel = this.uri + '-aeSelectedAnnotLabel-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID();

    document.getElementById(annotSelectLabel).setAttribute('value', selAnnotText);
  },
  
  /**
   * Nastavi atributu do textboxu text
   * @param {String} selection, text, ktery se nastavi
   */
  setSelectedText : function(selection)
  {
    if (this.uri == "")
      var textboxID = 'aeSelectedText';
    else
      var textboxID = this.uri + '-textbox1-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID();
    
    document.getElementById(textboxID).value = selection;
  },
  
  /**
   * Vrati retezec vsech vyberu anotaci oddelene oddelovacem z nastaveni
   * @returns {String} *
   */
  getAllAnnotationsText : function()
  {
    //TODO: pokud by bylo potreba dodelat pro aLinky
    if (this.isALink())
      return "";
    
    var text = "";
    var separ = ""; /**< Oddelovac jednotlivych anotaci (pokud jsou zobrazeny vsechny) */
    
    if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "newline")
    {
      separ = "\n";
    }
    else if (annotationExtensionChrome.browserOverlay.preferences.getCharPref("separateMode") == "space")
    {
      separ = " ";
    }
    
    //Ulozeni textu vsech anotaci do jedne promenne
    for(var i = 0; i < this.len(); i++)
    {
      text += this.getAnnotationText(i) + separ;
    }
    
    return text;
  },
  
  /**
   * Vrati text vyberu anotace
   * @returns {String}
   */
  getAnnotationText : function(index)
  {
    //TODO: pokud by bylo potreba dodelat pro aLinky
    if (this.isALink())
      return "";
    
    if (index >= 0 && index < this.len())
    {
      try
      {
        if (this.annotations[index].ranges.length <= 0)
          return "";
        var text = this.annotations[index].ranges[0].toString();
        if (text == undefined || text == null)
          return "";
        else
          return text;
      }
      catch(ex)
      {
        return "";  
      }
    }
    else
      return "";
  },
  
  /**
   * Zobrazi v okne sipky pro vyber range, kterymi se bude vybirat anotace - v atributu
   * je vice anotaci (se stejnym nazvem).
   */
  showSelectAnnotBoxForSelectAnnotation : function()
  {
    if (this.uri == "")
    {
      if(annotationExtensionChrome.bottomAnnotationWindow.documentAnnotation == true)
        return;
      var box = document.getElementById("aeSelectAnnotBox");
    }
    else
      var box = document.getElementById(this.uri + '-aeSelectAnnotBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());

    if (box != null)
    {
      var thisObject = this;
      box.setAttribute("hidden", "false"); 
    }
  },
  
  /**
   * Skryje v okne sipky pro vyber range
   * (sipkam se priradi zpet funkce pro vyber range)
   */
  hideSelectAnnotBoxForSelectAnnotation : function()
  {
    if (this.uri == "")
      var box = document.getElementById("aeSelectAnnotBox");
    else
      var box = document.getElementById(this.uri + '-aeSelectAnnotBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (box != null)
    {
      box.setAttribute("hidden", "true"); 
    }
  },
  
  /**
   * Zobrazi element, ktery obsahuje tlacitko pro pridani a mazani
   * "vicenasobne" anotace v atributu
   */
  showAddDeleteBox : function()
  {
    if (this.uri == "")
    {
      if(annotationExtensionChrome.bottomAnnotationWindow.documentAnnotation == true)
        return;
      var box = document.getElementById("aeAddDeleteAnnotBox");
    }
    else
      var box = document.getElementById(this.uri + '-aeAddDeleteAnnotBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());

    if (box != null)
    {
      var thisObject = this;
      box.setAttribute("hidden", "false"); 
    }
  },
  
  /**
   * Skryje v okne sipky pro vyber range
   * (sipkam se priradi zpet funkce pro vyber range)
   */
  hideAddDeleteBox : function()
  {
    if (this.uri == "")
      var box = document.getElementById("aeAddDeleteAnnotBox");
    else
      var box = document.getElementById(this.uri + '-aeAddDeleteAnnotBox-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (box != null)
    {
      box.setAttribute("hidden", "true"); 
    }
  },
  
  /**
   * Zobrazi element pro mazani anotace z "vicenasobne" anotace v atributu
   */
  showDeleteButton : function()
  {
    if (this.uri == "")
      var button = document.getElementById("aeDeleteAnnotSelection");
    else
      var button = document.getElementById(this.uri + '-aeDeleteAnnotSelection-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (button != null)
    {
      button.setAttribute("hidden", "false"); 
    }
  },
  
  /**
   * Skryje element pro mazani anotace z "vicenasobne" anotace v atributu
   */
  hideDeleteButton : function()
  {
    if (this.uri == "")
      var button = document.getElementById("aeDeleteAnnotSelection");
    else
      var button = document.getElementById(this.uri + '-aeDeleteAnnotSelection-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (button != null)
    {
      button.setAttribute("hidden", "true"); 
    }
  },
  
  /**
   * Skryje element pro vyber textu anotace z "vicenasobne" anotace v atributu
   */
  hideSelectNestedButton : function()
  {
    var selectNestedButton = document.getElementById(this.uri+'selectNestedButton-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    selectNestedButton.setAttribute("hidden", "true");
  },
  
  /**
   * Zobrazi element pro vyber textu anotace z "vicenasobne" anotace v atributu
   */
  showSelectNestedButton : function()
  {
    var selectNestedButton = document.getElementById(this.uri+'selectNestedButton-'+annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    selectNestedButton.setAttribute("hidden", "false");
  }
};
