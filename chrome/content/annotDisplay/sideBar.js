/**
 * Soubor: sidebar.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro sidebar.xul
 *        "Objekt bocniho panelu" anotacniho doplnku a funkce pro jeho inicializaci.
 * Posledni uprava: 5.6.2012
 */

/** Okno do ktereho patri sidebar. */
var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                 .getInterface(Components.interfaces.nsIWebNavigation)
                 .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                 .rootTreeItem
                 .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                 .getInterface(Components.interfaces.nsIDOMWindow);

function init()
{
  //Muzou byt duplikaty po pridani anotaci do sidebaru, proto nejdriv smaz pripadne anotace
  mainWindow.removeAnnotationsFromSidebar(mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS);
  mainWindow.addAnnotationsToSidebar(mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS);
}