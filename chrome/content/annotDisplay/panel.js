/**
 * Soubor: panel.js
 * Autor: Jiri Trhlik
 * Datum: 5.6.2012
 * Popis: Funkce pro vytvoreni a manipulaci panelu anotace.
 * Posledni uprava: 5.6.2012
 */

Components.utils.import("resource://annotationextension/functions.jsm");
Components.utils.import("resource://annotationextension/constants.jsm");

function createAnnotationSidebarPanel(annotation, anchor)
{
  var annotId = annotation.id;
	
	var sidebarPanel = document.createElement('vbox');
			sidebarPanel.setAttribute('id', annotId);
			sidebarPanel.setAttribute('class', 'aeAnnotationSidebarPanel');
      sidebarPanel.setAttribute('onmouseover', 'showNestedAnnotationsFragments("'+annotId+'", annotationExtensionChrome.annotationsView.frame_doc);');
			sidebarPanel.setAttribute('onmouseout', 'panelOnMouseOut(this, annotationExtensionChrome.annotationsView.frame_doc);');

	var controlBox = createAnnotationControlBox(annotation);
  var closeButton = $(controlBox).children('.aeCloseAnnotationButton').get(0);
  closeButton.setAttribute('hidden', 'true');
	
	sidebarPanel.appendChild(controlBox);
			
	sidebarPanel.appendChild(createAnnotationView(annotation, 0));
	
	anchor.appendChild(sidebarPanel);
	
	return sidebarPanel;
}

/*function toggleAnnotationSidebarPanel(panel)
{
	var toggleButton = $(panel).children('.aeAnnotationPanelControlBox').children('.aeToggleButton').get(0);
	panelToggleAttributes(toggleButton);
}*/

/**
 * Vytvori panel, ktery bude obsahovat danou anotaci
 * Panel se zaroven pripoji do DOMu k prvku anchor
 * @param {Annotation object} annotation, korenova anotace, ktera bude v panelu
 * @param {Node} anchor, uzel v DOMu, ke kteremu se panel defaultne pripoji
 * @returns {Node} vytvoreny panel
 */
function createAnnotationPanel(annotation, anchor)
{
	var annotID = annotation.id;
	
	var panel = document.createElement('panel');
			panel.setAttribute('id', annotID);
			panel.setAttribute('class', 'aeAnnotationPanel');
			panel.setAttribute('noautohide', 'true');
			panel.setAttribute('persist', 'false');
			//panel.setAttribute('type', 'arrow');
			panel.setAttribute('backdrag', 'true');
			panel.setAttribute('onpopuphiding', "closeNested(annotationExtensionChrome.annotationsView.ANNOTATIONS, annotationExtensionChrome.annotationsView.frame_doc,'" + annotID +"');");
			panel.setAttribute('onmouseover', 'panelOnMouseOver(this, annotationExtensionChrome.annotationsView.frame_doc);');
			panel.setAttribute('onmouseout', 'panelOnMouseOut(this ,annotationExtensionChrome.annotationsView.frame_doc);');

	var controlBox = createAnnotationControlBox(annotation);
	
	panel.appendChild(controlBox);
			
	panel.appendChild(createAnnotationView(annotation, 0));
	
	anchor.appendChild(panel);
	
	return panel;
}

/**
 * Vytvori pro danou anotaci kontrolni prvky (edit, close, delete tlacitka)
 * @param {Annotation object} annotation, anotace, ktera ma byt ovladana
 * @returns {Node} control box
 */
function createAnnotationControlBox(annotation)
{
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	
	var annotID = annotation.id;
	if (annotation.nested_id)
		var isNestedAnnot = true;
	else
		var isNestedAnnot = false;
	
	var controlBox = document.createElement('hbox');
			controlBox.setAttribute('class', 'aeAnnotationPanelControlBox');
			controlBox.setAttribute('align', 'center');
			controlBox.setAttribute('pack', 'end');
			var closeButton = document.createElement('image');
					closeButton.setAttribute('class','aeCloseAnnotationButton');
					closeButton.setAttribute('onclick',"closePanel(document.getElementById('" + annotID + "'),'true');");
					closeButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.closeAnnotationButton.tooltip"));
			var deleteButton = document.createElement('image');
					deleteButton.setAttribute('class','aeDeleteAnnotationButton');
					deleteButton.setAttribute('onclick',"panelRemoveAnnotation('" + annotID + "');");
					deleteButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.deleteAnnotationButton.tooltip"));
			var editButton = document.createElement('image');
					editButton.setAttribute('class','aeEditAnnotationButton');
					editButton.setAttribute('onclick',"panelChangeAnnotation('" + annotID + "');");
					editButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.editAnnotationButton.tooltip"));
			var buttonSpacer = document.createElement('spacer');
					buttonSpacer.setAttribute('flex', '1');
		  var collapseButtons = createCollapseButtons('aeToggleAnnotationButtonUp', 'aeToggleAnnotationButton2Up')
			controlBox.appendChild(editButton);
			controlBox.appendChild(deleteButton);
			if (isNestedAnnot == true)
			{
					deleteButton.hidden = true;
					editButton.hidden = true;
			}
			controlBox.appendChild(buttonSpacer);
			controlBox.appendChild(collapseButtons[0]);
			controlBox.appendChild(collapseButtons[1]);
			controlBox.appendChild(closeButton);
			
	return controlBox;
}

/**
 * Vytvori tlacitka na zobrazeni/skryti atributu anotaci
 * @param {String} collapseButtonClass a collapseNestedButtonClass, trida(y), ktera se nastavi tlacitkum
 * @returns {Array of Nodes} dvouprvkove pole, array[0] tlacitko pro z/s atributu anotace
 *                                             array[1] tlacitko pro z/s atributu vsech vnorenych anotaci
 */
function createCollapseButtons(collapseButtonClass, collapseNestedButtonClass)
{
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	
	var collapseButton = document.createElement('box');
			collapseButton.setAttribute('class', 'aeSmallImageButton aeToggleButton ' + collapseButtonClass);
			collapseButton.setAttribute('onclick',"panelToggleAttributes(this);");
			collapseButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.toggleAttributesButton.tooltip"));
			var collapseButtonImage = document.createElement('image');
			collapseButton.appendChild(collapseButtonImage);
	var collapseNestedButton = document.createElement('box');
			collapseNestedButton.setAttribute('class', 'aeSmallImageButton aeToggleButton2 ' + collapseNestedButtonClass);
			collapseNestedButton.setAttribute('onclick',"panelToggleNestedAnnotAttributes(this);");
			collapseNestedButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.toggleNestedAnnotAttributesButton.tooltip"));
			var collapseNestedButtonImage = document.createElement('image');
			collapseNestedButton.appendChild(collapseNestedButtonImage);
			
			if ($(collapseButton).hasClass('aeToggleAnnotationButtonDown'))
				collapseNestedButton.setAttribute('disabled', 'true');
			
	return [collapseButton, collapseNestedButton];
}

/**
 * Vytvori UI pro anotaci.
 * @param {Annotation object} annotation, anotace, pro kterou se ma vytvorit UI
 * @param {Int} viewLevel, urcuje jak hluboko je vytvareny annotationView zanoren v dalsich annotationView
 * @returns {Element}
 */
function createAnnotationView(annotation, viewLevel)
{
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	
	var annotationView = document.createElement('vbox');
			if (viewLevel > 0)
				annotationView.setAttribute('class', 'aeAnnotationView aeAnnotationViewNested');
			else
				annotationView.setAttribute('class', 'aeAnnotationView');
				
			annotationView.setAttribute('flex', '1');
			
			if (viewLevel == 0)
			{
				var authorBox = document.createElement('hbox');
						authorBox.setAttribute('align', 'center');
						if (annotationExtension.PREFERENCE.getBoolPref("annotationPanel.showAuthor"))
						{
							var authorLabel = document.createElement('label');
									authorLabel.setAttribute('class', 'aeAnnotationAuthor');
							var authorSpacer = document.createElement('spacer');
								authorSpacer.setAttribute('flex', '1');
							authorBox.appendChild(authorLabel);
							authorBox.appendChild(authorSpacer);
						}
						if (annotationExtension.PREFERENCE.getBoolPref("annotationPanel.showDate"))
						{
							var dateLabel = document.createElement('label');
									dateLabel.setAttribute('class', 'aeAnnotationDate');
							authorBox.appendChild(dateLabel);
						}
				annotationView.appendChild(authorBox);

				if (annotationExtension.PREFERENCE.getBoolPref("annotationPanel.showType"))
				{
					var typeBox = document.createElement('hbox');
							typeBox.setAttribute('align', 'center');
							var typeLabel = document.createElement('label');
									typeLabel.setAttribute('class', 'aeAnnotationType');
									typeLabel.setAttribute('crop', 'start');
							var typeSpacer = document.createElement('spacer');
									typeSpacer.setAttribute('flex', '1');
							var colorButton = document.createElement('image');
									colorButton.setAttribute('class','aeChangeAnnotationColorButton');
									colorButton.setAttribute('onclick',"panelChangeAnnotationColor('" + annotation.type + "');");
									colorButton.setAttribute('tooltiptext', stringBundle.getString("annotationextension.panel.changeAnnotationColorButton.tooltip"));
							typeBox.appendChild(typeLabel);
							typeBox.appendChild(typeSpacer);
							typeBox.appendChild(colorButton);
					annotationView.appendChild(typeBox);
				}
			}
	
			var contentTextbox = document.createElement('description');
					contentTextbox.setAttribute('class', 'aeAnnotationContent');
			annotationView.appendChild(contentTextbox);
	
			var attributesBox = document.createElement('richlistbox');
					attributesBox.setAttribute('class', 'aeAnnotationAttributes');
			annotationView.appendChild(attributesBox);
			
	actualizeAnnotationView(annotationView, annotation, viewLevel);
			
	return annotationView;
}

function actualizeAnnotationView(annotationView, annotation, viewLevel)
{
	var attributesBox = $(annotationView).find('.aeAnnotationAttributes').get();
	clearAttributes(attributesBox);
	
	var type = annotationExtension.functions.linearTypeURI(annotation.type);
	var typeName = annotationExtension.functions.getTypeName(annotation.type);
	var typeNode = $(annotationView).find('.aeAnnotationType');
	typeNode.attr('value', typeName);
	typeNode.attr('tooltiptext', type);
	
	$(annotationView).find('.aeAnnotationAuthor').attr('value', annotation.author.name);
	
	var date = dateConversion(annotation.dateTime);
	$(annotationView).find('.aeAnnotationDate').attr('value', date);
	
	if (!annotation.content.match(/^\s*$/g)) 
		$(annotationView).find('.aeAnnotationContent').get(0).textContent = annotation.content;
	
	appendAttributes(annotation, attributesBox, viewLevel);
}

function appendAttributes(annotation, attributesBox, aViewLevel)
{
	var viewLevel = aViewLevel + 1;
	var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
	var annotId = annotation.id;
	
	let stringBundle = document.getElementById("annotationextension-string-bundle");
	
	var notFoundText = stringBundle.getString("annotationextension.annotation.notFound");
	var nestedText = stringBundle.getString("annotationextension.annotation.nested");
	var aLinkText = stringBundle.getString("annotationextension.attributes.annotLink");
	var personText = stringBundle.getString("annotationextension.annotation.person");
	var fileText = stringBundle.getString("annotationextension.annotation.file");
	
	for(var i = 0; i < annotation.attributes.length; i++)
	{
		var richlistitem = document.createElement("richlistitem");
		var node_description = document.createElement('description');
		var attribute = annotation.attributes[i];
		
		var attrType = attribute.type.toLowerCase();
		switch(attrType)
		{
			case "duration":
			case "text":
			case "string":
			case "datetime":
			case "integer":
			case "decimal":
			case "date":
			case "time":
			case "boolean":
				var attrText = attribute.name + ": " + attribute.value;
				var description = document.createElement('description');
				description.textContent = attrText;
				richlistitem.appendChild(description);
				break;
			
			case "image":
				var imageURI = attribute.value;
				var image = document.createElement("image");
					image.setAttribute('maxwidth', '250px');
					image.setAttribute('src', imageURI);
				var imageBox = document.createElement('hbox');
					imageBox.setAttribute('flex', '1');
					imageBox.setAttribute('pack', 'center');
					imageBox.appendChild(image);
				var text = document.createElement('description');
					text.textContent = attribute.name + ": ";
				var box = document.createElement('vbox');
					box.setAttribute('flex', '1');
					box.appendChild(text);
					box.appendChild(imageBox);
				//Pokud se zalozka ma udelat aktivni: gBrowser.selectedTab = gBrowser.addTab('"+uri+"');
				richlistitem.setAttribute('onclick', "gBrowser.addTab('"+imageURI+"');");
				richlistitem.appendChild(box);
				break;
			
			case "binary":
				var description = document.createElement('description');
					description.textContent = attribute.name + ": (" + fileText + ")";
				var image = document.createElement("image");
					image.setAttribute('class', 'aeAnnotationPanelAttributeImage');
					image.setAttribute('src', 'chrome://annotationextension/skin/icons/binary16.png');
				var box = document.createElement('hbox');
					box.setAttribute('align', 'center');
					box.appendChild(description);
					box.appendChild(image);
				richlistitem.setAttribute('onclick', 'saveFile("'+annotId+'", "'+attribute.name+'")');
				richlistitem.appendChild(box);
				break;
			
			case "uri":
				var uri = attribute.value;
				var description = document.createElement("description");
					description.textContent = attribute.name + ": " + uri;
				var image = document.createElement("image");
					image.setAttribute('class', 'aeAnnotationPanelAttributeImage');
					image.setAttribute('src', 'chrome://annotationextension/skin/icons/hyperlink.gif');
				var box = document.createElement('hbox');
					box.setAttribute('align', 'center');
					box.appendChild(description);
					box.appendChild(image);
				richlistitem.setAttribute('onclick', "gBrowser.addTab('"+uri+"');");
				richlistitem.appendChild(box);
				break;
				
			case "geopoint":
				var url = 'http://maps.google.com/maps?q=' + attribute.value.glat + ',' + attribute.value.glong;
				var description = document.createElement("description");
					description.textContent = attribute.name + ": (Geo: " +  attribute.value.glat + ' , ' + attribute.value.glong + ")";
				var image = document.createElement("image");
				  image.setAttribute('class', 'aeAnnotationPanelAttributeImage');
					image.setAttribute('src', 'chrome://annotationextension/skin/icons/hyperlink.gif');
				var box = document.createElement('hbox');
					box.setAttribute('align', 'center');
					box.appendChild(description);
					box.appendChild(image);
				richlistitem.setAttribute('onclick', "gBrowser.addTab('"+url+"');");
				richlistitem.appendChild(box);
				break;
			
			case "person":
  			var attrText = attribute.name + ": " + attribute.value + " (" + personText + ")";
				var description = document.createElement('description');
				description.textContent = attrText;
				richlistitem.appendChild(description);
				break;
					
			case "annotationlink":
				var description = document.createElement("description");
				
				var box = document.createElement('hbox');
					box.setAttribute('align', 'center');
					box.appendChild(description);
				
				var annotationLinkId = attribute.value;
				var annotationLink = annotDB.getAnnotation(annotationLinkId);
				
				if(annotationLink != null)
				{
					//Pokud existuje alespon jeden span anotace odkazovane aLinkem
					if (annotationLink.fragments.length > 0)
					{
							richlistitem.setAttribute('onclick', "openPanel(document.getElementById('" + annotationLinkId + "')," + 
									"annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + annotationLinkId + "')[0]," + "'" + annotationLinkId + "', 'true');");
							richlistitem.setAttribute('onmouseover', "openPanel(document.getElementById('" + annotationLinkId + "')," + 
								"annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + annotationLinkId + "')[0]," + "'" + annotationLinkId + "', 'false');");
							richlistitem.setAttribute('onmouseout', "closePanel(document.getElementById('" + annotationLinkId + "'), 'false');");
						
					}
					else
					{
							richlistitem.setAttribute('onclick', 'openAnnotInSidebar("' + annotationLinkId + '");');
					}
					
					var annotationLinkText = "";
					for (var fragCount = 0; fragCount < annotationLink.fragments.length; ++fragCount)
						annotationLinkText += annotationLink.fragments[fragCount].text;
					
					description.textContent = attribute.name + ": " + annotationLinkText;
					
					var image = document.createElement("image");
					  image.setAttribute('class', 'aeAnnotationPanelAttributeImage');
						image.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
						image.setAttribute('width', '12');
						image.setAttribute('height', '12');
					
					box.appendChild(image);
				}
				else
				{
					description.textContent = attribute.name + " (" + aLinkText + ")(" + notFoundText + ")";
				}
				
				richlistitem.appendChild(box);
				break;
					
			case "nestedannotation":				
				var box = document.createElement('box');
					box.setAttribute('flex', '1');
				
				var nestedAnnotationId = attribute.value;
				var nestedAnnotation = annotDB.getAnnotation(nestedAnnotationId);
				
				if(nestedAnnotation != null)
				{
					box.setAttribute('orient', 'vertical');
					box.setAttribute('align', 'stretch');
					
					var annotationNestedText = "";
					for (var fragCount = 0; fragCount < nestedAnnotation.fragments.length; ++fragCount)
						annotationNestedText += nestedAnnotation.fragments[fragCount].text;
					
					var image = document.createElement("image");
					  image.setAttribute('class', 'aeAnnotationPanelAttributeImage');
						image.setAttribute('src','chrome://annotationextension/skin/icons/bubble.png');
						image.setAttribute('width', '12');
						image.setAttribute('height', '12');
					
					if (viewLevel <= annotationExtension.PREFERENCE.getIntPref("annotationPanel.viewLevel"))
					{//Nacti vnorenou anotaci primo do tohoto panelu
						var attrNameBox = document.createElement('hbox');
							attrNameBox.setAttribute('align', 'center');
						
						  //Defaultne rozbalena vnorena anotace
						  var collapse = false;
							var collapseButtonClass = 'aeToggleAnnotationButtonUp';
							var collapseNestedButtonClass = 'aeToggleAnnotationButton2Up';
						  if (viewLevel > annotationExtension.PREFERENCE.getIntPref("annotationPanel.showViewLevel"))
							{//Defaultne sbalena vnorena anotace
								collapse = true;
								collapseButtonClass = 'aeToggleAnnotationButtonDown';
								collapseNestedButtonClass = 'aeToggleAnnotationButton2Down';
							}
							
							var collapseButtons = createCollapseButtons(collapseButtonClass, collapseNestedButtonClass);
							
							var descriptionBox = document.createElement('hbox');
								descriptionBox.setAttribute('align', 'center');
								descriptionBox.setAttribute('flex', '1');
								var description = document.createElement("description");
									description.textContent = attribute.name + ": " + annotationNestedText;
								descriptionBox.appendChild(description);
								descriptionBox.appendChild(image);
							
							attrNameBox.appendChild(descriptionBox);
							attrNameBox.appendChild(collapseButtons[0]);
							attrNameBox.appendChild(collapseButtons[1]);
							
						if (nestedAnnotation.fragments.length > 0)                    
							descriptionBox.setAttribute('onclick', "openPanel(document.getElementById('" + nestedAnnotationId + "')," + 
								"annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + nestedAnnotationId + "')[0]," + "'" + nestedAnnotationId + "', 'true');");
						else
							descriptionBox.setAttribute('onclick', 'openAnnotInSidebar("' + nestedAnnotationId + '");');
							
						box.appendChild(attrNameBox);
						var nestedAnnotationView = createAnnotationView(nestedAnnotation, viewLevel);
						if (collapse)
						{
							var attrsBox = $(nestedAnnotationView).children('.aeAnnotationAttributes').get(0);
							attrsBox.setAttribute('hidden', 'true');
						}
						box.appendChild(nestedAnnotationView);
					}
					else
					{//Vytvor pouze odkaz
						box.setAttribute('orient', 'horizontal');
						box.setAttribute('align', 'center');
						
						var description = document.createElement("description");
							description.textContent = attribute.name + ': ' + annotationNestedText;
						box.appendChild(description);
						box.appendChild(image);
						
						if (nestedAnnotation.fragments.length > 0)
						{
							richlistitem.setAttribute('onclick', "openPanel(document.getElementById('" + nestedAnnotationId + "')," + 
								"annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + nestedAnnotationId + "')[0]," + "'" + nestedAnnotationId + "', 'true');");
							richlistitem.setAttribute('onmouseover', "openPanel(document.getElementById('" + nestedAnnotationId + "')," + 
								"annotationExtensionChrome.annotationsView.frame_doc.getElementsByName('" + nestedAnnotationId + "')[0]," + "'" + nestedAnnotationId + "', 'false');");
							richlistitem.setAttribute('onmouseout', "closePanel(document.getElementById('" + nestedAnnotationId + "'), 'false');");
						}
						else
						{
							richlistitem.setAttribute('onclick', 'openAnnotInSidebar("' + nestedAnnotationId + '");');
						}
					}
				}
				else
				{
					var description = document.createElement("description");
					description.textContent = attribute.name + " (" + nestedText + ")(" + notFoundText + ")";
					box.appendChild(description);
				}

				richlistitem.appendChild(box);
				break;
					
			default:
				var attrText = attribute.name + " (" + attribute.type +"): " + attribute.value;
				var description = document.createElement('description');
				description.textContent = attrText;
				richlistitem.appendChild(description);
				break;
		}
		
		$(attributesBox).append(richlistitem);
		if (i == 0)
			$(attributesBox).css("min-height","50px");
	}
};

function panelToggleAttributes(button)
{
	if (button.getAttribute("disabled") == "true")
		return;
	
	var buttonBox = button.parentNode;
	var viewParent = buttonBox.parentNode;
	var $annotView = $(viewParent).children('.aeAnnotationView');
	var attributesBox = $annotView.children('.aeAnnotationAttributes').get(0);
	
	if ($(button).hasClass("aeToggleAnnotationButtonDown"))
	{// v ---> ^
		attributesBox.hidden = false;
		$(button).removeClass("aeToggleAnnotationButtonDown").addClass("aeToggleAnnotationButtonUp");
		$(buttonBox).children(".aeToggleButton2").attr("disabled", "false");
	}
	else
	{// ^ ---> v
		attributesBox.hidden = true;
		$(button).removeClass("aeToggleAnnotationButtonUp").addClass("aeToggleAnnotationButtonDown");
		$(buttonBox).children(".aeToggleButton2").attr("disabled", "true");
	}
}

function panelToggleNestedAnnotAttributes(button)
{
	if (button.getAttribute("disabled") == "true")
		return;
	
	var viewParent = button.parentNode.parentNode;
	var $annotView = $(viewParent).children('.aeAnnotationView');
	var $attributesBox = $annotView.children('.aeAnnotationAttributes');
	var $nestedAttributesBoxes = $attributesBox.find('.aeAnnotationAttributes');
	
	if ($(button).hasClass("aeToggleAnnotationButton2Down"))
	{// vv ---> ^^
		$nestedAttributesBoxes.attr('hidden', 'false');
		$(button).removeClass("aeToggleAnnotationButton2Down").addClass("aeToggleAnnotationButton2Up");
		
		$annotView.find('.aeToggleAnnotationButtonDown').removeClass("aeToggleAnnotationButtonDown").addClass("aeToggleAnnotationButtonUp");
		$annotView.find('.aeToggleButton2').removeClass("aeToggleAnnotationButton2Down").addClass("aeToggleAnnotationButton2Up")
		  .attr("disabled", "false");
	}
	else
	{// ^^ ---> vv
		$nestedAttributesBoxes.attr('hidden', 'true');
		$(button).removeClass("aeToggleAnnotationButton2Up").addClass("aeToggleAnnotationButton2Down");
		
		$annotView.find('.aeToggleAnnotationButtonUp').removeClass("aeToggleAnnotationButtonUp").addClass("aeToggleAnnotationButtonDown");
		$annotView.find('.aeToggleButton2').removeClass("aeToggleAnnotationButton2Up").addClass("aeToggleAnnotationButton2Down")
		  .attr("disabled", "true");
	}
}


/**
 * Zobrazi fragmenty vnorenych anotaci
 * @param {String} id, id nadrazene anotace
 * @param {document} frame_doc, document, ve kterem se maji nachazet fragmenty vnorenych anotaci
 */
function showNestedAnnotationsFragments(id, frame_doc)
{
	var annotDB = annotationExtensionChrome.annotationsView.ANNOTATIONS;
	var annotation = annotDB.getAnnotation(id);
	var attrsLen = annotation.attributes.length;
	
	for(var i = 0; i < attrsLen; ++i)
	{
		var attribute = annotation.attributes[i];
		
		if (attribute.type == 'nestedAnnotation')
		{
			var nestedAnnotationId = attribute.value;
			var nestedAnnotation = annotDB.getAnnotation(nestedAnnotationId);
			
			if(nestedAnnotation != null)
			{
				var annotationSpans = frame_doc.getElementsByName(nestedAnnotationId);
				if (annotationSpans.length > 0)
				{//Pokud vnorena anotace existuje(alespon jeden span)
					var typeName = annotationExtension.functions.linearTypeURI(nestedAnnotation.type);
					var level = nestedAnnotation.lvl;
					var color = annotationExtensionChrome.typesColors.getColorForTypeWithLevel(typeName, level);
					
					setFragmentsColor(nestedAnnotationId, color, frame_doc, nestedAnnotation.tmpId);

					for (var aSCount= 0; aSCount < annotationSpans.length; ++aSCount)
					{
							annotationSpans[aSCount].setAttribute('active','true');
					}
				}
			}
		}
	}
}


/**
 * Otevre panel s anotaci.
 * @param {xul:panel} panel 
 * @param {node} anchor prvek, u ktereho se panel zobrazi
 * @param {string} id id anotace ke ktere panel patri
 * @param {String} persist
 * @param {bool} aShowNested, zda se maji s panelem oznacit i vnorene anotace spojene s nim
 */
function openPanel(panel, anchor, id, persist, aShowNested)
{
  if (aShowNested == undefined || aShowNested == null)
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
	
	if (showNested)
	{
		showNestedAnnotationsFragments(id, annotationExtensionChrome.annotationsView.frame_doc);
	}

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
		panel.openPopup(anchor, 'after_start', null, null, true, true, null );
		annotHighlight(id, annotationExtensionChrome.annotationsView.frame_doc);
	}
	else
	{//Zvyrazni anotaci dokumentu v bocnim panelu
		//TODO: pokud se zmeni barva apod. v closeALinkPanel() zrusit
		openAnnotInSidebar(id);
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
	{//Zruseni zvyrazneni anotaci v bocnim panelu 
		//TODO: zalezi na showALinkPanel();
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
		alert('panel.js : makeSuggestionPanelFromPanel: \n' + ex.message);
	}
};

/**
 * Skryje z panelu anotace tlacitko na smazani anotace
 * @param {Node} panel, panel nabizene anotace
 */
function hideDeleteButtonFromPanel(panel)
{
	var mainVbox = $(panel).find('.aeAnnotationView').get();
	var deleteButton = $(mainVbox).find('.aeDeleteAnnotationButton').get();
	$(deleteButton).attr('hidden', 'true');
};

/**
 * Nastavi panelu tridu nabidnute anotace
 * @param {Node} panel, panel nabizene anotace
 */
function setSuggestionClassToPanelContent(panel)
{
	var mainVbox = $(panel).find('.aeAnnotationView').get();
	$(mainVbox).addClass("aeAnnotationView-suggestion");
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
	confirmButtonBox.setAttribute('class', 'ap-confirmbuttonbox');
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
		
		var mainVbox = $(panel).find('.aeAnnotationView').get();
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
	suggestLabelBox.setAttribute('class', 'ap-suggestbox');
	suggestLabelBox.setAttribute('align', 'center');
		
		var suggestLabel = document.createElement('label');
		suggestLabel.setAttribute('value', suggestionTextString);
		suggestLabel.setAttribute('tooltiptext', suggestionTextTooltipString);
		
		var suggestInfoImage = document.createElement('image');
		suggestInfoImage.setAttribute('class', 'aeInfoButton');
		suggestInfoImage.setAttribute('tooltiptext', suggestionTextTooltipString);
		
		var spacer = document.createElement('spacer');
		spacer.setAttribute('flex', '1');
		
		$(suggestLabelBox).append(suggestLabel);
		$(suggestLabelBox).append(spacer);
		$(suggestLabelBox).append(suggestInfoImage);
		
		var mainVbox = $(panel).find('.aeAnnotationView').get();
		$(mainVbox).prepend(suggestLabelBox);
};

/**
 * Zasle pozadavek na odmitnuti anotace
 * @param {String} id, id anotace, ktera se ma prijmout
 * @param {String} tmpId, tmpId anotace, ktera se odmita
 */
function refuseSuggestion(id, tmpId)
{
	var panel = document.getElementById(id);
	if (panel.nodeName == 'panel')
	{//Nabidka neni pro cely dokument
		closePanel(panel,'true');
	}
	
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
	
	var panel = document.getElementById(id);
	if (panel.nodeName == 'panel')
	{//Nabidka neni pro cely dokument
		closePanel(panel,'true');
	}
	
	annotationExtensionChrome.client.confirmSuggestionManually(annotation.XMLText, tmpId);
};

/**
 * Vyvola okno pro ulozeni souboru z anotace
 * @param {String} id, id anotace obsahujici atribut se jmenem attrName
 * @param {String} attrName, jmeno atributu typu binary
 */
function saveFile(id, attrName)
{
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
}

/**
 * Otevre anotaci v sidebaru (pokud se tam naleza)
 * @param {String} annotID, id anotace, kterou chceme otevrit v sidebaru
 */
function openAnnotInSidebar(annotId)
{
    //Otevri sidebar
    annotationExtensionChrome.browserOverlay.toggleAnnotationSidebar(true);
		//TODO: animace, zvyrazneni nebo neco podobneho s panelem
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

function panelChangeAnnotationColor(typeURI)
{
	annotationExtensionChrome.settings.setTypeColor(typeURI);
}

/**
 * Smaze panel anotace
 * @param {String} id id panelu, ktery se ma odstranit
 */
function deleteAnnotationPanel(id)
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

function closeNested(annotDB, frame_doc, id)
{
    $.each(annotDB.annotations, function(ind, annotation)
		{
        if(annotation.nested_id == id)
				{
            var spanNodes = frame_doc.getElementsByName(annotation.id);

						setFragmentsColor(annotation.id, null, frame_doc,annotation.tmpId);
						
						for (var count = 0; count < spanNodes.length; count++)
						{//Zruseni zvyrazneni vnorene anotace na strance
								spanNodes[count].setAttribute('active','false');
						}
            
            document.getElementById(annotation.id).hidePopup();
        }
    });
}

function closeDocumentAnnotationsNestedAnnotations(annotDB, frame_doc)
{
	var documentAnnots = $('#aeDocumentAnnotationsBox').children();
	for (var i = 0; i < documentAnnots.length; ++i)
	{
		var documentAnnotId = documentAnnots[i].id;
		closeNested(annotDB, frame_doc, documentAnnotId);	
	}
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
function panelOnMouseOver(panel, doc)
{
  try
  {
		var annotId = panel.id;
		
    if (panel.state != 'hiding' && panel.state != 'closed')
    {
      //Pokud je fragment schovany pod jinym... "posun ho nahoru"
      var fragmentNodes = doc.getElementsByName(annotId);
      if (fragmentNodes.length > 0)
      {
          var fragmentNode = fragmentNodes[0];
          var fragmentsColor = getFragmentColorByID(fragmentNode, annotId);
          if (fragmentsColor != null)
							//TODO: tady by nemelo byt null, ale tmpId anotace (ktere muze byt null)
              setFragmentsColor(annotId, fragmentsColor, doc, null);
      }
			
			//Zvyrazneni fragmentu, ke kterym panel patri
      annotHighlight(annotId, doc);
      
      //Zvyrazneni fragmentu vnorenych anotaci (pokud jsou fragmenty vnorenych anotaci "schovane" pod fragmenty jinych anotaci)
			showNestedAnnotationsFragments(annotId, doc);
    }
  }
  catch(ex)
  {}
}

/**
 * Handler pro odejti mysi z panelu
 */
function panelOnMouseOut(panel, doc)
{
  try
  {
		var annotId = panel.id;
    
		var toggleButton = $(panel).children('.aeAnnotationPanelControlBox').children('.aeToggleButton').get(0);
		if ($(toggleButton).hasClass('aeToggleAnnotationButtonDown'))
		{//Atributy panelu jsou skryte
			//Skryj fragmenty vnorenych anotaci
			closeNested(annotationExtensionChrome.annotationsView.ANNOTATIONS, doc, annotId);
		}
		
		annotHighlightClear(annotId, doc);
  }
  catch(ex)
  {}
}