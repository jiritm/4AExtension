/**
 * Soubor: browseOverlay.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro browserOverlay.xul
 *        Importuje vsechny .jsm
 *        Zobrazeni/Skryti okna a inicializace nekterych casti doplnku.
 * Posledni uprava: 5.6.2012
 */

//Moduly potrebne po celou dobu prace anotacniho doplnku
Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/users.jsm");
Components.utils.import("resource://annotationextension/user.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");
Components.utils.import("resource://annotationextension/typesStorageService.jsm");

annotationExtensionChrome.browserOverlay = {

  /**
   * Zavola se pri otevreni noveho window(pomoci addEventListener)
   */
  init : function()
  {
    annotationExtension.windowCount++;
    
    //Nacteni meho nastaveni
    this.preferences = Components.classes["@mozilla.org/preferences-service;1"].
      getService(Components.interfaces.nsIPrefService).
      getBranch("extensions.annotationextension.");
    
  
    if (!this.preferences.getBoolPref("firstRun"))
    {  
      this.preferences.setBoolPref("firstRun", true);    
      // The "addon-bar" is available since Firefox 4  
      this.installButton("addon-bar", "aeButton");  
    }  
    
    var h;
    //Jak se urci velikost anotacniho okna (defaultni velikost nebo naposledy nastavena velikost)
    if (this.preferences.getCharPref("heightMode") == "previous")
    {
      h = this.preferences.getIntPref("previousHeight");
    }
    else
    {
      //Velikost okna je default
      h = this.preferences.getIntPref("defaultHeight");
    }
      
    //Nastavi vysku anotacniho okna
    document.getElementById('aeBottomWindow').setAttribute('height', h);
            
    var startupMode = this.preferences.getCharPref("startupMode");
    var status;
    
    if (startupMode == "open")
    {
      status = "show";
    }
    else if (startupMode == "close")
    {
      status = "hide";
    }
    else
    {
      //Urci, zda anotacni okno bylo otevrene nebo zavrene
      if (this.preferences.getBoolPref("isOpenedAtShutdown"))
      {
        status = "show";
      }
      else
      {
        status = "hide";
      }
    }
      
    this.setShowingStatus(status);
    
    annotationExtensionChrome.alerts.init();
    annotationExtensionChrome.user.init();
    annotationExtensionChrome.statusBar.init();
  },
    
  showStatus : false,         /**< Status, zda je anotacni okno zobrazeno. */
  sidebarShowStatus : false,  /**< Status, zda je otevreny sidebar. */
  lastSidebarShowStatus : null,  /**< Pokud se zavre a otevre anotacni okno, sidebar se otevre podle teto hodnoty. */ 
  preferences : null,         /**< Nastaveni. */


  /**
   * Prida ikonu do addon baru
   */
  installButton : function(toolbarId, id, afterId)
  {
    if (!document.getElementById(id))
    {  
        var toolbar = document.getElementById(toolbarId);  
  
        // If no afterId is given, then append the item to the toolbar  
        var before = null;  
        if (afterId) {  
            let elem = document.getElementById(afterId);  
            if (elem && elem.parentNode == toolbar)  
                before = elem.nextElementSibling;  
        }  
  
        toolbar.insertItem(id, before);  
        toolbar.setAttribute("currentset", toolbar.currentSet);  
        document.persist(toolbar.id, "currentset");  
  
        if (toolbarId == "addon-bar")  
            toolbar.collapsed = false;  
    }  
  },
  
  /**
   * Preklopi zobrazeni okna anotace
   */
  toggleAnnotationWindow : function()
  {
    try
    {
      //TODO: tohle premistit nekam jinam
      var attrTree = document.getElementById('aeAttrTree');
      if (attrTree.view != null)
        attrTree.view.selection.select(-1);
        
      if (this.showStatus)
      {//Okno je zobrazene -> skryj
        this.lastSidebarShowStatus = this.sidebarShowStatus;
        this.toggleAnnotationSidebar(false);
        
        this.setShowingStatus('hide');
        if (annotationExtension.user.isLogged)
          annotationExtensionChrome.bottomAnnotationWindow.windowClosed();  
      }
      else
      {//Okno je skryte -> zobraz
        if (this.lastSidebarShowStatus)
          this.toggleAnnotationSidebar(true);
          
        this.setShowingStatus('show');
        if (annotationExtension.user.isLogged)
          annotationExtensionChrome.bottomAnnotationWindow.windowOpened();
      }
    }
    catch(ex)
    {
      alert('browserOverlay : toggleAnnotationWindow:\n' + ex.message);
    }
  },

  /**
   * "Zobrazi" anotacni okno podle parametru status
   * @param status - pokud je show, zobrazi okno, pokud je hide, skryje okno
   */
  setShowingStatus : function(status)
  {
    var hideFlag = false; /**< Defaultne se anotacni okno zobrazi. */
      
    if (status == 'hide')
    {
      //Schovej anotacni okno
      hideFlag = true;   
    }
    else
    {
      //Otevri anotacni okno
      if (this.preferences.getCharPref("heightMode") == "default")
      {
        //Pokud je pri otevreni anotacniho okna nastavena velikost na default
        var h = this.preferences.getIntPref("defaultHeight");
        document.getElementById('aeBottomWindow').setAttribute('height', h);
      }
    }
  
    //Zobrazeni nebo skryti elementu anotacniho okna 
    document.getElementById('aeBottomSplitter').setAttribute('hidden', hideFlag);
    document.getElementById('aeBottomWindow').setAttribute('hidden', hideFlag);
    document.getElementById('aeViewMenu').setAttribute('checked', !hideFlag);
    //Prenastav indikator otevreni okna
    this.showStatus = !hideFlag;
  },
  
  /**
   * Preklopi sidebar
   * @param {Bool} open, pokud je nastaveny zavre/otevre sidebar podle hodnoty
   */
  toggleAnnotationSidebar : function(open)
  {
    var annotationSidebar =  document.getElementById('aeSidebar');
    var annotationSidebarButton = document.getElementById('aeToggleAnnotationSidebarButton');
    var annotationSidebarSplitter = document.getElementById('aeSidebarSplitter');
    if (open != undefined && open != null)
    {
      annotationSidebar.hidden = !open;
      annotationSidebarSplitter.hidden = !open;
      this.sidebarShowStatus = open;
      
      if (open) annotationSidebarButton.className = "aeHideSidebarButton";
      else annotationSidebarButton.className = "aeShowSidebarButton";
    }
    else
    {
      if (this.sidebarShowStatus)
      {//Sidebar je zobrazeny -> skryj
        annotationSidebar.hidden = true;
        annotationSidebarSplitter.hidden = true;
        this.sidebarShowStatus = false;
        annotationSidebarButton.className = "aeShowSidebarButton";
      }
      else
      {//Sidebar je skryty -> zobraz
        annotationSidebar.hidden = false;
        annotationSidebarSplitter.hidden = false;
        this.sidebarShowStatus = true;
        annotationSidebarButton.className = "aeHideSidebarButton";
      }
    }
    
    if (!this.sidebarShowStatus)
    {
      closeDocumentAnnotationsNestedAnnotations(annotationExtensionChrome.annotationsView.ANNOTATIONS,
                                                annotationExtensionChrome.annotationsView.frame_doc);
    }
  },


  /**
   * Zobrazi okno s nastavenim
   */
  openPrefWindow : function()
  {
    var instantApply;
    try
    {
      instantApply = this.preferences("browser.preferences.instantApply");
    }
    catch(e)
    {
      instantApply = false;
    }
    window.openDialog("chrome://annotationextension/content/annotCreation/config.xul",
      "annotationextension:Options",
      "resizable,chrome,titlebar,toolbar,centerscreen" + (instantApply ? "dialog=no" : "modal"));
  },

  /**
   * Zavola se pri zavreni window
   */
  destroy : function()
  {
    annotationExtension.windowCount--;
    
    //Uloz velikost anotacniho okna
    var h = document.getElementById('aeBottomWindow').getAttribute('height');
    this.preferences.setIntPref("previousHeight", h);

    //Uloz stav anotacniho okna - zavrene/otevrene
    if (this.showStatus)
    {
      this.preferences.setBoolPref("isOpenedAtShutdown", true);
    }
    else
    {
      this.preferences.setBoolPref("isOpenedAtShutdown", false);
    }
    
    annotationExtensionChrome.user.destroy();
    annotationExtensionChrome.alerts.destroy();
    
    if (annotationExtension.windowCount == 0)
    {//Zavreno posledni okno
      annotationExtension.typesStorageService.destroy();
    }
  }
};

/**
 * Vytvoreni a zavreni anotacniho okna -pri otevreni/zavreni window browseru
 */
window.addEventListener(
  "load", function(){ annotationExtensionChrome.browserOverlay.init(); }, false);
window.addEventListener(
  "unload", function(){ annotationExtensionChrome.browserOverlay.destroy(); }, false);