/**
 * Soubor: groupsWindow.js
 * Autor: Jiri Trhlik
 * Datum: 25.2.2013
 * Popis: Funkce pro groupsWindow.xul.
 * Posledni uprava:
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

annotationExtensionChrome.groupsWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
    //Vytvoreni a pripojeni datasource ke stromu
    var aeGroupsTree = document.getElementById('aeGroupsTree');
    annotationExtensionChrome.treeGroupsDatasource = new annotationExtensionChrome.TreeDatasource(aeGroupsTree, 'groups', opener.annotationExtensionChrome.groupsDatasource, null);
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
    annotationExtensionChrome.treeGroupsDatasource.destroy();
  },
  
  selectGroup : function()
  {
    try
    {
      var URI = annotationExtensionChrome.treeGroupsDatasource.getSelectionURI();
      var name = annotationExtensionChrome.treeGroupsDatasource.getResourceProp(URI, 'name');
      
      
      if (URI == null)
        return; //Neni vybrana zadna skupina
  
      window.arguments[0].out = {groupURI:URI,
                                 groupName:name};
  
      window.close();
    }
    catch(ex)
    {
      alert('typesWindow.js : selectGroup:\n' + ex.message);
    }
  }
};