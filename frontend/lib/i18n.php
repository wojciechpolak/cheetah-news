<?php

/*
   Cheetah News lib/i18n.php
   Copyright (C) 2005, 2006 The Cheetah News Team.

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 3 of the License, or (at your
   option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License along
   with this program.  If not, see <http://www.gnu.org/licenses/>. */

/* This module configures current locale using client preferences.
   Largely inspired by Savane */

$locale = 'en_US.UTF_8';

# Our text domain id
$textdomain = $CONF['textdomain'];
$domaindir = '';
$mofile = '';

# Path to search for .mo files.
if (isset ($CONF['localePath']))
     $localepath = explode(":", $CONF['localePath']);
else
     $localepath = array ('/usr/share/locale', '/usr/local/share/locale');

# ISO 639 language code => ISO 3166 country code
# The corresponding country codes where selected using the following
# principles:
#  1. If the language is spoken in only one country, this country code is used.
#  2. If the language is spoken in more than one country, select the code of
#     that country where it has official status.
#  3. If the language does not have official status, select the country with
#     greater number of speakers
#
# The table does not list artificial languages (Esperanto, Ido, Interlingua,
# etc), as the notion of a territory does not apply to them.
#
# If you find any inconsistency in this table, please let me know.
#
$defterr = array(
	"aa" => "ET", # Afar
	"ab" => "GE", # Abkhazian
	"ae" => "IR", # Avestan
	"af" => "ZA", # Afrikaans
	"ak" => "GH", # Akan # or ak_CI
	"am" => "ET", # Amharic
	"an" => "ES", # Aragonese
	"ar" => "SA", # Arabic
	"as" => "IN", # Assamese
	"av" => "RU", # Avaric # Spoken mainly in Dagestan
	"ay" => "BO", # Aymara
	"az" => "AZ", # Azerbaijani

	"ba" => "RU", # Bashkir
	"be" => "BY", # Byelorussian; Belarusian
	"bg" => "BG", # Bulgarian
	"bh" => "IN", # Bihari
	"bi" => "VU", # Bislama
	"bm" => "ML", # Bambara
	"bn" => "BD", # Bengali; Bangla
	"bo" => "CN", # Tibetan
	"br" => "FR", # Breton
	"bs" => "BA", # Bosnian

	"ca" => "ES", # Catalan
	"ce" => "RU", # Chechen
	"ch" => "GU", # Chamorro
	"co" => "FR", # Corsican
	"cr" => "CA", # Cree
	"cs" => "CZ", # Czech
	"cu" => "BG", # Church Slavic
	"cv" => "RU", # Chuvash
	"cy" => "GB", # Welsh

	"da" => "DK", # Danish
	"de" => "DE", # German
	"dv" => "MV", # Divehi
	"dz" => "BT", # Dzongkha; Bhutani

	"ee" => "GH", # @'Ew@'e
	"el" => "GR", # Greek
	"en" => "US", # English
	"es" => "ES", # Spanish
	"et" => "EE", # Estonian
	"eu" => "ES", # Basque

	"fa" => "IR", # Persian
	"ff" => "CM", # Fulah # Also NG, MR, and many others
	"fi" => "FI", # Finnish
	"fj" => "FJ", # Fijian; Fiji
	"fo" => "FO", # Faroese
	"fr" => "FR", # French
	"fy" => "NL", # Frisian

	"ga" => "IE", # Irish
	"gd" => "GB", # Scots; Gaelic
	"gl" => "ES", # Gallegan; Galician
	"gn" => "PE", # Guarani
	"gu" => "IN", # Gujarati
	"gv" => "GB", # Manx

	"ha" => "NG", # Hausa (?)
	"he" => "IL", # Hebrew (formerly iw)
	"hi" => "IN", # Hindi
	"ho" => "PG", # Hiri Motu
	"hr" => "HR", # Croatian
	"ht" => "HT", # Haitian; Haitian Creole
	"hu" => "HU", # Hungarian
	"hy" => "AM", # Armenian
	"hz" => "NA", # Herero

	"id" => "ID", # Indonesian (formerly in)
	"ig" => "NG", # Igbo
	"ii" => "CN", # Sichuan Yi
	"ik" => "CA", # Inupiak
	"is" => "IS", # Icelandic
	"it" => "IT", # Italian
	"iu" => "CA", # Inuktitut

	"ja" => "JP", # Japanese
	"jv" => "ID", # Javanese

	"ka" => "GE", # Georgian
	"kg" => "CG", # Kongo # also CD and AO
	"ki" => "KE", # Kikuyu
	"kj" => "AO", # Kuanyama
	"kk" => "KZ", # Kazakh
	"kl" => "DK", # Kalaallisut; Greenlandic
	"km" => "KH", # Khmer; Cambodian
	"kn" => "IN", # Kannada
	"ko" => "KR", # Korean
	"kr" => "NG", # Kanuri
	"ks" => "IN", # Kashmiri
	"ku" => "IQ", # Kurdish
	"kv" => "RU", # Komi
	"kw" => "GB", # Cornish
	"ky" => "KG", # Kirghiz

	"la" => "VA", # Latin
	"lb" => "LU", # Letzeburgesch
	"lg" => "UG", # Ganda
	"li" => "NL", # Limburgish; Limburger; Limburgan
	"ln" => "CD", # Lingala
	"lo" => "LA", # Lao; Laotian
	"lt" => "LT", # Lithuanian
	"lu" => "CD", # Luba-Katanga
	"lv" => "LV", # Latvian; Lettish

	"mg" => "MG", # Malagasy
	"mh" => "MH", # Marshall
	"mi" => "NZ", # Maori
	"mk" => "MK", # Macedonian
	"ml" => "IN", # Malayalam
	"mn" => "MN", # Mongolian
	"mo" => "MD", # Moldavian
	"mr" => "IN", # Marathi
	"ms" => "MY", # Malay
	"mt" => "MT", # Maltese
	"my" => "MM", # Burmese

	"na" => "NR", # Nauru
	"nb" => "NO", # Norwegian Bokm@aa{}l
	"nd" => "ZA", # Ndebele, North
	"ne" => "NP", # Nepali
	"ng" => "NA", # Ndonga
	"nl" => "NL", # Dutch
	"nn" => "NO", # Norwegian Nynorsk
	"no" => "NO", # Norwegian
	"nr" => "ZA", # Ndebele, South
	"nv" => "US", # Navajo
	"ny" => "MW", # Chichewa; Nyanja

	"oc" => "FR", # Occitan; Proven@,{c}al
	"oj" => "CA", # Ojibwa
	"om" => "ET", # (Afan) Oromo
	"or" => "IN", # Oriya
	"os" => "RU", # Ossetian; Ossetic

	"pa" => "IN", # Panjabi; Punjabi
	"pi" => "IN", # Pali
	"pl" => "PL", # Polish
	"ps" => "AF", # Pashto, Pushto
	"pt" => "PT", # Portuguese

	"qu" => "PE", # Quechua

	"rm" => "FR", # Rhaeto-Romance
	"rn" => "BI", # Rundi; Kirundi
	"ro" => "RO", # Romanian
	"ru" => "RU", # Russian
	"rw" => "RW", # Kinyarwanda

	"sa" => "IN", # Sanskrit
	"sc" => "IT", # Sardinian
	"sd" => "PK", # Sindhi
	"se" => "NO", # Northern Sami
	"sg" => "CF", # Sango; Sangro
	"si" => "LK", # Sinhalese
	"sk" => "SK", # Slovak
	"sl" => "SI", # Slovenian
	"sm" => "WS", # Samoan
	"sn" => "ZW", # Shona
	"so" => "SO", # Somali
	"sq" => "AL", # Albanian
	"sr" => "CS", # Serbian
	"ss" => "SZ", # Swati; Siswati
	"st" => "LS", # Sesotho; Sotho, Southern
	"su" => "ID", # Sundanese
	"sv" => "SE", # Swedish
	"sw" => "TZ", # Swahili # Also KE

	"ta" => "IN", # Tamil
	"te" => "IN", # Telugu
	"tg" => "TJ", # Tajik
	"th" => "TH", # Thai
	"ti" => "ER", # Tigrinya
	"tk" => "TM", # Turkmen
	"tl" => "PH", # Tagalog
	"tn" => "BW", # Tswana; Setswana
	"to" => "ZM", # Tonga (?) # Also ZW ; MW
	"tr" => "TR", # Turkish
	"ts" => "MZ", # Tsonga # ZA SZ XW
	"tt" => "RU", # Tatar
	"tw" => "GH", # Twi
	"ty" => "PF", # Tahitian

	"ug" => "RU", # Uighur
	"uk" => "UA", # Ukrainian
	"ur" => "IN", # Urdu
	"uz" => "UZ", # Uzbek

	"ve" => "ZA", # Venda
	"vi" => "VN", # Vietnamese

	"wa" => "FR", # Walloon
	"wo" => "SN", # Wolof

	"xh" => "ZA", # Xhosa

	"yi" => "IL", # Yiddish (formerly ji)
	"yo" => "NG", # Yoruba

	"za" => "CN", # Zhuang
	"zh" => "CN", # Chinese
	"zu" => "ZA"  # Zulu
);

$langname = array(
        "ca" => "Català",
        "en" => "English",
	"eo" => "Esperanto",
        "es" => "Español",
        "pl" => "Polski",
        "uk" => "Українська" 
);

function enumerate_languages ($func)
{
  global $langname;
  foreach ($langname as $key => $lang) 
    $func ($key, $lang);
}

# Is the $locale supported
function is_supported_locale($locale, &$return_dir, &$return_file)
{
  global $localepath, $textdomain;

  foreach ($localepath as $dir) {
    $name = $dir . '/' . $locale . '/LC_MESSAGES/' . $textdomain;
    foreach (array('mo', 'gmo') as $suffix) {
	$file = $name . "." . $suffix; 
	if (is_readable ($file)) {
	  $return_dir = $dir;
	  $return_file = $file;
	  return 1;
	}
    }
  }
  return 0;
}

function get_mo_name ($loc, &$name, $suf = "-js")
{
  global $textdomain, $domaindir;

  $base = $domaindir . '/' . $loc . '/LC_MESSAGES/' . $textdomain . $suf;
  $name = $base  . '.mo';
  if (!is_readable ($name)) {
    $name = $base  . '.gmo';
    if (!is_readable ($name))
      return 0;
  }
  return 1;
}

function my_addslashes ($s)
{
  static $from;
  static $to;

  if (!isset ($from))
    $from = array ("\\", "\b", "\f", "\n", "\r", "\t", "'", "\"");
  if (!isset ($to))
    $to = array ("\\\\", "\\b", "\\f", "\\n", "\\r", '\t', "\\'", "\\\"");
  return str_replace ($from, $to, $s);
}

function convert_mo()
{
  global $locale;

  echo "var gettext_nplurals;\n";
  echo "var gettext_plural;\n";
  echo "var gettext_msg;\n";

  # Strip off eventual charset 
  $loc = array_shift(explode(".", $locale));
  if (!get_mo_name($loc, $name))
    {
      $loc = array_shift(explode("_", $loc));
      if (!get_mo_name($loc, $name))
        {
          return;
        }
    }

  # open mo file for binary reading
  $mo = fopen($name, "rb");

  # get the number of strings
  fseek($mo, 8);
  $str_count = array_pop(unpack("L", fread($mo, 4)));
#  echo "str_count=$str_count\n";

  # read in the start of the msgids and msgstrs
  fseek($mo, 12);
  $start = unpack("Loriginal/Ltranslation", fread($mo, 8));
#  echo "original/translation " . $start['original'] . " / " . $start['translation'] . "\n";

  # read in the table for the lengths and offsets for the msgids
  fseek($mo, $start['original']);
  $msgids = fread($mo, $str_count*8);
  for ($q = 0; $q < $str_count; $q++)
    $original[$q] = unpack("Llength/Loffset", substr($msgids, $q*8, 8));

  $msgid = array();
  # Read in the msgids

  for ($q = 0; $q < $str_count; $q++) {
    fseek($mo, $original[$q]['offset']);
    if ($original[$q]['length']) 
      $msgid[$q] = array_pop(unpack("a*", fread($mo, $original[$q]['length'])));
    else
      $msgid[$q] = '';
#    echo "msgid[$q] = $msgid[$q]\n";
  }

  # Read in the lengths/offsets of the corresponding translations
  fseek($mo, $start['translation']);
  $msgstrs = fread($mo, $str_count*8);
  for ($q = 0; $q < $str_count; $q++) 
    $translation[$q] = unpack("Llength/Loffset", substr($msgstrs, $q*8, 8));

  $msgstr = array();
  # Read in the msgstrs
  for ($q = 0; $q < $str_count; $q++) {
    fseek($mo, $translation[$q]['offset']);
    $msgstr[$q] = array_pop(unpack("a*", fread($mo, $translation[$q]['length'])));
#    echo "msgstr[$q] = $msgstr[$q]\n";
  }
  fclose($mo);

  # Select necessary info from msgstr[0]
  foreach (explode ("\n", $msgstr[0]) as $var) {
    if (preg_match ('/^Plural-Forms:/', $var)) {
       foreach (explode (";", preg_replace ('/^Plural-Forms:/', '', $var)) as $pv) {
         $a = explode ("=", $pv, 2);
         if (ltrim($a[0]) == "nplurals")
           echo "gettext_nplurals = $a[1];\n";
         else if (ltrim($a[0]) == "plural")
           echo "function gettext_plural (n) { return $a[1]; }\n";
       }
    }
  }

  echo "var gettext_locale = \"$locale\";\n";
  echo "gettext_msg = {\n";
  for ($q = 1; $q < $str_count; $q++) {
    printf("  '%s' : '%s'", my_addslashes ($msgid[$q]), my_addslashes ($msgstr[$q]));
    if ($q < $str_count-1)
      printf(",");
    echo "\n";
  }
  echo "};\n";
  
}

function locale_setup ($preferred_lang)
{
  global $CHEETAH_LANG, $locale, $textdomain, $domaindir, $defterr, $mofile;

  if (!is_array ($preferred_lang)) 
    $preferred_lang = array ($preferred_lang);

  while (list(, $lng) = each ($preferred_lang)) {
    $lng = trim($lng);
    $curlocale = strtolower(substr($lng,0,2));
    
    if (substr($lng,2,1) == "-") {
      $terr = strtoupper(substr($lng,3,2));
      $sublocale = $curlocale . "_" . $terr;
    } else {
      $sublocale = $curlocale;
      if (isset($defterr[$curlocale]))
        $terr = $defterr[$curlocale];
      else
        $terr = "XX"; # Hack for languages without defined territory.
    }
    if (is_supported_locale($sublocale, $domaindir, $mofile)) { 
      $locale = $curlocale . '_' . $terr . ".UTF-8";
      break;
    } 
  }

  if (!isset ($locale)) {
    $locale = 'en_US.UTF-8';
  }

  # $cheetah_lang is used by d.php to determine message file to use
  $cheetah_lang = substr ($locale,0,2);
  # CHEETAH_LANG is used to produce valid <?xml> header
  $CHEETAH_LANG = substr ($locale,0,2) . '-' . substr($locale,3);
  setlocale (LC_ALL, $locale);

  # Gettext (i18n) configs :
  bindtextdomain ($textdomain, $domaindir);
  textdomain ($textdomain);

#  print "[".$locale.",".setlocale(LC_ALL,0)."]";
}

function i18n_get_content ($file)
{
  global $CONF, $locale;

  $suffixes = array($locale);
  if (preg_match('/^([a-z][a-z])_[A-Z][A-Z]\.(.*)/', $locale, $matches))
    array_push($suffixes, $matches[1].'.'.$matches[2]); 
  array_push($suffixes, 'txt');
  foreach ($suffixes as $suf) {
     $name = $CONF['siteContentDir'].'/'.$file.'.'.$suf;
     if (is_readable ($name)) {
       include ($name);
       break;
     }
  }
}

locale_setup (explode (',', getenv ('HTTP_ACCEPT_LANGUAGE')));
#locale_setup(array('pl'));
#convert_mo();
?>
