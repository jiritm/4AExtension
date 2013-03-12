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
  init : function()
  {
    annotationExtensionChrome.mainAEChrome = window.arguments[0].input.mainAEChrome;

    let structTypes = document.getElementById('aeStructTypes');
    structTypes.aeMainAEChrome = annotationExtensionChrome.mainAEChrome;
    structTypes.aeondblclick = this.selectType;
    structTypes.aeSetNewDatasource(annotationExtensionChrome.mainAEChrome.typesDatasource);
  },

  selectType : function()
  {
    let structTypes = document.getElementById('aeStructTypes');

    let typeURI = structTypes.aeSelectedTypeURI;
    let typeName = structTypes.aeSelectedTypeName;
    
    if (!typeURI)
      return; //Neni vybran zadny typ

    window.arguments[0].out = {typeURI:typeURI,
                               typeName:typeName};

    window.close();
  }
};