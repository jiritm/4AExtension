/**
 * Soubor: attributes.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Funkce pro praci s atributy a stromem atributu v hlavnim okne.
 *  Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.attributes =
{
  selectedAttrType : null,  /** Pro potreby okna, ktere pridava atributy k typu.
                             *  Zde je ulozeno, ke kteremu typu se atribut pridava. */
  
  selectedAttrUIID : null,  /**< ID zobrazeneho UI atributu(pro skryti, pri "vybrani zadneho typu",
                             *   Vybrani jineho typu...). */
  
  /**
   * Zobrazi ve strome atributu atributy pro vybranou zalozku
   */
  selectAttrsForCurrentTab : function()
  {
    annotationExtensionChrome.attrDatasource.rootName = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getAttrsRootName();
    var tree = document.getElementById('aeAttrTree');
    if (tree != null)
      tree.setAttribute('ref', annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getAttrsURI());
  },
  
  /**
   * Zobrazi naposledy zobrazeny (ulozeny) atribut pro zalozku...
   */
  selectAttrIndexForCurrentTab : function()
  {
    var tree = document.getElementById('aeAttrTree');
    if (tree != null)
    {
      var index = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getAttrsIndex();
      if (index > -1)
        tree.view.selection.select(index);
    }
  },
  
  /**
   * Handler pro vybrani noveho typu atributu
   */
  newTypeSelectedHandler : function(typeBox)
  {
    annotationExtensionChrome.attributes.setTypeToAttribute(typeBox.aeSelectedTypeURI, typeBox.aeAttrId, true, true, true, typeBox.aeAdditionalAttrs.setTypeInTemplate);
  },
  
  /**
   * Handler pro tlacitko pridat atribut
   */
  openAddAttributeWindowRoot : function()
  {
    window.openDialog("chrome://annotationextension/content/windows/addAttributeWindow.xul", "annotationextension:addAttrWindow", "resizable,chrome,centerscreen,modal,height=430,width=600",
      annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName, //Ancestor
      annotationExtensionChrome.bottomAnnotationWindow.selectedTypeURI, //URI TYPU(v typeAttr.rdf) KE KTEREMU SE MA PRIPOJIT NOVY ATRIBUT
      annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName,
      'root');
  },
  
  /**
   * Handler pro tlacitko pridat atribut atributu
   */
  openAddAttributeWindowAttr : function()
  {
    //Po pridani atributu se vyber nastavi zpet na vybrany atribut
    var view = document.getElementById('aeAttrTree').view;
    var selection = view.selection.currentIndex;
    
    window.openDialog("chrome://annotationextension/content/windows/addAttributeWindow.xul", "annotationextension:addAttrWindow", "resizable,chrome,centerscreen,modal,height=430,width=600",
      //this.selectedAttrUIID,
      annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName, //Ancestor
      this.selectedAttrType,  //URI TYPU(v typeAttr.rdf) KE KTEREMU SE MA PRIPOJIT NOVY ATRIBUT
      this.getSelectionURI(),
      'nested');
  },
  
  /**
   * Handler pro onselect udalost stromu id=aeAttrTree
   */
  attrSelected : function()
  {
    try
    {
      //Vybran jiny typ, ukonci vyber vnorene anotace
      if (annotationExtensionChrome.bottomAnnotationWindow.selectingNested == true)
        annotationExtensionChrome.bottomAnnotationWindow.selectNestedAnnotation(
          annotationExtensionChrome.bottomAnnotationWindow.nestedAnnotationUIID);

      var view = document.getElementById('aeAttrTree').view;
      var selection = view.selection.currentIndex;
      var type = null;

      if(selection > -1)
      {//Neco je vybrano
        var res = annotationExtensionChrome.attrDatasource.getRowResource(selection);
        if (res == null) return;
        //ID UI(DOM elementu), ktere se urci z URI atributu
        var id = res.ValueUTF8;
        //Typ atributu pro zobrazeni pozadovaneho UI
        var type = annotationExtensionChrome.attrDatasource.getResourceProp(res, 'type');

        this.selectedAttrType = type;
        
        if (id != this.selectedAttrUIID)
          this.checkAndDeleteActUI();
          
        this.showOrHideAttrCheckboxesAndDeleteAttrButton(false);
      }
      else if (selection < 0)
      {//Pokud se zrusil vyber ve stromu skryj zobrazene UI atributu
        this.checkAndDeleteActUI();
        this.hideSelectedAttrUI();
        this.selectedAttrUIID = null;
        
        this.showOrHideAttrCheckboxesAndDeleteAttrButton(true);
        this.hideAddAttrToAttrButton();
        return;
      }

      if (id == this.selectedAttrUIID)
      //=Jiz zobrazene uziv. rozhrani.
        return;
      
      if(!this.selectedAttrHasParentInTree())
      {//Pokud nema atribut vytvorene UI rodice(vnorena anotace), uzivatel ho nemuze vyplnit, nezobrazuj ho
       //A vyber rodice...(muze iterovat az k prvni urovni...)
        //Pokud je nejake zobrazene, skryj ho
        //TODO: TEST_1000 Bylo zakomentovano, otestovat, zda nekde nevzniknou chyby
        //this.hideSelectedAttrUI();
        //this.selectedAttrUIID = null;
        //var parentIndex = this.getSelectionParentIndex();
        //
        //view.selection.select(parentIndex);
        //return;
      }

      //Pokud je nejake zobrazene, skryj ho
      this.hideSelectedAttrUI();
      
      if (type != null)
      {
        this.selectAttrInterface(id, type);
     
        //Pokud je strukturovany typ a nema podstrom atributu, nahraj atributy
        //Pokud je aLink nebo edited nenahravej atributy!
        if(!annotationExtension.attrConstants.isSimple(type))
        {
          if (!this.attributeIsEdited(id) && !this.attributeIsALink(id))
          {
            if(!this.hasChildElements(id))
              this.selectAttributes(type, id, false, true, false);
          }
          else if (this.attributeIsEdited(id) && !this.attributeIsALink(id))
          {

          }
        }
      }

    }
    catch(ex)
    {
      alert('attributes.js : attrSelected: ' + ex.message);
    }
  },
  
  /**
   * Zda je atribut typu anotace a je aLink
   * @param {String} id, id atributu(uri v attrDatasource)
   * @returns {bool} true, pokud je aLink, jinak false
   */
  attributeIsALink : function(id)
  {
    var aLink = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'aLink');
    if (aLink == true || aLink == "true")
      return true;
    else
      return false;
  },
  
  /**
   * Zda je atribut typu anotace a je aLink
   * @param {String} id, id atributu(uri v attrDatasource)
   * @returns {bool} true, pokud je aLink, jinak false
   */
  getAttributeALink : function(id)
  {
    var aLink = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'aLink');
    if (aLink == true || aLink == "true")
      return true;
    else
      return false;
  },
  
  /**
   * Pokud je nejake UI atributu zobrazene a nejsou v nem data, smaze ho 
   */
  checkAndDeleteActUI : function()
  {
    try
    {
      if(this.selectedAttrUIID != null && this.selectedAttrUIID != '')
      {//Osetreni zobrazeni aktualniho ui, pred zmenou zobrazeni noveho
        //Pokud neni nic vyplneneho smaz ho z domu
          if (!this.hasDataInUI(this.selectedAttrUIID))
          {
            this.deleteAttrInterface(this.selectedAttrUIID);
            
            if(annotationExtensionChrome.attrDatasource != null)
            {
              var oldType = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'type');
            }
            
            //Neni vybrano zadne uziv. rozhrani(bylo smazano)
            this.selectedAttrUIID = null;
          }
      }
    }
    catch(ex)
    {
      alert('attributes.js : checkAndDeleteActUI: ' + ex.message);
    }
  },
  
  /**
   * Zobrazi uziv. rozhrani pro atribut.
   * @param {string} id id atributu, ktere bude identifikovat rozhrani pro atribut
   * @param {string} type typ atributu, pro ktery se ma zobrazit rozhranni.
   */
  selectAttrInterface : function(id, type)
  {
    try
    {
      this.showOrHideAddAttrToAttrButtonByID(id);
      
      var actualAttrUI = this.getAttrUI(id);
      if (actualAttrUI == null)
      {//Pokud neexistuje vytvor
        //Nove UI pro atribut
        var aui = this.createAttrUserInterface(id, type);
        //Box s UIs atributu
        var attrsUIsBox = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
        attrsUIsBox.appendChild(aui);
        
        //Nastaveni jmena typu do textboxu
        document.getElementById(id+'-typeBox-'+this.getCurrentTabID()).aeSetType(type, this.getTypeStringToTextbox(type));
      }
      else
      {//Pokud existuje zobraz ho
        this.showAttrUI(id);
      }
      
      //NOVE ZVOLENE ID ATTR USER INTERFACE
      this.selectedAttrUIID = id;
    }
    catch(ex)
    {
      alert('attributes.js : selectAttrInterface :\n' + ex.message);
    }
  },
  
  /**
   * Nastavi atributu novy typ
   * @param {string} typ, ktery se ma atributu nastavit
   * @param {string} uri, uri atributu, jake ma v datasource attr.rdf
   */
  setTypeToAttribute : function(type, uri, setSelectedType, showOrHideP, loadAttributesP, setTypeInTemplateP)
  {
    try
    {
      //Pokud je atribut default (je v sablone)
      //a setDefInTemplateP je true, potom se typ atributu zmeni take v sablone
      if (setTypeInTemplateP == null || setTypeInTemplateP == undefined)
        var setTypeInTemplate = true;
      else
        var setTypeInTemplate = setTypeInTemplateP;

      if (showOrHideP == undefined || showOrHideP == null)
        var showOrHide = true;
      else
        var showOrHide = showOrHideP;  
        
      if (loadAttributesP == undefined || loadAttributesP == null)
        var loadAttributes = true;
      else
        var loadAttributes = loadAttributesP;
      
      //Vybran jiny typ, ukonci vyber vnorene anotace
      if (annotationExtensionChrome.bottomAnnotationWindow.selectingNested == true)
        annotationExtensionChrome.bottomAnnotationWindow.selectNestedAnnotation(
          annotationExtensionChrome.bottomAnnotationWindow.nestedAnnotationUIID);

      var oldType = annotationExtensionChrome.attrDatasource.getResourceProp(uri, 'type');
      if(oldType == type)
        //Typ nezmenen(nastaven na typ ktery je nastaveny)
        return;
      
      var name = "";
      var uiID = uri;
      var parentURI = uri;
      
      var attrUITypebox = document.getElementById(uiID+'-typeBox-'+this.getCurrentTabID());
      if (attrUITypebox != null)
      {//ATRIBUT MA ZOBRAZENE(VYTVORENE) UI, ZMEN HO
        var name = this.getTypeStringToTextbox(type);
        attrUITypebox.aeSetType(type, name);
  
        /*********Smazani souvisejicich atributu*******************/
        if (!this.attributeIsEdited(uri))
          this.deleteAttrInterfaceChilds(uiID);
        /**********ZMENA UI ATRIBUTU ******************************/
        //Smazani radku ui a vytvoreni novych
        var rows = document.getElementById(uiID + '-rows-'+this.getCurrentTabID());
        var firstRow = document.getElementById(uiID + '-row1-'+this.getCurrentTabID());
        var secondRow = document.getElementById(uiID + '-row2-'+this.getCurrentTabID());
        
        var nestedAnnotObj = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotation(uri);
        var attrIsALink = this.attributeIsALink(uri);
        if (nestedAnnotObj != null && !attrIsALink && !annotationExtension.attrConstants.isSimple(type))
        {//Pokud se zmenil typ vnorene anotace na jiny typ vnorene anotace, ponechej ulozene hodnoty
          //Do nothing
        }
        else
        {//Jinak smaz
          if (attrIsALink)
          {//Zmenil se typ, aLink by tedy ukazoval na spatny typ...smaz
            deleteALinkFromAttribute(uri);
          }
            
          rows.removeChild(firstRow);
          if (secondRow != null)
            rows.removeChild(secondRow);
          
          var newRows = this.createAttrUIRows(uiID, type);
          
          rows.appendChild(newRows[0]);
          if(newRows.length > 1)
          {
            rows.appendChild(newRows[1]);
          }
        }
        /**********************************************************/
      }
      
      /******Smazani souvisejicich atributu**********************/
      if (!this.attributeIsEdited(uri))
        annotationExtensionChrome.attrDatasource.delAllObjectsInSeq(uri);
      /**********************************************************/
      
      /*****Zmena typu v ds attr**************************************/
      if (annotationExtension.attrConstants.isSimple(type))
        var structP = 'false';
      else
        var structP = 'true';
        
      var attrTree = document.getElementById('aeAttrTree');
      var savedSelection = attrTree.currentIndex;
      attrTree.view.selection.clearSelection();
      
      annotationExtensionChrome.attrDatasource.changeResourceProp(uri, 'type', type);
      annotationExtensionChrome.attrDatasource.changeResourceProp(uri, 'struct', structP);
      /*********************************************************/
      
      attrTree.view.selection.select(savedSelection);
      
      /*****Je vybran novy typ atributu**************************/
      if(setSelectedType == undefined || setSelectedType == true)
        this.selectedAttrType = type;
      /**********************************************************/
      /****Pokud je vybran strukt. atribut. Nahraj do stromu atributu jeho atributy****/
      if(loadAttributes && !annotationExtension.attrConstants.isSimple(type) && !this.attributeIsEdited(uri))
        this.selectAttributes(type, parentURI, false, true, false);
      /*******************************************************************************/
      /****Pokud byl nastaveny jako aLink, zrus aLink ********************************/
      annotationExtensionChrome.attrDatasource.changeResourceProp(uiID, 'aLink', "");
      /******************************************************************************/
      
      /***Zobraz nebo skryj tlacitko na pridani atributu do atributu*****************/
      if(showOrHide)
        this.showOrHideAddAttrToAttrButtonByID(uiID);
      /******************************************************************************/
      
      /////////////////////
      /////////////////////
      var typeURIwhichHasAttribute = this.getTypeURIinWhichIsSelectedAttribute();
      var attrParentURI = this.getParentURIOfSelectedAttribute();
      
      if (typeURIwhichHasAttribute != null && attrParentURI != null)
      {
        /***Pokud byl zmenen typ defaultnimu atributu, je potreba odeslat zmenu typu na server s novym typem atributu***/       
        if (this.attributeIsDefault(uri) && setTypeInTemplate)
        {
          annotationExtensionChrome.bottomAnnotationWindow.addToChangedTypes(typeURIwhichHasAttribute);
          /**************************************************************************************************************/
        
          /*****Zmena typu v ds typeAttr**************************************/
          var attrName = annotationExtensionChrome.attrDatasource.getResourceProp(uri, 'name');
          var attrTypeURI = annotationExtensionChrome.attrDatasource.getResourceProp(uri, 'attrTypeURI');
          annotationExtensionChrome.typeAttrDatasource.changeResourceProp(attrTypeURI,'type', type);
          annotationExtensionChrome.typeAttrDatasource.changeResourceProp(attrTypeURI,'struct', structP);
          /*******************************************************************/
        }
      }
      /////////////////////
      /////////////////////
    }
    catch(ex)
    {
      alert('attributes.js : setTypeToAttribute :\n' + ex.message);
    }
  },
  
  showOrHideAddAttrToAttrButtonByID : function(id)
  {
    var type = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'type');
    
    var button = document.getElementById('aeAddAttributeToAttrButton');
    if (!annotationExtension.attrConstants.isSimple(type) && !this.attributeIsALink(id))
      //Zobraz tlacitko na pridani atributu k atributu typu anotace
      button.hidden = false;
    else
      button.hidden = true;
  },
  
  hideAddAttrToAttrButton : function()
  {
    var button = document.getElementById('aeAddAttributeToAttrButton');
    button.hidden = true;
  },
  
  /**
   * Vrati "jmeno" typu, ktere se ma zobrazit v textboxu jako typ
   * @param {string} type, Typ, pro ktery chceme "jmeno"
   */
  getTypeStringToTextbox : function(type)
  {
    if (annotationExtension.attrConstants.isSimple(type))
      return type;
    else
    {
      return annotationExtension.functions.linearTypeURI(type);
    }
  },
  
  /**
   * @param {string} id, id elementu, ktery pozadujeme
   * @returns {node} vrati UI podle id
   *                 pokud UI s pozadovanym id neexistuje, vrati null
   */
  getAttrUI : function(id)
  {
    return this.getInterfaceInTabById(id);
  },
  
  /**
   * Zobrazi UI atributu podle ID
   * @param {string} id, ID UI atributu
   */
  showAttrUI : function(id)
  {
    var attrUI = this.getInterfaceInTabById(id);
    if (attrUI != null)
      attrUI.hidden = false;
    
    //TODO: TEST_EDIT1
    //Sipky pro vyber range ve vnorene anotaci jsou defaultne schovane.
    //var box = document.getElementById(id + '-aeSelectRangeBox-'+this.getCurrentTabID());
    //  if (box != null)
    //    box.setAttribute("hidden", "true");
  },
  
  /**
   * Skryje aktualne zobrazene UI atributu
   */
  hideSelectedAttrUI : function()
  {
    if (this.selectedAttrUIID != null)
    {
      var selectedUI = this.getInterfaceInTabById(this.selectedAttrUIID);
      if (selectedUI != null)
        selectedUI.hidden = true;
    }
  },
  
  /**
   * Smaze vsechna UI atributu, ktera se vytvorila pro danny typ anotace.
   */
  deleteAttrInterfaces : function()
  {
    var attrsUIsBox = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    while (attrsUIsBox.hasChildNodes())
    {
      var attrUI = attrsUIsBox.firstChild;
      attrsUIsBox.removeChild(attrUI);
    }
    
    //Neni vybrano zadne uziv. rozhrani
    this.selectedAttrUIID = null;
  },
  
  /**
   * Smaze UI atributu, ktere ma dane ID
   * @param {string} id, ID UI, ktere chceme smazat
   */
  deleteAttrInterface : function(id)
  {
    var tabsUI = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if(tabsUI != null && tabsUI.hasChildNodes)
    {
      var child = tabsUI.firstChild;
      
      while (child != null)
      {
        var childID = child.getAttribute('id');
        //Pokud id obsahuje na zacatku id interface, pro ktery chceme smazat potomky, je potomkem
        if(childID == id)
        {
          child.parentNode.removeChild(child);
          return;
        }
        child = child.nextSibling;
      }
    }
  },
  
  /**
   * Smaze UI atributu, ktere ma dane ID(jsou "potomky UI" s atributem id==ID)
   * @param {string} id, ID UI, pro ktere chceme smazat potomky
   */
  deleteAttrInterfaceChilds : function(id)
  {
    var attrsUIsBox = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    
    if (attrsUIsBox == null)
      return;
    
    if (attrsUIsBox.hasChildNodes())
    {
      var attrUI = attrsUIsBox.firstChild;
      while(attrUI)
      {
        var next = attrUI.nextSibling;
        
        var attrUIID = attrUI.getAttribute('id');
        //Pokud id obsahuje na zacatku id interface, pro ktery chceme smazat potomky, je potomkem
        //attrUIID != id zaruci, ze se nesmaze "rodic"!
        if(attrUIID.search(id) == 0 && attrUIID != id)
        {
          attrsUIsBox.removeChild(attrUI);
        }
        
        attrUI = next;
      }
    }
  },
  
  /**
   * Smaze interfaces atributu pro vsechny zalozky.
   */
  deleteAllAttrInterfaces : function()
  {
    var attrsUIsBox = document.getElementById('aeAttrUserInterface');
    
    while (attrsUIsBox.hasChildNodes())
    {
      var attrUI = attrsUIsBox.firstChild;
      attrsUIsBox.removeChild(attrUI);
    }
    
    //Neni vybrano zadne uziv. rozhrani
    this.selectedAttrUIID = null;
  },
  
  /**
   * Vytvori uzivatleske rozhrani pro atribut.
   * @param {String} id, id ktere se priradi UI
   * @param {String} type, typ UI z annotationExtension.attrConstants
   */
  createAttrUserInterface : function(id, type)
  {    
    var attrGrid = document.createElement('grid');
      attrGrid.setAttribute('id', id);
      attrGrid.setAttribute('flex', '1');
    var attrCols = document.createElement('columns');
    var firstAttrCol = document.createElement('column');
      firstAttrCol.setAttribute('class', 'attrLabelColumn')
    var secondAttrCol = document.createElement('column');
      secondAttrCol.setAttribute('flex', '1');
    var thirdAttrCol = document.createElement('column');
    var attrRows = document.createElement('rows');
      attrRows.setAttribute('id', id + '-rows-'+this.getCurrentTabID());
    
    var newRows = this.createAttrUIRows(id, type);
    
    //Tlacitko a textbox na vyber typu
    attrRows.appendChild(this.createSelectAttrTypeUI(id))
    //Ostatni textboxy a labely
    attrRows.appendChild(newRows[0]);
    if(newRows.length > 1)
    {
      attrRows.appendChild(newRows[1]);
    }    
    
    attrCols.appendChild(firstAttrCol);
    attrCols.appendChild(secondAttrCol);
    attrCols.appendChild(thirdAttrCol);
    attrGrid.appendChild(attrCols);
    attrGrid.appendChild(attrRows);
    
    return attrGrid;
  },
  
  attrSelectFile : function(id, tabId)
  {
    //TODO:
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Select a File", nsIFilePicker.modeOpen);
    var res = fp.show();
    if (res != nsIFilePicker.returnCancel)
    {
      var thefile = fp.file;
      
      var path = thefile.path
      //var size = thefile.fileSize;
      
      var tb = document.getElementById(id+'-textbox1-'+tabId)
      tb.value = path;
    }
  },
  
  /**
   * Vytvori uzivatelske rozhrani pro atribut.
   */
  createAttrUIRows : function(id, type)
  {
    var newRows = [];
    
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    var labels = [];
    
    type = type.toLowerCase();
    with (annotationExtension.attrConstants)
    {
      //TODO: DODELAT KONTROLU VSTUPU - ke kazdemu textboxu pri inputu dat nejakou funkci
      if (type == SIMPLE_IMAGE.toLowerCase())
      {//IMAGE
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.image"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        boxForSecondColumn.appendChild(rowTextbox);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_ANYANNOTATION.toLowerCase())
      {//ANYANNOTATION
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowSpacer = document.createElement('spacer');
          rowSpacer.setAttribute('flex', '1');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowSpacer);
        row.appendChild(boxForSecondColumn);
        row.setAttribute('hidden', 'true');
        newRows.push(row);
      }
      else if (type == SIMPLE_BINARY.toLowerCase())
      {//BINARY
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.file"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('readonly', 'true');
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var fileButton = document.createElement('button');
        fileButton.setAttribute('onclick', 'annotationExtensionChrome.attributes.attrSelectFile("'+id+'", "'+this.getCurrentTabID()+'");');
        fileButton.setAttribute('label', stringBundle.getString('annotationextension.choose.button.label'));
        fileButton.setAttribute('class', 'aeAttributeTypeSelect');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        row.appendChild(fileButton);
        newRows.push(row);
      }
      else if (type == SIMPLE_DURATION.toLowerCase())
      {//DURATION
                var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.duration"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_TEXT.toLowerCase())
      {//TEXT
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.string"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('multiline', 'true');
          rowTextbox.setAttribute('flex','1');
          rowTextbox.setAttribute('rows', '2');
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        boxForSecondColumn.appendChild(rowTextbox);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);        
      }
      else if (type == SIMPLE_STRING.toLowerCase())
      {//STRING
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.string"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_URI.toLowerCase())
      {//URI
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.uri"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        boxForSecondColumn.appendChild(rowTextbox);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_DATETIME.toLowerCase())
      {//DATETIME
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.date"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('datepicker');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('type', 'popup');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
        
        var row2 = document.createElement('row');
          row2.setAttribute('id', id+'-row2-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel2 = document.createElement('label');
          rowLabel2.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.time"));
          rowLabel2.setAttribute('class', 'aeLabel');
        var rowTextbox2 = document.createElement('timepicker');
          rowTextbox2.setAttribute('id', id+'-textbox2-'+this.getCurrentTabID());
          rowTextbox2.setAttribute('hideseconds', 'true');
        var boxForSecondColumn2 = document.createElement('hbox');
        var spacerForBoxForSecondColumn2 = document.createElement('spacer');
          spacerForBoxForSecondColumn2.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn2.appendChild(rowTextbox2);
        boxForSecondColumn2.appendChild(spacerForBoxForSecondColumn2);
        row2.appendChild(rowLabel2);
        row2.appendChild(boxForSecondColumn2);
        newRows.push(row2);
      }
      else if (type == SIMPLE_INTEGER.toLowerCase())
      {//INTEGER
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.integer"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('type', 'number');
          rowTextbox.setAttribute('min', "-999999999999999999999");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_DECIMAL.toLowerCase())
      {//DECIMAL
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.decimal"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('type', 'number');
          rowTextbox.setAttribute('decimalplaces', 'Infinity');
          rowTextbox.setAttribute('increment', '0.5');
          rowTextbox.setAttribute('min', "-999999999999999999999");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_DATE.toLowerCase())
      {//DATE
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.date"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('datepicker');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('type', 'popup');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_TIME.toLowerCase())
      {//TIME
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.time"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('timepicker');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('hideseconds', 'true');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_BOOLEAN.toLowerCase())
      {//BOOL
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.boolean"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('listbox');
        var listitemTrue = document.createElement('listitem');
          listitemTrue.setAttribute('label', 'true');
        var listitemFalse = document.createElement('listitem');
          listitemFalse.setAttribute('label', 'false');
          rowTextbox.setAttribute('rows', '2');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.appendChild(listitemTrue);
          rowTextbox.appendChild(listitemFalse);
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_PERSON.toLowerCase())
      {//PERSON
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.person"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute("flex", "1");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
      }
      else if (type == SIMPLE_GEOPOINT.toLowerCase())
      {//GEOPOINT
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.geoLat"));
          rowLabel.setAttribute('class', 'aeLabel');
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          rowTextbox.setAttribute('type', 'number');
          rowTextbox.setAttribute('decimalplaces', '3');
          rowTextbox.setAttribute('increment', '0.5');
          rowTextbox.setAttribute('min', "-90");
          rowTextbox.setAttribute('max', "90");
          rowTextbox.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn = document.createElement('hbox');
        var spacerForBoxForSecondColumn = document.createElement('spacer');
          spacerForBoxForSecondColumn.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn.appendChild(rowTextbox);
        boxForSecondColumn.appendChild(spacerForBoxForSecondColumn);
        row.appendChild(rowLabel);
        row.appendChild(boxForSecondColumn);
        newRows.push(row);
        
        var row2 = document.createElement('row');
          row2.setAttribute('id', id+'-row2-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel2 = document.createElement('label');
          rowLabel2.setAttribute('value', stringBundle.getString("annotationextension.annotationWindow.attLabel.geoLong"));
          rowLabel2.setAttribute('class', 'aeLabel');
        var rowTextbox2 = document.createElement('textbox');
          rowTextbox2.setAttribute('id', id+'-textbox2-'+this.getCurrentTabID());
          rowTextbox2.setAttribute('type', 'number');
          rowTextbox2.setAttribute('decimalplaces', '3');
          rowTextbox2.setAttribute('increment', '0.5');
          rowTextbox2.setAttribute('min', "-180");
          rowTextbox2.setAttribute('max', "180");
          rowTextbox2.setAttribute('class', 'aeTextbox');
        var boxForSecondColumn2 = document.createElement('hbox');
        var spacerForBoxForSecondColumn2 = document.createElement('spacer');
          spacerForBoxForSecondColumn2.setAttribute("class", "spacerForAttrSecondColumn");
        boxForSecondColumn2.appendChild(rowTextbox2);
        boxForSecondColumn2.appendChild(spacerForBoxForSecondColumn2);
        row2.appendChild(rowLabel2);
        row2.appendChild(boxForSecondColumn2);
        newRows.push(row2);
      }
      else
      {//Jedna se o typ anotace
        var row = document.createElement('row');
          row.setAttribute('id', id+'-row1-'+this.getCurrentTabID()); 
        /*************/
        var chooseButtonLabel = stringBundle.getString("annotationextension.choose.button.label");
        var rowLabel = document.createElement('label');
          rowLabel.setAttribute('value', stringBundle.getString("annotationextension.aeSelectedText.selectedText.label"));
          rowLabel.setAttribute('tooltiptext', stringBundle.getFormattedString("annotationextension.annotationWindow.selectedTextNested.tooltip", [chooseButtonLabel]));
          rowLabel.setAttribute('class', 'aeLabel');
         
        ////////////////////////////////////////////////////////////////////////
        /// VYBER RANGE                                                      ///
        var imagePrev = document.createElement('image');
          imagePrev.setAttribute('class','aeSelectPrevious');
          imagePrev.setAttribute('onclick',"annotationExtensionChrome.selectedText.showRange('previous');");
          imagePrev.setAttribute('tooltiptext', stringBundle.getString("annotationextension.aeSelectedText.selectedText.previous.tooltip"));
        var spacer1 = document.createElement('spacer');
          spacer1.setAttribute('flex', '1');
        var labelRange = document.createElement('label');
          labelRange.setAttribute('id', id+'-aeSelectedRangeLabel-'+this.getCurrentTabID());
        var spacer2 = document.createElement('spacer');
          spacer2.setAttribute('flex', '1');
        var imageNext = document.createElement('image');
          imageNext.setAttribute('class','aeSelectNext');
          imageNext.setAttribute('onclick',"annotationExtensionChrome.selectedText.showRange('next');");
          imageNext.setAttribute('tooltiptext', stringBundle.getString("annotationextension.aeSelectedText.selectedText.next.tooltip"));
        
        var selectRangeBox = document.createElement('hbox');
          selectRangeBox.setAttribute('id', id+'-aeSelectRangeBox-'+this.getCurrentTabID());
          selectRangeBox.setAttribute('align','center');
          selectRangeBox.setAttribute('pack','center');
          selectRangeBox.setAttribute('hidden','true');
          selectRangeBox.appendChild(imagePrev);
          selectRangeBox.appendChild(spacer1);
          selectRangeBox.appendChild(labelRange);
          selectRangeBox.appendChild(spacer2);
          selectRangeBox.appendChild(imageNext);
        var deleteRangeBox = document.createElement('hbox');
          deleteRangeBox.setAttribute('id', id+'-aeDeleteRangeBox-'+this.getCurrentTabID());
          deleteRangeBox.setAttribute('pack', 'center');
          deleteRangeBox.setAttribute('hidden','true');
        var deleteAnnotButton = document.createElement('image');
          deleteAnnotButton.setAttribute('id', id+'-aeDeleteActiveRange-'+this.getCurrentTabID());
          deleteAnnotButton.setAttribute('class','aeDeleteAnnotSelection');
          deleteAnnotButton.setAttribute('onclick',"annotationExtensionChrome.selectedText.removeActiveRange();");
          deleteAnnotButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.aeSelectedText.selectedText.delete.tooltip"));
        deleteRangeBox.appendChild(deleteAnnotButton);
        ///                                                                  ///
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        /// VYBER MULTIPLE ANNOTATION
        var imagePrevAnnot = document.createElement('image');
          imagePrevAnnot.setAttribute('class','aeSelectPrevious');
          imagePrevAnnot.setAttribute('onclick',"annotationExtensionChrome.attributes.showEditAnnotationButtonHandler('previous','"+id+"');");
          imagePrevAnnot.setAttribute('tooltiptext', stringBundle.getString("annotationextension.aeSelectedText.selectedText.previous.tooltip"));
        var spacer1Annot = document.createElement('spacer');
          spacer1Annot.setAttribute('flex', '1');
        var labelRangeAnnot = document.createElement('label');
          labelRangeAnnot.setAttribute('id', id+'-aeSelectedAnnotLabel-'+this.getCurrentTabID());
        var spacer2Annot = document.createElement('spacer');
          spacer2Annot.setAttribute('flex', '1');
        var imageNextAnnot = document.createElement('image');
          imageNextAnnot.setAttribute('class','aeSelectNext');
          imageNextAnnot.setAttribute('onclick',"annotationExtensionChrome.attributes.showEditAnnotationButtonHandler('next','"+id+"');");
          imageNextAnnot.setAttribute('tooltiptext', stringBundle.getString("annotationextension.aeSelectedText.selectedText.next.tooltip"));
        
        var selectRangeBoxAnnot = document.createElement('hbox');
          selectRangeBoxAnnot.setAttribute('id', id+'-aeSelectAnnotBox-'+this.getCurrentTabID());
          selectRangeBoxAnnot.setAttribute('align','center');
          selectRangeBoxAnnot.setAttribute('pack','center');
          selectRangeBoxAnnot.setAttribute('hidden','true');
          selectRangeBoxAnnot.appendChild(imagePrevAnnot);
          selectRangeBoxAnnot.appendChild(spacer1Annot);
          selectRangeBoxAnnot.appendChild(labelRangeAnnot);
          selectRangeBoxAnnot.appendChild(spacer2Annot);
          selectRangeBoxAnnot.appendChild(imageNextAnnot);
        var addDeleteBox = document.createElement('hbox');
          addDeleteBox.setAttribute('id', id+'-aeAddDeleteAnnotBox-'+this.getCurrentTabID());
          addDeleteBox.setAttribute('pack', 'center');
          addDeleteBox.setAttribute('hidden','true');
        var addAnnotButton = document.createElement('image');
          addAnnotButton.setAttribute('id', id+'-aeAddAnnotSelection-'+this.getCurrentTabID());
          addAnnotButton.setAttribute('class','aeAddAnnotSelection');
          addAnnotButton.setAttribute('onclick',"annotationExtensionChrome.attributes.addAnnotationToSelectionButtonHandler('"+id+"');");
          addAnnotButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.selection.add"));
        var deleteAnnotButton = document.createElement('image');
          deleteAnnotButton.setAttribute('id', id+'-aeDeleteAnnotSelection-'+this.getCurrentTabID());
          deleteAnnotButton.setAttribute('class','aeDeleteAnnotSelection');
          deleteAnnotButton.setAttribute('onclick',"annotationExtensionChrome.attributes.deleteAnnotationFromSelectionButtonHandler('"+id+"');");
          deleteAnnotButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.selection.delete"));
        addDeleteBox.appendChild(addAnnotButton);
        addDeleteBox.appendChild(deleteAnnotButton);
        ///                                                                  ///
        ////////////////////////////////////////////////////////////////////////
        var aeSelectTextLabelBox = document.createElement('vbox');
          aeSelectTextLabelBox.setAttribute('id', id+'-aeSelectTextLabelBox-'+this.getCurrentTabID());
          aeSelectTextLabelBox.setAttribute('flex','1');
          aeSelectTextLabelBox.appendChild(rowLabel);
          aeSelectTextLabelBox.appendChild(selectRangeBox);
          aeSelectTextLabelBox.appendChild(deleteRangeBox);
          aeSelectTextLabelBox.appendChild(selectRangeBoxAnnot);
          aeSelectTextLabelBox.appendChild(addDeleteBox);
          
      
        var rowTextbox = document.createElement('textbox');
          rowTextbox.setAttribute('id', id+'-textbox1-'+this.getCurrentTabID());
          //rowTextbox.setAttribute('autocompletesearchparam', 'attrType');
          rowTextbox.setAttribute('multiline', 'true');
          rowTextbox.setAttribute('flex','1');
          rowTextbox.setAttribute('rows', '2');
          rowTextbox.setAttribute('readonly', 'true');
          rowTextbox.setAttribute('class', 'aeTextbox');
        var selectButton = document.createElement('button');
          selectButton.setAttribute('id',id+'selectNestedButton-'+this.getCurrentTabID());
          selectButton.setAttribute('class', 'aeSelectNestedAnnotButton');
          selectButton.setAttribute('label', chooseButtonLabel);
          selectButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.annotationWindow.chooseNested.tooltip"));
          selectButton.setAttribute('oncommand', "annotationExtensionChrome.bottomAnnotationWindow.selectNestedAnnotation('"+id+"');");
        var selectButtonSpacer = document.createElement('spacer');
          selectButtonSpacer.setAttribute('flex', '1');
        var selectButtonBox = document.createElement('vbox');
          selectButtonBox.appendChild(selectButton);
          selectButtonBox.appendChild(selectButtonSpacer);
        row.appendChild(aeSelectTextLabelBox);
        row.appendChild(rowTextbox);
        row.appendChild(selectButtonBox);
        newRows.push(row);
        
        var row2 = document.createElement('row');
          row2.setAttribute('id', id+'-row2-'+this.getCurrentTabID()); 
        /*************/
        var rowLabel2 = document.createElement('label');
          rowLabel2.setAttribute('value', stringBundle.getString("annotationextension.aeContentText.annotationText.label"));
          rowLabel2.setAttribute('tooltiptext', stringBundle.getString("annotationextension.annotationWindow.contentText.tooltip"));
          rowLabel2.setAttribute('class', 'aeLabel');
        var rowTextbox2 = document.createElement('textbox');
          rowTextbox2.setAttribute('id', id+'-textbox2-'+this.getCurrentTabID());
          rowTextbox2.setAttribute('flex', '1');
          rowTextbox2.setAttribute('class', 'aeTextbox');
        
        var annotContentTextboxDeck = document.createElement('deck');
          annotContentTextboxDeck.setAttribute('selectedIndex', '0');
          annotContentTextboxDeck.setAttribute('id', id+'-contentDeck-'+this.getCurrentTabID());
          annotContentTextboxDeck.setAttribute('flex', '1');
        var aLinkLabel = document.createElement('label');
          aLinkLabel.setAttribute('id', id+'-aLinkLabel-'+this.getCurrentTabID());
          aLinkLabel.setAttribute('value', stringBundle.getString("annotationextension.attributes.annotLink"));
        var aLinkImage = document.createElement('image');
          aLinkImage.setAttribute('id', id+'-aLinkImage-'+this.getCurrentTabID());
          aLinkImage.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
          aLinkImage.setAttribute('width','12');
          aLinkImage.setAttribute('height','12');
        var aLinkLabelBox = document.createElement('hbox');
          aLinkLabelBox.setAttribute('id', id+'-aLinkLabelBox-'+this.getCurrentTabID());
          aLinkLabelBox.setAttribute('pack', 'center');
          aLinkLabelBox.setAttribute('align', 'center');
          aLinkLabelBox.setAttribute('flex', '1');
          aLinkLabelBox.appendChild(aLinkLabel);
          aLinkLabelBox.appendChild(aLinkImage);
          
        var labelBox = document.createElement('hbox');
          labelBox.setAttribute("class", "redBoxHover");
          labelBox.setAttribute('id', id+'-labelContentBox-'+this.getCurrentTabID());
          labelBox.appendChild(aLinkLabelBox); 
                 
        annotContentTextboxDeck.appendChild(rowTextbox2);
        annotContentTextboxDeck.appendChild(labelBox);
        
        row2.appendChild(rowLabel2);
        row2.appendChild(annotContentTextboxDeck);
        newRows.push(row2);
      }
    }
     
    return newRows;  
  },
  
  /**
   * Vytvoreni prvku UI na vyber typu atributu
   */
  createSelectAttrTypeUI : function(id)
  {
    try
    {
      var typeRow = document.createElement('row');
        typeRow.setAttribute('id', id+'-selectTypeRow-'+this.getCurrentTabID());
      
      var typeBox = document.createElement('box');
        typeBox.setAttribute('aeConfirmTextHidden', 'true');
        typeBox.setAttribute('aeShowSimple', 'true');
        typeBox.setAttribute('id', id+'-typeBox-'+this.getCurrentTabID());
        typeBox.setAttribute("type", "aeTypeSelect");
        typeBox.aeOnTypeSelect = this.newTypeSelectedHandler;
        typeBox.aeMainAEChrome = annotationExtensionChrome;
        typeBox.aeContext = annotationExtensionChrome.attributes;
        typeBox.setAttribute('aeAttrId', id);
      
      var typeLabel = document.createElement('box');
        typeLabel.setAttribute("type", "aeTypeSelectLabel");
        typeLabel.setAttribute("control", id+'-typeBox-'+this.getCurrentTabID());
        typeLabel.setAttribute("id", id+'-typeLabel-'+this.getCurrentTabID());
      
      var typeButton = document.createElement('box');
        typeButton.setAttribute("type", "aeTypeSelectButton");
        typeButton.setAttribute("aeTypeSelect", id+'-typeBox-'+this.getCurrentTabID());
        typeButton.setAttribute("id", id+'-typeButton-'+this.getCurrentTabID());
      
      typeRow.appendChild(typeLabel);
      typeRow.appendChild(typeBox);
      typeRow.appendChild(typeButton);
      
      return typeRow;
    }
    catch(ex)
    {
      alert('attributes.js : createSelectAttrTypeUI:\n' + ex.message);
      return null;
    }
  },
  
  /**
   * Precte data z UI.
   * @param {String} id id UI, pro ktere chceme precist data
   * @returns {Array} Pole prectenych hodnot, kazdy prvek == jeden textbox
   */
  getDataFromUI : function(id)
  {
    try
    {
      var data = [];

      var typeBox = document.getElementById(id+'-typeBox-'+this.getCurrentTabID());
      var firstTextbox = document.getElementById(id+'-textbox1-'+this.getCurrentTabID());
      var secondTextbox = document.getElementById(id+'-textbox2-'+this.getCurrentTabID());
      
      if (typeBox == null || firstTextbox == null)
        return data;
      
      if (typeBox.aeSelectedTypeName != "")
        data.push(typeBox.aeSelectedTypeName);
      
      if (firstTextbox.value != undefined && firstTextbox.value != null)
        if (firstTextbox.value.length > 0)
          data.push(firstTextbox.value);
      else if(firstTextbox.tagName == 'listbox')
      {
        data.push(firstTextbox.getSelectedItem(0).label);
      }
        
      if (secondTextbox != null)
        if (secondTextbox.value.length > 0)
          data.push(secondTextbox.value);
      
      return data;
    }
    catch(ex)
    {
      alert('attributes.js : getDataFromUI:\n' + ex.message);
      return null;
    }
  },
  
  /**
   * Zda je UI rodice prave vybraneho atributu ve stromu DOMu =
   * = je v nem neco napsano (=vnorena anotace)
   */
  selectedAttrHasParentInTree : function()
  {
    var parentURI = this.getSelectionParentURI();
    
    if (parentURI == "")
      //Atribut prvni urovne
      return true;
    
    var parentElem = this.getInterfaceInTabById(parentURI);
    if (parentElem == null)
      return false;
    else
      return true;
  },
  
  /**
   * @param {Int} id, id uziv. rozhrani atributu
   * @returns {bool} true, pokud je atribut radne vyplneny, jinak false
   */
  attributeIsFilled : function(id)
  {
    try
    {
      //TODO: TEST_1001 otestovat zda tato funkce pracuje spravne
      var typeBox = document.getElementById(id+'-typeBox-'+this.getCurrentTabID());      
      if (typeBox == null)
        throw 'ATTRIBUTE_UI_NOT_FOUND';
    
      if (typeBox.aeSelectedTypeName == "")
        return false;
      
      var type = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'type');
      var type = type.toLowerCase();
      with (annotationExtension.attrConstants)
      {
        if (type == SIMPLE_STRING.toLowerCase() || type == SIMPLE_URI.toLowerCase() ||
            type == SIMPLE_INTEGER.toLowerCase() || type == SIMPLE_DECIMAL.toLowerCase() || type == SIMPLE_DATE.toLowerCase() ||
            type == SIMPLE_TIME.toLowerCase() || type == SIMPLE_PERSON.toLowerCase() || type == SIMPLE_DURATION.toLowerCase()
            || type == SIMPLE_IMAGE.toLowerCase() || type == SIMPLE_TEXT.toLowerCase() || type == SIMPLE_ANYANNOTATION.toLowerCase()
            || type == SIMPLE_BINARY.toLowerCase())
        {//ATRIBUTY S JEDNIM TEXTBOXEM
          var firstTextbox = document.getElementById(id+'-textbox1-'+this.getCurrentTabID());
          
          if (firstTextbox == null)
            throw 'ATTRIBUTE_UI_NOT_FOUND';
          
          if (firstTextbox.value == undefined || firstTextbox.value == null || firstTextbox.value == "")
            return false;
          
          return true;
        }
        else if (type == SIMPLE_BOOLEAN.toLowerCase())
        {//BOOL (LISTBOX)
          var firstTextbox = document.getElementById(id+'-textbox1-'+this.getCurrentTabID());
          
          if (firstTextbox == null)
            throw 'ATTRIBUTE_UI_NOT_FOUND';
          
          if (firstTextbox.selectedItem == null)
            return false;
          
          return true;          
        }
        else if (type == SIMPLE_GEOPOINT.toLowerCase() || type == SIMPLE_DATETIME.toLowerCase())
        {//ATRIBUTY SE DVEMA TB.
          var firstTextbox = document.getElementById(id+'-textbox1-'+this.getCurrentTabID());
          
          if (firstTextbox == null)
            throw 'ATTRIBUTE_UI_NOT_FOUND';
          
          if (firstTextbox.value == undefined || firstTextbox.value == null || firstTextbox.value == "")
            return false;
        
          var secondTextbox = document.getElementById(id+'-textbox2-'+this.getCurrentTabID());
          
          if (secondTextbox == null)
            throw 'ATTRIBUTE_UI_NOT_FOUND';
          
          if (secondTextbox.value == undefined || secondTextbox.value == null || secondTextbox.value == "")
            return false;
          
          return true;
        }
        else
        {//ANOTACE (staci kdyz je "vybran text")
          var firstTextbox = document.getElementById(id+'-textbox1-'+this.getCurrentTabID());
          
          if (firstTextbox == null)
            throw 'ATTRIBUTE_UI_NOT_FOUND';
          
          if (firstTextbox.value == undefined || firstTextbox.value == null || firstTextbox.value == "")
            return false;
          
          return true;
        }
      }
    }
    catch(ex)
    {
      return false;
    }
    
  },
  
  hasDataInUI : function(uiID)
  {
    data = this.getDataFromUI(uiID);
    //Prvni prvek je hodnota typu atributu
    if (data.length > 1)
      return true;
    else
      return false;
  },
  
  getInterfaceInTabById : function(id)
  {
    var tabUI = document.getElementById('tab'+ this.getCurrentTabID());

    if(tabUI != null && tabUI.hasChildNodes)
    {
      var child = tabUI.firstChild;
      
      while (child)
      {
        var childID = child.getAttribute('id');
        if(childID == id)
          return child;
        
        child = child.nextSibling;
      }
    }
    
    return null;
  },
  
  /**
   * @return {int} index vyberu ve stromu
   * Pro strom id=aeAttrTree
   */
  getSelectionIndex : function()
  {
    var view = document.getElementById('aeAttrTree').view;
    
    return view.selection.currentIndex;
  },
  
  /**
   * @return {int} URI vyberu ve stromu, pokud neni nic vybrano, vrati null
   * Pro strom id=aeAttrTree
   */
  getSelectionURI : function()
  {
    var index = this.getSelectionIndex();
    
    if (index > -1)
      return annotationExtensionChrome.attrDatasource.getResourceURIOnIndex(index);
    else
      return null;
  },
  
  /**
   * @return {int} index rodice vyberu ve stromu, pokud neni nic vybrano, cislo MENSI jak -1
   * Pro strom id=aeAttrTree
   */
  getSelectionParentIndex : function()
  {
    var view = document.getElementById('aeAttrTree').view;
    var selIndex = this.getSelectionIndex();
    if(selIndex > -1)
    {
      return view.getParentIndex(selIndex);
    }
    else
      return -2;
  },
  
  /**
   * @return {string} URI rodice aktualniho vyberu
   * pro strom z attrDatasource
   */
  getSelectionParentURI : function()
  {
    var selParentIndex = this.getSelectionParentIndex();  /**< Index rodice vybraneho radku. */
    if (selParentIndex > -1)
    {
      return annotationExtensionChrome.attrDatasource.getResourceURIOnIndex(selParentIndex);
    }
    else if (selParentIndex == -1)
    {//Neco vybrano, ale nema rodice
      return "";
    }
    else
    {//Neni nic vybrano
      return null;
    }    
  },
  
  getTypeURIinWhichIsSelectedAttribute : function()
  {
    var selectionPar = this.getSelectionParentURI();

    if (selectionPar != null)
    {
      var typeURIwhichHasAttribute = "";
      
      if(selectionPar == "")
        typeURIwhichHasAttribute = annotationExtensionChrome.bottomAnnotationWindow.selectedTypeURI;
      else
        typeURIwhichHasAttribute = annotationExtensionChrome.attrDatasource.getResourceProp(selectionPar, 'type');
        
      return typeURIwhichHasAttribute;
    }
    else
      return null;
  },
  
  getParentURIOfSelectedAttribute : function()
  {
    var selectionParent = this.getSelectionParentURI();

    if (selectionParent != undefined && selectionParent != null)
    {
      var attrParentURI = "";
      
      if(selectionParent == "")
        attrParentURI = annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName;
      else
        attrParentURI = selectionParent;
        
      return attrParentURI;
    }
    else
    {
      return null;
    }
  },
  
  /**
   * @returns {string} id prave vybrane zalozky
   */
  getCurrentTabID : function()
  {
    return annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID();
  },
  
  /**
   * Vybere do stromu atributu atributy prave vybraneho typu
   * @param {string} typeURI, uri typu v typeAttr.rdf - ziska atributy tohoto typu
   * @param {string} ancestorP, uri kam se maji atributy typu pripojit(v attr.rdf)
   * @param {bool} allP, zda se maji rekurzivne nacist vsechny typy(pri true)
   *                    melo by byt false, pokud neni uveden, je false
   * @param {Bool} reloadExisted, pokud je true a atribut se stejnym nazvem v sablone
   *               typu je jiz ve strome bude smazan a znovu nahran
   * @param {Bool} onlyChangeDefParam, pokud je true reloadExistedP a tento parametr
   *               je taky true, misto znovu nacteni atributu ze sablony, pouze atributu
   *               zmeni default parametr na true
   */
  selectAttributes : function(typeURI, ancestorP, allP, reloadExistedP, onlyChangeDefParamP)
  {
    try
    {
      if (allP == undefined || allP == null)
        var all = false;
      else
        var all = allP;
        
      if (reloadExistedP == undefined || reloadExistedP == null)
        var reloadExisted = false;
      else
        var reloadExisted = reloadExistedP;
        
      if (onlyChangeDefParamP == undefined || onlyChangeDefParamP == null)
        var onlyChangeDefParam = false;
      else
        var onlyChangeDefParam = onlyChangeDefParamP;
      
      var datasource = annotationExtensionChrome.typeAttrDatasource.getDatasource();
      if (datasource == null)
        return;
      
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
       
      //Kontejner   
      var theSectionHeading = rdfService.GetResource(typeURI);
      //Neni kontejner...
      if (!containerTools.IsContainer(datasource, theSectionHeading))
          return;
        
      theSectionContainer.Init(datasource, theSectionHeading);
      
      var attributeElems = theSectionContainer.GetElements();

      //Pruchod vsemi elementy a "prekopirovani" do attrDatasource
      while(attributeElems.hasMoreElements())
      {
        var attributeElem = attributeElems.getNext();
        attributeElem.QueryInterface(Components.interfaces.nsIRDFResource);
    
        var typeP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem, 'type');
        var reqP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'req');
        var nameP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'name');
        var defP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'def');
        var structP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'struct');
        var commentP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'comment');
        var attrTypeUriP = attributeElem.ValueUTF8;
      

        if (typeP == null || reqP == null || nameP == null)
        //Nejaka chyba, preskoc
          continue;
        
        var attr = { name : nameP, req : reqP, type : typeP, uri : ancestorP + '/' + nameP, ancestor : ancestorP, def : defP, struct : structP, attrTypeURI : attrTypeUriP, edited : "", aLink : "", comment : commentP};

        var loadAttr = true;
        if (reloadExisted == false)
        {
          loadAttr = !this.attrWithNameIsInAttrTree(attr.uri, attr.name);
        }
        
        var onlyChangeDef = false;
        if (reloadExisted == true && onlyChangeDefParam == true)
        {
          onlyChangeDef = this.attrWithNameIsInAttrTree(attr.uri, attr.name);
        }
        
        if (onlyChangeDef)
        {
          annotationExtensionChrome.attrDatasource.changeResourceProp(attr.uri, 'def', 'true');
          annotationExtensionChrome.attrDatasource.changeResourceProp(attr.uri, 'attrTypeURI', attr.attrTypeURI);
          annotationExtensionChrome.attrDatasource.changeResourceProp(attr.uri, 'comment', attr.comment);
        }
        else if (loadAttr)
          annotationExtensionChrome.attrDatasource.addNewObject(attr);
        
        //Nacti rekurzivne vsechny atributy do stromu
        if (all)
        {
          if (!annotationExtension.attrConstants.isSimple(typeP))
            //Neni jednoduchy typ atributu, pridej do stromu atributy atributu typu anotace
            this.selectAttributes(typeP, attr.uri, true, reloadExisted, onlyChangeDefParam);  
        }
      }
    }
    catch(ex)
    {
      alert('attributes.js : selectAttributes: ' + ex.message);
    }
  },
  
  //TODO: touhle funkci to nelze zjistovat - pokud kontejner neni otevren a prida se do nej atribut
  //      tak se nenactou ostatni!!! PREDELAT
  /**
   * Zda ma kontejner(atribut) v parametru pripojene elementy(dalsi atributy).
   * Pouzito ke zjisteni, pokud ma typ nahrate atributy
   * @param {string} attrURI, uri atributu, pro ktery se zjisteju, zda ma nejake pripojene elementy
   * @returns {bool} true, pokud ma nejake elementy, jinak false
   */
  hasChildElements : function(attrURI)
  {
    try
    {
      var datasource = annotationExtensionChrome.attrDatasource.getDatasource();
      if (datasource == null)
        return null;
      
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
       
      //Kontejner   
      var theSectionHeading = rdfService.GetResource(attrURI);
      //Neni kontejner...
      if (!containerTools.IsContainer(datasource, theSectionHeading))
        return false;
      theSectionContainer.Init(datasource, theSectionHeading);
      
      var attributeElems = theSectionContainer.GetElements();
      
      //Pruchod vsemi elementy
      if(attributeElems.hasMoreElements())
        return true;
      else
        return false;
    }
    catch(ex)
    {
      alert('attributes.js : hasChildElements: ' + ex.message);
      return null;
    }
  },
  
  /**
   * Pripoji atribut do stromu atributu, ke vsem atributum daneho typu, rekurzivni fce
   * @param {string} type, typ anotace ke kteremu se pripoji novy atribut
   * @param {objekt ktery obsahuje name, req a type noveho atributu} attr, novy atribut
   * @param {startURI} pri volani funkce se nastavi na root element stromu atributu
   */
  addAtributeToTypeRecursive : function(type, attr, startURI)
  {
    try
    {
      var datasource = annotationExtensionChrome.attrDatasource.getDatasource();
      if (datasource == null)
        return;

      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);

      //Kontejner   
      var theSectionHeading = rdfService.GetResource(startURI);

      //Neni kontejner...
      if (!containerTools.IsContainer(datasource, theSectionHeading))
        containerTools.MakeSeq(datasource, theSectionHeading);
        
      theSectionContainer.Init(datasource, theSectionHeading);
     
      if (!this.attributeIsEdited(startURI))
      {//TODO: DOPLNENA TATO PODMINKA KVULI EDITACI V BUDOUCNU SE BUDE MUSET FUNKCE UPRAVIT?
        if(!this.hasChildElements(startURI) && startURI != (annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName))
          return;
      }

      var checkStart = false;
      if(startURI == (annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName))
      {//startURI je kořenový kontejner
        var typePar = annotationExtensionChrome.bottomAnnotationWindow.selectedTypeURI;
        checkStart = true;
      }

      if (!checkStart || (checkStart == true && typePar == type))
      {//checkStart je true ve chvili kdy se pridava "korenovy" atribut, potom se prida pouze pokud parametr type odpovida vybranemu typu anotace 
        //Pripojeni atributu
        var ancestor = startURI;
        var uri = ancestor + '/' + attr.name;
        var newAttr = { name : attr.name, req : attr.req, type : "", uri : uri, ancestor : ancestor, def : attr.def, struct : "", attrTypeURI : attr.attrTypeURI, edited : attr.edited, aLink : attr.aLink, comment : ""};
       
        annotationExtensionChrome.attrDatasource.addNewObject(newAttr);
      }
  
      //Kontrola ostatnich atributu, zda jsou stejneho typu anotace, ke kteremu se ma pripojit atribut
      var attributeElems = theSectionContainer.GetElements();
    
      //Pruchod vsemi elementy
      while(attributeElems.hasMoreElements())
      {
        var attributeElem = attributeElems.getNext();
        attributeElem.QueryInterface(Components.interfaces.nsIRDFResource);

        var typeP = annotationExtensionChrome.attrDatasource.getResourceProp(attributeElem, 'type');       
        
        if (typeP == null || typeP != type || this.attributeIsALink(attributeElem))
          continue;
        
        this.addAtributeToTypeRecursive(type, attr, attributeElem.ValueUTF8);
      }
           
      if (!checkStart || (checkStart == true && typePar == type))
        //Nastaveni typu atributu - na konci - kvuli zacykleni
        this.setTypeToAttribute(attr.type, newAttr.uri, false, false);

    }
    catch(ex)
    {
      alert('attributes.js : addAtributeToTypeRecursive: ' + ex.message);
    }
  },
  
  /**
   * Pripoji atribut do stromu atributu
   * @param {objekt ktery obsahuje name, req a type noveho atributu} attr, novy atribut
   * @param {String} parentURI, uri ke kteremu se ma atribut pripojit
   */
  addAtributeToType : function(attr, parentURI)
  {
    try
    {
      var datasource = annotationExtensionChrome.attrDatasource.getDatasource();
      if (datasource == null)
        return;

      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);

      //Kontejner   
      var theSectionHeading = rdfService.GetResource(parentURI);

      //Neni kontejner...
      if (!containerTools.IsContainer(datasource, theSectionHeading))
        containerTools.MakeSeq(datasource, theSectionHeading);
        
      theSectionContainer.Init(datasource, theSectionHeading);

      var ancestor = parentURI;
      var uri = ancestor + '/' + attr.name;
      var newAttr = { name : attr.name, req : attr.req, type : "", uri : uri, ancestor : ancestor, def : attr.def, struct : "", attrTypeURI : attr.attrTypeURI, edited : attr.edited, aLink : attr.aLink, comment : ""};

      annotationExtensionChrome.attrDatasource.addNewObject(newAttr);

      //Nastaveni typu atributu
      this.setTypeToAttribute(attr.type, newAttr.uri, false, false);

    }
    catch(ex)
    {
      alert('attributes.js : addAtributeToType: ' + ex.message);
    }
  },
  
  /**
   * Vytvori typ z datasourcu typeAttrDatasource
   * podle uri v argumentu
   * @param {string} uri URI typu
   * @return {type} vytvoreny typ
   */
  createTypeFromDatasource : function(uri)
  {
    try
    {
      var datasource = annotationExtensionChrome.typeAttrDatasource.getDatasource();
      if (datasource == null)
        return null;
      
      var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
        getService(Components.interfaces.nsIRDFService);
      var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
        createInstance(Components.interfaces.nsIRDFContainer);
      var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
        getService(Components.interfaces.nsIRDFContainerUtils);
      
      var typePrimaryURI = annotationExtensionChrome.typesDatasource.getPrimaryTypeURI(uri);//asi by ale nemelo nastat, ze se zde nepracuje s primarni uri
      var typeName = annotationExtensionChrome.typesDatasource.getResourceProp(typePrimaryURI, 'name');
      var typeAncestor = annotationExtensionChrome.typesDatasource.getResourceProp(typePrimaryURI, 'ancestor');
      var typeGroup = annotationExtensionChrome.typesDatasource.getResourceProp(typePrimaryURI, 'group');
      var typeComment = annotationExtensionChrome.typesDatasource.getResourceProp(typePrimaryURI, 'comment');
      var typeAncestors;
      try {
        var typeAncestorsString = annotationExtensionChrome.typesDatasource.getResourceProp(typePrimaryURI, 'ancestorsArray');
        typeAncestorsString = typeAncestorsString.replace(/'/g, '"');
        typeAncestors = JSON.parse(typeAncestorsString);
      } catch(ex) {
        typeAncestors = [];
      }
      
    
      //Vytvoreni typu
      var newType = new annotationExtensionChrome.type(typeName, typeAncestor, typePrimaryURI, typeGroup, typeAncestors, typeComment);
      
       //Kontejner   
      var theSectionHeading = rdfService.GetResource(typePrimaryURI);
      //Neni kontejner...nema atributy
      if (!containerTools.IsContainer(datasource, theSectionHeading))
        return newType;
      
      theSectionContainer.Init(datasource, theSectionHeading);
      
      var attributeElems = theSectionContainer.GetElements();
      
      //Pruchod atributy
      while(attributeElems.hasMoreElements())
      {//Pridani atributu do typu
        var attributeElem = attributeElems.getNext();
        attributeElem.QueryInterface(Components.interfaces.nsIRDFResource);
    
        var typeP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem, 'type');
        var reqP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'req');
        var nameP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'name');
        var commentP = annotationExtensionChrome.typeAttrDatasource.getResourceProp(attributeElem,'comment');

        if (typeP == null || reqP == null || nameP == null || commentP == null)
        //Nejaka chyba nebo neni default preskoc
          continue;
        
        //(name, type, def, req, struct, comment)
        newType.addAttribute(nameP, typeP, true, reqP, null, commentP);
      }
      
      return newType;
    }
    catch(ex)
    {
      alert(ex.message);
      return null;
    }
  },
  
  changeAttrSettingHandler : function()
  {
    var def = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'def');
    var req = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'req');
    
    var params = {inn:{def:def,req:req}, out:null}; 
    window.openDialog("chrome://annotationextension/content/dialogs/changeAttrSetting.xul", "annotationextension:changeAttrWindow", "chrome,centerscreen,modal", params).focus();  
  
    if (params.out)
    {//Zmeneno nastaveni
      this.setSelectedAttributeDefaultParametr(params.out.def);
      this.setSelectedAttributeRequiredParametr(params.out.req);
    }
    else
    {//Kliknuto na cancel
    }
  },
  
  deleteAttributeButtonHandler : function()
  {
    this.deleteAttribute(this.selectedAttrUIID);
  },
  
  deleteAttribute : function(id)
  {
    try
    {
      var def = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'def');
      
      var params = {inn:{def:def}, out:null}; 
      window.openDialog("chrome://annotationextension/content/dialogs/deleteAttrDialog.xul", "annotationextension:deleteAttrWindow", "chrome,centerscreen,modal", params).focus();  
    
      if (params.out)
      {//Zmeneno nastaveni
        def = params.out.def;
          
        var attrParentURI = this.getParentURIOfSelectedAttribute();
        if (attrParentURI == null)
          return;
        
        if (def)
        {//smaz i ze sablony
  
          var typeURIwhichHasAttribute = this.getTypeURIinWhichIsSelectedAttribute();
          if (typeURIwhichHasAttribute == null)
            return;
          
          annotationExtensionChrome.bottomAnnotationWindow.addToChangedTypes(typeURIwhichHasAttribute);
          /*****Zmena typu v ds typeAttr - smazani atributu**************************************/
          var attrName = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'name');
          var attrTypeURI = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'attrTypeURI');
          annotationExtensionChrome.typeAttrDatasource.deleteObject(attrTypeURI, typeURIwhichHasAttribute);
          ///*******************************************************************/
        }
        
        /******Smazani atributu ze stromu aktualne zobrazenych atributu a jeho potomku************************/
        annotationExtensionChrome.attrDatasource.delAllObjectsInSeq(id);
        annotationExtensionChrome.attrDatasource.deleteObject(id,attrParentURI);
        /*****************************************************************************************************/
        
        //Smazani UI a celeho podstromu UI
        this.deleteAttrInterface(id);
        this.deleteAttrInterfaceChilds(id);      
      }
      else
      {//Kliknuto na cancel
      }
    }
    catch(ex)
    {
      alert('attributes.js : deleteAttribute :\n' + ex.message);
    }
  },
  
  setSelectedAttributeDefaultParametr : function(isDefault)
  {
    var typeURIwhichHasAttribute = this.getTypeURIinWhichIsSelectedAttribute();
    var attrParentURI = this.getParentURIOfSelectedAttribute();
    
    if (typeURIwhichHasAttribute != null && attrParentURI != null)
    {       
      annotationExtensionChrome.bottomAnnotationWindow.addToChangedTypes(typeURIwhichHasAttribute);
      
      var attrTree = document.getElementById('aeAttrTree');
      var savedSelection = attrTree.currentIndex;
      attrTree.view.selection.clearSelection();
      
      /*****Zmena v ds typeAttr a attr**************************************/
      var attrUriInTypeAttr = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'attrTypeURI');
      var attrName = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'name');
      
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      try
      {
        if ((!this.attributeIsDefault(this.selectedAttrUIID) || attrUriInTypeAttr == "" || attrUriInTypeAttr == null)
             && isDefault == true)
        //ZMENA DEFAULT PARAMETRU Z FALSE -> TRUE
        {//Atribut neni ulozen v typeAttr datasource
          var typeUriOfAttr = this.getTypeURIinWhichIsSelectedAttribute();
          var attrUriInTypeAttr = typeUriOfAttr + '/' + attrName;
        
          var attrToType = { name : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'name'),
                             req : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'req'),
                             def : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'def'),
                             type : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'type'),
                             uri : attrUriInTypeAttr,
                             ancestor : typeUriOfAttr,
                             struct : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'struct'),
                             comment : annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'comment')}
         
          annotationExtensionChrome.typeAttrDatasource.addNewObject(attrToType);
          //Aktualizace atributu ve stromu atributu - navazani na atribut v sablone atributu
          annotationExtensionChrome.attrDatasource.changeResourceProp(this.selectedAttrUIID, 'attrTypeURI', attrUriInTypeAttr);
          
          
        }
      }
      catch(ex)
      {//Nepodarilo se pridat atribut do typeAttr datasource
        //TODO: doimplementovat?
      }
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
    
      annotationExtensionChrome.typeAttrDatasource.changeResourceProp(attrUriInTypeAttr, 'def', isDefault);
      annotationExtensionChrome.attrDatasource.changeResourceProp(this.selectedAttrUIID, 'def', isDefault);
      /*******************************************************************/
      
      attrTree.view.selection.select(savedSelection);
    }
  },
  
  //TODO: dodelat - viz pridani atributu u setSelectedAttributeDefaultParametr do typeAttr
  //funkce se musi jinak volat po setSelectedAttributeDefaultParametr
  setSelectedAttributeRequiredParametr : function(isRequired)
  {
    var typeURIwhichHasAttribute = this.getTypeURIinWhichIsSelectedAttribute();
    var attrParentURI = this.getParentURIOfSelectedAttribute();
    
    if (typeURIwhichHasAttribute != null && attrParentURI != null)
    {       
      annotationExtensionChrome.bottomAnnotationWindow.addToChangedTypes(typeURIwhichHasAttribute);
      
      var attrTree = document.getElementById('aeAttrTree');
      var savedSelection = attrTree.currentIndex;
      attrTree.view.selection.clearSelection();
      
      /*****Zmena v ds typeAttr a attr**************************************/
      var attrTypeURI = annotationExtensionChrome.attrDatasource.getResourceProp(this.selectedAttrUIID, 'attrTypeURI');
      annotationExtensionChrome.typeAttrDatasource.changeResourceProp(attrTypeURI, 'req', isRequired);
      annotationExtensionChrome.attrDatasource.changeResourceProp(this.selectedAttrUIID, 'req', isRequired);
      /*******************************************************************/
  
      attrTree.view.selection.select(savedSelection);
    }
  },
  
  /**
   * Zda je atribut defaultni (ze sablone atributu)
   * @param {String nebo nsIResource} id, id atributu (muze byt primo resource atributu)
   * @returns {Bool} true, pokud je atribut ze sablony atributu, jinak false
   */
  attributeIsDefault : function(id)
  {
    var isDefault = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'def');
    if (isDefault == 'true')
      return true;
    else
      return false;
  },
  
  showOrHideAttrCheckboxesAndDeleteAttrButton : function(hide)
  {
    var aeDefAndReqCheckboxBox = document.getElementById('aeDefAndReqCheckboxBox');
    var aeRemoveAttributeButton = document.getElementById('aeRemoveAttributeButton');
    
    if (hide == true)
    {
      aeRemoveAttributeButton.hidden = true;
      aeDefAndReqCheckboxBox.hidden = true;
    }
    else
    {
      aeRemoveAttributeButton.hidden = false;
      aeDefAndReqCheckboxBox.hidden = false;
    }
  },
  
  /**
   * Vybere do stromu atributu z pole.
   * @param {Array} attrsArray, pole obsahujici "attributes" objekty
   * @param {string} ancestorP, uri kam se maji atributy typu pripojit(v attr.rdf)
   *                 vetsinou korenovy seq attr.rdf
   * @param {string} typeAnnot, pokud je uveden navic se nactou typy ze sablony
   *                  atributu pro typ typeAnnot
   */
  selectAttributesFromArray : function(attrsArray, ancestorP, typeAnnot)
  {
    try
    {        
      var attr = null;
      for (var i = 0; i < attrsArray.length; i++)
      {
        attr = attrsArray[i];
      
        var reqP = false;
        var nameP = attr.name;
        var defP = false;
        var structP = null;
        var typeP = null;

        if (attr.type == 'nestedAnnotation' || attr.type == 'annotationLink')
        {//Strukturovany typ
          structP = true;
          try
          {
            //Ziskej typ pro strukturovany typ z anotace na ktere odkazuje atribut
            var annot = annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(attr.value);
            typeP = annot.type;
          }
          catch(ex)
          {//Anotace nemusela byt nalezena, neznamy typ, preskoc
            continue;
          }
        }
        else
        {//Jednoduchy typ
          structP = false;
          typeP = attr.type;
        }
        
        var uriP = ancestorP + '/' + nameP;

        if (typeP == null || reqP == null || nameP == null)
        //Nejaka chyba, preskoc
          continue;
        
        var attrExisted = this.attrWithNameIsInAttrTree(uriP, nameP)
        if (!attrExisted)
        {//Atribut jeste neni ve stromu atributu
          var attrResource = { name : nameP, req : reqP, type : typeP, uri : uriP, ancestor : ancestorP, def : defP, struct : structP, attrTypeURI : "", edited : "", aLink : "", comment : ""};
          annotationExtensionChrome.attrDatasource.addNewObject(attrResource);
      
          if (attr.type == 'nestedAnnotation')
            annotationExtensionChrome.attrDatasource.changeResourceProp(uriP, 'edited', attr.value);
          
          this.createUIForAttributeFromArray(attr, uriP, typeP);
          
          //Nahraj do stromu atributy vnorenych anotaci
          if (attr.type == 'nestedAnnotation')
          {
            var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
            var nestedAnnotation = annotDB.getAnnotation(attr.value);
            var nestedAttrsArray = nestedAnnotation.attributes;
            
            this.selectAttributesFromArray(nestedAttrsArray, uriP, nestedAnnotation.type); 
          }
        }
        else
        {//Atribut je ve stromu atributu anotace
          if (attr.type == 'nestedAnnotation')
          { //Pokud jde o typ anotace, pridej fragmenty k existujicimu atributu
            //jako novy range
            //Pridani objektu vnorene anotace do aktualni zalozky
            var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
            var nestedAnnotation = annotDB.getAnnotation(attr.value);
            
            var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
            var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', uriP);
            var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
            if (selectedAnnotationObj == null)
            {
              continue;
            }
            
            var annotationObj = new annotationExtensionChrome.annotation(attr.value);
            annotationObj.selectedRange = 0;
            annotationObj.fragments = new annotationExtensionChrome.fragments(null, null);
            annotationObj.fragments.rangesFragments.push(nestedAnnotation.fragments);
            annotationObj.ranges = new Array();
            annotationObj.ranges.push(annotationExtensionChrome.rangeCreator.createRangeFromFragments(nestedAnnotation.fragments));
            
            selectedAnnotationObj.addAnnotation(annotationObj, -1);
          }
          else if (attr.type == 'annotationLink')
          {
            var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
            var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', uriP);
            var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
            if (selectedAnnotationObj == null)
            {
              continue;
            }
            
            //TODO: IMPORTANT
            selectedAnnotationObj.addAnnotation(annotationObj, 0);
            selectedAnnotationObj.setALinkToActiveAnnotation(attr.value);
            selectedAnnotationObj.showExactAnnotation(-1);
          }
        }
      }
           
      if (typeAnnot != undefined && typeAnnot != null)
        this.selectAttributes(typeAnnot, ancestorP, false, true, true);
    }
    catch(ex)
    {
      alert('attributes.js : selectAttributesFromArray: ' + ex.message);
    }
  },
  
  /**
   * Vytvori pro atribut uzivatelske rozhrani a naplni ho daty.
   * @param {Attribute Object} attr, atribut, pro ktery se ma vytvorit UI
   */
  createUIForAttributeFromArray : function(attr, uri, type)
  {
    var aui = this.createAttrUserInterface(uri, type);
    //Box s UIs atributu
    var attrsUIsBox = document.getElementById('tab'+ annotationExtensionChrome.bottomAnnotationWindow.getCurrentTabID());
    attrsUIsBox.appendChild(aui);
    aui.setAttribute("hidden", "true");
    //Nastaveni jmena typu do textboxu
    document.getElementById(uri+'-typeBox-'+this.getCurrentTabID()).aeSetType(type, this.getTypeStringToTextbox(type));
    //alert(uri);
    
    //////////////////////////
    //Vlozeni dat z atributu//
    //////////////////////////    
    type = type.toLowerCase();
    with (annotationExtension.attrConstants)
    {
      if (type == SIMPLE_DURATION.toLowerCase())
      {//DURATION
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_IMAGE.toLowerCase())
      {//IMAGE
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_TEXT.toLowerCase())
      {//TEXT
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_ANYANNOTATION.toLowerCase())
      {//ANYANNOTATION
      }
      else if (type == SIMPLE_BINARY.toLowerCase())
      {//BINARY
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = annotationExtension.SAVED_DATA;
      }
      if (type == SIMPLE_STRING.toLowerCase())
      {//STRING
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_URI.toLowerCase())
      {//URI
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_DATETIME.toLowerCase())
      {//DATETIME
        //TODO: SPRAVNE NAPARSOVAT?
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value.slice(0,10);
        var valueBox2 = document.getElementById(uri+'-textbox2-'+this.getCurrentTabID());
        valueBox2.value = attr.value.slice(11,19);
      }
      else if (type == SIMPLE_INTEGER.toLowerCase())
      {//INTEGER
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_DECIMAL.toLowerCase())
      {//DECIMAL
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_DATE.toLowerCase())
      {//DATE
        //TODO: SPRAVNE NAPARSOVAT?
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value.slice(0,10);
      }
      else if (type == SIMPLE_TIME.toLowerCase())
      {//TIME
        //TODO: SPRAVNE NAPARSOVAT?
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value.slice(0,8);
      }
      else if (type == SIMPLE_BOOLEAN.toLowerCase())
      {//BOOL
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        if (attr.value == 'true')
          valueBox.selectedIndex = 0;
        else
          valueBox.selectedIndex = 1;
      }
      else if (type == SIMPLE_PERSON.toLowerCase())
      {//PERSON
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value;
      }
      else if (type == SIMPLE_GEOPOINT.toLowerCase())
      {//GEOPOINT
        var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
        valueBox.value = attr.value.glat;
        var valueBox2 = document.getElementById(uri+'-textbox2-'+this.getCurrentTabID());
        valueBox2.value = attr.value.glong;
      }
      else
      {//Jedna se o typ anotace
        //TODO: DODELAT
        if(attr.type == 'nestedAnnotation')
        {          
          var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
          var nestedAnnotation = annotDB.getAnnotation(attr.value);
          
          var valueBox = document.getElementById(uri+'-textbox1-'+this.getCurrentTabID());
          valueBox.value = nestedAnnotation.getFragmentText();
          var valueBox2 = document.getElementById(uri+'-textbox2-'+this.getCurrentTabID());
          valueBox2.value = nestedAnnotation.content;
          
          //Pridani objektu vnorene anotace do aktualni zalozky
          var tab = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab();
                        
          var annotationObj = new annotationExtensionChrome.annotation(attr.value);
          annotationObj.selectedRange = 0;
          annotationObj.fragments = new annotationExtensionChrome.fragments(null, null);
          annotationObj.fragments.rangesFragments.push(nestedAnnotation.fragments);
          annotationObj.ranges = new Array();
          annotationObj.ranges.push(annotationExtensionChrome.rangeCreator.createRangeFromFragments(nestedAnnotation.fragments));
          
          var selectedAnnotatationObj = new annotationExtensionChrome.selectedAnnotation(uri);
          selectedAnnotatationObj.addAnnotation(annotationObj, 0);
          
          tab.nestedAnnotations.addNew(selectedAnnotatationObj);
        }
        else if (attr.type == 'annotationLink')
        {
          setALinkToAttribute(uri, attr.value);
          
          var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
          var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', uri);
          var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
          if (selectedAnnotationObj != null)
            selectedAnnotationObj.showExactAnnotation(0);
        }
      }
    }
  },
  
  /**
   * Zda byl atribut pridan do stromu z editovane anotace (pouze pro struct  attr)
   * @param {String} id, id atributu ve stromu
   * @returns {Bool} true, pokud ma parametr edited, jinak false
   */   
  attributeIsEdited : function(id)
  {
    var edited = annotationExtensionChrome.attrDatasource.getResourceProp(id, 'edited');
    if (edited == null || edited == "" || edited == "null")
      return false;
    else
      return true;
  },
  
  typeHasAttrWithName : function(typeURI, attrName)
  {
    if (typeURI == undefined || typeURI == null || attrName == undefined || attrName == null)
      return false;
    return annotationExtensionChrome.typeAttrDatasource.sourceWithPropertyValueExists(typeURI + '/' + attrName, 'name', attrName);
  },
  
  attrWithNameIsInAttrTree : function(attrURI, attrName)
  {
    if (attrURI == undefined || attrURI == null || attrName == undefined || attrName == null)
      return false;
    return annotationExtensionChrome.attrDatasource.sourceWithPropertyValueExists(attrURI, 'name', attrName);
  },
  
  showEditAnnotationButtonHandler : function(direction, id)
  {
    var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
    var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
    var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
    if (selectedAnnotationObj == null)
    {
      return;
    }
    
    selectedAnnotationObj.showAnnotation(direction);
  },
  
  addAnnotationToSelectionButtonHandler : function(id)
  {
    try
    {
      var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
      var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
      var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
      
      deleteALinkFromUiById(id);
      selectedAnnotationObj.addAnnotationAndClickSelectButton();
    }
    catch(ex)
    {}
  },
  
  deleteAnnotationFromSelectionButtonHandler : function(id)
  {
    try
    {
      var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
      var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
      var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
      
      selectedAnnotationObj.deleteActiveAnnotation();
      
      this.deleteMultipleAnnotationObjFromCurrentTabIfZeroLen(selectedAnnotationObjIndex);
      
    }
    catch(ex)
    {}
  },
  
  deleteMultipleAnnotationObjFromCurrentTabIfZeroLenById : function(id)
  {
    var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
    var selectedAnnotationObjIndex = nestedAnnotations.getIndexByProp('uri', id);
    if (selectedAnnotationObjIndex == -1)
      return;
    var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
    if (selectedAnnotationObj.multipleAnnotation != true)
      return;
    
    if (selectedAnnotationObj.len() < 1)
    {
      this.deleteMultipleAnnotationObjFromCurrentTab(selectedAnnotationObjIndex);
    }
  },
  
  /**
   * Smaze na indexu objekt s vnorenymi(odkazovanymi) anotacemi, pokud neobsahuje zadnou anotaci.
   */
  deleteMultipleAnnotationObjFromCurrentTabIfZeroLen : function(selectedAnnotationObjIndex)
  {
    var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
    var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
    if (selectedAnnotationObj.multipleAnnotation != true)
      return;
    
    if (selectedAnnotationObj.len() < 1)
    {
      this.deleteMultipleAnnotationObjFromCurrentTab(selectedAnnotationObjIndex);
    }
  },
  
  deleteMultipleAnnotationObjFromCurrentTab : function(selectedAnnotationObjIndex)
  {
    var nestedAnnotations = annotationExtensionChrome.bottomAnnotationWindow.getCurrentTab().getNestedAnnotations();
    var selectedAnnotationObj = nestedAnnotations.getAtIndex(selectedAnnotationObjIndex);
    if (selectedAnnotationObj.multipleAnnotation != true)
      return;
    
    if (selectedAnnotationObj.aLinks == true)
    {
      deleteALinkFromAttribute(selectedAnnotationObj.uri);
    }

    selectedAnnotationObj.hideAddDeleteBox();
    selectedAnnotationObj.showSelectNestedButton();
    nestedAnnotations.deleteOnIndex(selectedAnnotationObjIndex);
  },
  
  /**
   * Zjisti, zda ma atribut (struct) atributy, ktere nejsou v sablone atributu
   * @param {String} resourceURI, id atributu
   * @returns {Bool} true, pokud ma atribut dalsi atributy, ktere nesjou v sablone
   *                 atributu, jinak false
   */
  checkIfAttrHasNonDefaultAttrs : function(resourceURI)
  {
    var datasource = annotationExtensionChrome.attrDatasource.datasource.getDatasource();
    if (datasource == null)
      return false;
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
     
    //Kontejner   
    var theSectionHeading = rdfService.GetResource(resourceURI);
    //Neni kontejner...
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return false;
    
    theSectionContainer.Init(datasource, theSectionHeading);
    
    var childElems = theSectionContainer.GetElements();
    
    while(childElems.hasMoreElements())
    {
      var child = childElems.getNext();
      child.QueryInterface(Components.interfaces.nsIRDFResource);
      
      if (!this.attributeIsDefault(child))
        return true;
    }
    
    return false;
  },
  
  /**
   * Zkontroluje, zda vsechny atributy maji "vyplnene rodice".
   * Pokud ne, vypise hlasku, ze atribut nebude ulozen na serveru.
   * @returns {Bool} true, pokud maji vsechny vyplnene atributy vyplnene rodice
   *                 nebo pokud byla potvrzena hlaska o neulozeni.
   *                 false, jinak
   */
  checkIfAllAttrsHaveFilledParentsAlertWhenNot : function()
  {//TODO: LZE TOTO OPTIMALIZOVAT?      
    var rootURI = annotationExtensionChrome.attrDatasource.baseURI + annotationExtensionChrome.attrDatasource.rootName;
    var param = {path : null};
    
    var setFalse = false;
    
    var datasource = annotationExtensionChrome.attrDatasource.datasource.getDatasource();
    if (datasource == null)
      return true;
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);    
    
    var theSectionHeading = rdfService.GetResource(rootURI);
    //Neni kontejner...
    if (!containerTools.IsContainer(datasource, theSectionHeading))
      return true;
    
    theSectionContainer.Init(datasource, theSectionHeading);
    var childElems = theSectionContainer.GetElements();
    
    while(childElems.hasMoreElements())
    {
      if (setFalse)
        break;
      
      var child = childElems.getNext();
      child.QueryInterface(Components.interfaces.nsIRDFResource);
      
      var actualName = annotationExtensionChrome.attrDatasource.getResourceProp(child.ValueUTF8, 'name');
      var actualFilled = this.attributeIsFilled(child.ValueUTF8);
                         
      if(!this.checkChildsIfAllParentsAreFilled(child.ValueUTF8, true, "", param))
        setFalse = true;
    }
    
    if (setFalse)
    {
      let stringBundle = document.getElementById("annotationextension-string-bundle");
      if (window.confirm(stringBundle.getFormattedString("annotationextension.attributes.attributeParentNotFilled", [param.path])))
        return true;
      else
        return false;
    }
    else    
      return true;
  },
  
  /**
   * Rekurzivni funkce pro funkci checkIfAllAttrsHaveFilledParentsAlertWhenNot()
   * @param {String} actualURI, uri kontrolovaneho atributu
   * @param {Bool} parentIsFilled, zda jsou vsichni rodice kontrolovaneho atributu vyplneni
   * @param {String} pathP, cesta od korene k atributu ve forme: rodic1->rodic2-> 
   * @param {Object} param, vystupni objekt, kteremu se nastavi vlastnost path obsahujici
   *                 cestu k prvnimu atributu, ktery je vyplneny a nema vyplneneho
   *                 nejakeho rodice
   * @returns {Bool} false, pokud nejaky atribut nema vyplneneho nejakeho rodice
   *                 true, jinak
   */
  checkChildsIfAllParentsAreFilled : function(actualURI, parentIsFilled, pathP, param)
  {
    var setFalse = false;
    
    var datasource = annotationExtensionChrome.attrDatasource.datasource.getDatasource();
    if (datasource == null)
      return false;
    
    var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
      getService(Components.interfaces.nsIRDFService);
    var theSectionContainer = Components.classes["@mozilla.org/rdf/container;1"].
      createInstance(Components.interfaces.nsIRDFContainer);
    var containerTools = Components.classes["@mozilla.org/rdf/container-utils;1"].
      getService(Components.interfaces.nsIRDFContainerUtils);
    
    var actualName = annotationExtensionChrome.attrDatasource.getResourceProp(actualURI, 'name');
    var actualFilled = this.attributeIsFilled(actualURI);
    var path = pathP + actualName;
    
    if (!parentIsFilled && actualFilled)
    {
      param.path = path;
      return false;
    }
    else
    {
      path += '->';
      //Kontejner   
      var theSectionHeading = rdfService.GetResource(actualURI);
      //Neni kontejner...
      if (containerTools.IsContainer(datasource, theSectionHeading))
      {
        theSectionContainer.Init(datasource, theSectionHeading);
        var childElems = theSectionContainer.GetElements();
        
        while(childElems.hasMoreElements())
        {
          if (setFalse)
            break;
          
          var child = childElems.getNext();
          child.QueryInterface(Components.interfaces.nsIRDFResource);
    
          if (!parentIsFilled || !actualFilled)
            var newAttrParentIsFilled = false
          else
            var newAttrParentIsFilled = true;
                             
          if(!this.checkChildsIfAllParentsAreFilled(child.ValueUTF8, newAttrParentIsFilled, path, param))
            setFalse = true;
        }
      }
      
      //Posl
      if (setFalse)
        return false;
      else
        return true;
    }
  }
};