/**
 * Soubor: panelsDocumentAnnotations.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro vytvoreni a manipulaci panelu anotace v bocnim panelu ->
 *        anotace dokumentu.
 * Posledni uprava: 5.6.2012
 */

/**
 * Soubor s funkcemi pro zobrazeni anotaci v bocnim panelu
 * Tyto funkce jsou volany v chrome kodu v bocnim panelu, zatimco
 * ostatni funkce jsou volany v chrome kodu "hlavniho okna" FF!
 * Ulozene anotace apod. tedy nejsou primo pristupne.
 *
 * Dale soubor take obsahuje funkce, ktere jsou volany v "hlavnim okne" FF
 * a manipuluji s obsahem bocniho panelu.
 *
 * Komentare nejsou uvedeny, funkce maji "stejny" vyznam jako funkce v souboru panels.
 */

Components.utils.import("resource://annotationextension/namespace.jsm");
Components.utils.import("resource://annotationextension/functions.jsm");

function createRTASidebarPanel(id, nestedAnnotationPanel)
{
    let stringBundle = document.getElementById("annotationextension-string-bundle");
    
    var sidebarPanel = document.createElement('vbox');
    sidebarPanel.setAttribute('id', id);
    sidebarPanel.setAttribute('class', 'annotExtSidebarPanel');
    ////////////////////////////////////////////////////////////////////////////
    /////////////////         "TITTLEBAR"                     //////////////////
    ////////////////////////////////////////////////////////////////////////////
        var vbox_node1 = document.createElement('vbox');
        vbox_node1.setAttribute('id', 'ap-vbox');
        vbox_node1.setAttribute('ondblclick', 'toggleRTASidebarPanelContent("' + id + '");');
        
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
                    node_image.setAttribute('id','aeToggleAnnotationButton');
                    node_image.setAttribute('class','toggleAnnotationButtonDown');
                    node_image.setAttribute('onclick',"toggleRTASidebarPanelContent('" + id + "');");
                    node_image.setAttribute('tooltiptext', stringBundle.getString("annotationextension.sidebar.panel.closeAnnotationButton.tooltip"));
								var deleteButton = document.createElement('image');
                    deleteButton.setAttribute('id','aeDeleteAnnotationButton');
                    deleteButton.setAttribute('onclick',"annotationExtensionChrome.sideBar.mainWindow.panelRemoveAnnotation('" + id + "');");
                    deleteButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.deleteAnnotationButton.tooltip"));
								var editButton = document.createElement('image');
                    editButton.setAttribute('id','aeEditAnnotationButton');
                    editButton.setAttribute('onclick',"annotationExtensionChrome.sideBar.mainWindow.panelChangeAnnotation('" + id + "');");
                    editButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.editAnnotationButton.tooltip"));
								var buttonSpacer = document.createElement('spacer');
										buttonSpacer.setAttribute('flex', '1');
            
            hbox_node_close.appendChild(editButton);
            hbox_node_close.appendChild(deleteButton);
            if (nestedAnnotationPanel == true)
            {alert('gfasgasg');
								deleteButton.hidden = true;
                editButton.hidden = true;
            }
            hbox_node_close.appendChild(buttonSpacer);
            hbox_node_close.appendChild(node_image);
        
        vbox_node1.appendChild(hbox_node_close);
        vbox_node1.appendChild(hbox_node);

            var label_node_type = document.createElement('label');
                label_node_type.setAttribute('id', 'ap-type');
                label_node_type.setAttribute('value', 'type');
                label_node_type.setAttribute('crop', 'start');
                
        vbox_node1.appendChild(label_node_type);
            
    ////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////
        var vbox_node2 = document.createElement('vbox');
        vbox_node2.setAttribute('id', 'ap-vbox2');
        vbox_node2.setAttribute('hidden', 'true');
        
            
            var textbox_node = document.createElement('textbox');
                textbox_node.setAttribute('id', 'ap-text');
                textbox_node.setAttribute('readonly', 'true');
                textbox_node.setAttribute('value', 'text of annotation');
                textbox_node.setAttribute('width', '230');
                textbox_node.setAttribute('multiline', 'true');
                textbox_node.setAttribute('style', '-moz-border-radius: 10px;');
        
        vbox_node2.appendChild(textbox_node);
            
                
            var richlistbox_node = document.createElement('richlistbox');
                richlistbox_node.setAttribute('id', 'ap-attributes');
                richlistbox_node.setAttribute('style', 'max-height: 50em');
       
        vbox_node2.appendChild(richlistbox_node);
        
    sidebarPanel.appendChild(vbox_node1);
    sidebarPanel.appendChild(vbox_node2);
		
    var sidebarDocument = document.getElementById("sidebar").contentDocument;
    if (isAnnotationSidebarActive(sidebarDocument))
    {
      var sideBarAnnotBox = sidebarDocument.getElementById("aeDocumentAnnotationsBox");
      appendRTAPanel(sideBarAnnotBox, sidebarPanel);
    }
    
    return sidebarPanel;
};

function actualizeRTASidebarPanel(panel,id)
{				
    var objAnot = annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(id);
    
		var type = typeConversion(objAnot.type);
    $(panel).find('#ap-type').attr('value',type);
    $(panel).find('#ap-type').attr('tooltiptext',type);
		
    $(panel).find('#ap-author').attr('value',objAnot.author.name);
    
		var date = dateConversion(objAnot.dateTime);
    $(panel).find('#ap-date').attr('value',date);
};

function actualizeRTASidebarPanelAnnotContentAndAttributes(panel,id,showNestedP)
{
    if (showNestedP == undefined || showNestedP == null)
				var showNested = true;
		else
				var showNested = showNestedP;
    
    var objAnot = annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS.getAnnotation(id);
    
    $(panel).find('#ap-text').attr('value',objAnot.content);
    
		var rich_list_box = $(panel).find('#ap-attributes').get();
    annotationExtensionChrome.sideBar.mainWindow.clearAttributes(rich_list_box);
    appendAttributesRTASidebarPanel(id, annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.frame_doc, panel, showNested);
};

function appendAttributesRTASidebarPanel(id,frame_doc, panel, showNestedP)
{
		if (showNestedP == undefined || showNestedP == null)
				var showNested = true;
		else
				var showNested = showNestedP;
		
    var annotDB = annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS;
    var rich_list_box = $(panel).find('#ap-attributes').get();
    var annotation = annotDB.getAnnotation(id);
		
		let stringBundle = annotationExtensionChrome.sideBar.mainWindow.document.getElementById("annotationextension-string-bundle");
		
		var notFoundText = stringBundle.getString("annotationextension.annotation.notFound");
		var nestedText = stringBundle.getString("annotationextension.annotation.nested");
		var personText = stringBundle.getString("annotationextension.annotation.person");
		
    for(var i = 0;i < annotation.attributes.length;i++)
		{
        var node_richlistitem = document.createElement("richlistitem");
        var node_description = document.createElement('description');

        var attribute = annotation.attributes[i];
        //alert(attribute.string());
        var text_node = undefined;
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
								node_richlistitem.setAttribute('onclick', "annotationExtensionChrome.sideBar.mainWindow.gBrowser.addTab('"+uri+"');");
                node_richlistitem.appendChild(text_node);
								node_richlistitem.appendChild(node_image);
								break;
            
            case "Binary":
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:a");
   							span_node.setAttribute('onclick', 'annotationExtensionChrome.sideBar.mainWindow.saveFile("'+id+'", "'+attribute.name+'")');
                
                text_node = document.createTextNode(attribute.name + " = (" + "File" + ")");
                span_node.appendChild(text_node);
								
								node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                node_image.setAttribute('src','chrome://annotationextension/skin/boomy/bubble.png');
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
                    //Pokud se zalozka ma udelat aktivni: annotationExtensionChrome.sideBar.mainWindow.gBrowser.selectedTab = annotationExtensionChrome.sideBar.mainWindow.gBrowser.addTab('"+uri+"'); 
										span_node.setAttribute('onclick', "annotationExtensionChrome.sideBar.mainWindow.gBrowser.addTab('"+uri+"');");
                    
								append = attribute.name + " = " + attribute.value;
                text_node = document.createTextNode(append);

                node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/boomy/hyperlink.gif');
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
										span_node.setAttribute('onclick', "annotationExtensionChrome.sideBar.mainWindow.gBrowser.addTab('"+url+"');");
                    
								text_node = document.createTextNode(attribute.name + " = (Geo: " +  attribute.value.glat + ' , ' + attribute.value.glong + ")");

                node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/boomy/hyperlink.gif');
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
                if(frame_doc.getElementsByName(link_id).length > 0 || document.getElementById(link_id) != null)
								{//Pokud existuje alespon jeden span anotace odkazovane aLinkem
                    
                    var linkAnnotation = annotDB.getAnnotation(link_id);
                    if (linkAnnotation.fragments.length > 0)
                        span_node.setAttribute('onclick', "annotationExtensionChrome.sideBar.mainWindow.openPanel(annotationExtensionChrome.sideBar.mainWindow.document.getElementById('" + link_id + "')," + 
                            "annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + link_id + "')[0]," + "'" + link_id + "', 'true');");
										else
                        span_node.setAttribute('onclick', "toggleRTASidebarPanelContent('" + link_id + "');");
                    
                    text_node = document.createTextNode(attribute.name + " (aLink)");
                    span_node.appendChild(text_node);
										
                    node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/boomy/bubble.png');
                    node_image.setAttribute('width','12');
                    node_image.setAttribute('height','12');
                    span_node.appendChild(node_image);
                }
								else
								{
                    text_node = document.createTextNode(attribute.name + " (aLink)(" + notFoundText + ")");
                    span_node.appendChild(text_node);
                }
                node_description.appendChild(span_node);
                node_richlistitem.appendChild(node_description);
                break;
                
            case "nestedAnnotation":
                span_node = document.createElementNS("http://www.w3.org/1999/xhtml","html:span");
                link_id = attribute.value;
                
                if(frame_doc.getElementsByName(link_id).length > 0 || document.getElementById(link_id) != null)
								{//Pokud vnorena anotace existuje(alespon jeden span) nebo je na urovni dokumentu
                    var nestedAnnotation = annotDB.getAnnotation(link_id);
										var annotationSpans = frame_doc.getElementsByName(link_id);
                    var typeName = annotationExtension.functions.linearTypeURI(nestedAnnotation.type);
										
                    if (nestedAnnotation.fragments.length > 0)
                    {
                        if (showNested == true)
                        {
                            if(!annotation.nested_id)
                            {
                                //Pokud NEMA anotace, ke ktere PATRI tento atribut definovane nested_id, jde o anotaci prvni urovne
                                //nastav barvu pozadi prislusnym spanum v dokumentu
                                var color = annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 1);
                                annotationExtensionChrome.sideBar.mainWindow.setFragmentsBackground(link_id, color, frame_doc, nestedAnnotation.tmpId);
                            }
                            else
                            {
                                //Pokud MA anotace, ke ktere patri tento atribut definovane nested_id, jde o anotaci druhe, ci vyssi urovne
                                var color = annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, 2);
                                annotationExtensionChrome.sideBar.mainWindow.setFragmentsBackground(link_id, color, frame_doc, nestedAnnotation.tmpId);
                            }
                            
                            for (var aSCount= 0; aSCount < annotationSpans.length; aSCount++)
                            {
                                annotationSpans[aSCount].setAttribute('active','true');
                            }
                        }
										
                        span_node.setAttribute('onclick', "annotationExtensionChrome.sideBar.mainWindow.openPanel(annotationExtensionChrome.sideBar.mainWindow.document.getElementById('" + link_id + "')," + 
                            "annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + link_id + "')[0]," + "'" + link_id + "', 'true');");
                    }
                    else
                    {
                        span_node.setAttribute('onclick', "toggleRTASidebarPanelContent('" + link_id + "');");
                    }
                    
                    text_node = document.createTextNode(attribute.name + " (" + nestedText + ")");
                    span_node.appendChild(text_node);
                    node_image = document.createElementNS("http://www.w3.org/1999/xhtml","html:img");
                    node_image.setAttribute('src','chrome://annotationextension/skin/boomy/bubble.png');
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

function toggleRTASidebarPanelContent(panelID)
{
    var panel = document.getElementById(panelID);
    if (panel == null)
        return;
    else
    {
        var $content = $(panel).find('#ap-vbox2');
        var $toggleButton = $(panel).find('#aeToggleAnnotationButton');
        
        if ($content.attr('hidden') == 'true')
        {
            actualizeRTASidebarPanelAnnotContentAndAttributes(panel, panelID);
            $content.attr('hidden', false);
            $toggleButton.attr('class', 'toggleAnnotationButtonUp');
        }
        else
        {
            $content.attr('hidden', true);
            $toggleButton.attr('class', 'toggleAnnotationButtonDown');
            annotationExtensionChrome.sideBar.mainWindow.closeNested(annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.ANNOTATIONS,
                                                                     annotationExtensionChrome.sideBar.mainWindow.annotationExtensionChrome.annotationsView.frame_doc,
                                                                     panelID);
        }
    }
};

function changeRTASidebarPanelColor(panelID, color)
{
    var panel = document.getElementById(panelID);
    if (panel != null)
    {
        panel.setAttribute('style','background-color:' + color);
    }
};