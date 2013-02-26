/**
 * Soubor: attrTypesWindow.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro attrTypesWindow.xul
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

annotationExtensionChrome.attrTypesWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
    //Vytvoreni a pripojeni datasource ke stromu
    annotationExtensionChrome.attrTypesDatasource = new annotationExtensionChrome.TreeDatasource('aeExtAttrTypesTree',                                                                                          
      'types',
      opener.annotationExtensionChrome.typesDatasource,
      null);

    if (opener.annotationExtensionChrome.attributes.attributeIsDefault(window.arguments[0]))
      var setTypeToTempCheck = document.getElementById('aeChangeTypeInTemplateCheckbox').hidden = false;
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
    annotationExtensionChrome.attrTypesDatasource.destroy();
  },
  
  /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeSimpAttrTypesTree
   */
  onselectSimp : function()
  {
    var simpTree = document.getElementById('aeSimpAttrTypesTree');
    var extTree = document.getElementById('aeExtAttrTypesTree');
    var simpView = simpTree.view;
    var extView = extTree.view;
    
    var selection = simpView.selection.currentIndex;
    if(selection != -1)
      extView.selection.select(-1);
    
    var addTypeButton = document.getElementById('aeAddTypeButton');
    addTypeButton.disabled = true;
  },
  
    /**
   * Handler pro vybrani radku ve stromu
   * strom id=aeExtAttrTypesTree
   */
  onselectExt : function()
  {
    try
    {
      var simpTree = document.getElementById('aeSimpAttrTypesTree');
      var extTree = document.getElementById('aeExtAttrTypesTree');
      var simpView = simpTree.view;
      var extView = extTree.view;
      
      var selection = extView.selection.currentIndex;
      if(selection != -1)
        simpView.selection.select(-1);
        
      var addTypeButton = document.getElementById('aeAddTypeButton');
      addTypeButton.disabled = false;
    }
		catch(ex)
		{//TODO: vyhazuje vyjimku pri vybrani noveho strukt. attr.
		}
  },  
  
  /**
   * Handler tlacitka id=aeAddTypeButton
   * Prida typ do vybraneho podstromu
   */
  addNewType : function(type)
  {
    if (type == 'subtype')
    {
      var parentURI = this.getSelectionPrimaryURI();
     
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
    //TODO: DODELAT/PREDELAT KONTROLU NAZVU
    //newTypeName = newTypeName.replace(/[ ]{2,}/ig, ' ');
    //if(!this.checkTypeName(newTypeName))
    //{
    //  let stringBundle = opener.document.getElementById("annotationextension-string-bundle");
    //  var alertLabel = stringBundle.getString("annotationextension.typesWindow.badTypeName.alert");
    //  alert(alertLabel);
    //  return;
    //}
    //
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
    var typeURI = this.getSelectionPrimaryURI();
     
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
   * Handler tlacitka id=aeSelectTypeButton
   */
  selectType : function()
  {
    try
    {
      var simpTree = document.getElementById('aeSimpAttrTypesTree');
      var extTree = document.getElementById('aeExtAttrTypesTree');
      var simpView = simpTree.view;
      var extView = extTree.view;
    
      var selectedIndexSimp = this.getSelectionIndex('aeSimpAttrTypesTree');
      var selectedIndexExt = this.getSelectionIndex('aeExtAttrTypesTree');
      
      if (selectedIndexSimp == -1 && selectedIndexExt == -1)
      {//Neni nic vybrano
        //TODO:
        //handle this
        return;
      }
      
      if(selectedIndexSimp > -1)
      {//Je vybran zakladni typ
        var type = this.simpleType(selectedIndexSimp);
      }
      else
      {//Je vybran struktur. typ
        var type = this.getSelectionPrimaryURI();
      }
      
      var setTypeInTemplate = document.getElementById('aeChangeTypeInTemplateCheckbox').checked;
      
      opener.annotationExtensionChrome.attributes.setTypeToAttribute(type, window.arguments[0], true, true, true, setTypeInTemplate);
      
      window.close();
    }
    catch(ex)
    {
      alert(ex.message);
    }
  },
  
    /**
   * Priradi jmeno jednoducheho typu(zavisle na usporadani jednoduchych typu ve stromu!!!)
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
   * Zda jmeno typu neobsahuje nepovolene znaky.
   * @param {string} type, typ, ktery chceme zkontrolovat
   * @return {bool} true, pokud je typ ok, jinak false
   */
  checkTypeName : function(type)
  {
    var match = /^[a-zA-Z]+[1-9a-zA-Z ]*$/.test(type);
    
    return match;
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
   * @return {int} URI vyberu ve stromu, pokud neni nic vybrano, vrati null
   * Pro strom id=aeExtAttrTypesTree
   */
  getSelectionURI : function()
  {
    var theTree = document.getElementById('aeExtAttrTypesTree');
    var id = theTree.getAttribute('id');
    var index = this.getSelectionIndex(id);
    
    if (index > -1)
      return annotationExtensionChrome.attrTypesDatasource.getResourceURIOnIndex(index);
    else
      return null;
  },
  
  /**
   * @return {String} Primarni uri typu vybraneho ve stromu
   * Pro strom id=aeExtAttrTypesTree
   */
  getSelectionPrimaryURI : function()
  {
    var selectedTypeURI = this.getSelectionURI();
    if (selectedTypeURI == null)
      return null;
    else
      return annotationExtensionChrome.attrTypesDatasource.datasource.getPrimaryTypeURI(selectedTypeURI);
  },
  
  /**
   * @return {int} index rodice vyberu ve stromu, pokud neni nic vybrano, cislo mensi jak -1
   * Pro strom id=aeExtAttrTypesTree
   */
  getSelectionParentIndex : function()
  {
    var theTree = document.getElementById('aeExtAttrTypesTree');
    var view = theTree.view;
    var id = theTree.getAttribute('id');
    
    var selIndex = this.getSelectionIndex(id); 
    if(selIndex > -1)
    {
      return view.getParentIndex(selIndex);
    }
    else
      return -2;
  },
  
  /**
   * @return {string} URI rodice aktualniho vyberu
   * Pro strom id=aeExtAttrTypesTree
   */
  getSelectionParentURI : function()
  {
    var selParentIndex = this.getSelectionParentIndex();  /**< Index rodice vybraneho radku. */
    var parentURI;
    if (selParentIndex > -1)
    {
      return annotationExtensionChrome.attrTypesDatasource.getResourceURIOnIndex(selParentIndex);
    }
    else if (selParentIndex == -1)
    {
      return annotationExtensionChrome.attrTypesDatasource.baseURI + annotationExtensionChrome.attrTypesDatasource.rootName;
    }
    else
    {//Neni nic vybrano
      return null;
    }    
  }
};