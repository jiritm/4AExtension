/**
 * Soubor: annotationWindow.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Funkce anotacniho okna.
 *  Posledni uprava: 5.6.2012
 */

//Ulozene okna pro zalozky, pole objektu AnnotationWindow
annotationExtensionChrome.tabs = [];

annotationExtensionChrome.bottomAnnotationWindow =
{
  annotation : null,            /**< Objekt typu annotation. Pro ulozeni anotace(hodnot z poli UI a fragmentu). */
  selectedTypeName : "",        /**< Hodnota vybraneho typu. (Zobrazena v textboxu vybraneho typu)*/
  selectedTypeURI : "",         /**< URI vybraneho typu. */
  selectingNested : false,      /**< Pokud je true, text se vybira pro vnorenou anotaci podle nestedAnnotationUIID. */
  nestedAnnotationUIID : null,  /**< ID rozhrani, pro ktere se vybira vnorena anotace. */
  documentAnnotation : false,   /**< Zda se anotuje cely dokument. */
  selectedTab : null,           /**< Reference na aktualne vybranou zalozku. */
  
  editing : false,              /**< Indikace, zda se aktualne edituje nejaka anotace. */
  editingAnnotID : null,        /**< Pokud se edituje anotace, je zde ulozene jeji ID. */
  
  editingAnnotTmpId : null,     /**< Pokud se edituje nabidnuta anotace, je zde ulozene jeji tmpId. */
  
  annotsAreHiddenForALink : false,  /**< Nastavi se, pokud se pri vyberu vnorene anotace skryji v dokumentu
                                     *   anotace, ale zustanou jen anotace pro vyber aLinku. */
  annotsALinkType : null,           /**< Pokud je annotsAreHiddenForALink true, zde je ulozen typ pro aLink
                                     *   (typ vnorene anotace), jinak null. */
  
  isSuggestAnnotationsPanelOpened : false, /**< Zda je otevreny box pro zadost o nabidky anotaci. */
                      
  /**
   * Vola se v annotationExtensionChrome.user.loggedOn() - soubor user.js
   */
  init : function()
  {
    try
    {
      annotationExtensionChrome.statusBar.setTextToBar(annotationExtensionChrome.statusBar.annotationText + ' - ' + annotationExtension.user.username);

      let observerService = Components.classes["@mozilla.org/observer-service;1"].
         getService(Components.interfaces.nsIObserverService);  
      observerService.addObserver(this, "annotationextension-client-topic", false);
      observerService.addObserver(this, "annotationextension-settingsChange-topic", false);
      observerService.addObserver(this, "annotationextension-textSelected", false);
  
      //Tento datasource uklada atributy k typum
      annotationExtensionChrome.typeAttrDatasource = new annotationExtensionChrome.Datasource('typesAttr', [{ type : 'annotAttr', props : ['name', 'type', 'def', 'req', 'struct', 'comment']}]);
      
      //Tento datasource se stara o "zobrazeni" atributu aktualne vybraneho typu
      annotationExtensionChrome.attrDatasource = new annotationExtensionChrome.TreeDatasource('aeAttrTree', 'attr', null, [{ type : 'annotAttrAnnotExt', props : ['name', 'type', 'req', 'def', 'struct', 'attrTypeURI', 'aLink', 'edited', 'comment']}]);
      annotationExtensionChrome.attrDatasource.masterRootName = 'attr';
      annotationExtensionChrome.attrDatasource.datasource.masterRootName = 'attr';
    
      //Tento datasource uklada typy anotaci.
      annotationExtensionChrome.typesDatasource = new annotationExtensionChrome.TypesDatasource('types',
                                                  [{ type : 'annotType', props : ['name', 'ancestor', 'group', 'ancestorsArray', 'comment']},
                                                   { type : 'annotTypeRef', props : ['name', 'primaryURI', 'comment']}]); 

      //Inicializace typu, pozadej server o typy
      annotationExtensionChrome.client.queryTypes();

      //Vytvoreni objektu pro ulozeni anotace.
      this.annotation = new annotationExtensionChrome.annotation('');

      //Zahajeni long polling comet.
      annotationExtensionChrome.client.sendCometMessage();

      //Udalost zmeny zalozky v okne Firefoxu.
      var container = gBrowser.tabContainer;
      container.addEventListener("TabClose", this.tabRemoved, false);

      annotationExtensionChrome.annotationsView.turnOn();
      
      this.createAeTabs();
          
      if (annotationExtensionChrome.browserOverlay.showStatus)
      {
        //Zpracovani udalosti zvednuti tlacitka = vybran text k anotovani
        this.setTextSelectionListener(!this.editing);
            
        //Synchronizace aktualne zobrazenho dokumentu
        annotationExtensionChrome.annotationsView.initForNewDocument();
        this.initSyncForCurrentBrowser(false);
          
        var container = gBrowser.tabContainer;
        container.addEventListener("TabSelect", this.tabSelected, false);
            
        //Pokud je vybran text zobraz ho
        if (this.editing == true)
          annotationExtensionChrome.selectedText.selectTextOnlyFirstRange(); 
        else
          annotationExtensionChrome.selectedText.selectText();
      }
      //Skryj strom s atributy(neni vybran zadny typ).
      //var tree = document.getElementById('aeAttrTree');
      //if (tree != null)
      //  tree.setAttribute('ref', '');  
    }
    catch(ex)
    {
      alert('annotationWindow.js : init:\n' + ex.message);
    }
  },
  
  /**
   * Vola se pri odhlaseni
   */
  destroy : function()
  {
    let observerService = Components.classes["@mozilla.org/observer-service;1"].
      getService(Components.interfaces.nsIObserverService);  
    observerService.removeObserver(this, "annotationextension-client-topic");
    observerService.removeObserver(this, "annotationextension-settingsChange-topic");
    observerService.removeObserver(this, "annotationextension-textSelected");
  
    this.removeTextSelectionListener();
    
    var container = gBrowser.tabContainer;
    container.removeEventListener("TabSelect", this.tabSelected, false);
    container.removeEventListener("TabClose", this.tabRemoved, false);
    
    this.removeListenersFromBrowsers();
    
    //Neni nic synchronizovani
    annotationExtensionChrome.document.clear();
    
    this.clearAll();
    this.destroyDatasources();
    
    annotationExtensionChrome.annotationsView.turnOff();
    
    annotationExtensionChrome.settings.clear();
  },
  
  //Vola se v browserOverlay.js toggleAnnotationWindow()
  windowClosed : function()
  {
    this.removeTextSelectionListener();
    
    var container = gBrowser.tabContainer;
    container.removeEventListener("TabSelect", this.tabSelected, false);
    
    this.removeListenersFromBrowsers();
    
    //Neni nic synchronizovano
    annotationExtensionChrome.document.clear();
    //Zablokovani tlacitka odesilani anotace do uspesne synchronizace dokumentu
    var saveButtonDeck = document.getElementById('aeSaveButtonDeck');
    saveButtonDeck.selectedIndex = "1";
    
    annotationExtensionChrome.annotationsView.turnOff();
  },
  
  //Vola se v browserOverlay.js toggleAnnotationWindow()
  windowOpened : function()
  {
    //Zpracovani udalosti zvednuti tlacitka = vybran text k anotovani
    this.setTextSelectionListener(!this.editing);
    
    //Zmena zalozky v okne Firefoxu.
    var container = gBrowser.tabContainer;
    container.addEventListener("TabSelect", this.tabSelected, false);
    
    this.tabSelected();
  },
  
  /**
   * Rozhrani pro observer
   */
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic == "annotationextension-client-topic")
    {
      if (aData == "addTypes")
        this.addTypes();
      else if (aData == "deleteTypes")
        this.deleteTypes();
    }
    else if(aTopic == "annotationextension-docSynchronized-topic")
    {
      if (aData == "ok")
        this.docSynchronized();
      else
        this.syncFailed(aData);
    }
    else if(aTopic == "annotationextension-settingsChange-topic")
    {
      if (aData == "all")
      {
        updateAnnotationsColorInDoc();
      }
    }
    else if(aTopic == "annotationextension-textSelected")
    {
      if (this.isSuggestAnnotationsPanelOpened)
      {// Zobraz vybrany text do zadosti o nabizene anotace
        var panel = annotationExtensionChrome.infoPanel.get('aeSuggestPanel');
        var suggestBox = $(panel).find('.suggestAnnotation').get(0);
        suggestBox.setText(annotationExtensionChrome.selectedText.selectedRanges);
      }
      else
      {// Zobraz vybrany text do vybrane anotace
        this.setSelectedTextToSelectedAnnot();
      }
    }
  },
  
  /**
   * Pri vybrani noveho browseru synchronizuje dokument a sleduje "nahrati"
   * noveho dokumentu.
   * @param {bool} ovewrite zda se ma na serveru prepsat aktualni dokument synchronizovanym 
   */
  initSyncForCurrentBrowser : function(overwrite)
  {
    var browser = gBrowser.selectedBrowser;  
    if(browser)  
      browser.addEventListener("DOMContentLoaded", this.onPageLoad, true);
    
    if (!browser.webProgress.isLoadingDocument)
    {//Pokud je stranka jiz nactena provede synchronizaci
      let observerService = Components.classes["@mozilla.org/observer-service;1"].
        getService(Components.interfaces.nsIObserverService);  
      observerService.addObserver(this, "annotationextension-docSynchronized-topic", false);
      
      annotationExtensionChrome.document.sync(overwrite);
    }
  },
  
  /**
   * Odstrani eventListener-y zalozek
   */ 
  removeListenersFromBrowsers : function()
  {
    var tabs = gBrowser.tabs;
    
    for (var i = 0; i < tabs.length; i++)
    {
      var tab = tabs[i];
      var browser = gBrowser.getBrowserForTab(tab);
      
      browser.removeEventListener("DOMContentLoaded", this.onPageLoad, true);
    }
  },
  
  /**
   * Dokument je synchronizovan
   */
  docSynchronized : function()
  {
    try
    {
      let observerService = Components.classes["@mozilla.org/observer-service;1"].
         getService(Components.interfaces.nsIObserverService);  
      observerService.removeObserver(this, "annotationextension-docSynchronized-topic", false);
    }
    catch(ex)
    {}
    
    //Je mozne odesilat anotace
    var saveButtonDeck = document.getElementById('aeSaveButtonDeck');
    saveButtonDeck.selectedIndex = "0";
  },
  
  /**
   * Pokud selhala synchronizace
   */
  syncFailed : function(error)
  {
    try
    {
      let observerService = Components.classes["@mozilla.org/observer-service;1"].
         getService(Components.interfaces.nsIObserverService);  
      observerService.removeObserver(this, "annotationextension-docSynchronized-topic", false);
      
      for (var i = 0; i < error.length; ++i)
        if (error[i] == ':')
          break;
			
		  var errorNo = error.substr(0, i);
		  var errorString = error.slice(i + 1);
      
      annotationExtensionChrome.document.errorOccured(errorNo, errorString);
    }
    catch(ex)
    {
      //Pokud by nahodou observer nebyl registrovan
    }
  },
  
  /**
   * Po nacteni stranky
   */
  onPageLoad : function()
  {
    let observerService = Components.classes["@mozilla.org/observer-service;1"].
       getService(Components.interfaces.nsIObserverService);  
    observerService.addObserver(annotationExtensionChrome.bottomAnnotationWindow, "annotationextension-docSynchronized-topic", false);
    
    //Zablokovani tlacitka odesilani anotace do synchrnonizace dokumentu
    var saveButtonDeck = document.getElementById('aeSaveButtonDeck');
      saveButtonDeck.selectedIndex = "1";
  
    annotationExtensionChrome.annotationsView.initForNewDocument();
    //Synchronizuj dokument
    annotationExtensionChrome.document.sync(false);
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                      Vyber textu                                 ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Nastavi text, ktery je ulozeny v selectedText objektu, vybrane anotaci
   */
  setSelectedTextToSelectedAnnot : function()
  {
    sT = annotationExtensionChrome.selectedText;
    this.hideDeleteButton();
    this.hideSelectRangeBox();
    
    if (!this.selectingNested)
    {
      var textboxID = 'aeSelectedText';
      var rangeLabel = 'aeSelectedRangeLabel';
    }
    else
    {
      var textboxID = this.nestedAnnotationUIID + '-textbox1-'+this.getCurrentTabID();
      var rangeLabel = this.nestedAnnotationUIID + '-aeSelectedRangeLabel-'+this.getCurrentTabID();
    }
    
    document.getElementById(textboxID).value = "";
    
    if (sT.rangeCount > 1)
    {
      //Prida sipky pro vyber range do anotacniho okna
      this.showSelectRangeBox();
      document.getElementById(rangeLabel).setAttribute('value', sT.selRangeText);
    }
    
    if (sT.selectedRanges.length > 0)
      this.showDeleteButton();
    
    document.getElementById(textboxID).value = sT.selectedRanges;
  },
  
  /**
   * Zobrazi v okne sipky pro vyber range.
   */
  showSelectRangeBox : function()
  {
    if (!this.selectingNested)
    {
      if(this.documentAnnotation == true)
        return;
      
      var box = document.getElementById("aeSelectRangeBox");
    }
    else
      var box = document.getElementById(this.nestedAnnotationUIID + '-aeSelectRangeBox-'+this.getCurrentTabID());

    if (box != null)
      box.setAttribute("hidden", "false");
      
    this.showDeleteButton();
  },
  
  /**
   * Skryje v okne sipky pro vyber range
   */
  hideSelectRangeBox : function()
  {
    if (!this.selectingNested)
      var box = document.getElementById("aeSelectRangeBox");
    else
      var box = document.getElementById(this.nestedAnnotationUIID + '-aeSelectRangeBox-'+this.getCurrentTabID());
    
    if (box != null)  
      box.setAttribute("hidden", "true");
    
    this.hideDeleteButton();
  },
  
  /**
  */
  showDeleteButton : function(id)
  {
    if (!this.selectingNested)
    {
      if(this.documentAnnotation == true)
        return;
      
      var button = document.getElementById("aeDeleteRangeBox");
    }
    else
      var button = document.getElementById(this.nestedAnnotationUIID + '-aeDeleteRangeBox-'+this.getCurrentTabID());
    
    if (button != null)
    {
      button.setAttribute("hidden", "false"); 
    }
  },
  
  /**
  */
  hideDeleteButton : function()
  {
    if (!this.selectingNested)
      var button = document.getElementById("aeDeleteRangeBox");
    else
      var button = document.getElementById(this.nestedAnnotationUIID + '-aeDeleteRangeBox-'+this.getCurrentTabID());
    
    if (button != null)
    {
      button.setAttribute("hidden", "true"); 
    }
  },
  
  /**
   * Prida eventListener pri vyberu textu na strance
   * @param {Bool} all, true = selectText
   *                    false = selectTextOnlyFirstRange
   */
  setTextSelectionListener : function(all)
  {
    var webContent;
      webContent = document.getElementById('content');
    
    this.removeTextSelectionListener();  
      
    if (all == true)
    {
      webContent.addEventListener(
        "mouseup", annotationExtensionChrome.selectedText.selectText, false);
    }
    else if (all == false)
    {
      webContent.addEventListener(
        "mouseup", annotationExtensionChrome.selectedText.selectTextOnlyFirstRange, false);
    }
    else
    {
      //Nenastavi se zadny, protoze se v teto funkci vola removeTextSelectionListener()
      //nebude zadna odezva na vybrany text na strance.
    }
  },
  
  /**
   * Odstraneni eventListeneru pri vyberu textu na strance
   */
  removeTextSelectionListener : function()
  {
    var webContent;
      webContent = document.getElementById('content');
    
    try
    {
      webContent.removeEventListener(
        "mouseup", annotationExtensionChrome.selectedText.selectText, false);
    }
    catch(ex)
    {alert(ex.message);}
   
    try
    {
      webContent.removeEventListener(
        "mouseup", annotationExtensionChrome.selectedText.selectTextOnlyFirstRange, false);
    }
    catch(ex)
    {alert(ex.message);}
    
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                      Vyber typu                                 ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Vyber noveho typu anotace
   * @param {String} typeURI  URI vybraneho typu.
   * @param {String} typeName Jmeno vybraneho typu.
   * @param {Bool} pokud je true, smaze s vyberem typu vsechny aktualne nastavene atributy, defaultne true
   * @param {Bool} pokud je true, nahraje pro nove vybrany typ def. atributy, defaultne true
   */
  selectNewType : function(typeURI, typeName, delAttrUI, loadDefAttrs)
  {
    if (typeURI == this.selectedTypeURI)
      return;
    
    if (typeName != null)
    {//Nastaveni noveho typu v textboxu.
      var aeTypeSelectTextbox = document.getElementById('aeTypeSelect');
      aeTypeSelectTextbox.value = typeName;
    }
    
    var addAttrButton = document.getElementById('aeAddAttributeButton');
    var addAttributeToAttrButton = document.getElementById('aeAddAttributeToAttrButton');
    
    if (typeURI != '' && typeURI != null)
    {
      if (delAttrUI == undefined || (delAttrUI != undefined && delAttrUI == true))
      {//Atributy se stromu atributu se nesmazou a muze zustat vybran strukt. typ
        addAttributeToAttrButton.hidden = true;
      }
      
      addAttrButton.hidden = false;
      
      var confirmLabel = document.getElementById('aeConfirmTypeLabel');
      confirmLabel.hidden = true;
    }
    else
    {//Neni vybran zadny typ
      addAttrButton.hidden = true;
      addAttributeToAttrButton.hidden = true;
      
      annotationExtensionChrome.attributes.selectedAttrType = null;
      
      if (this.selectingNested == true)
        this.selectNestedAnnotation(this.nestedAnnotationUIID);
    }
    
    //Smaz strom atributu a vsechna uziv. rozhrani pro typ, ktery byl vybran pred novym
    if (delAttrUI == undefined || (delAttrUI != undefined && delAttrUI == true))
    {
      //Nastaveni stromu atributu pro nove vybrany typ
      var attrTree = document.getElementById('aeAttrTree');
      attrTree.view.selection.select(-1);
      
      annotationExtensionChrome.attrDatasource.delAllObjectsInSeq(this.getCurrentTab().getAttrsURI());
      annotationExtensionChrome.attributes.deleteAttrInterfaces();
    }
    
    //Vytvor strom atributu pro nove vybrany typ
    if (typeURI != '' && typeURI != null)
      if (loadDefAttrs == undefined || (loadDefAttrs != undefined && loadDefAttrs == true))
        annotationExtensionChrome.attributes.selectAttributes(typeURI, annotationExtensionChrome.attrDatasource.baseURI +
                                  annotationExtensionChrome.attrDatasource.rootName, false, true, false);
      
    
    this.selectedTypeName = typeName;
    this.selectedTypeURI = typeURI;
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                   Funkce pro typy anotaci                       ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Prida typy do datasource.
   * Vola observer, pokud mu prijde zprava, ze jsou ulozeny nove typy.
   */
  addTypes : function()
  {
    var cont = true;
      
    while(cont)
    {
      cont = false;
      var count = annotationExtensionChrome.types.count;

      for(var i = 0; i < count; i++)
      {
        var type = annotationExtensionChrome.types.shift();
        
        //Pridani typu do datasource typu.
        var result = annotationExtensionChrome.typesDatasource.addType(type);
        if (result)
          cont = true;
        else
          annotationExtensionChrome.types.addNew(type);
        
        //Pridani atributu do datasource atributu.
        annotationExtensionChrome.typeAttrDatasource.addNewObject2(type);
      }
    }
  },
  
  /**
   * Smaze typy z datasource.
   * Vola observer, pokud mu prijde zprava, ze jsou ulozeny typy ke smazani.
   */
  deleteTypes : function()
  {
    try
    {
      var count = annotationExtensionChrome.deletedTypes.count;
  
      for(var i = 0; i < count; i++)
      {
        var type = annotationExtensionChrome.deletedTypes.shift();
        
        //Smazani typu z datasource typu.
        annotationExtensionChrome.typesDatasource.deleteType(type);
        //Smazani typu a atributu typu z datasource atributu.
        var typeAttrDatasourceAncestor = annotationExtensionChrome.typeAttrDatasource.baseURI + annotationExtensionChrome.typeAttrDatasource.rootName;
        annotationExtensionChrome.typeAttrDatasource.deleteObject(type.uri, typeAttrDatasourceAncestor);
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : deleteTypes:\n' + ex.message);
    }
  },
  
  /**
   * Pokud je potreba odeslat zmenu typu na server, zavola se tato funkce.
   * @param {String} uri, uri typu, ktery se zmenil(v typeAttr.rdf)
   */
  addToChangedTypes : function(uri)
  {
    var changedTypes = this.getCurrentTab().getChangedTypes();
    var index = changedTypes.getIndexByProp('uri', uri);  //existuje v poli?
    
    var newType = { uri : uri};
    
    if (index == -1)
    {
      changedTypes.addNew(newType);
    }
  },
  
  /**
   * Projde typy, ktere jsou ulozene v changedTypes
   * --- a prida k nim defaultni atributy --- aby se mohly odeslat jako changed
   * na server.
   * @param {aeArray} changedTypes
   */
  makeChangedTypes : function(changedTypes)
  {
    try
    {
      var count = changedTypes.count;
      
      for (var i = 0; i < count; i++)
      {
        var typeURI = changedTypes.getAtIndex(i).uri;
        
        changedTypes.arrayOfObjs[i] = annotationExtensionChrome.attributes.createTypeFromDatasource(typeURI);
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : makeChangedTypes:\n' + ex.message);
    }
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                   Handlery pro tlacitka                         ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Handler pro tlacitko vybrat typ
   */
  openTypesWindow : function()
  {
    var params = {out:null};
    window.openDialog("chrome://annotationextension/content/windows/typesWindow.xul", "annotationextension:typesWindow", "resizable,chrome,centerscreen,modal,height=400,width=600", params);
    if (params.out)
    {
      var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
      
      if (tab.loadAttributes == true)
      {
        annotationExtensionChrome.bottomAnnotationWindow.selectNewType(params.out.typeURI, params.out.typeName);
        tab.loadAttributes = false;
      }
      else
      {
        annotationExtensionChrome.bottomAnnotationWindow.selectNewType(params.out.typeURI, params.out.typeName, false, false);
      }
    }
  },
  
  /**
   * Handler pro tlacitko id=aeClearButton
   */
  clearWindow : function()
  {
    var tab = this.getCurrentTab();
    tab.loadAttributes = true;
    
    this.clearTab(null, false);
  },
  
  /**
   * Handler pro stisknuti klavesove kombinace pro ulozeni anotace
   */
  saveAnnotationsKeyHandler : function()
  {
    var saveButtonDeck = document.getElementById('aeSaveButtonDeck');
    if (saveButtonDeck.selectedIndex == "0")
    {
      annotationExtensionChrome.bottomAnnotationWindow.saveAnnotations();
    }      
  },
  
  /**
   * Handler pro stisknuti tlacitka odeslat anotaci.
   * button id = aeSaveButton
   */
  saveAnnotations : function()
  {
    //TODO: TEST_EDIT1
    try
    {
      if (!annotationExtensionChrome.attributes.checkIfAllAttrsHaveFilledParentsAlertWhenNot())
        return;
      
      if (document.getElementById('aeSelectedText').value == "" && this.documentAnnotation == false)
      {//Neni oznacen text pro anotaci.
        var stringBundle = document.getElementById('annotationextension-string-bundle');
        var alertText = stringBundle.getString('annotationextension.selectText.alert');
        annotationExtensionChrome.alerts.alert(alertText);
        return;
      }
    
      //Pokud se neukoncilo vybirani vnorene anotace
      if (this.selectingNested == true)
        this.selectNestedAnnotation(this.nestedAnnotationUIID);
      
      //Ulozeni vybraneho textu hlavni anotace pro vypocet fragmentu(XPath, offset, delka).
      this.saveAnnotation(true);
      
      //Ulozeni fragmentu do anotaci
      var nestedAnnotations = this.getCurrentTab().getNestedAnnotations();
  
      var count = nestedAnnotations.count;
      var annotation = null;
       
      //Ulozeni zmenenych typu
      this.makeChangedTypes(this.getCurrentTab().getChangedTypes());
      annotationExtensionChrome.client.changeTypes(this.getCurrentTab().getChangedTypes());
      
      //Vytvoreni zpravy anotace a odeslani na server
      var annotationsXML = new Array();
      if (this.documentAnnotation == true)
      {
        //TODO: OPRAVIT "i", nema tady co delat?
        var annotationXML = annotationExtensionChrome.annotationProcessor.makeAnnotation(i);
        if (annotationXML != null)
        {
          annotationsXML.push(annotationXML);
        }
      }
      else
      {
        for (var i = 0; i < this.annotation.fragments.rangesFragments.length; i++)
        {
          var annotationXML = annotationExtensionChrome.annotationProcessor.makeAnnotation(i);
          if (annotationXML != null)
          {
            annotationsXML.push(annotationXML);
          }
        }
      }
      
      if (annotationsXML.length > 0)
      {
        if (this.editing == true && this.editingAnnotTmpId == null)
          annotationExtensionChrome.client.changeAnnotations(annotationsXML);
        else if (this.editingAnnotTmpId == null)
          annotationExtensionChrome.client.sendAnnotations(annotationsXML);
        else
          annotationExtensionChrome.client.confirmSuggestionManuallyEdited(annotationsXML, this.editingAnnotTmpId);
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : saveAnnotations:\n' + ex.message);
    }
  },
  
  /**
   * Vola client, pokud prisla ok zprava - anotace byla ulozena.
   */
  annotationsSaved : function()
  {
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    var text = stringBundle.getString("annotationextension.messages.annotationSaved");
		
    annotationExtensionChrome.statusBar.showMessage(text, 3000, annotationExtension.STATUSBAR_MESSAGE_COLOR);
    annotationExtensionChrome.bottomAnnotationWindow.clearTab(null, false);
    
    var tab = this.getCurrentTab();
    tab.loadAttributes = true;
  },

  /**
   * Handler pro stisknuti "tlacitka" na anotaci celeho dokumentu.
   * "Preklapi" anotaci celeho dokumentu
   * button id = aeAnnotateDocumentButton
   * @param {Bool} bool, pokud je zadan, nehlede na predchozi stav, true = anotace dokumetu
   *                     false opak
   */
  annotateDocument : function(bool)
  {
    var selectedTextBox = document.getElementById('aeSelectedTextBox');
    var aeSelectedText = document.getElementById('aeSelectedTextBoxDeck');
    
    //Pokud je zadano, zda se ma nebo nema anotovat dokument
    if (bool != undefined || bool != null)
      this.documentAnnotation = bool ? false : true;
    
    if (this.documentAnnotation == false)
    {
      aeSelectedText.selectedIndex = 1;
      selectedTextBox.className = "textboxBoxRed";
      
      this.hideSelectRangeBox();
      
      this.documentAnnotation = true;
    }
    else
    {
      aeSelectedText.selectedIndex = 0;
      selectedTextBox.className = "textboxBoxReadonly";
      
      this.documentAnnotation = false;
      
      if (annotationExtensionChrome.selectedText.rangeCount > 1)
        this.showSelectRangeBox();
      else if (annotationExtensionChrome.selectedText.rangeCount > 0)
        this.showDeleteButton();
    }
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                  Nabidka anotaci                                ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Handler pro aeSuggestButton
   * Odesle pozadavek nabidnuti anotaci
   */
  suggestAnnotations : function()
  {
    if (!annotationExtensionChrome.infoPanel.exists('aeSuggestPanel'))
		{
      let stringBundle = document.getElementById("annotationextension-string-bundle");
    
      var title = stringBundle.getString("annotationextension.suggestAnnotations.title")  
      var panel = annotationExtensionChrome.infoPanel.create('aeSuggestPanel', 'none', title, null, null, true);
      panel.setAttribute('noautohide', 'true');
      panel.setAttribute('persist', 'true');
      //panel_node.setAttribute('type', 'arrow');
      panel.setAttribute('backdrag', 'true');
      panel.setAttribute('position', 'after_end');
      panel.setAttribute('onpopupshown', 'annotationExtensionChrome.bottomAnnotationWindow.suggestAnnotationsPanelOpened(this);');
      panel.setAttribute('onpopuphidden', 'annotationExtensionChrome.bottomAnnotationWindow.suggestAnnotationsPanelClosed(this);');
    }
    else
    {
      annotationExtensionChrome.infoPanel.hide('aeSuggestPanel');
    }
        
    var content = this.createSuggestAnnotationsPanelContent();
    annotationExtensionChrome.infoPanel.setMisc('aeSuggestPanel', content);
    annotationExtensionChrome.infoPanel.show('aeSuggestPanel', document.getElementById('aeSuggestButton'));
  },
  
  createSuggestAnnotationsPanelContent : function()
  {
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    
    var suggestBox = document.createElement("box");
    suggestBox.setAttribute("class", "suggestAnnotation");
    
    var sB = document.createElement("button");
    sB.setAttribute("label", stringBundle.getString("annotationextension.suggestAnnotationPanel.confirmButton.label"));
    sB.setAttribute("tooltiptext", stringBundle.getString("annotationextension.suggestAnnotationPanel.confirmButton.tooltip"));
    sB.setAttribute("oncommand", "annotationExtensionChrome.bottomAnnotationWindow.sendSuggestAnnotations();");
    var sS = document.createElement("spacer");
    sS.setAttribute("flex", "1");
    var sBB = document.createElement("hbox");
    sBB.appendChild(sS);
    sBB.appendChild(sB);
    
    var sVB = document.createElement("vbox");
    sVB.appendChild(suggestBox);
    sVB.appendChild(sBB);
  
    return sVB;
  },
  
  suggestAnnotationsPanelOpened : function(panel)
  {
    //Vybrany text chci zobrazovrat do panelu
    this.saveCurrentTextSelectionForProperAnnot();
    this.isSuggestAnnotationsPanelOpened = true;
  },
  
  suggestAnnotationsPanelClosed : function(panel)
  {    
    //Vybrany text zobrazuj ve vybrane anotaci
    this.isSuggestAnnotationsPanelOpened = false;
    this.restoreTextSelectionForProperAnnot();
  },
  
  /**
   * Odesle zadost na nabidnute anotace
   */
  sendSuggestAnnotations : function()
  {
    var panel = annotationExtensionChrome.infoPanel.get('aeSuggestPanel');
    var suggestBox = $(panel).find('.suggestAnnotation').get(0);
    var typeURI = suggestBox.getAttribute('typeURI');
    if (typeURI == 'null')
      typeURI = null;
    var suggestionForDoc = suggestBox.getAttribute('isDocumentSelected');
    
    var fragments = [];
    
    if (suggestionForDoc == 'true')
    {
      var fragment = new annotationExtensionChrome.fragment("", null, null, "/HTML[1]/BODY[1]/");
      fragments.push(fragment);
    }
    else
    {
      var rangesFragments = new annotationExtensionChrome.fragments(annotationExtensionChrome.selectedText.ranges, -1);
      var rangesLen = rangesFragments.rangesFragments.length;
  
      for (var i = 0; i < rangesLen; ++i)
      {
        var rangeFragments = rangesFragments.rangesFragments[i];
        var fragLen = rangeFragments.length;
        for (var j = 0; j < fragLen; ++j)
        {
          var rangeFragment = rangeFragments[j];
          fragments.push(rangeFragment);
        }
      }
    }
    
    panel.hidePopup();
    
    annotationExtensionChrome.client.suggestAnnotations(fragments, typeURI);
  },
  
  /**
   * Handler pro aeSuggesEndtButton
   * Odesle pozadavek nabidnuti anotaci
   */
  suggestAnnotationsEnd : function()
  {
    var fragments = [];
    var fragment = new annotationExtensionChrome.fragment("", 0, null, "/HTML[1]/BODY[1]/");
    fragments.push(fragment);

    annotationExtensionChrome.client.suggestAnnotations(fragments);
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                  Funkce pro vnorenou anotaci                    ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  
  /**
   * Ulozi vybrany text anotaci:
   * hlavni nebo vnorene pokud se vybira vnorena anotace.
   */
  saveCurrentTextSelectionForProperAnnot : function()
  {
    try
    {
      if (this.selectingNested == false)
      {
        this.saveAnnotation(true);
      }
      else
      {
        id = this.nestedAnnotationUIID;
        var aLink = annotationExtensionChrome.attributes.getAttributeALink(id);
        if (aLink)
        //Atribut(anotace) ma nastaveny aLink
        {}
        else
        {
          this.saveNestedAnnotation(id, true); 
        }
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : saveCurrentTextSelectionForProperAnnot:\n' + ex.message);
    }
  },
  
  /**
   * Obnov vybrany text anotaci:
   * hlavni nebo vnorene pokud se vybira vnorena anotace.
   */
  restoreTextSelectionForProperAnnot : function()
  {
    try
    {
      if (this.selectingNested == false)
      {
        this.restoreAnnotationRanges("");
      }
      else
      {
        id = this.nestedAnnotationUIID;
        var aLink = annotationExtensionChrome.attributes.getAttributeALink(id);
        if (aLink)
          //Atribut(anotace) ma nastaveny aLink
        {}
        else
        {
          this.restoreAnnotationRanges(id);
        }
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : saveCurrentTextSelectionForProperAnnot:\n' + ex.message);
    }
  },
  
  /**
   * Ulozi vybrany text pro 'hlavni anotaci'.
   * @param {Bool} saveAllRanges pokud je true, ulozi se vsechny ranges, pokud false
   *                            ulozi se pouze aktualne vybrany range
   */
  saveAnnotation : function(saveAllRanges)
  {
    try
    {  
      this.annotation = new annotationExtensionChrome.annotation("");
      this.annotation.ranges = annotationExtensionChrome.selectedText.ranges;
      //TODO: this.annotation.ranges je undefined??? kdy? opravit
      this.annotation.selectedRange = annotationExtensionChrome.selectedText.activeRange;
      if (saveAllRanges == undefined || saveAllRanges == null || saveAllRanges == false)
        var selRanges = this.annotation.selectedRange;
      else
        var selRanges = -1;
        
      this.annotation.fragments = new annotationExtensionChrome.fragments(this.annotation.ranges, selRanges);
      this.annotation.content = this.getContent();
    }
    catch(ex)
    {
      alert('annotationWindow.js : saveAnnotation:\n' + ex.message);
    }
  },
  
  /**
   * Pro tlacitko vybrani vnorene anotace
   * @param {string} id, ID UI atributu vnorene anotace
   */
  selectNestedAnnotation : function(id)
  {
    //TODO: TEST_EDIT1
    try
    {
      let stringBundle = document.getElementById("annotationextension-string-bundle");
      var selectButton = document.getElementById(id+'selectNestedButton-'+this.getCurrentTabID());    
          
      if (this.selectingNested == false)
      {//Chci zacit vybirat vnorenou anotaci
        
        var hideAnnotationsForSelectALinkBool = true;
        this.hideSelectRangeBox();
        this.saveAnnotation(true);
        
        this.selectingNested = true;
        this.nestedAnnotationUIID = id;
        
        if(selectButton != null)
        {
          selectButton.className = "aeSelectNestedAnnotButtonActive";
          selectButton.setAttribute('label', stringBundle.getString("annotationextension.chooseEnd.button.label"));
        }
        
        var aLink = annotationExtensionChrome.attributes.getAttributeALink(id);
        if (aLink)
          //Atribut(anotace) ma nastaveny aLink
        {
          //Zruseni vyberu hlavni anotace
          var selection = window.content.getSelection();
          selection.removeAllRanges();
          
          var aLinksAnnotObj = this.getCurrentTab().getNestedAnnotation(id);
          if (aLinksAnnotObj != null)
          {
            aLinksAnnotObj.restoreActiveAnnotation();
          }
          
          this.setTextSelectionListener(null);
        }
        else
        {
          var editedAttr = annotationExtensionChrome.attributes.attributeIsEdited(id);
          if  (editedAttr)
          {
            //Editovana vnorena anotace    
            var nestedAnnotObj = this.getCurrentTab().getNestedAnnotation(id);
            if (nestedAnnotObj != null && nestedAnnotObj.multipleAnnotation == true)
            {
              this.setTextSelectionListener(false);
              this.restoreAnnotationRanges(id);
              if (nestedAnnotObj.len() > 1)
                hideAnnotationsForSelectALinkBool = false;
            }
            else
            {
              this.setTextSelectionListener(true);
              this.showSelectRangeBox();
              this.restoreAnnotationRanges(id);
            }
          }
          else
          {
            //Obnoveni vyberu vnorene anotace, pokud jiz nejaky ma.
            this.setTextSelectionListener(true);
            this.showSelectRangeBox();
            this.restoreAnnotationRanges(id);
          }
        }
          
        if (hideAnnotationsForSelectALinkBool)
        {//Je mozne vybirat ODKAZ NA ANOTACI
          this.annotsAreHiddenForALink = true;
          this.annotsALinkType = annotationExtensionChrome.attributes.selectedAttrType;
          hideAnnotationsForSelectALink(this.annotsALinkType, annotationExtension.ALINK_ANNOTATION_COLOR, annotationExtensionChrome.annotationsView.frame_doc);
        }
      }
      else
      {//Ukonceni vybirani vnorene anotace
        this.hideSelectRangeBox();
        
        var aLink = annotationExtensionChrome.attributes.getAttributeALink(id);
        if (aLink)
          //Atribut(anotace) ma nastaveny aLink
        {
           var aLinksAnnotObj = this.getCurrentTab().getNestedAnnotation(id);
           if (aLinksAnnotObj != null)
           {
              aLinksAnnotObj.saveActiveAnnotation();
           }
        }
        else
        {
          this.saveNestedAnnotation(id, true);
          
          annotationExtensionChrome.attributes.deleteMultipleAnnotationObjFromCurrentTabIfZeroLenById(id);
        }
        
        this.selectingNested = false;
        if (this.editing)
          this.setTextSelectionListener(false);
        else
          this.setTextSelectionListener(true);
          
        this.showSelectRangeBox();
        if(selectButton != null)
        {
          selectButton.className = "aeSelectNestedAnnotButton";
          selectButton.setAttribute('label', stringBundle.getString("annotationextension.choose.button.label"));
        }
        //Obnoveni vyberu "hlavni anotace".
        this.restoreAnnotationRanges("");
  
        if (this.annotsAreHiddenForALink)
        {
          restoreAnnotationsAfterSelectALink(annotationExtensionChrome.annotationsView.frame_doc);
          this.annotsAreHiddenForALink = false;
          this.annotsALinkType = null;
        }
      }
    }
    catch(ex)
    {
      alert('annotationWindow.js : selectNestedAnnotation:\n' + ex.message);
    }
  },
  
  /**
   * Ulozi vybrany text pro vnorenou anotaci.
   * @param {string} id ID uziv. rozhrani vnorene anotace
   * @param {Bool} saveAllRanges pokud je true, ulozi se vsechny ranges, pokud false
   *                             ulozi se pouze aktualne vybrany range
   */
  saveNestedAnnotation : function(id, saveAllRanges)
  {
    //TODO: TEST_EDIT1
    var nestedAnnotations = this.getCurrentTab().getNestedAnnotations();
    var index = nestedAnnotations.getIndexByProp('uri', id);
    
    if(index == -1)
    {//Vnorena anotace se jeste nevytvarela
      var annotation = new annotationExtensionChrome.annotation(id);
      
      annotation.selectedRange = annotationExtensionChrome.selectedText.activeRange;
      annotation.ranges = annotationExtensionChrome.selectedText.ranges;
      if (saveAllRanges == undefined || saveAllRanges == null || saveAllRanges == false)
        var selRanges = annotation.selectedRange;
      else
        var selRanges = -1;
      annotation.fragments = new annotationExtensionChrome.fragments(annotation.ranges, selRanges);
        
      nestedAnnotations.addNew(annotation);
    }
    else
    {//Vnorena anotace je ulozena.
      //Zmena
      if(nestedAnnotations.arrayOfObjs[index].multipleAnnotation == true)
      {//
       // MULTIPLEANNOTATION MA JINOU STRUKTURU!!!
       //
        nestedAnnotations.arrayOfObjs[index].saveActiveAnnotation();
      }
      else
      {
        nestedAnnotations.arrayOfObjs[index].selectedRange = annotationExtensionChrome.selectedText.activeRange;
        nestedAnnotations.arrayOfObjs[index].ranges = annotationExtensionChrome.selectedText.ranges;
        if (saveAllRanges == undefined || saveAllRanges == null || saveAllRanges == false)
          var selRanges = nestedAnnotations.arrayOfObjs[index].ranges;
        else
          var selRanges = -1;
        nestedAnnotations.arrayOfObjs[index].fragments = new annotationExtensionChrome.fragments(nestedAnnotations.arrayOfObjs[index].ranges, selRanges);
      }
    }
  },
  
  /**
   * Obnovi vybrany text pro anotaci
   * @param {string} id, pokud je "", obnovi vybrany text pro "hlavni anotaci".
   *                     jinak se ocekava ID uziv. rozhrani vnorene anotace!
   */
  restoreAnnotationRanges : function(id)
  {
    //TODO: TEST_EDIT1
    try
    {
      var nestedAnnotations = this.getCurrentTab().getNestedAnnotations();
      
      var selection = window.content.getSelection();
      var savedAnnotation = null;
      selection.removeAllRanges();
      
      if (id == "")
      {
        savedAnnotation = this.annotation;
      }
      else
      {
        var index = nestedAnnotations.getIndexByProp('uri', id);
        
        if(index != -1)
        {//Vnorena anotace je ulozena.
          if(nestedAnnotations.arrayOfObjs[index].multipleAnnotation == true)
          {//
           // MULTIPLEANNOTATION MA JINOU STRUKTURU!!!
           //
            nestedAnnotations.arrayOfObjs[index].restoreActiveAnnotation();
          }
          else
          {
            savedAnnotation = nestedAnnotations.arrayOfObjs[index];
          }
        }        
      }
      
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
      
      if (savedAnnotation != null)
        annotationExtensionChrome.selectedText.showExactRange(savedAnnotation.selectedRange);
    }
    catch(ex)
    {
      alert('annotationWindow.js : restoreAnnotationRanges:\n' + ex.message);
    }
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////      Funkce pro autocomplete textbox (vyber typu anotace)       ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  autocompleteParams : [],
  typeCreatedInTextbox : false,
  
  //Nastaveni typu pro anotaci z autocompletu
  autocompleteTypeSelected : function()
  {    
    var texbox = document.getElementById('aeTypeSelect');
    var index = annotationExtensionChrome.autocompleteURIs.getIndexByProp('linear', texbox.value);
    
    if (index != -1)
    {//Typ prisel ze serveru a je ulozen v poli
      var type = annotationExtensionChrome.autocompleteURIs.getAtIndex(index);
      
      var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();     
      if (tab.loadAttributes == true)
      {
        this.selectNewType(type.uri, texbox.value);          
        tab.loadAttributes = false;
      }
      else
      {
        this.selectNewType(type.uri, texbox.value, false, false);
      }
      
      var confirmLabel = document.getElementById('aeConfirmTypeLabel');
      confirmLabel.hidden = true;
    }
    else
    {
      //TODO: doimplementovat!!!
      //this.selectNewType('', '');
      this.addNewType(texbox.value, texbox.id);
    }
  },
  
  autocompleteTypeInput : function(textBox)
  {
    var confirmLabel = document.getElementById('aeConfirmTypeLabel');
    if (textBox.value != annotationExtensionChrome.bottomAnnotationWindow.selectedTypeName)
    {
      confirmLabel.hidden = false;
    }
    else
      confirmLabel.hidden = true;
  },
  
  //Nastaveni typu pro atribut z autocompletu
  autocompleteAttrSelected : function(id)
  {
    var texbox = document.getElementById(id+'-typeTextbox-'+this.getCurrentTabID());
    var index = annotationExtensionChrome.autocompleteURIs.getIndexByProp('linear', texbox.value);
    

    if(annotationExtension.attrConstants.isSimple(texbox.value))
    {//Jednoduchy typ
      if (index != -1)
      {//Muzu vybrat mezi jednoduchym a slozenym
        var retVals = { struct : false};
        
        window.openDialog("chrome://annotationextension/content/dialogs/simpleOrStructuredDialog.xul", "annotationextension:simpleOrStructWindow", "chrome,modal,centerscreen", retVals);
        
        if (retVals.struct == false)
        {//Vyber jednoduchy typ
          annotationExtensionChrome.attributes.setTypeToAttribute(texbox.value, id);
        }
        else
        {//Vyber strukturovany typ
          var type = annotationExtensionChrome.autocompleteURIs.getAtIndex(index);
          annotationExtensionChrome.attributes.setTypeToAttribute(type.uri, id);
        }
      }
      else
      {
        annotationExtensionChrome.attributes.setTypeToAttribute(texbox.value, id);
      }
    }
    else if (index != -1)
    {//Typ anotace
      var type = annotationExtensionChrome.autocompleteURIs.getAtIndex(index);
      annotationExtensionChrome.attributes.setTypeToAttribute(type.uri, id); 
    }
    else
    {//ani jedno
      //TODO: implementovat
      //annotationExtensionChrome.attributes.setTypeToAttribute('String', id);
      annotationExtensionChrome.bottomAnnotationWindow.addNewType(texbox.value, id);
    }
  },
  
  addNewType : function(typeName, textboxId)
  {
    annotationExtensionChrome.client.addTypeAutocompleteTextbox(textboxId, typeName);
  },
  
  addTypesAndSelectInAutocompleteTextbox : function(typesArray, typeName, textboxId)
  {
    try
    {
      var lastTypeName = typeName.replace(/->/g, '/');
      lastTypeName = lastTypeName.replace(/.*\//, '');
      //lastTypeName = lastTypeName.replace(/^\s*/, '');
    
      
      var count = typesArray.count;
      var type;
  
      for(var i = 0; i < count; i++)
      {
        type = typesArray.shift();
        //Pridani typu do datasource typu.
        var resourceTypeName = annotationExtensionChrome.typesDatasource.getResourceProp(type.uri, 'name');
        if (resourceTypeName != null)
        //Uz existuje
          continue;
        
        var result = annotationExtensionChrome.typesDatasource.addType(type);
        //TODO: pokud se result == false zpracovat
        
        //Pridani atributu do datasource atributu.
        annotationExtensionChrome.typeAttrDatasource.addNewObject2(type);
      }
      
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      //Posledni pridany typ(prijaty typ od serveru) je typ, ktery chci vybrat
      //TODO: nemusi byt pravda?
      if (textboxId == 'aeTypeSelect')
      {//Novy typ pro hlavni anotaci
        var linearizedURI = annotationExtension.functions.linearTypeURI(type.uri);
        var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();     
        if (tab.loadAttributes == true)
        {
          annotationExtensionChrome.bottomAnnotationWindow.selectNewType(type.uri, linearizedURI);
          
          tab.loadAttributes = false;
        }
        else
        {
          annotationExtensionChrome.bottomAnnotationWindow.selectNewType(type.uri, linearizedURI, false, false);
        }
      }
      else
      {//Novy typ vyber do atributu
        annotationExtensionChrome.attributes.setTypeToAttribute(type.uri, textboxId);
      }
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
    }
    catch(ex)
    {
      alert('annotationWindow.js : addTypesAndSelectInAutocompleteTextbox:\n' + ex.message);
    }
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                      Obsah anotace                              ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * @returns {String} Obsah hlavní anotace
   */
  getContent : function()
  {
    return document.getElementById('aeContentText').value;
  },
  
  /**
   * Nastaví obsah hlavní anotace
   * @param {String} content obsah, ktery se ma nastavit v hlavni anotaci
   */
  setContent : function(content)
  {
    var contentTextbox = document.getElementById('aeContentText');
    contentTextbox.value = content;
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                      Prace se zalozkama                         ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Volá se v init
   * inicializuje otevřené záložky ve Firefoxu...
   */
  createAeTabs : function()
  {
    for (var i = 0; i < gBrowser.tabs.length; i++)
    {
      this.newTab(gBrowser.tabs[i]);
    }
    
    this.selectedTab = gBrowser.selectedTab;
    //Zobraz element pro pripojeni uziv. rozhrani prave vybrane zalozky
    var tabElementForAttrs = document.getElementById('tab'+ this.getCurrentTabID());
      tabElementForAttrs.setAttribute('hidden', 'false');
    
    annotationExtensionChrome.attributes.selectAttrsForCurrentTab();
  },
  
  /**
   * "Vytvori" pro zalozku misto v poli a ulozi ji - inicializuje
   * a priradi zalozce id pro obnoveni dat
   * @param {tab} tab, zalozka pro ulozeni
   */
  newTab : function(tab)
  {
    try
    {
      var attrsInterfaces = document.getElementById('aeAttrUserInterface');
      var tabAttrInterfaces = document.createElement('hbox');
      tabAttrInterfaces.setAttribute('flex', '1');
      tabAttrInterfaces.setAttribute('hidden', 'true');
      
      this.saveAnnotation(true);
      
      var len = annotationExtensionChrome.tabs.length;
      
      for (var i = 0; i < len; i++)
      {
        if (annotationExtensionChrome.tabs[i] == null)
        {//V poli .tabs[] je volne misto pro zalozku, vloz ji na to misto, misto na konec
          //Vloz a nastav id na i;
          annotationExtensionChrome.tabs[i] = new annotationExtensionChrome.annotationWindowTab(this, annotationExtensionChrome.attributes, i);
          tab.aeTabData = i;
            
            //Vytvoreni DOM vetve pro uzivatelske rozhrani atributu v zalozce
            tabAttrInterfaces.setAttribute('id', 'tab' + tab.aeTabData);
            attrsInterfaces.appendChild(tabAttrInterfaces);
          return;      
        }
      }
       
      var newTab = new annotationExtensionChrome.annotationWindowTab(this, annotationExtensionChrome.attributes, len);
      //Neni volne zadne pole
      annotationExtensionChrome.tabs.push(newTab);
      tab.aeTabData = len;
        
        //Vytvoreni DOM vetve pro uzivatelske rozhrani atributu v zalozce
        tabAttrInterfaces.setAttribute('id', 'tab' + tab.aeTabData);
        attrsInterfaces.appendChild(tabAttrInterfaces);
    }
    catch(ex)
    {
      annotationExtensionChrome.alerts.alert('annotationWindow.js : newTab:\n' + ex.message);
    }
  },
  
  /**
   * Obnovi data pro zalozku
   * @param {tab} tab - zalozka pro obnoveni
   */
  restoreTab : function(tab)
  {
    try
    {
      annotationExtensionChrome.tabs[tab.aeTabData].load(this, annotationExtensionChrome.attributes, 'aeAttrTree');
    }
    catch(ex)
    {
      annotationExtensionChrome.alerts.alert('annotationWindow.js : restoreTab:\n' + ex.message);
    }
  },
  
  /**
   * Ulozi data pro zalozku
   * @param {tab} tab - zalozka pro ulozeni
   */
  saveTab : function(tab)
  {
    try
    {
      this.saveAnnotation(true);
      annotationExtensionChrome.tabs[tab.aeTabData].save(this, annotationExtensionChrome.attributes, tab.aeTabData, 'aeAttrTree');
    }
    catch(ex)
    {
      annotationExtensionChrome.alerts.alert('annotationWindow.js : saveTab:\n' + ex.message);
    }
  },
  
  /**
   * Handler pro event "TabSelect" (zmeny zalozky).
   */
  tabSelected : function(ev)
  {
    try
    {
      var aeWindow = annotationExtensionChrome.bottomAnnotationWindow;
      
      //Pokud je otevreny panel pro zadost o nabizeni anotaci zavri ho
      annotationExtensionChrome.infoPanel.hide("aeSuggestPanel");
          
      //Pokud se neukoncilo vybirani vnorene anotace
      if (aeWindow.selectingNested == true)
        aeWindow.selectNestedAnnotation(aeWindow.nestedAnnotationUIID);
        
      //Pokud se edituje nabidnuta anotace - neni mozne tuto editaci ulozit
      //diky tmpId generovanou na serveru
      //TODO: vytvorit hlasku o nemoznosti ulozeni
      if (aeWindow.editingAnnotTmpId != null)
        aeWindow.clearWindow();
      
      //Uloz naposledy vybranou zalozku a skryj pripadne uziv. rozhrani atributu
      if (aeWindow.selectedTab != null)
      {
        aeWindow.saveTab(aeWindow.selectedTab);
        

        if (annotationExtensionChrome.attributes.selectedAttrUIID != null)
        {
          var selectedAttrInterface = document.getElementById(annotationExtensionChrome.attributes.selectedAttrUIID);
          if (selectedAttrInterface != null)
            selectedAttrInterface.setAttribute('hidden','true');
        }
        
        //Skryj element pro uzivatelska rozhrani atributu pro naposledy vybranou zalozku
        var tabElementForAttrs = document.getElementById('tab'+ aeWindow.getCurrentTabID());
          tabElementForAttrs.setAttribute('hidden', 'true');
          
        //Smazani aktualne vyplnenych dat
        aeWindow.clearAnnotationWindow(true, false);
      }
      
      var tab = gBrowser.selectedTab;
      aeWindow.selectedTab = tab;

      //Obnoveni dat pro nove vybranou zalozku
      annotationExtensionChrome.annotationsView.initForNewDocument();
      if (tab.aeTabData == undefined || tab.aeTabData == null)
        //Pridej zalozku do pole zalozek pro dalsi obnoveni
        aeWindow.newTab(tab);
      else
        aeWindow.restoreTab(tab);
       
      //Zobraz element pro pripojeni uziv. rozhrani nove vybrane zalozky
      var tabElementForAttrs = document.getElementById('tab'+ aeWindow.getCurrentTabID());
        tabElementForAttrs.setAttribute('hidden', 'false');
        
      //Po nacteni stranky provede synchronizaci dokumentu.
      aeWindow.initSyncForCurrentBrowser(false);
      
      //Nastaveni stromu atributu
      annotationExtensionChrome.attributes.selectAttrsForCurrentTab();
      //Obnoveni vybrane polozky stromu atributu
      annotationExtensionChrome.attributes.selectAttrIndexForCurrentTab();
    }
    catch(ex)
    {
      annotationExtensionChrome.alerts.alert('annotationWindow.js : tabSelected:\n' + ex);
    }
  },
  
  /**
   * Handler pro event "TabClose" (zavreni zalozky).
   */
  tabRemoved : function(ev)
  {
    try
    {
      var aeWindow = annotationExtensionChrome.bottomAnnotationWindow;
      
      //Pokud je otevreny panel pro zadost o nabizeni anotaci zavri ho
      annotationExtensionChrome.infoPanel.hide("aeSuggestPanel");
      
      //Smazani vyplnenych dat anotacniho okna(pokud se zavrela "vybrana" zalozka)
      //Pokud se zavrela jina zalozka, okno zustane vyplnene
      if (aeWindow.selectedTab == ev.target)
        aeWindow.clearAnnotationWindow();
        
      annotationExtensionChrome.tabs[ev.target.aeTabData] = null;
      
      //Odstraneni vetve DOMU pro uzivatelskych rozhrani atributu zalozky
      var tabAttrInterfaces = document.getElementById('tab' + ev.target.aeTabData);
      if (tabAttrInterfaces != null)
        tabAttrInterfaces.parentNode.removeChild(tabAttrInterfaces);
        
      if (aeWindow.selectedTab == ev.target)
        aeWindow.selectedTab = null;
    }
    catch(ex)
    {
      annotationExtensionChrome.alerts.alert('annotationWindow.js : tabRemoved:\n' + ex);
    }
  },
  
  /**
   * Vrati ID, index aktualne vybrane zalozky
   * @returns {String} ID aktualne vybrane zalozky
   */
  getCurrentTabID : function()
  {
    if (this.selectedTab == null)
      return null;
    else
      return this.selectedTab.aeTabData;
  },
  
  /**
   * Vrati aktualne vybranou zalozku
   * @returns {Object} aktualne vybrana zalozka
   */
  getCurrentTab : function()
  {
    var i = this.getCurrentTabID();
    if (i != null)
      return annotationExtensionChrome.tabs[i];
    else
      return null;
  },
  
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////                      Mazani dat                                 ///////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////
  /**
   * Smaze veskera data
   */
  clearAll : function()
  {
    try
    {
      //Smazani anotacniho okna
      this.clearAnnotationWindow();
      //Smazani objektu zalozek
      annotationExtensionChrome.tabs = [];
      //Smazani DOMU atributu
      annotationExtensionChrome.attributes.deleteAllAttrInterfaces();
    }
    catch(ex)
    {
      alert('annotationWindow.js : clearAll():\n' + ex.message);
    }
  },
  
  /**
   * Smaze data pro zalozku
   * @param {tab} tabP pokud je parametr uveden smaze data pro zalozku z parametru
   *                   jinak z aktualne vybrane zalozky (pokud je null)
   * @param {Bool} blockSaveAnnotP zda se ma zablokovat tlacitka na ulozeni anotace
   *               defaultne true
   */
  clearTab : function(tabP, blockSaveAnnotP)
  {
    try
    {
      if (tabP == undefined || tabP == null)
        var tab = this.getCurrentTab();
      else
        var tab = tabP;
        
      if (blockSaveAnnotP == undefined || blockSaveAnnotP == null)
        var blockSaveAnnot = true;
      else
        var blockSaveAnnot = blockSaveAnnotP;
        
      //Pokud je otevreny panel pro zadost o nabizeni anotaci zavri ho
      annotationExtensionChrome.infoPanel.hide("aeSuggestPanel");
      
      //Ukonci vyber vnorene anotace
      if (this.selectingNested == true)
        this.selectNestedAnnotation(this.nestedAnnotationUIID);
      
      //Zruseni vybraneho textu
      var selection = window.content.getSelection();
      selection.removeAllRanges();
      //Vybrany text byl nastaven jako prazdny, timto se v podstate "smazou" data selectedText
      annotationExtensionChrome.selectedText.selectText();
      
      //Smazani ulozenych anotaci a zmenenych typu
      tab.deleteSaved();
          
      //Odstraneni uzivatelskych rozhrani atributu zalozky
      annotationExtensionChrome.attributes.deleteAttrInterfaces();
      
      //Smazani vyplnenych dat v okne
      this.clearAnnotationWindow(blockSaveAnnot);
    }
    catch(ex)
    {
      alert('annotationWindow.js : clearTab():\n' + ex.message);
    }
  },
  
  /**
   * Smaze data anotacniho okna "v zalozce"
   * @param {Bool} blockSaveAnnot zda se ma zablokovat tlacitka na ulozeni anotace, defaultne true
   * @param {Bool} clearAttrsP zda se maji smazat atributy, defaultne true
   */
  clearAnnotationWindow : function(blockSaveAnnotP, clearAttrsP)
  {
    try
    {
      if (blockSaveAnnotP == undefined || blockSaveAnnotP == null)
        var blockSaveAnnot = true;
      else
        var blockSaveAnnot = blockSaveAnnotP;
      
      if (clearAttrsP == undefined || clearAttrsP == null)
        var clearAttrs = true;
      else
        var clearAttrs = clearAttrsP;
      
      //Smazani atributu    
      annotationExtensionChrome.attributes.selectedAttrType = null;
      annotationExtensionChrome.attributes.selectedAttrUIID = null;
      if (clearAttrs == true && this.getCurrentTab() != null)
        annotationExtensionChrome.attrDatasource.delAllObjectsInSeq(this.getCurrentTab().getAttrsURI());   //Smazani datasource atributu

      //Smazani vybraneho textu, obsahu anotace a vybraneho typu
      this.selectedTypeName = "";
      this.selectedTypeURI = "";
      this.selectingNested = false;
      this.nestedAnnotationUIID = null;
      this.documentAnnotation = false;
      var confirmLabel = document.getElementById('aeConfirmTypeLabel');
      confirmLabel.hidden = true;
      
      var contentTextbox = document.getElementById('aeContentText');
      var selectedTextTextbox = document.getElementById('aeSelectedText');
      var typeTextbox = document.getElementById('aeTypeSelect');
        selectedTextTextbox.value = "";
        contentTextbox.value = "";
        typeTextbox.value = "";
        
      //Skryti tlacitek na pridani atributu
      var button1 = document.getElementById('aeAddAttributeToAttrButton');
        button1.hidden = true;
      var button2 = document.getElementById('aeAddAttributeButton');
        button2.hidden = true;
      
      //Nastaveni textboxu pro vybrany text "na bilo" - zruseni pripadne anotace celeho dokumentu  
      var selectedTextBox = document.getElementById('aeSelectedTextBox');
      var aeSelectedText = document.getElementById('aeSelectedTextBoxDeck');
        aeSelectedText.selectedIndex = 0;
        selectedTextBox.className = "textboxBoxReadonly";
        
      //Smazani hlavni anotace
      this.annotation = null;
      
      //Zadna anotace se needituje
      this.editing = false;
      this.editingAnnotID = null;
      this.editingAnnotTmpId = null;
      
      //Skryj tlacitka na vyber a odstraneni vyberu
      this.hideDeleteButton();
      this.hideSelectRangeBox();
      
      //Zablokovani tlacitka odesilani anotace do uspesne synchronizace dokumentu
      if(blockSaveAnnot)
      {
        var saveButtonDeck = document.getElementById('aeSaveButtonDeck');
        saveButtonDeck.selectedIndex = "1";
      }
      
      //Needituje se, do textboxu vyberu lze vybrat vice ranges
      this.setTextSelectionListener(true);
    }
    catch(ex)
    {
      alert('annotationWindow.js : clearAnnotationWindow():\n' + ex.message);
    }
  },
  
  /**
   * Smaze vsechny RDF/XML soubory
   */
  destroyDatasources : function()
  {
    annotationExtensionChrome.typeAttrDatasource = null;
    annotationExtensionChrome.attrDatasource = null;
    annotationExtensionChrome.typesDatasource = null;
  }
};