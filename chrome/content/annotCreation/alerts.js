/**
 * Soubor: alerts.js
 *  Autor: Jiri Trhlik
 *  Datum: 3.9.2011
 *  Popis: Objekt pro upozorneni o udalostech pro uzivatele.
 *  Posledni uprava: 5.6.2012
 */

annotationExtensionChrome.alerts =
{
  stringBundle : null,
  
  /**
   * Vola se v annotationExtensionChrome.browserOverlay.init() (browserOverlay.js)
   */
  init : function()
  {    
    this.stringBundle = document.getElementById("annotationextension-string-bundle");
  },
  
  /**
   * Vola se v annotationExtensionChrome.browserOverlay.destroy() (browserOverlay.js)
   */
  destroy : function()
  {
    
  },
  
  /**
   * Zobrazi upozornujici hlasku
   * @param {string} message - text hlasky
   */
  alertMessage : function(message)
  {
    let alertsService =
      Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
      
    let title = this.stringBundle.getString("annotationextension.alertMessage.title")

    alertsService.showAlertNotification(
      "chrome://annotationextension/skin/boomy/edit.png",
      title, message, false, "", null, "Annotation Extension Message");
  },
  
  /**
   * Zobrazi upozornujici hlasku
   * @param {string} typ hlasky, pokud neni rozpoznan, pouzije se jako hlaska
   */
  alert : function(aData)
  {
    var message = "";
    
    if (aData == "httpReqError")
    {
      message = this.stringBundle.getFormattedString("annotationextension.alertMessage.httpRequestError", []);
    }
    else if (aData == "badResponse")
    {
      message = this.stringBundle.getString("annotationextension.alertMessage.serverResponseError");
    }
    else if (aData == "badProto")
    {
      message = this.stringBundle.getString("annotationextension.alertMessage.badProtocol");
    }
    else
    {
      message = this.stringBundle.getString("annotationextension.alertMessage.unhandledError") + ' ' + aData;
    }
    
    this.alertMessage(message);
  },
  
  /**
   * Zobrazi upozornujici hlasku
   * @param {string} text, text hlasky
   */
  alertWarning : function(text)
  {    
    this.alertMessage('Warning: \n' + text);
  }
}

//Konstruktor
//(function() { this.init(); }).apply(annotationExtensionChrome.alerts);