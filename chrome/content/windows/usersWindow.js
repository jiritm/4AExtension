/**
 * Soubor: usersWindow.js
 * Autor: Jiri Trhlik
 * Datum: 25.2.2013
 * Popis: Funkce pro usersWindow.xul.
 * Posledni uprava:
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

annotationExtensionChrome.usersWindow =
{
  /**
   * Inicializace
   * vola se pri onload 
   */
  init : function()
  {
    //Vytvoreni a pripojeni datasource ke stromu
    annotationExtensionChrome.treeUsersDatasource = new annotationExtensionChrome.TreeDatasource('aeUsersTree', 'users', opener.annotationExtensionChrome.usersDatasource, null);
  },
  
  /**
   * Vola se pri onunload
   */
  destroy : function()
  {
    annotationExtensionChrome.treeUsersDatasource.destroy();
  },

  selectUser : function()
  {
    try
    {
      var URI = annotationExtensionChrome.treeUsersDatasource.getSelectionURI();
      var name = annotationExtensionChrome.treeUsersDatasource.getResourceProp(URI, 'name');
      var email = annotationExtensionChrome.treeUsersDatasource.getResourceProp(URI, 'email');
      
      
      if (URI == null)
        return; //Neni vybrana zadna skupina
  
      window.arguments[0].out = {userURI:URI,
                                 userName:name,
                                 userEmail:email};
  
      window.close();
    }
    catch(ex)
    {
      alert('typesWindow.js : selectUser:\n' + ex.message);
    }
  }
};