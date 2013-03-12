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

annotationExtensionChrome.addAttributeWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
		annotationExtensionChrome.mainAEChrome = window.arguments[0].input.mainAEChrome;
		
		let types = document.getElementById('aeTypes');
    types.aeMainAEChrome = annotationExtensionChrome.mainAEChrome;
    types.aeondblclick = this.addAttribute;
    types.aeSetNewDatasource(annotationExtensionChrome.mainAEChrome.typesDatasource);
		
		var aeAddOntoAttrTree = document.getElementById('aeAddOntoAttrTree');
	  annotationExtensionChrome.attrOntologyTreeDatasource = new annotationExtensionChrome.TreeDatasource(aeAddOntoAttrTree,
			'types',
      null,
			[{ type : 'attrFromOnto', props : ['name', 'type', 'group', 'comment', 'linearizedType']}]);
    
    document.getElementById('aeAttributeNameTextbox').focus();
		
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    observerService.addObserver(this, "annotationextension-client-topic", false);
		
		annotationExtensionChrome.mainAEChrome.client.getOntologyAttrs("*");
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
		let observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
    observerService.removeObserver(this, "annotationextension-client-topic");
    
		annotationExtensionChrome.attrOntologyTreeDatasource.destroy();
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
				var attrsFromOnto = annotationExtensionChrome.mainAEChrome.attrsFromOntology
				while (attrsFromOnto.length > 0)
				{// Pridej vsechny atributy z ontologie do ds
					var attr = attrsFromOnto.shift();
					annotationExtensionChrome.attrOntologyTreeDatasource.addNewObject(attr);
				}
			}
    }
  },
  
  /**
   * Handler pro event onkeypress v textboxu pro jmeno atributu
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
			var typeURI;
			var attrName;
			
			var panels = document.getElementById('aeAddAttrPanels');
			
			if (panels.selectedIndex == 0)
			{//Vybrany simple a strukt atributy
				var types = document.getElementById('aeTypes');
				
				typeURI = types.aeSelectedTypeName;
				
				if (typeURI == null)
					return;  //Nic neni vybrano
				
				attrName = document.getElementById('aeAttributeNameTextbox').value;
			}
			else
			{//Vybrany atributy z ontologie
				var ontologyView = document.getElementById('aeAddOntoAttrTree').view;
				var selectedIndex = ontologyView.selection.currentIndex;
				
				if (selectedIndex < 0)
					return; //Nic neni vybrano
				
				typeURI = annotationExtensionChrome.attrOntologyTreeDatasource.getResourcePropOnIndex(selectedIndex, 'type');
				attrName = annotationExtensionChrome.attrOntologyTreeDatasource.getResourcePropOnIndex(selectedIndex, 'name');
			}
			
			if (attrName.length < 1)
				return;  //Neni uvedeno jmeno atributu
		
      var def = document.getElementById('aeDefAttrCheckbox').hasAttribute('checked');
      var req = document.getElementById('aeReqAttrCheckbox').hasAttribute('checked');
			
			window.arguments[0].out = {typeURI: typeURI,
                                 attrName: attrName,
																 isDef : def,
																 isReq : req};
      
      window.close();
    }
    catch(ex)
    {
      alert('addAttributeWindow : addAttribute :\n' + ex.message);
    }
  },
  
  /**
   * Handler pro checkbox pro pridani k zakladnimu typu
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
   * Handler pro checkbox pro povinny atribut
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