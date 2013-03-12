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
		annotationExtensionChrome.mainAEChrome = window.arguments[0].input.mainAEChrome;
    
		let types = document.getElementById('aeTypes');
    types.aeMainAEChrome = annotationExtensionChrome.mainAEChrome;
    types.aeondblclick = this.selectType;
    types.aeSetNewDatasource(annotationExtensionChrome.mainAEChrome.typesDatasource);
		
    if (annotationExtensionChrome.mainAEChrome.attributes.attributeIsDefault(window.arguments[0].input.attrId))
      var setTypeToTempCheck = document.getElementById('aeChangeTypeInTemplateCheckbox').hidden = false;
  },
  
  /**
   * Handler tlacitka id=aeSelectTypeButton
   */
  selectType : function()
  {
    try
    {
      var types = document.getElementById('aeTypes');
      
      if (!types.aeSelectedTypeURI)
        return; //Neni nic vybrano
      
      var setTypeInTemplate = document.getElementById('aeChangeTypeInTemplateCheckbox').checked;
      
			window.arguments[0].out = {typeURI:types.aeSelectedTypeURI,
                                 typeName:annotationExtensionChrome.mainAEChrome.attributes.getTypeStringToTextbox(types.aeSelectedTypeURI),
																 additionalAttrs:{setTypeInTemplate : setTypeInTemplate}};
			
      window.close();
    }
    catch(ex)
    {
      alert(ex.message);
    }
  }
};