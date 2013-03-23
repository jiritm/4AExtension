/**
 * Soubor: constants.jsm
 * Autor: Jiri Trhlik
 * Datum: 3.9.2011
 * Popis: Objekt obsahujici konstanty reprezentujici jednoduche typy atributu a nejake funkce.
 *        Konstanty pro doplnek.
 * Posledni uprava: 5.6.2012
 */

var EXPORTED_SYMBOLS = [];

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import("resource://annotationextension/namespace.jsm");

annotationExtension.PREFERENCE = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.annotationextension.");

annotationExtension.ANNOTATION_EXTENSION = 'annotationExtension: ';

annotationExtension.ELEM_NAMESPACE = "chrome://annotationExtension";

annotationExtension.NAMESPACE = 'chrome://annotationextension/rdf#';
annotationExtension.BASE_URI = 'chrome://annotationextension/';
annotationExtension.EXTENSION_DIRECTORY = 'annotationExtension';
annotationExtension.ANNOTATION_NODE_CLASS = 'annotationExtension';

annotationExtension.DATABASE = 'annotationExtension.sqlite';

annotationExtension.SUGGESTED_ANNOTATION = 'aeSuggestedAnnotation';
annotationExtension.SUGGESTED_BORDER_COLOR = '#d2ef0c';

//NEMENIT HEX TVAR BAREV!!!
annotationExtension.ANNOTATION_HIGHLIGHTED = '#00AADD';
annotationExtension.ANNOTATION_HIGHLIGHTED_FONT = '#000000';

//pozor - XULu (u stromu) muze byt primo notSet
annotationExtension.SETTING_NOT_SET = "notSet";

annotationExtension.SEND_ANNOTATIONS_OK = 'sendAnnotations';
annotationExtension.REMOVE_ANNOTATIONS_OK = 'removeAnnotations';
annotationExtension.JOIN_GROUP_OK = 'joinGroup';
annotationExtension.LEAVE_GROUP_OK = 'leaveGroup';
annotationExtension.QUERY_LOGGED_USER_RESPONSE = 'queryLoggedUserResponse';

annotationExtension.SYNC_NAME = 'synchronization';

annotationExtension.STATUSBAR_MESSAGE_COLOR = '#CCFFFF';
annotationExtension.ALINK_ANNOTATION_COLOR = '#66CCFF';
annotationExtension.ALINK_ANNOTATION_COLOR_FONT = '#000000';

annotationExtension.ALINK_TEXTBOX_COLOR = '#FF6666';

annotationExtension.OPTIONSNAMESPACE = 'ClientFFExtAnnotExt';
annotationExtension.TYPECOLOROPTION = annotationExtension.OPTIONSNAMESPACE + 'TypeColor:';
annotationExtension.SUBSCRIPTIONOPTION = annotationExtension.OPTIONSNAMESPACE + 'Subscription:';

annotationExtension.SAVED_DATA = "-BINARY-";

/**
 * Zakladni typy atributu
 */
annotationExtension.attrConstants =
{
  SIMPLE_STRING : 'String',
  SIMPLE_URI : 'URI',
  SIMPLE_DATETIME : 'DateTime',
  SIMPLE_INTEGER : 'Integer',
  SIMPLE_DECIMAL : 'Decimal',
  SIMPLE_DATE : 'Date',
  SIMPLE_TIME : 'Time',
  SIMPLE_BOOLEAN : 'Boolean',
  SIMPLE_GEOPOINT : 'GeoPoint',
  SIMPLE_DURATION : 'Duration',
  SIMPLE_IMAGE : 'Image',
  SIMPLE_TEXT : 'Text',
  SIMPLE_ANYANNOTATION : 'AnyAnnotation',
  SIMPLE_BINARY : 'Binary',
  SIMPLE_PERSON : 'Person',  // Deprecated
  
  simpleTypesArray :
  [
    'Boolean',
    'Decimal',
    'Integer',
    'DateTime',
    'Date',
    'Duration',
    'Time',
    'String',
    'Text',
    'AnyAnnotation',
    'Binary',
    'GeoPoint',
    'Image',
    'URI',
    'Person'
  ],
  
  /**
   * Je typ simple?
   * @param {string} type jmeno typu
   * @return {bool} true, pokud je type mezi SIMPLE_
   */
  isSimple : function(type)
  {
    if (type == null || type == undefined)
      return false;
    
    type = type.toLowerCase();
    
    for (var i = 0; i < this.simpleTypesArray.length; ++i)
    {
      if (type == this.simpleTypesArray[i].toLowerCase())
        return true;
    }

    return false;
  }
};

annotationExtension.constants =
{
  ERROR_0_PROTO_VERSION : 0,
  ERROR_1_CREDENTIALS : 1,
  ERROR_2_ANOT_PERM : 2,
  ERROR_3_READ_ONLY : 3,
  ERROR_4_ANOT_EDIT : 4,
  ERROR_5_ANOT_DEL : 5,
  ERROR_6_MISING_ATT : 6,
  ERROR_7_ATT_VAL : 7,
  ERROR_8_SUGG_FR : 8,
  ERROR_9_SYNC_FAILED : 9,
  ERROR_10_SYNC_FORC : 10,
  ERROR_11_SYNC_ERR : 11,
  ERROR_12_TYPE_EDIT : 12,
  ERROR_13_TYPE_DEL : 13,
  ERROR_14_TYPE_ADD : 14,
  ERROR_15_ATTR_TYPE_NE : 15,
  ERROR_16_BAD_ANNOT_TYPE : 16,
  ERROR_17_BAD_ANNOT_TYPE_ATTR : 17,
  ERROR_18_BAD_EDITED_TYPE : 18,
  ERROR_19_UNKNOWN_ANNOT_TYPE : 19,
  ERROR_20_FORBIDDEN_ANNOT_TYPE_MODIFY : 20,
  ERROR_21_BAD_SETTINGS : 20,
  ERROR_22_SYNCHRONIZATION_W_NO_RES : 22,
  ERROR_23_SYNCHRONIZATION_W_NO_CONTENT : 23,
  ERROR_24_BAD_SOURCE_IN_ANNOT : 24,
  ERROR_25_BAD_FRAGMENT : 25,
  ERROR_26_BAD_ATTRIBUTE : 26,
  ERROR_27_UNKNOWN_PERSON_ATTRIBUTE : 27,
  ERROR_28_BAD_TMP_ID : 28,
  ERROR_29_UNKNOWN_ANNOTATION : 29,
  ERROR_30_UNKNOWN_DEL_ANNOTATION : 30,
  ERROR_31_UNKNOWN_SESSION : 31,
  ERROR_32_BAD_REQUEST : 32,
  ERROR_33_SERVER_MODULE_ERROR : 33,
  ERROR_34_REQ_ANNOT_UNKNOWN : 34,
  ERROR_35_BAD_XPATH : 35,
  ERROR_36_BAD_DOCUMENT : 36,
  ERROR_37_BAD_OFFSET_OR_LENGTH : 37,
  ERROR_38_EDITED_ANNOT_NOT_SAVED : 38,
  ERROR_39_TM_NOT_APPLICABLE : 39,
  ERROR_40_SUGG_FR_ANNOT_TYPE : 40,
  ERROR_41_BAD_DATE_FORMAT_ANNOT : 41,
  ERROR_42_BAD_DATE_FORMAT_ATTR : 42,
  ERROR_43_NOT_SYNCHRONIZED : 43,
  ERROR_44_ANNOT_AUTHOR : 44,
  ERROR_45_UNKNOWN_GROUP : 45,
  ERROR_46_UNKNOWN_GROUP_TYPE : 46,
  ERROR_47_DEL_USED_TYPE : 47,
  ERROR_48_PERSIST_FAILED : 48,
  ERROR_49_DUPLICIT_TYPE : 49,
  ERROR_50_BAD_MODIFICATION : 50,
  ERROR_51_DEL_TYPE_W_SUBTYPES : 51,
  ERROR_52_AMBIGUOUS_FRAGMENT : 52,
  ERROR_53_BAD_URI_OF_DOCUMENT : 53,
  ERROR_54_BAD_ANNOT_DESCRIPTION : 54,
  ERROR_55_BAD_ANNOT_TYPE_ANC : 55,
  ERROR_56_BAD_ANNOT_TYPE_URI : 56,
  ERROR_57_JOIN_TO_ADMIN : 57,
  ERROR_58_LAST_ADMIN : 58,
  ERROR_59_P_AUA_FAILED : 59,
  ERROR_60_NLP_CONN : 60,
  ERROR_61_PERSISTER_ERROR_PART_NOT_SAVED : 61,
  ERROR_62_SYNC_DOC_OPENED : 62, 
  ERROR_100_UNKNOWN : 100,
  ERROR_1000_BADMESSAGE : 1000
};