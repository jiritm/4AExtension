/**
 * Soubor: typesColors.js
 * Autor: Jiri Trhlik
 * Datum: 14.11.2011
 * Popis: Projde ulozene nastaveni uzivatele a vybere nastaveni pro barvu anotaci.
 *        Barvy nastavi jednotlivym typum.
 * Posledni uprava: 5.6.2012       
 */


//TODO:POUZIT KNIHOVNU NA ZPRACOVANI BAREV

annotationExtensionChrome.typesColors =
{      
  /**
   * PRO ZISKANI BARVY BY SE MELA POUZIT POUZE TATO FUNKCE
   * Vrati barvu pro typ, pritom zohledni uroven typu
   * @param {String} type, typ pro ktery chceme ziskat baarvu
   * @param {Int} level, uroven zanoreni typu
   * @returns barva pro typ z argumentu
   */
  getColorForTypeWithLevel : function(type, level)
  {
    //TODO: Doladit level anotace...
    //var color = this.getColorForType(type);
    //var alfa = 1;
    
    //switch(level)
    //{
    //  case 0: alfa = 1; break;
    //  case 1: alfa = 0.6; break;
    //  case 2: alfa = 0.4; break;
    //  case 3: alfa = 0.3; break;
    //  case 4: alfa = 0.2; break;
    //  case 5: alfa = 0.1; break;
    //  default: alfa = 1; break;
    //}

    //color = this.hexColorToRgbaColor(color, alfa);
    var color = this.getRgbaColorForType(type);
    
    return color;
  },
  
  /**
   * Private
   * Vrati barvu pro typ v rgba tvaru
   * @param {String} type, typ pro ktery chceme ziskat baarvu
   * @returns barva pro typ z argumentu
   */
  getRgbaColorForType : function(type)
  {
    var backgroundColor = annotationExtensionChrome.colorsDatasource.getResourceProp('annotationExtension://' + type, 'backgroundColor');
    var fontColor = annotationExtensionChrome.colorsDatasource.getResourceProp('annotationExtension://' + type, 'fontColor');
    
    var color = { backgroundColor : annotationExtension.PREFERENCE.getCharPref("annotationFragment.defaultBackground"),
                  fontColor : annotationExtension.PREFERENCE.getCharPref("annotationFragment.defaultFont")};
    
    if (backgroundColor != null)
    {      
      if (this.checkRGBAColor(backgroundColor))
        color.backgroundColor = backgroundColor;
      else if (this.checkHexColor(backgroundColor))
        color.backgroundColor = this.hexColorToRgbaColor(backgroundColor, 1);
    }
    
    if (fontColor != null)
    {
      if (this.checkRGBAColor(fontColor))
        color.fontColor = fontColor;
      else if (this.checkHexColor(fontColor))
        color.fontColor = this.hexColorToRgbaColor(fontColor, 1);
      else
        color.fontColor = annotationExtension.SETTING_NOT_SET;
    }
      
    return color;
  },
  
  /**
   * Private
   * Vrati barvu (jak je ulozena) pro typ
   * @param {String} type, typ pro ktery chceme ziskat baarvu
   * @returns barva pro typ z argumentu
   */
  getColorForType : function(type)
  {
    var backgroundColor = annotationExtensionChrome.colorsDatasource.getResourceProp('annotationExtension://' + type, 'backgroundColor');
    var fontColor = annotationExtensionChrome.colorsDatasource.getResourceProp('annotationExtension://' + type, 'fontColor');
    
    var color = { backgroundColor : annotationExtension.PREFERENCE.getCharPref("annotationFragment.defaultBackground"),
                  fontColor : annotationExtension.PREFERENCE.getCharPref("annotationFragment.defaultFont")};
    
    if (fontColor != null)
      color.fontColor = fontColor;
    
    if (backgroundColor != null)
      color.backgroundColor = backgroundColor;
               
    return color;
  },
  
  /**
   * Prevede barvu v hexa formatu na rgba (se specifikovanym alfa kanalem)
   * @param {String} color, barva ve formatu #FFFFFF
   * @param {Double} alfa, alfa kanal 0 - 1
   * @returns {String} rgba retezec udavajici barvu, null, pokud color neni v hexa formatu
   */
  hexColorToRgbaColor : function(color, alfa)
  {
    if (!this.checkHexColor(color))
      return null;
    else
    {
      var rgbaColor ='rgba(';
      var r = parseInt(color.substring(1,3), 16);
      var g = parseInt(color.substring(3,5), 16);
      var b = parseInt(color.substring(5), 16);
      rgbaColor += r + ',' + g + ',' + b + ',' + alfa + ')';
    
      return rgbaColor;
    }
  },
  
  /**
   * Zda je barva ve spravnem hexa formatu #FFFFFF
   * @param {String} color
   * @returns {Bool} true, pokud je barva ve spravnem formatu, jinak false
   */
  checkHexColor : function(color)
  {
    //var patt = /^#[0-9A-Fa-f]{6}$/;
    var patt = /^\#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
    if (color.match(patt) != null)
      return true;
    else
      return false;
  },
  
  /**
   * Zda je barva ve spravnem rgba formatu
   * @param {String} color
   * @returns {Bool} true, pokud je barva ve spravnem formatu, jinak false
   */
  checkRGBAColor : function(color)
  {
    //TODO:
    //vylepsit pattt na poznani rgba barvy
    var patt = /^rgba\([0-9]{1,3},[0-9]{1,3},[0-9]{1,3},(1)|(0)|(0\.[0-9])\)$/;
    if (color.match(patt) != null)
      return true;
    else
      return false;
  },
  
  /**
   * @param {String} color, rgba barva
   * @returns {Float} alfa kanal barvy, pri chybe vrati null
   */
  getAlphaForRGBAColor : function(color)
  {
    if (this.checkRGBAColor(color))
    {
      var pars = color.indexOf(',');
      var repars = color.indexOf(',',pars+1);
      var alpha = parseFloat(color.substr(color.indexOf(',',repars+1)+1,color.indexOf(')')));
      
      if (isNaN(alpha))
        return null;
      
      return alpha;
    }
    else
    {
      return null;
    }    
  }
};