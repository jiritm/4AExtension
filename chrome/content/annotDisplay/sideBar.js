/**
 * Soubor: sideBar.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro sideBar.xul
 *        "Objekt bocniho panelu" anotacniho doplnku a funkce pro jeho inicializaci.
 * Posledni uprava: 5.6.2012
 */

/**
 * Soubor: sidebar.js
 *  Autor: Jiri Trhlik
 *  Datum: 13.10.2011
 *  Popis: Funkce pro praci s bocnim panelem sideBar.xul
 */
annotationExtensionChrome.sideBar =
{
  mainWindow : null,   /**< Okno do ktereho patri sidebar. */
  /**
   * Inicializace
   * vola se pri onload annot. sidebaru
   */
  init : function()
  {
    this.mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIWebNavigation)
                   .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                   .rootTreeItem
                   .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                   .getInterface(Components.interfaces.nsIDOMWindow);
    
    //Muzou byt duplikaty po pridani anotaci do sidebaru, proto nejdriv smaz pripadne anotace
    this.mainWindow.removeAnnotationsFromSidebar(this.mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS);
    this.mainWindow.addAnnotationsToSidebar(this.mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS);
  }
};