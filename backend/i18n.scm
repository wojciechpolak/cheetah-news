;;;; This file is part of Cheetah News Aggregator
;;;; Copyright (C) 2006 The Cheetah News Team
;;;;
;;;; This program is free software; you can redistribute it and/or modify it
;;;; under the terms of the GNU General Public License as published by the
;;;; Free Software Foundation; either version 3 of the License, or (at your
;;;; option) any later version.
;;;;
;;;; This program is distributed in the hope that it will be useful,
;;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;;;; GNU General Public License for more details.
;;;;
;;;; You should have received a copy of the GNU General Public License along
;;;; with this program.  If not, see <http://www.gnu.org/licenses/>.

(define-module (backend i18n)
  :export (locale-setup)
  :export-syntax (_))

(use-modules (backend config))
(use-syntax (ice-9 syncase))

(define-syntax _
  (syntax-rules ()
   ((_ text)  (gettext text))))

;;; ISO 639 language code => ISO 3166 country code
;;; The corresponding country codes where selected using the following
;;; principles:
;;;  1. If the language is spoken in only one country, this country code is
;;;     used.
;;;  2. If the language is spoken in more than one country, select the code of
;;;     that country where it has official status.
;;;  3. If the language does not have official status, select the country with
;;;     greater number of speakers
;;;
;;; The table does not list artificial languages (Esperanto, Ido, Interlingua,
;;; etc), as the notion of a territory does not apply to them.
;;;
;;; If you find any inconsistency in this table, please let me know.
;;;

(define defterr
  '((aa . "ET") ; Afar
    (ab . "GE") ; Abkhazian
    (ae . "IR") ; Avestan
    (af . "ZA") ; Afrikaans
    (ak . "GH") ; Akan # or ak_CI
    (am . "ET") ; Amharic
    (an . "ES") ; Aragonese
    (ar . "SA") ; Arabic
    (as . "IN") ; Assamese
    (av . "RU") ; Avaric # Spoken mainly in Dagestan
    (ay . "BO") ; Aymara
    (az . "AZ") ; Azerbaijani
    
    (ba . "RU") ; Bashkir
    (be . "BY") ; Byelorussian; Belarusian
    (bg . "BG") ; Bulgarian
    (bh . "IN") ; Bihari
    (bi . "VU") ; Bislama
    (bm . "ML") ; Bambara
    (bn . "BD") ; Bengali; Bangla
    (bo . "CN") ; Tibetan
    (br . "FR") ; Breton
    (bs . "BA") ; Bosnian
    
    (ca . "ES") ; Catalan
    (ce . "RU") ; Chechen
    (ch . "GU") ; Chamorro
    (co . "FR") ; Corsican
    (cr . "CA") ; Cree
    (cs . "CZ") ; Czech
    (cu . "BG") ; Church Slavic
    (cv . "RU") ; Chuvash
    (cy . "GB") ; Welsh
    
    (da . "DK") ; Danish
    (de . "DE") ; German
    (dv . "MV") ; Divehi
    (dz . "BT") ; Dzongkha; Bhutani
    
    (ee . "GH") ; @'Ew@'e
    (el . "GR") ; Greek
    (en . "US") ; English
    (es . "ES") ; Spanish
    (et . "EE") ; Estonian
    (eu . "ES") ; Basque
    
    (fa . "IR") ; Persian
    (ff . "CM") ; Fulah # Also NG, MR, and many others
    (fi . "FI") ; Finnish
    (fj . "FJ") ; Fijian; Fiji
    (fo . "FO") ; Faroese
    (fr . "FR") ; French
    (fy . "NL") ; Frisian
    
    (ga . "IE") ; Irish
    (gd . "GB") ; Scots; Gaelic
    (gl . "ES") ; Gallegan; Galician
    (gn . "PE") ; Guarani
    (gu . "IN") ; Gujarati
    (gv . "GB") ; Manx
    
    (ha . "NG") ; Hausa (?)
    (he . "IL") ; Hebrew (formerly iw)
    (hi . "IN") ; Hindi
    (ho . "PG") ; Hiri Motu
    (hr . "HR") ; Croatian
    (ht . "HT") ; Haitian; Haitian Creole
    (hu . "HU") ; Hungarian
    (hy . "AM") ; Armenian
    (hz . "NA") ; Herero
    
    (id . "ID") ; Indonesian (formerly in)
    (ig . "NG") ; Igbo
    (ii . "CN") ; Sichuan Yi
    (ik . "CA") ; Inupiak
    (is . "IS") ; Icelandic
    (it . "IT") ; Italian
    (iu . "CA") ; Inuktitut
    
    (ja . "JP") ; Japanese
    (jv . "ID") ; Javanese
    
    (ka . "GE") ; Georgian
    (kg . "CG") ; Kongo # also CD and AO
    (ki . "KE") ; Kikuyu
    (kj . "AO") ; Kuanyama
    (kk . "KZ") ; Kazakh
    (kl . "DK") ; Kalaallisut; Greenlandic
    (km . "KH") ; Khmer; Cambodian
    (kn . "IN") ; Kannada
    (ko . "KR") ; Korean
    (kr . "NG") ; Kanuri
    (ks . "IN") ; Kashmiri
    (ku . "IQ") ; Kurdish
    (kv . "RU") ; Komi
    (kw . "GB") ; Cornish
    (ky . "KG") ; Kirghiz
    
    (la . "VA") ; Latin
    (lb . "LU") ; Letzeburgesch
    (lg . "UG") ; Ganda
    (li . "NL") ; Limburgish; Limburger; Limburgan
    (ln . "CD") ; Lingala
    (lo . "LA") ; Lao; Laotian
    (lt . "LT") ; Lithuanian
    (lu . "CD") ; Luba-Katanga
    (lv . "LV") ; Latvian; Lettish
    
    (mg . "MG") ; Malagasy
    (mh . "MH") ; Marshall
    (mi . "NZ") ; Maori
    (mk . "MK") ; Macedonian
    (ml . "IN") ; Malayalam
    (mn . "MN") ; Mongolian
    (mo . "MD") ; Moldavian
    (mr . "IN") ; Marathi
    (ms . "MY") ; Malay
    (mt . "MT") ; Maltese
    (my . "MM") ; Burmese
    
    (na . "NR") ; Nauru
    (nb . "NO") ; Norwegian Bokm@aa{}l
    (nd . "ZA") ; Ndebele, North
    (ne . "NP") ; Nepali
    (ng . "NA") ; Ndonga
    (nl . "NL") ; Dutch
    (nn . "NO") ; Norwegian Nynorsk
    (no . "NO") ; Norwegian
    (nr . "ZA") ; Ndebele, South
    (nv . "US") ; Navajo
    (ny . "MW") ; Chichewa; Nyanja
    
    (oc . "FR") ; Occitan; Proven@,{c}al
    (oj . "CA") ; Ojibwa
    (om . "ET") ; (Afan) Oromo
    (or . "IN") ; Oriya
    (os . "RU") ; Ossetian; Ossetic
    
    (pa . "IN") ; Panjabi; Punjabi
    (pi . "IN") ; Pali
    (pl . "PL") ; Polish
    (ps . "AF") ; Pashto, Pushto
    (pt . "PT") ; Portuguese
    
    (qu . "PE") ; Quechua
    
    (rm . "FR") ; Rhaeto-Romance
    (rn . "BI") ; Rundi; Kirundi
    (ro . "RO") ; Romanian
    (ru . "RU") ; Russian
    (rw . "RW") ; Kinyarwanda
    
    (sa . "IN") ; Sanskrit
    (sc . "IT") ; Sardinian
    (sd . "PK") ; Sindhi
    (se . "NO") ; Northern Sami
    (sg . "CF") ; Sango; Sangro
    (si . "LK") ; Sinhalese
    (sk . "SK") ; Slovak
    (sl . "SI") ; Slovenian
    (sm . "WS") ; Samoan
    (sn . "ZW") ; Shona
    (so . "SO") ; Somali
    (sq . "AL") ; Albanian
    (sr . "CS") ; Serbian
    (ss . "SZ") ; Swati; Siswati
    (st . "LS") ; Sesotho; Sotho, Southern
    (su . "ID") ; Sundanese
    (sv . "SE") ; Swedish
    (sw . "TZ") ; Swahili # Also KE
    
    (ta . "IN") ; Tamil
    (te . "IN") ; Telugu
    (tg . "TJ") ; Tajik
    (th . "TH") ; Thai
    (ti . "ER") ; Tigrinya
    (tk . "TM") ; Turkmen
    (tl . "PH") ; Tagalog
    (tn . "BW") ; Tswana; Setswana
    (to . "ZM") ; Tonga (?) # Also ZW ; MW
    (tr . "TR") ; Turkish
    (ts . "MZ") ; Tsonga # ZA SZ XW
    (tt . "RU") ; Tatar
    (tw . "GH") ; Twi
    (ty . "PF") ; Tahitian
    
    (ug . "RU") ; Uighur
    (uk . "UA") ; Ukrainian
    (ur . "IN") ; Urdu
    (uz . "UZ") ; Uzbek
    
    (ve . "ZA") ; Venda
    (vi . "VN") ; Vietnamese
    
    (wa . "FR") ; Walloon
    (wo . "SN") ; Wolof
    
    (xh . "ZA") ; Xhosa
    
    (yi . "IL") ; Yiddish (formerly ji)
    (yo . "NG") ; Yoruba

    (za . "CN") ; Zhuang
    (zh . "CN") ; Chinese
    (zu . "ZA"))); Zulu

(define (supported-locale-dir lang)
  (call-with-current-continuation
   (lambda (return)
     (for-each
      (lambda (dir)
	(let ((name (string-append dir "/" lang "/LC_MESSAGES/" cheetah-textdomain)))
	  (if (or (access? (string-append name ".mo") R_OK)
		  (access? (string-append name ".gmo") R_OK))
	      (return dir))))
      (string-split cheetah-locale-path #\:))
     #f)))

(define (locale-setup lang)
  (cond
   ((not lang)
    (setenv "LC_ALL" "C")
    (setlocale LC_ALL "C")
    #f)
   (else
    (let ((curlocale (if (> (string-length lang) 2)
			 (string-downcase (substring lang 0 2))
			 lang))
	  (terr #f)
	  (sublocale #f)
	  (domaindir #f))
      
      (cond
       ((and (> (string-length lang) 2) (char=? (string-ref lang 2) #\-))
	(set! terr (string-upcase (substring lang 3 2)))
	(set! sublocale (string-append curlocale "_" terr)))
       ((assoc-ref defterr (string->symbol curlocale)) =>
	(lambda (elt)
	  (set! sublocale curlocale)
	  (set! terr elt)))
       (else
	(set! sublocale curlocale)
	(set! terr "XX"))) ; Hack for languages without defined territory.
      
      (let ((domaindir (supported-locale-dir sublocale)))
	(cond
	 (domaindir
	  (let ((locale (string-append curlocale "_" terr ".UTF-8")))
	    (setenv "LC_ALL" locale)
	    (setlocale LC_ALL locale)
	    (textdomain cheetah-textdomain)
	    (bindtextdomain cheetah-textdomain domaindir)
	    "UTF-8"))
	 ((setenv "LC_ALL" "C")
	  (setlocale LC_ALL "C")
	  #f)))))))




