/**
 * Soubor: panel.js
 * Autor: Jiri Trhlik
 * Datum: 27.11.2012
 * Popis: Funkce pro vytvareni a zobrazeni informacnich panelu
 * Posledni uprava: 27.11.2012
 */

annotationExtensionChrome.infoPanel =
{    
  /**
   * Zobrazi panel
   * @param {String} id, id panelu, ktere bylo nastavene panelu pri vytvoreni
   * @param {Node || String} parent, uzel u ktereho se panel zobrazi
   */
  show : function(panelId, parent)
  {
    var panel = this.get(panelId);
    if (panel == null)
      throw "Panel does not exist.";
    else
    {
      var v_parent;
      if (typeof parent === 'string')
        v_parent = document.getElementById(parent);
      else
        v_parent = parent;
      panel.openPopup(v_parent, 'before_end', null, null, true, true, null );  
    }
  },
  
  /**
   * Skryje panel
   * @param {String} id, id panelu, ktere bylo nastavene panelu pri vytvoreni
   */
  hide : function(panelId)
  {
    var panel = this.get(panelId);
    if (panel != null)
    {
      panel.hidePopup();  
    }
  },
  
  /**
   * Vytvori panel, pokud panel s danym id neexistuje
   * @param {String} panelId, id, ktere se nastavi panelu
   * @param {String} fade, viz popis atributu "fade" XUL panelu
   *                 pokud je null, nastav na "none"
   * @param {String} title, popisek panelu
   * @param {String} text, text, ktery se nastavi do panelu
   * @param {String} imageClass, pokud neni null, infoPanel bude obsahovat obrazek
   *                 s imageClass - tento obrazek se definuje ve stylech
   * @param {Bool}  Zda se maji zobrazit tlacitka v "titleBaru"
   * @returns {Node} vytvoreny panel
   */
  create : function(panelId, fade, title, text, imageClass, showButtonsP)
  {
    var panel_node = this.get(panelId);
    if (panel_node != null)
      return panel_node;
    
    if (showButtonsP == undefined || showButtonsP == null)
      var showButtons = false;
    else
      var showButtons = showButtonsP;
    
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    
    panel_node = document.createElement('panel');
    panel_node.setAttribute('id', panelId);
    var v_fade ;
    if (fade == null || fade == undefined)
      v_fade = "none";
    else
      v_fade = fade;
      
    panel_node.setAttribute('fade', v_fade);
    panel_node.setAttribute('type', 'arrow');
    panel_node.setAttribute('position', 'before_end');
        
    var image_info_hbox_node = document.createElement('hbox');
    image_info_hbox_node.setAttribute('class', 'aeInfoPanel-image_info-hbox');
    
    if (imageClass != null && imageClass != undefined)
    {
      var image = document.createElement('image');
          image.setAttribute('class', imageClass);
          var image_vbox = document.createElement('vbox');
          var image_spacer = document.createElement('spacer');
              image_spacer.setAttribute('flex', '1');
          image_vbox.appendChild(image);
          image_vbox.appendChild(image_spacer);
          
      image_info_hbox_node.appendChild(image_vbox);
    }
        
    var info_vbox_node = document.createElement('vbox');
        info_vbox_node.setAttribute('class', 'aeInfoPanel-info-vbox');
        info_vbox_node.setAttribute('flex', '1');
        var titleDesc = document.createElement('description');
        titleDesc.setAttribute('class', 'aeInfoPanel-title-desc');
        if (title != null && title != undefined)
          titleDesc.setAttribute('value', title);
        var imageClose = document.createElement('image');
          imageClose.setAttribute('class','aeInfoPanel-close-button');
          imageClose.setAttribute('onclick', 'document.getElementById("'+panelId+'").hidePopup();');
          imageClose.setAttribute('tooltiptext', stringBundle.getString("annotationextension.infoPanel.closeButton.tooltip"));
          if (!showButtons) imageClose.setAttribute('hidden', 'true');
        var titlebar = document.createElement("hbox");
          titlebar.setAttribute('align', 'center');
				  titlebar.setAttribute('pack', 'center');
          titlebar.setAttribute('flex', '1');
          titlebar.setAttribute('class', 'aeInfoPanel-titlebar-box');
          var titlebarSpacer1 = document.createElement("spacer");
            titlebarSpacer1.setAttribute('flex', '1');
          var titlebarSpacer2 = document.createElement("spacer");
            titlebarSpacer2.setAttribute('flex', '1');
          titlebar.appendChild(titlebarSpacer1);
          titlebar.appendChild(titleDesc);
          titlebar.appendChild(titlebarSpacer2);
          titlebar.appendChild(imageClose);
        var textDesc = document.createElement('description');
        textDesc.setAttribute('class', 'aeInfoPanel-text-desc');
        if (text != null && text != undefined)
          textDesc.textContent = text;
        var spacer = document.createElement('spacer');
        spacer.setAttribute('flex', '1');
        
        var misc_box = document.createElement('box');
        misc_box.setAttribute('class', 'aeInfoPanel-misc');
      
        info_vbox_node.appendChild(textDesc);
        info_vbox_node.appendChild(misc_box);
        info_vbox_node.appendChild(spacer);
  
    image_info_hbox_node.appendChild(info_vbox_node);
    
    var main_vbox = document.createElement('vbox');
    main_vbox.setAttribute('class', 'aeInfoPanel-main');
    main_vbox.appendChild(titlebar);
    main_vbox.appendChild(image_info_hbox_node);
    panel_node.appendChild(main_vbox);
     
    var panels = document.getElementById('aeInfoPanels');    
        panels.appendChild(panel_node);
        
    return panel_node;
  },
  
  /**
   * Nastavi panelu dodatecne prvky
   * @param {String} id, id panelu
   * @param {Node} misc, uzel obsahujici dodatecne prvky k zobrazeni na panelu.
   */
  setMisc : function(id, misc)
  {
    var panel = this.get(id);
    if (panel == null)
      throw "Panel does not exist.";
    
    var miscBox = $(panel).find('.aeInfoPanel-misc').get();
    $(miscBox).empty();
    $(miscBox).append(misc);
  },
  
  /**
   * Odstrani z panelu dodatecne prvky
   * @param {String} id, id panelu
   */
  deleteMisc : function(id)
  {
    var panel = this.get(id);
    if (panel == null)
      throw "Panel does not exist.";
    
    var miscBox = $(panel).find('.aeInfoPanel-misc').get();
    $(miscBox).empty();
  },
  
  setInfo : function(id, title, text)
  {
    var panel = this.get(id);
    if (panel == null)
      throw "Panel does not exist.";
  
    if (title != null && title != undefined)
    {
      var desc = $(panel).find('.aeInfoPanel-title-desc').get(0);
      desc.textContent = title;
    }
    
    if (text != null && text != undefined)
    {
      var textDesc = $(panel).find('.aeInfoPanel-text-desc').get(0);
      textDesc.textContent = text;
    }
  },
  
  exists : function(id)
  {
    if (this.get(id) != null)
      return true;
    else
      return false;
  },
  
  get : function(id)
  {
    return document.getElementById(id);
  },
  
  remove : function(id)
  {
    var panel_node = this.get(id);
    if (panel_node != null)
      panel_node.parentNode.removeChild(panel_node);
  }
}