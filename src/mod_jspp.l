%{
/* This file is part of Cheetah News Aggregator
   Copyright (C) 2006 The Cheetah News Team.

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

#include "php.h"
#include "zend_ini.h"
#include <stdio.h>
#include <stdlib.h>  
#define obstack_chunk_alloc malloc
#define obstack_chunk_free free
#include <obstack.h>
#include <libintl.h>

#define ECHO zend_write (yytext, yyleng)

int gettext_string;
int quote;

#define BEGIN_STRING(q,c,s) { if (gettext_string) \
                                { string_begin (q); \
                                  string_grow_c (yytext+1, yyleng-3, c); } \
                                else \
                                  ECHO; \
                              BEGIN(s); }


#define CONTINUE_STRING(c)  { if (gettext_string) \
                                 string_grow_c (yytext, yyleng-2, c); \
                               else \
                                 ECHO; }
 
static struct obstack stk;

static char *
unescape (char *str)
{
  for (; *str; str++)
    {
      switch (*str)
	{
	case '\b':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, 'b');
	  break;
	  
	case '\f':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, 'f');
	  break;
	  
	case '\n':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, 'n');
	  break;
	  
	case '\r':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, 'r');
	  break;
	  
	case '\t':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, 't');
	  break;
	  
	case '\\':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, '\\');
	  break;
	  
	case '"':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, '"');
	  break;
	  
	case '\'':
	  obstack_1grow(&stk, '\\');
	  obstack_1grow(&stk, '\'');
	  break;

	default:
	  obstack_1grow(&stk, *str);
	}
    }
  obstack_1grow(&stk, 0);
  return obstack_finish (&stk);
}

static void
string_begin(int q)
{
  quote = q;
}
 
static void
string_grow (const char *str, size_t len)
{
  obstack_grow (&stk, str, len);
}

static void
string_add_c (char c)
{
  obstack_1grow (&stk, c);
}

static void
string_grow_c (const char *str, size_t len, char c)
{
  string_grow (str, len);
  string_add_c (c);
}

static char *
string_end ()
{
  obstack_1grow (&stk, 0);
  return obstack_finish (&stk);
}

static void
string_free (char *s)
{
  obstack_free (&stk, s);
}

#define YY_DECL static int yylex(void)
#define YY_SKIP_YYWRAP
static int yywrap(void);

%}

%option    never-interactive

%x COMMENT STR STR1 GETTEXT

WS [ \t]*
IDENT [a-zA-Z_][a-zA-Z_0-9]+

%%
         /* C-style comments */
"/*"         BEGIN(COMMENT);
<COMMENT>[^*\n]*        /* eat anything that's not a '*' */
<COMMENT>"*"+[^*/\n]*   /* eat up '*'s not followed by '/'s */
<COMMENT>\n             ;
<COMMENT>"*"+"/"        BEGIN(INITIAL);
         /* BCPL (C++) style comment */
         /* It is commented out since it conflicts with JS brain-damaged syntax of
	    regex's */
         /* "//".*\n                ; */

(_|gettext){WS}"("/['\"]   { gettext_string = 1; } 

{IDENT}                 ECHO;
	      
\"[^\\"\n]*\"           { if (gettext_string)
                            {
                              string_begin ('"');
                              string_grow (yytext+1, yyleng-2);
                            }
                          else
                            ECHO;
                        }

\"[^\\"\n]*\\b          BEGIN_STRING ('"', '\b', STR)
\"[^\\"\n]*\\f          BEGIN_STRING ('"', '\f', STR)
\"[^\\"\n]*\\n          BEGIN_STRING ('"', '\n', STR)
\"[^\\"\n]*\\r          BEGIN_STRING ('"', '\r', STR)
\"[^\\"\n]*\\t          BEGIN_STRING ('"', '\t', STR)
\"[^\\"\n]*\\\\         BEGIN_STRING ('"', '\\', STR)
\"[^\\"\n]*\\\"         BEGIN_STRING ('"', '"', STR)
\"[^\\"\n]*\\'          BEGIN_STRING ('"', '\'', STR)

<STR>[^\\"\n]*\\b 	CONTINUE_STRING ('\b');     
<STR>[^\\"\n]*\\f 	CONTINUE_STRING ('\f');     
<STR>[^\\"\n]*\\n 	CONTINUE_STRING ('\n');     
<STR>[^\\"\n]*\\r 	CONTINUE_STRING ('\r');     
<STR>[^\\"\n]*\\t 	CONTINUE_STRING ('\t');     
<STR>[^\\"\n]*\\\\	CONTINUE_STRING ('\\');     
<STR>[^\\"\n]*\\\"	CONTINUE_STRING ('\"');     
<STR>[^\\"\n]*\\' 	CONTINUE_STRING ('\'');     

<STR>[^\\"\n]*\"        { if (gettext_string)
                            string_grow (yytext, yyleng-1);
                          else
                            ECHO;
			  BEGIN(INITIAL);
                        }


'[^\\'\n]*'             { if (gettext_string)
                            {
                               string_begin ('\'');
                               string_grow (yytext+1, yyleng-2);
                            }
                          else
                            ECHO;
                         }

'[^\\'\n]*\\b   BEGIN_STRING ('\'', '\b', STR1)                    
'[^\\'\n]*\\f   BEGIN_STRING ('\'', '\f', STR1)                   
'[^\\'\n]*\\n   BEGIN_STRING ('\'', '\n', STR1)                   
'[^\\'\n]*\\r   BEGIN_STRING ('\'', '\r', STR1)                   
'[^\\'\n]*\\t   BEGIN_STRING ('\'', '\t', STR1)                   
'[^\\'\n]*\\\\  BEGIN_STRING ('\'', '\\', STR1)                   
'[^\\'\n]*\\\"  BEGIN_STRING ('\'', '"', STR1)                    
'[^\\'\n]*\\'   BEGIN_STRING ('\'', '\'', STR1)                   
			                                             
<STR1>[^\\'\n]*\\b 	 CONTINUE_STRING ('\b');     
<STR1>[^\\'\n]*\\f 	 CONTINUE_STRING ('\f');     
<STR1>[^\\'\n]*\\n 	 CONTINUE_STRING ('\n');     
<STR1>[^\\'\n]*\\r 	 CONTINUE_STRING ('\r');     
<STR1>[^\\'\n]*\\t 	 CONTINUE_STRING ('\t');     
<STR1>[^\\'\n]*\\\\	 CONTINUE_STRING ('\\');     
<STR1>[^\\'\n]*\\\"	 CONTINUE_STRING ('\"');     
<STR1>[^\\'\n]*\\' 	 CONTINUE_STRING ('\'');     

<STR1>[^\\"\n]*'        { if (gettext_string)
                            string_grow (yytext, yyleng-1);
                          else
                            ECHO;
			  BEGIN(INITIAL); }

")"                     { if (gettext_string && quote)
                            {
                              char *str = string_end ();
			      char *ustr = unescape (gettext (str));
			      zend_printf ("%c%s%c", quote, ustr, quote);
			      string_free (str);
			      BEGIN(INITIAL);
                            }
                          else
                            ECHO;
                          gettext_string = 0;
                         }

.                        ECHO;

%%	      

static int
yywrap ()
{
  return 1;
}

ZEND_MINFO_FUNCTION (jspp);
ZEND_FUNCTION (jspp_gettext);


zend_function_entry jspp_functions[] = {
  ZEND_FE (jspp_gettext, NULL)
  {NULL, NULL, NULL} 	  
};

zend_module_entry jspp_module_entry = {
  STANDARD_MODULE_HEADER,
  "jspp",
  jspp_functions,
  NULL,
  NULL,
  NULL,
  NULL,
  ZEND_MINFO (jspp),
  NO_VERSION_YET,
  STANDARD_MODULE_PROPERTIES
};

ZEND_MINFO_FUNCTION (jspp)
{
  php_info_print_table_start();
  php_info_print_table_header(2, "Function", "Support");
  php_info_print_table_row(2, "JS gettext expansion", "Enabled");
  php_info_print_table_row(2, "Build ", __DATE__ "  " __TIME__);

  php_info_print_table_end();
}  

#if COMPILE_DL_FIRST_MODULE
ZEND_GET_MODULE (jspp)
#endif

ZEND_FUNCTION (jspp_gettext)
{
  zval *files;
  zval **data;
  
  if (zend_parse_parameters (ZEND_NUM_ARGS () TSRMLS_CC,
			     "z", &files) == FAILURE)
    return;

  obstack_init (&stk);
  gettext_string = quote = 0;
  yy_init = 1;
  while (zend_hash_get_current_data (Z_ARRVAL (*files), (void **) &data) == SUCCESS)
    {
      char *str;
      FILE *fp;
      
      if (Z_TYPE_PP (data) != IS_STRING)
	zend_error (E_ERROR, "Argument must contain only strings");

      str = Z_STRVAL (**data);

      fp = fopen (str, "r");
      if (!fp)
	{
	  obstack_free (&stk, NULL);
	  zend_error (E_ERROR, "Cannot open file %s", str);
	}

      yyrestart (fp);
      
      yylex ();
      
      fclose (yyin);
      
      zend_hash_move_forward (Z_ARRVAL (*files));
    }
  obstack_free (&stk, NULL);
  yy_delete_buffer (YY_CURRENT_BUFFER);
}

