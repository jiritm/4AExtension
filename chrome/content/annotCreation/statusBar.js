/**
 * Soubor: statusBar.js
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Funkce pro zobrazeni textu a zprav v horni liste doplnku.
 * Posledni uprava: 5.6.2012
 */
annotationExtensionChrome.statusBar =
{  
  barText : "",
  annotationText : "",
  color : "white",
  
  //Vola se v annotationExtensionChrome.browserOverlay.init()
  init : function()
  {
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    this.barText = stringBundle.getString("annotationextension.Window.aeControlPanel.label");
    this.annotationText = this.barText; 
  },
  
  /**
   * Nastavi do statusbaru text
   * @param {String} text text do statusbaru
   */
  setTextToBar : function(text)
  {  
    var statusBar = document.getElementById('statusBar');
    statusBar.setAttribute("value", text);
    this.barText = text;
  },
  
  /**
   * Prida do statusbaru text
   * @param {String} text text na pridani do statusbaru
   */
  addTextToBar : function(text)
  {
    var statusBar = document.getElementById('statusBar');
    statusBar.setAttribute("value", this.barText + text);
    this.barText += text;
  },
  
  isShowing : false,
  
  /**
   * Zobrazi do status baru zpravu na urcitou dobu a vrati nastaveny text.
   * @param {String} text text do statusbaru
   * @param {Double} time cas v milisekundach, po kterou bude zprava zobrazena
   * @param {String} color optional, barva textu - red, green, black, blue...
   */
  showMessage : function(text, time, color)
  {
    var statusBar = document.getElementById('statusBar');
     
    if (!this.isShowing)
    {
      statusBar.setAttribute("value", text);
      if (color != undefined && color != null)
        statusBar.setAttribute("style", 'color: ' + color);
      
      this.isShowing = true;
      setTimeout(this.clearMessage.bind(this), time);
    }
  },
  
  /**
   * Zobrazi puvodni text - "smaze zpravu"
   */
  clearMessage : function()
  {
    var statusBar = document.getElementById('statusBar');
    
    this.isShowing = false;
    statusBar.setAttribute("value", this.barText);
    statusBar.setAttribute("style", 'color: ' + this.color);
  }
};