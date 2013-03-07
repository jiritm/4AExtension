/**
 * Soubor: panels.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro vytvoreni a manipulaci panelu anotace.
 * Posledni uprava: 5.6.2012
 */

/**
 * Otevre panel s anotaci.
 * @param {xul:panel} panel 
 * @param {node} anchor prvek, u ktereho se panel zobrazi
 * @param {string} id id anotace ke ktere panel patri
 * @param {String} persist
 * @param {bool} showNestedP, zda se maji s panelem oznacit i vnorene anotace spojene s nim
 */
function openPanel(panel, anchor, id, persist, showNestedP)
{
  if (showNestedP == undefined || showNestedP == null)
    var showNested = true;
  else
    var showNested = showNestedP;
		
  if(persist == "true" || persist == "false")
  {
    if($(panel).attr('persist') == 'false')
    {
      $(panel).attr('persist', persist);
    }
  }
  actualizePanel(panel, id, showNested);

  //openPopup( anchor , position , x , y , isContextMenu, attributesOverride, triggerEvent )
  panel.openPopup(anchor, 'after_start', null, null, true, true, null );
};

/**
 * Zavre panel s anotaci.
 * @param {xul:panel} panel 
 * @param {bool} persist pokud je false a panel ma nastaveno true - panel se nezavre
 * 											 pokud je true - "nasilne" zavre panel
 */
function closePanel(panel, persist)
{
  var panel_persist = $(panel).attr('persist');
  //alert(panel_persist);
  //alert(persist);
  if(panel_persist == "true" && persist != "true")
  {
    //in this case do nothing
  }
  else
  {
    $(panel).attr('persist','false');
    panel.hidePopup();
  }    
};

/**
 * Otevre panel s anotaci. 
 * @param {string} id, id panelu
 */
function showALinkPanel(id)
{
  var panel = document.getElementById(id);
  var anchor = annotationExtensionChrome.annotationsView.frame_doc.getElementsByName(id)[0];
    
    if (panel != null && panel != undefined && anchor != null && anchor != undefined)
    {
        actualizePanel(panel, id, false);
        panel.openPopup(anchor, 'after_start', null, null, true, true, null );
        annotHighlight(id, annotationExtensionChrome.annotationsView.frame_doc);
    }
    else
    {//Zvyrazni anotaci dokumentu v bocnim panelu
        //Otevri sidebar
        toggleSidebar('viewAnnotationsSidebar', true);
        //pokus se otevrit anotaci v sidebaru
        try
        {//TODO: pokud neni sidebar otevreny, anotace se neotevre - nestihne se nahrat dom nebo skript? opravit
            var sidebarWin = document.getElementById("sidebar").contentWindow;
            sidebarWin.changeRTASidebarPanelColor(id, annotationExtension.ALINK_ANNOTATION_COLOR);
        }
        catch(ex)
        {} 
    }
};

/**
 * Zavre panel s anotaci.
 * @param {string} id, id panelu 
 */
function closeALinkPanel(id)
{
		var panel = document.getElementById(id);
    var anchor = annotationExtensionChrome.annotationsView.frame_doc.getElementsByName(id)[0];
		
    if (panel != null && panel != undefined && anchor != null && anchor != undefined)
    {
        panel.hidePopup();
        annotHighlightClear(id, annotationExtensionChrome.annotationsView.frame_doc);
    }
    else
    {
        try
        {//TODO: pokud neni sidebar otevreny, anotace se neotevre - nestihne se nahrat dom nebo skript? opravit
            var sidebarWin = document.getElementById("sidebar").contentWindow;
            sidebarWin.changeRTASidebarPanelColor(id, '#DDDDDD');
        }
        catch(ex)
        {} 
    }
};

/**
 * Zavre vsechny panely s anotacemi
 */
function closeAllPanels()
{
		var panels = document.getElementById('aePanels').childNodes;
    for (var i = 0; i < panels.length; i++)
    {
				closePanel(panels[i], 'true');
    }
};


function actualizePanel(panel,id,showNestedP)
{
		if (showNestedP == undefined || showNestedP == null)
				var showNested = true;
		else
				var showNested = showNestedP;
				
    var objAnot = annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(id);
    
		var type = typeConversion(objAnot.type);
    $(panel).find('#ap-type').attr('value',type);
    $(panel).find('#ap-type').attr('tooltiptext',type);
		
    $(panel).find('#ap-author').attr('value',objAnot.author.name);
    
		var date = dateConversion(objAnot.dateTime);
    $(panel).find('#ap-date').attr('value',date);
    
		$(panel).find('#ap-text').attr('value',objAnot.content);
    
		var rich_list_box = $(panel).find('#ap-attributes').get();
    clearAttributes(rich_list_box);
    appendAttributes(id, annotationExtensionChrome.annotationsView.frame_doc, panel, showNested);
};

/**
 * Vytvori z panelu panel nabidnute anotace)
 * @param {String} id, id nabidnute anotace (lokalni)
 * @param {String} tmpId, tmpId nabidnute anotace (od serveru)
 * @param {Node Element} panel, panel, ktery patri anotaci s id "id"
 */
function makeSuggestionPanelFromPanel(id, tmpId, panel)
{
	try
	{
		addSuggestionButtonsToPanel(id, tmpId, panel);
		addSuggestionInfoToPanel(panel);
		setSuggestionClassToPanelContent(panel);
		hideDeleteButtonFromPanel(panel);
	}
	catch(ex)
	{
		alert('panels.js : makeSuggestionPanelFromPanel: \n' + ex.message);
	}
};

/**
 * Skryje z panelu anotace tlacitko na smazani anotace
 * @param {Node} panel, panel nabizene anotace
 */
function hideDeleteButtonFromPanel(panel)
{
	var mainVbox = $(panel).find('#ap-vbox').get();
	var deleteButton = $(mainVbox).find('#aeDeleteAnnotationButton').get();
	$(deleteButton).attr('hidden', 'true');
};

/**
 * Nastavi panelu tridu nabidnute anotace
 * @param {Node} panel, panel nabizene anotace
 */
function setSuggestionClassToPanelContent(panel)
{
	var mainVbox = $(panel).find('#ap-vbox').get();
	$(mainVbox).addClass("ap-vbox-suggestion");
};

/**
 * Prida k panelu tlacitka na potvrzeni a odmitnuti anotace
 * @param {String} id, id nabidnute anotace (lokalni)
 * @param {String} tmpId, tmpId nabidnute anotace (od serveru)
 * @param {Node} panel, panel nabizene anotace
 */
function addSuggestionButtonsToPanel(id, tmpId, panel)
{
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	var confirmButtonString = stringBundle.getString('annotationextension.panel.confirmSuggestionButton.label');
	var refuseButtonString = stringBundle.getString('annotationextension.panel.refuseSuggestionButton.label');

	var confirmButtonBox = document.createElement('hbox');
	confirmButtonBox.setAttribute('id', 'ap-confirmbuttonbox');
	confirmButtonBox.setAttribute('pack', 'end');
		
		var confirmButton = document.createElement('button');
		confirmButton.setAttribute('label', confirmButtonString);
		confirmButton.setAttribute('onclick', 'confirmSuggestion("'+id+'");');
		confirmButton.setAttribute('tooltiptext', stringBundle.getString('annotationextension.panel.confirmSuggestionButton.tooltip'));
		
		var refuseButton = document.createElement('button');
		refuseButton.setAttribute('label', refuseButtonString);
		refuseButton.setAttribute('onclick', 'refuseSuggestion("'+id+'","'+tmpId+'");');
		refuseButton.setAttribute('tooltiptext', stringBundle.getString('annotationextension.panel.refuseSuggestionButton.tooltip'));
		//refuseButton.setAttribute('style', 'margin: 0px !important; padding: 0px !important;');
		
		$(confirmButtonBox).append(refuseButton);
		$(confirmButtonBox).append(confirmButton);
		
		var mainVbox = $(panel).find('#ap-vbox').get();
		$(mainVbox).append(confirmButtonBox);
};

/**
 * Prida k panelu anotace info, ze se jedna o nabizenou anotaci
 * @param {Node} panel, panel nabizene anotace
 */
function addSuggestionInfoToPanel(panel)
{
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	var confirmButtonString = stringBundle.getString('annotationextension.panel.confirmSuggestionButton.label');
	var suggestionTextString = stringBundle.getString('annotationextension.panel.suggestionText.label');
	var suggestionTextTooltipString = stringBundle.getFormattedString('annotationextension.panel.suggestionText.tooltip', [confirmButtonString]);
	
	var suggestLabelBox = document.createElement('hbox');
	suggestLabelBox.setAttribute('id', 'ap-suggestbox');
	suggestLabelBox.setAttribute('align', 'center');
		
		var suggestLabel = document.createElement('label');
		suggestLabel.setAttribute('value', suggestionTextString);
		suggestLabel.setAttribute('tooltiptext', suggestionTextTooltipString);
		
		var suggestInfoImage = document.createElement('image');
		suggestInfoImage.setAttribute('id', 'aeInfoButton');
		suggestInfoImage.setAttribute('tooltiptext', suggestionTextTooltipString);
		
		var spacer = document.createElement('spacer');
		spacer.setAttribute('flex', '1');
		
		$(suggestLabelBox).append(suggestLabel);
		$(suggestLabelBox).append(spacer);
		$(suggestLabelBox).append(suggestInfoImage);
		
		var mainVbox = $(panel).find('#ap-vbox').get();
		$(mainVbox).prepend(suggestLabelBox);
};

/**
 * Zasle pozadavek na odmitnuti anotace
 * @param {String} id, id anotace, ktera se ma prijmout
 * @param {String} tmpId, tmpId anotace, ktera se odmita
 */
function refuseSuggestion(id, tmpId)
{
	closePanel(document.getElementById(id),'true');
	
	annotationExtensionChrome.client.refusedSuggestions([tmpId], "manually");
};

/**
 * Ulozi nabidnutou anotaci
 * @param {String} id, id anotace, ktera se ma prijmout
 */
function confirmSuggestion(id)
{
	var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
  var annotation = annotDB.getAnnotation(id);
	
	var annotationXML = annotation.XMLText;
	var tmpId = annotation.tmpId;
	
	closePanel(document.getElementById(id),'true');
	
	annotationExtensionChrome.client.confirmSuggestionManually(annotation.XMLText, tmpId);
};

function appendAttributes(id,frame_doc, panel, showNestedP)
{
		if (showNestedP == undefined || showNestedP == null)
				var showNested = true;
		else
				var showNested = showNestedP;
		
    var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
    var rich_list_box = $(panel).find('#ap-attributes').get();
    var annotation = annotDB.getAnnotation(id);
		
		let stringBundle = document.getElementById("annotationextension-string-bundle");
		
		var notFoundText = stringBundle.getString("annotationextension.annotation.notFound");
		var nestedText = stringBundle.getString("annotationextension.annotation.nested");
    var aLinkText = stringBundle.getString("annotationextension.attributes.annotLink");
		var personText = stringBundle.getString("annotationextension.annotation.person");
		
    for(var i = 0;i < annotation.attributes.length; i++)
		{
        var node_richlistitem = document.createElement("richlistitem");
        var node_description = document.createElement('description');
        var attribute = annotation.attributes[i];
        //alert(attribute.string());
        var text_node = undefined;
        var span_image = undefined;
				var node_image = undefined;
        var span_node = undefined;
        var link_id = undefined;
        var append = "";
        
        switch(attribute.type)
				{
            case "Image":
								var uri = attribute.value;
								
                node_image = document.createElement("image");
                    node_image.setAttribute('src', attribute.value);
                    node_image.setAttribute('height','100');
							
                var text_node = document.createElement('description');
								text_node.setAttribute('value', attribute.name + " = ");
								//Pokud se zalozka ma udelat aktivni: gBrowser.selectedTab = gBrowser.addTab('"+uri+"');
								node_richlistitem.setAttribute('onclick', "gBrowser.addTab('"+uri+"');");
                node_richlistitem.appendChild(text_node);
								node_richlistitem.appendChild(node_image);
								
								break;
						
						case "Binary":
								span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:a");
   							span_node.setAttribute('onclick', 'saveFile("'+id+'", "'+attribute.name+'")');
                
                text_node = document.createTextNode(attribute.name + " = (" + "File" + ")");
                span_node.appendChild(text_node);
								
								node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                node_image.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
                node_image.setAttribute('width','12');
                node_image.setAttribute('height','12');
                span_node.appendChild(node_image);
								node_description.appendChild(span_node);
								node_richlistitem.appendChild(node_description);
							
								break;
            case "Duration":
						case "Text":
            case "String":
            case "DateTime":
            case "Integer":
            case "Decimal":
            case "Date":
            case "Time":
            case "Boolean":
                append = attribute.name + " = " + attribute.value;
                text_node = document.createTextNode(append);
                node_description.appendChild(text_node);
								node_richlistitem.appendChild(node_description);
                break;
            
						case "URI":
							  var uri = attribute.value;
                
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:span");
								    //Pokud se zalozka ma udelat aktivni: gBrowser.selectedTab = gBrowser.addTab('"+uri+"');
										span_node.setAttribute('onclick', "gBrowser.addTab('"+uri+"');");
                    
								append = attribute.name + " = " + attribute.value;
                text_node = document.createTextNode(append);

                node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/icons/hyperlink.gif');
                    node_image.setAttribute('width','12');
                    node_image.setAttribute('height','12');
                    
								span_node.appendChild(text_node);
								span_node.appendChild(node_image);
                
                node_description.appendChild(span_node);
								node_richlistitem.appendChild(node_description);
								break;
							
            case "GeoPoint":
            case "geoPoint":
                var url = 'http://maps.google.com/maps?q=' + attribute.value.glat + ',' + attribute.value.glong;
                
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:span");
										span_node.setAttribute('onclick', "gBrowser.addTab('"+url+"');");
                    
								text_node = document.createTextNode(attribute.name + " = (Geo: " +  attribute.value.glat + ' , ' + attribute.value.glong + ")");

                node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/icons/hyperlink.gif');
                    node_image.setAttribute('width','12');
                    node_image.setAttribute('height','12');
                    
								span_node.appendChild(text_node);
								span_node.appendChild(node_image);
                
                node_description.appendChild(span_node);
								node_richlistitem.appendChild(node_description);
                break;
                
            case "annotationLink":
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:a");
                
                link_id = attribute.value;
                var linkAnnotation = annotDB.getAnnotation(link_id);
                
                if(linkAnnotation != null)
								{
                    //Pokud existuje alespon jeden span anotace odkazovane aLinkem
                    if (frame_doc.getElementsByName(link_id).length > 0)
                        span_node.setAttribute('onclick', "openPanel(document.getElementById('" + link_id + "')," + 
                            "annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + link_id + "')[0]," + "'" + link_id + "', 'true');");
										else
                        span_node.setAttribute('onclick', 'openAnnotInSidebar("' + link_id + '");');
                    
                    text_node = document.createTextNode(attribute.name + " (" + aLinkText + ")");
                    span_node.appendChild(text_node);
										
                    node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
                    node_image.setAttribute('width','12');
                    node_image.setAttribute('height','12');
                    span_node.appendChild(node_image);
                }
								else
								{
                    text_node = document.createTextNode(attribute.name + " (" + aLinkText + ")(" + notFoundText + ")");
                    span_node.appendChild(text_node);
                }
                node_description.appendChild(span_node);
								node_richlistitem.appendChild(node_description);
                break;
                
            case "nestedAnnotation":
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:span");
                link_id = attribute.value;
                
                var nestedAnnotation = annotDB.getAnnotation(link_id);
                
                if(nestedAnnotation != null)
								{
                    var annotationSpans = frame_doc.getElementsByName(link_id);
                    if (annotationSpans.length > 0)
                    {
                        //Pokud vnorena anotace existuje(alespon jeden span)
                        if (showNested == true)
                        {
                            var typeName = annotationExtension.functions.linearTypeURI(nestedAnnotation.type);
                            var level = nestedAnnotation.lvl;
                            
                            var color = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, level);
                            setFragmentsBackground(link_id, color, frame_doc, nestedAnnotation.tmpId);
  
                            for (var aSCount= 0; aSCount < annotationSpans.length; aSCount++)
                            {
                                annotationSpans[aSCount].setAttribute('active','true');
                            }
                        }
                        
                        span_node.setAttribute('onclick', "openPanel(document.getElementById('" + link_id + "')," + 
                            "annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + link_id + "')[0]," + "'" + link_id + "', 'true');");
                    }
                    else
                    {
                        span_node.setAttribute('onclick', 'openAnnotInSidebar("' + link_id + '");');
                    }
                    
                    text_node = document.createTextNode(attribute.name + " (" + nestedText + ")");
                    span_node.appendChild(text_node);
                    node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
                    node_image.setAttribute('width','12');
                    node_image.setAttribute('height','12');
                    span_node.appendChild(node_image);
                }
								else
								{
                    text_node = document.createTextNode(attribute.name + " (" + nestedText + ")(" + notFoundText + ")");
                    span_node.appendChild(text_node);
                }
                node_description.appendChild(span_node);
								node_richlistitem.appendChild(node_description);
                break;
                
            case "person":
            case "Person":
								append = attribute.name + " = " + attribute.value + " (" + personText + ")";
                text_node = document.createTextNode(append);
                node_description.appendChild(text_node);
								node_richlistitem.appendChild(node_description);
                break;
                
            default:
                append = "(T:" + attribute.type + ", N:" + attribute.name + ", V:" + attribute.value + ")";
                text_node = document.createTextNode(append);
                node_description.appendChild(text_node);
								node_richlistitem.appendChild(node_description);
                break;
        }
        
        $(rich_list_box).append(node_richlistitem);
				if (i == 0)
					$(rich_list_box).css("min-height","50px");
    }
};

/**
 * Vyvola okno pro ulozeni souboru z anotace
 * @param {String} id, id anotace obsahujici atribut se jmenem attrName
 * @param {String} attrName, jmeno atributu typu binary
 */
function saveFile(id, attrName)
{
	try{
	var annotation = annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(id);
	var attr = annotation.getAttributeByName(attrName);
	if (attr != null)
	{
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.appendFilter("All","*.*");

   	fp.init(window, "Save a File", nsIFilePicker.modeSave);
		var res = fp.show();
		
		if (res != nsIFilePicker.returnCancel)
		{
			Components.utils.import("resource://gre/modules/FileUtils.jsm");
		
			var stream = FileUtils.openSafeFileOutputStream(fp.file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE);
				
			var binaryStream = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance(Components.interfaces.nsIBinaryOutputStream);
			binaryStream.setOutputStream(stream);

			var data = decodeURIComponent(escape(window.atob(attr.value.replace(/\s/g, ''))));
			//window.atob(attr.value);

			binaryStream.writeBytes(data, data.length);
				
			FileUtils.closeSafeFileOutputStream(stream);
		}
	}
	}catch(ex)
	{
		alert(ex.message);
	}
}

/**
 * Otevre anotaci v sidebaru (pokud se tam naleza)
 * @param {String} annotID, id anotace, kterou chceme otevrit v sidebaru
 */
function openAnnotInSidebar(annotID)
{
    //Otevri sidebar
    toggleSidebar('viewAnnotationsSidebar', true);
    //pokus se otevrit anotaci v sidebaru
    try
    {//TODO: pokud neni sidebar otevreny, anotace se neotevre - nestihne se nahrat dom nebo skript? opravit
        var sidebarWin = document.getElementById("sidebar").contentWindow;
        sidebarWin.toggleRTASidebarPanelContent(annotID);
    }
    catch(ex)
    {}
}

function hidePanelEditButton(id)
{
		var panel = document.getElementById(id);
		var editButton = panel.getElementById('aeEditAnnotationButton');
		editButton.hidden = true;
}

function createRTAPanel(id, anchor, nestedAnnotationPanel)
{
	  let stringBundle = document.getElementById("annotationextension-string-bundle");
	
    var panel_node = document.createElement('panel');
        panel_node.setAttribute('id', id);
        panel_node.setAttribute('noautohide', 'true');
        panel_node.setAttribute('persist', 'false');
        //panel_node.setAttribute('type', 'arrow');
        panel_node.setAttribute('backdrag', 'true');
        panel_node.setAttribute('onpopuphiding', "closeNested(annotationExtensionChrome.annotationsView.ANNOTATIONS, annotationExtensionChrome.annotationsView.frame_doc,'" + id +"');");
				panel_node.setAttribute('onmouseover', 'panelOnMouseOver("'+id+'",annotationExtensionChrome.annotationsView.frame_doc)');
				panel_node.setAttribute('onmouseout', 'annotHighlightClear("'+id+'",annotationExtensionChrome.annotationsView.frame_doc)');

        var vbox_node = document.createElement('vbox');
            vbox_node.setAttribute('id', 'ap-vbox');
            var hbox_node = document.createElement('hbox');
                var label_node_author = document.createElement('label');
                    label_node_author.setAttribute('id', 'ap-author');
                    label_node_author.setAttribute('value', 'creator');
                hbox_node.appendChild(label_node_author);
                var label_node_date = document.createElement('label');
                    label_node_date.setAttribute('id', 'ap-date');
                    label_node_date.setAttribute('value', 'date');
                hbox_node.appendChild(label_node_date);

            var hbox_node_close = document.createElement('hbox');
								hbox_node_close.setAttribute('align', 'end');
								hbox_node_close.setAttribute('pack', 'end');
                var node_image = document.createElement('image');
                    node_image.setAttribute('id','aeCloseAnnotationButton');
                    node_image.setAttribute('onclick',"closePanel(document.getElementById('" + id + "'),'true');");
										node_image.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.closeAnnotationButton.tooltip"));
								var deleteButton = document.createElement('image');
                    deleteButton.setAttribute('id','aeDeleteAnnotationButton');
                    deleteButton.setAttribute('onclick',"panelRemoveAnnotation('" + id + "');");
										deleteButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.deleteAnnotationButton.tooltip"));
								var editButton = document.createElement('image');
                    editButton.setAttribute('id','aeEditAnnotationButton');
                    editButton.setAttribute('onclick',"panelChangeAnnotation('" + id + "');");
										editButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.editAnnotationButton.tooltip"));
								var buttonSpacer = document.createElement('spacer');
										buttonSpacer.setAttribute('flex', '1');
                hbox_node_close.appendChild(editButton);
								hbox_node_close.appendChild(deleteButton);
								if (nestedAnnotationPanel == true)
                {
										deleteButton.hidden = true;
                    editButton.hidden = true;
                }
								hbox_node_close.appendChild(buttonSpacer);
                hbox_node_close.appendChild(node_image);
            vbox_node.appendChild(hbox_node_close);
            vbox_node.appendChild(hbox_node);

            var label_node_type = document.createElement('label');
                label_node_type.setAttribute('id', 'ap-type');
                label_node_type.setAttribute('value', 'type');
                label_node_type.setAttribute('style', 'max-width: 30em;');
                label_node_type.setAttribute('crop', 'start');
            vbox_node.appendChild(label_node_type);

            var textbox_node = document.createElement('textbox');
                textbox_node.setAttribute('id', 'ap-text');
                textbox_node.setAttribute('readonly', 'true');
                textbox_node.setAttribute('value', 'text of annotation');
                textbox_node.setAttribute('width', '230');
                textbox_node.setAttribute('multiline', 'true');
                textbox_node.setAttribute('style', '-moz-border-radius: 10px;');
            vbox_node.appendChild(textbox_node);

            var richlistbox_node = document.createElement('richlistbox');
                richlistbox_node.setAttribute('id', 'ap-attributes');
                richlistbox_node.setAttribute('rows', 3);
								richlistbox_node.setAttribute("disabled", "true");
            vbox_node.appendChild(richlistbox_node);
    panel_node.appendChild(vbox_node);
		
		appendRTAPanel(anchor, panel_node);
    return panel_node;
}

function panelRemoveAnnotation(id)
{
		var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
		annotDB.removeAnnotation(id);
}

function panelChangeAnnotation(id)
{
	var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
	annotDB.changeAnnotation(id);
}

/**
 * Pripoji panel do dokumentu
 * @param {Panel} panel panel, ktery se ma pripojit
 * @param {Node} anchor uzel v dokumentu, ke kteremu se pripoji panel
 */
function appendRTAPanel(anchor, panel)
{
    anchor.appendChild(panel);
}

/**
 * Smaze panel z dokumentu
 * @param {String} id id panelu, ktery se ma odstranit
 */
function deleteRTAPanel(id)
{
		var panel_node = document.getElementById(id);
		if (panel_node != null)
		  panel_node.parentNode.removeChild(panel_node);
}

function clearAttributes(rich_list_box)
{
    $(rich_list_box).empty();
}

function dateConversion(date)
{
    var ret = "";
    ret += date.substr(0, 10);
    ret += " ";
    ret += date.substr(11, 5);
    return ret;
}

function typeConversion(type_str)
{
    var ret = type_str;
    var pos = type_str.indexOf('/types/g');
		
    if(pos > -1)
		{
        var rest = type_str.substr(pos + 8);
        pos = rest.indexOf('/');
        ret = rest.substr(pos + 1)
    }
		
    while((pos = ret.indexOf('/')) > 0)
		{
        ret = ret.substr(0,pos) + " -> " + ret.substr(pos + 1);
    }
		
    return ret;
}

function closeNested(annotDB,frame_doc,id)
{
    $.each(annotDB.annotations, function(ind, annotation)
		{
        if(annotation.nested_id == id)
				{
            var spanNodes = frame_doc.getElementsByName(annotation.id);

						setFragmentsBackground(annotation.id, "" ,frame_doc,annotation.tmpId);
						
						for (var count = 0; count < spanNodes.length; count++)
						{//Zruseni zvyrazneni vnorene anotace na strance
								spanNodes[count].setAttribute('active','false');
						}
            
            document.getElementById(annotation.id).hidePopup();
        }
    });
}


//Panel-related event listeners
/**
 * Pokud prijde udalost o najeti mysi nad anotovany text - zobraz panel s anotaci
 */
function ShowAPanelEventListener(evt)
{
    var active = $(evt.target).attr('active');
		
    if(active == 'true')
		{
				var panelID = evt.target.getAttribute("name");
				var panel = document.getElementById(panelID);
        openPanel(panel, evt.target, panelID, 'false');
		}
}

/**
 * Pokud prijde udalost o najeti mysi nad anotovany text - zobraz panel s anotaci
 */
function ShowAPanelWithoutNestedEventListener(evt)
{    
    var active = $(evt.target).attr('active');
		
    if(active == 'true')
		{
				var panelID = evt.target.getAttribute("name");
				var panel = document.getElementById(panelID);
        openPanel(panel, evt.target, panelID, 'false', false);
		}
}

/**
 * Pokud prijde udalost o skryti panelu s anotaci.
 */
function HideAPanelEventListener(evt) 
{
    var panelID = evt.target.getAttribute("name");
    var panel = document.getElementById(panelID);
    closePanel(panel,'false');
}

/**
 * Pokud prijde udalost o kliknuti mysi nad anotovany text - zobraz panel s anotaci,
 * ktery se nezavre pri odjeti mysi z anotovaneho textu
 */
function OpenAPanelEventListener(evt)
{
    var active = $(evt.target).attr('active');
		
    if(active == 'true')
		{
				var panelID = evt.target.getAttribute("name");
				var panel = document.getElementById(panelID);
        openPanel(panel, evt.target, panelID, 'true');
		}
}

/**
 * Handler pro najeti mysi nad panel
 */
function panelOnMouseOver(id, doc)
{
  try
  {
    var panel = document.getElementById(id);
    if (panel.state != 'hiding' && panel.state != 'closed')
    {
      //Pokud je fragment schovany pod jinym...(barva pro vsechny spany je stejna)
      var fragmentNodes = doc.getElementsByName(id);
      
      if (fragmentNodes.length > 0)
      {
          var fragmentNode = fragmentNodes[0];
          var fragmentsColor = getFragmentColorByID(fragmentNode, id);
          if (fragmentsColor != "")
					//TODO: tady by nemelo byt null, ale tmpId anotace (ktere muze byt null)
              setFragmentsBackground(id, fragmentsColor, doc, null);
      
          //Zvyrazneni fragmentu, ke kterym panel patri
          annotHighlight(id, doc);
      }
      
      //Zvyrazneni fragmentu vnorenych anotaci
      var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
      var annotation = annotDB.getAnnotation(id);
      for(var i = 0;i < annotation.attributes.length;i++)
      {
          var attribute = annotation.attributes[i];
          
          if (attribute.type == 'nestedAnnotation')
          {
              var link_id = attribute.value;
              var nestedSpans = doc.getElementsByName(link_id);
                  
              if(nestedSpans.length > 0)
              {//Pokud vnorena anotace existuje(alespon jeden span)
                  var nestedAnnotation = annotDB.getAnnotation(link_id);
                  var annotationSpans = doc.getElementsByName(link_id);
                  var typeName = annotationExtension.functions.linearTypeURI(nestedAnnotation.type);
                          
                  if(!annotation.nested_id)
                  {
                      //Pokud NEMA anotace, ke ktere patri tento atribut definovane nested_id, jde o anotaci prvni urovne
                      //nastav barvu pozadi prislusnym spanum v dokumentu
                      var color = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 1);
                      setFragmentsBackground(link_id, color, doc, nestedAnnotation.tmpId);
                  }
                  else
                  {
                      //Pokud MA anotace, ke ktere patri tento atribut definovane nested_id, jde o anotaci druhe, ci vyssi urovne
                      var color = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 2);
                      setFragmentsBackground(link_id, color, doc, nestedAnnotation.tmpId);
                  }
              }	
          }
      }
    }
  }
  catch(ex)
  {}
}