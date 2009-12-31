#  This file is part of Cheetah News Aggregator
#  Copyright (C) 2006 The Cheetah News Team.
#
#  This program is free software; you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by the
#  Free Software Foundation; either version 3 of the License, or (at your
#  option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License along
#  with this program.  If not, see <http://www.gnu.org/licenses/>.

BEGIN {
	if (!STEM)
	  STEM="out"
	output = STEM "-js.po"    
	system("rm -f " output);
	push("# This file is generated automatically. Please, do not edit")
}

function push(s) {
	if (accum == "")
	  accum = s
        else
	  accum = accum "\n" s;
}

function print_accum() {
	if (accum != "") {
	  print accum;
	  accum=""
	}
}

function print_accum_js() {
##	print "# STATE " state >> output
	print accum >> output;
	accum=""
}

state < 2 { push($0); }
state == 0 && /msgid/ { state = 1 }

state == 1 && NF==0 { header = accum; 
                      print_accum();
                      accum = header;
                      print_accum_js();
                      state = 2; 
                      next }

state == 2 && /#:/ { state = 3; }
state == 2 { push($0); }
(state == 2 || state == 3) && $1=="#." && $2="TRANSLATORS:" && $3=="BEGIN" && $4=="JS" { state = 6; next }
state == 2 && NF==0 { print_accum(); }

state == 3 && /#:/ { for (i = 2; i <= NF; i++) {
                       if (!match($i, "^js/")) {
			 push($0)
	                 print_accum();
	                 state = 5;
			 next
		       }
		     }	    
		     push($0);	
                     next   
		   }

state == 3 { push($0) }
state == 3 && /msgid_plural/ { state = 4; next }
state == 3 && NF==0 { print_accum(); state = 2; next } 

state == 4 && NF==0 { push($0); print_accum_js(); state = 2; next } 
state == 4 { push($0); next }

state == 5 && NF==0 { print; state = 2; next }
state == 5 { print }	   

state == 6 { push($0); }
state == 6 && NF==0 { push($0); print_accum_js(); next }
state == 6 && $1=="#." && $2=="TRANSLATORS:" && $3=="END" && $4=="JS" { state = 4; next }

END {
	if (state == 6)
		print_accum_js();
	else
		print_accum();
	print ""
}
