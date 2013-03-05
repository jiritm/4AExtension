/**
 * Soubor: typesWindow.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro typesWindow.xul.
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

annotationExtensionChrome.typesWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
    annotationExtensionChrome.mainAEChrome = window.arguments[0].input.mainAEChrome;
    //Vytvoreni a pripojeni datasource ke stromu
    annotationExtensionChrome.treeTypesDatasource = new annotationExtensionChrome.TreeDatasource('aeTypesTree', 'types', annotationExtensionChrome.mainAEChrome.typesDatasource, null);
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
    annotationExtensionChrome.treeTypesDatasource.destroy();
  },
  
  /**
   * Handler tlacitka id=aeSelectTypeButton
   */
  selectType : function()
  {
    try
    {
      var view = document.getElementById('aeTypesTree').view;
  
      var URI = this.getSelectionPrimaryURI();
      
      if (URI == null)
        return; //Neni vybran zadny typ
      
      var linearizedURI = annotationExtension.functions.linearTypeURI(URI);
  
      window.arguments[0].out = {typeURI:URI,
                                 typeName:linearizedURI};
  
      window.close();
    }
    catch(ex)
    {
      alert('typesWindow.js : selectType:\n' + ex.message);
    }
  },
  
  /**
   * Handler tlacitka id=aeAddType a id=aeAddSubtype
   * Prida typ do vybraneho podstromu
   * @param {String} type root - prida korenovy typ
   *                      subtype - prida jako podtyp vyberu
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
      var parentURI = "";      
    }
    
    //Kontrola nazvu typu
    var newTypeName = document.getElementById("aeNewTypeNameTextbox").value;
    //TODO: DODELAT/PREDELAT KONTROLU NAZVU
    //newTypeName = newTypeName.replace(/[ ]{2,}/ig, ' ');
    //if(!this.checkTypeName(newTypeName))
    //{
    //  let stringBundle = opener.document.getElementById("annotationextension-string-bundle");
    //  var alertLabel = stringBundle.getString("annotationextension.attributeWindow.badName.alert");
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

    annotationExtensionChrome.mainAEChrome.createdTypes.addNew(newType);
    annotationExtensionChrome.mainAEChrome.client.addTypes(annotationExtensionChrome.mainAEChrome.createdTypes);
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
    
    if (!annotationExtensionChrome.mainAEChrome.typesDatasource.containerIsEmpty(typeURI))
    {//Je kontejner a neni prazdny, nemaz.
      let stringBundle = document.getElementById("annotationextension-string-bundle");
      var alertLabel = stringBundle.getString("annotationextension.typesWindow.notEmpty.alert");
      alert(alertLabel);
      return;
    }    
    
    var typeName = annotationExtensionChrome.treeTypesDatasource.getResourceProp(typeURI, 'name');
    var typeAncestor = annotationExtensionChrome.treeTypesDatasource.getResourceProp(typeURI, 'ancestor');
    
    //Vytvoreni typu a pridani do pole pro klienta.
    var deleteType = new annotationExtensionChrome.type(typeName, typeAncestor, typeURI, "", null, "");
    
    annotationExtensionChrome.mainAEChrome.deleteTypes.addNew(deleteType);
    annotationExtensionChrome.mainAEChrome.client.removeTypes();
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
   * @return {int} index vyberu ve stromu
   * Pro strom id=aeTypesTree
   */
  getSelectionIndex : function()
  {
    var view = document.getElementById('aeTypesTree').view;
    
    return view.selection.currentIndex;
  },
  
  /**
   * @return {String} URI vyberu ve stromu, pokud neni nic vybrano, vrati null
   * Pro strom id=aeTypesTree
   */
  getSelectionURI : function()
  {
    var index = this.getSelectionIndex();
    
    if (index > -1)
      return annotationExtensionChrome.treeTypesDatasource.getResourceURIOnIndex(index);
    else
      return null;
  },
  
  /**
   * @return {String} Primarni uri typu vybraneho ve stromu
   * Pro strom id=aeTypesTree
   */
  getSelectionPrimaryURI : function()
  {
    var selectedTypeURI = this.getSelectionURI();
    if (selectedTypeURI == null)
      return null;
    else
      return annotationExtensionChrome.treeTypesDatasource.datasource.getPrimaryTypeURI(selectedTypeURI);
  },
  
  /**
   * @return {int} index rodice vyberu ve stromu, pokud neni nic vybrano, cislo mensi jak -1
   * Pro strom id=aeTypesTree
   */
  getSelectionParentIndex : function()
  {
    var view = document.getElementById('aeTypesTree').view;
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
   */
  getSelectionParentURI : function()
  {
    var selParentIndex = this.getSelectionParentIndex();  /**< Index rodice vybraneho radku. */
    var parentURI;
    if (selParentIndex > -1)
    {
      return annotationExtensionChrome.treeTypesDatasource.getResourceURIOnIndex(selParentIndex);
    }
    else if (selParentIndex == -1)
    {
      return annotationExtensionChrome.treeTypesDatasource.baseURI + annotationExtensionChrome.treeTypesDatasource.rootName;
    }
    else
    {//Neni nic vybrano
      return null;
    }    
  }
};