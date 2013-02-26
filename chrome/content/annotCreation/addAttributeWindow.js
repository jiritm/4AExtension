/**
 * Soubor: addAttributeWindow.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Funkce pro addAttributeWindow.xul
 *  Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

//
//  WINDOW PRIJDOU 4 ARGUMENTY OD ANNOTATIONWINDOW.JS
//  0. uri resource, ke kteremu se pripojuje atribut jako prvni(v attr.rdf)
//  1. URI TYPU(v typeAttr.rdf)
//  2. URI VYBERU(vybraneho atributu)(v attrTree.rdf)
//  3. 'nested' nebo 'root' - zda se jedna o vlozeni atributu do atributu nebo atributu do hlavni anotace
//
annotationExtensionChrome.addAttributeWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
    //Vytvoreni a pripojeni datasource ke stromu
    annotationExtensionChrome.attrTypesDatasource = new annotationExtensionChrome.TreeDatasource('aeAddExtAttrTypesTree',
			'types',
      opener.annotationExtensionChrome.typesDatasource,
			null);
		
	  annotationExtensionChrome.attrOntologyDatasource = new annotationExtensionChrome.TreeDatasource('aeAddOntoAttrTree',
			'types',
      null,
			[{ type : 'attrFromOnto', props : ['name', 'type', 'group', 'comment', 'linearizedType']}]);
    
    document.getElementById('aeAttributeNameTextbox').focus();
		
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    observerService.addObserver(this, "annotationextension-client-topic", false);
		
		opener.annotationExtensionChrome.client.getOntologyAttrs("*");
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    observerService.removeObserver(this, "annotationextension-client-topic");
    
		annotationExtensionChrome.attrTypesDatasource.destroy();
  },
	
	/**
   * Rozhrani pro observer
   */
  observe : function(aSubject, aTopic, aData)
  {
    if (aTopic == "annotationextension-client-topic")
    {
			if (aData == "addAttrsFromOntology")
			{
				var attrsFromOnto = opener.annotationExtensionChrome.attrsFromOntology
				while (attrsFromOnto.length > 0)
				{// Pridej vsechny atributy z ontologie do ds
					var attr = attrsFromOnto.shift();
					annotationExtensionChrome.attrOntologyDatasource.addNewObject(attr);
				}
			}
    }
  },
  
  /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeAddSimpAttrTypesTree
   */
  onselectSimp : function()
  {
    var simpTree = document.getElementById('aeAddSimpAttrTypesTree');
    var extTree = document.getElementById('aeAddExtAttrTypesTree');
		var ontoTree = document.getElementById('aeAddOntoAttrTree');
    var simpView = simpTree.view;
    var extView = extTree.view;
		var ontoView = ontoTree.view;
    
    var selection = simpView.selection.currentIndex;
    if(selection != -1)
		{
			ontoView.selection.select(-1);
      extView.selection.select(-1);
		}
    
    var addTypeButton = document.getElementById('aeAddTypeButton');
    addTypeButton.disabled = true;
  },
  
  /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeAddExtAttrTypesTree
   */
  onselectExt : function()
  {
		try
		{
			var simpTree = document.getElementById('aeAddSimpAttrTypesTree');
			var extTree = document.getElementById('aeAddExtAttrTypesTree');
			var ontoTree = document.getElementById('aeAddOntoAttrTree');
			var simpView = simpTree.view;
			var extView = extTree.view;
			var ontoView = ontoTree.view;
			
			var selection = extView.selection.currentIndex;
			if(selection != -1)
			{
				ontoView.selection.select(-1);
				simpView.selection.select(-1);
			}
				
			var addTypeButton = document.getElementById('aeAddTypeButton');
			addTypeButton.disabled = false;
		}
		catch(ex)
		{//TODO: vyhazuje vyjimku pri pridani noveho strukt. attr.
		}
  },
	
	/**
   * Handler pro vybrani radku ve stromu
   * strom id=aeAddOntoAttrTree
   */
	onselectOnto : function()
	{
	  var simpTree = document.getElementById('aeAddSimpAttrTypesTree');
    var extTree = document.getElementById('aeAddExtAttrTypesTree');
		var ontoTree = document.getElementById('aeAddOntoAttrTree');
    var simpView = simpTree.view;
    var extView = extTree.view;
		var ontoView = ontoTree.view;
    
    var selection = ontoView.selection.currentIndex;
    if(selection != -1)
		{
      extView.selection.select(-1);
			simpView.selection.select(-1);
		}
    
    var addTypeButton = document.getElementById('aeAddTypeButton');
    addTypeButton.disabled = true;
	},
  
  /**
   * Handler pro event onkeypress
   */
  onkeypress : function(textbox, event)
  {
    //Pokud bylo zmacknuto enter
    if (event.keyCode == 13)
    {
      this.addAttribute();
    }
  },
  
  /**
   * Handler tlacitka id=aeAddAttributeButton2
   */
  addAttribute : function()
  {
    try
    {
      var simpTree = document.getElementById('aeAddSimpAttrTypesTree');
      var extTree = document.getElementById('aeAddExtAttrTypesTree');
      var simpView = simpTree.view;
      var extView = extTree.view;
    
      var selectedIndexSimp = this.getSelectionIndex('aeAddSimpAttrTypesTree');
      var selectedIndexExt = this.getSelectionIndex('aeAddExtAttrTypesTree');
			var selectedIndexOnto = this.getSelectionIndex('aeAddOntoAttrTree');
      
      if (selectedIndexSimp == -1 && selectedIndexExt == -1 && selectedIndexOnto == -1)
      {//Neni nic vybrano
        return;
      }
      
			var nameTextbox = document.getElementById('aeAttributeNameTextbox');
      var defCheckbox = document.getElementById('aeDefAttrCheckbox');
      var reqCheckbox = document.getElementById('aeReqAttrCheckbox');
      
      var req = reqCheckbox.hasAttribute('checked');
			var name;
			var type;
      
      if(selectedIndexSimp > -1)
      {//Je vybran zakladni typ
        type = this.simpleType(selectedIndexSimp);
				name = nameTextbox.value;
      }
      else if (selectedIndexExt > -1)
      {//Je vybran struktur. typ
        type = this.geExtTreetSelectionPrimaryURI();
				name = nameTextbox.value;
      }
			else
			{// Je vybran atribut z ontologie
				type = annotationExtensionChrome.attrOntologyDatasource.getResourcePropOnIndex(selectedIndexOnto, 'type');
				name = annotationExtensionChrome.attrOntologyDatasource.getResourcePropOnIndex(selectedIndexOnto, 'name');
			}
			
			if (name.length < 1)
				return;
     
      var defBool = defCheckbox.hasAttribute('checked');
      
      //Musi se poslat zmena typu na server
      if (defBool == true)
      {
        opener.annotationExtensionChrome.bottomAnnotationWindow.addToChangedTypes(window.arguments[1]);
      }
      
      var structP;
      if (annotationExtension.attrConstants.isSimple(type))
			structP = 'false';
				else
			structP = 'true';  
			
      var attrTypeURI = "";
      if (defBool == true)
      {
				//Pokud je default, pridej do default typu
				attrTypeURI = window.arguments[1] + '/' + name;
				
				var attrToType = { name : name, req : req, def : defBool, type : type, uri : attrTypeURI, ancestor : window.arguments[1], struct : structP, comment : ""};
				opener.annotationExtensionChrome.typeAttrDatasource.addNewObject(attrToType);
      }
			
      //PRIDANI ATRIBUTU DO STROMU ZOBRAZENYCH ATRIBUTU
      var attr = { name : name, req : req, type : type, def : defBool, struct : structP, attrTypeURI : attrTypeURI, edited : "", aLink : ""};
      if (defBool == true)
				opener.annotationExtensionChrome.attributes.addAtributeToTypeRecursive(window.arguments[1], attr, window.arguments[0]);
			else
				opener.annotationExtensionChrome.attributes.addAtributeToType(attr, window.arguments[2]);

      if (window.arguments[3] == 'nested')
      {//Pokud se vklada atribut do atributu, je potreba ho "znovu vybrat", aby se mu nacetl atributy. Pokud nema zatim zadny atribut, nezobrazi se mu nove pridany, ale az po kliknuti na jiny atribut a zpet na atribut do ktereho se pridavalo
        var attrSelection = opener.document.getElementById('aeAttrTree').view.selection;
        opener.annotationExtensionChrome.attributes.selectedAttrUIID = "";
        attrSelection.selectEventsSuppressed = true;
        attrSelection.selectEventsSuppressed = false;
      }
      
      window.close();
    }
    catch(ex)
    {
      alert('addAttributeWindow : addAttribute :\n' + ex.message);
    }
  },
  
  /**
   * Priradi jmeno jednoducheho typu(zavisle na usporadani jednoduchych typu ve stromu UI!!!)
   * @return {string} Vrati jednoduchy typ podle vyberu
   */
  simpleType : function(selection)
  {
    var type = '';
    switch(selection)
    {
      case 0:
        type = annotationExtension.attrConstants.SIMPLE_BOOLEAN; break;
      case 1:
        type = annotationExtension.attrConstants.SIMPLE_DECIMAL; break;
      case 2:
        type = annotationExtension.attrConstants.SIMPLE_INTEGER; break;
      case 3:
        type = annotationExtension.attrConstants.SIMPLE_DATETIME; break;
      case 4:
        type = annotationExtension.attrConstants.SIMPLE_DATE; break;
			case 5:
        type = annotationExtension.attrConstants.SIMPLE_DURATION; break;
      case 6:
        type = annotationExtension.attrConstants.SIMPLE_TIME; break;
      case 7:
        type = annotationExtension.attrConstants.SIMPLE_STRING; break;
      case 8:
        type = annotationExtension.attrConstants.SIMPLE_TEXT; break;
			case 9:
        type = annotationExtension.attrConstants.SIMPLE_ANYANNOTATION; break;
			case 10:
        type = annotationExtension.attrConstants.SIMPLE_BINARY; break;
			case 11:
        type = annotationExtension.attrConstants.SIMPLE_GEOPOINT; break;
			case 12:
        type = annotationExtension.attrConstants.SIMPLE_IMAGE; break;
      case 13:
        type = annotationExtension.attrConstants.SIMPLE_URI; break;
    }
    
    return type;
  },
  
  /**
   * Handler tlacitka id=aeAddTypeButton
   * Prida typ do vybraneho podstromu
   */
  addNewType : function(type)
  {   
    if (type == 'subtype')
    {
      var parentURI = this.geExtTreetSelectionPrimaryURI();
     
      if (parentURI == null)
        //Pokud neni vybran zadny typ, pro ktery se ma vytvorit podtyp...
        return;
    }
    else
    {
      parentURI = "";      
    }
     
    //Kontrola nazvu typu 
    var newTypeName = document.getElementById("aeNewTypeNameTextbox").value;
		
    ////Vytvoreni uri typu
    //var newTypeNameNoSpace = newTypeName.replace(/ /ig, "");
    if (parentURI != "")
      var uri = parentURI + '/' + newTypeName;
    else
      var uri = "";
    
    //Vytvoreni typu a pridani do pole pro klienta.
    var newType = new annotationExtensionChrome.type(newTypeName, parentURI, uri, "", null, "");

    opener.annotationExtensionChrome.createdTypes.addNew(newType);
    opener.annotationExtensionChrome.client.addTypes();
  },
  
  /**
   * Handler tlacitka id=aeRemoveType
   * Odstraneni typu.
   */
  removeType : function()
  {   
    var typeURI = this.geExtTreetSelectionPrimaryURI();
     
    if (typeURI == null)
      //Neni vybran typ ke smazani
      return;
    
    if (!opener.annotationExtensionChrome.typesDatasource.containerIsEmpty(typeURI))
    {//Je kontejner a neni prazdny, nemaz.
      let stringBundle = opener.document.getElementById("annotationextension-string-bundle");
      var alertLabel = stringBundle.getString("annotationextension.typesWindow.notEmpty.alert");
      alert(alertLabel);
      return;
    }    
    
    var typeName = annotationExtensionChrome.attrTypesDatasource.getResourceProp(typeURI, 'name');
    var typeAncestor = annotationExtensionChrome.attrTypesDatasource.getResourceProp(typeURI, 'ancestor');
    
    //Vytvoreni typu a pridani do pole pro klienta.
    var newType = new annotationExtensionChrome.type(typeName, typeAncestor, typeURI, "", null, "");
    
    opener.annotationExtensionChrome.deleteTypes.addNew(newType);
    opener.annotationExtensionChrome.client.removeTypes();
  },

  /**
   * @param {string} id, id stromu
   * @return {int} index vyberu ve stromu
   */
  getSelectionIndex : function(id)
  {
    var view = document.getElementById(id).view;
    
    return view.selection.currentIndex;
  },
  
  /**
   * @return {String} URI vyberu ve stromu, pokud neni nic vybrano, vrati null
   * Pro strom id=aeAddExtAttrTypesTree
   */
  getExtTreeSelectionURI : function()
  {
    var index = this.getSelectionIndex('aeAddExtAttrTypesTree');
    
    if (index > -1)
      return annotationExtensionChrome.attrTypesDatasource.getResourceURIOnIndex(index);
    else
      return null;
  },
	
	/**
   * @return {String} Primarni uri typu vybraneho ve stromu
   * Pro strom id=aeTypesTree
   */
  geExtTreetSelectionPrimaryURI : function()
  {
    var selectedTypeURI = this.getExtTreeSelectionURI();
    if (selectedTypeURI == null)
      return null;
    else
      return annotationExtensionChrome.attrTypesDatasource.datasource.getPrimaryTypeURI(selectedTypeURI);
  },
  
  /**
   * Zpracuje udalost zmacknuti checkboxu pro pridani k zakladnimu typu
   */
  defCheckboxHandler : function()
  {
    var defCheckbox = document.getElementById('aeDefAttrCheckbox');
    
    if (defCheckbox.hasAttribute('checked') == false)
    {
      var reqCheckbox = document.getElementById('aeReqAttrCheckbox');
      reqCheckbox.checked = false;
    }
  },
  
  /**
   * Zpracuje udalost zmacknuti checkboxu pro povinny atribut
   */
  reqCheckboxHandler : function()
  {
    var reqCheckbox = document.getElementById('aeReqAttrCheckbox');
    
    if (reqCheckbox.hasAttribute('checked') == true)
    {
      var defCheckbox = document.getElementById('aeDefAttrCheckbox');
      defCheckbox.checked = true;
    }
  }
};