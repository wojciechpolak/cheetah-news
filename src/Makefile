YLWRAP=ylwrap
LEXFLAGS=
LEX=flex

mod_jspp.so:	mod_jspp.o
	gcc -shared  mod_jspp.o  -Wl,-soname -Wl,mod_jspp.so -o mod_jspp.so

mod_jspp.o:	mod_jspp.c
	gcc -O2 -I/usr/include/php/main -I/usr/include/php/Zend -I/usr/include/php -I/usr/include/php/TSRM -DCOMPILE_DL_FIRST_MODULE=1 -c mod_jspp.c -fPIC -DPIC -o mod_jspp.o

install: mod_jspp.so
	/usr/bin/install -c  mod_jspp.so "/usr/lib/php/extensions/mod_jspp.so"

mod_jspp.c: mod_jspp.l
	$(YLWRAP) "$(LEX) $(AM_LEXFLAGS) $(LEXFLAGS)" \
                  mod_jspp.l lex.yy.c mod_jspp.c \
                  -- -yy jsppyy

clean:
	rm -f *.o *.so
