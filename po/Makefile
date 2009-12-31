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

PACKAGE = cheetah
#VERSION = N/A

SHELL = /bin/sh
AWK=awk

srcdir = .
top_srcdir = ..

# FIXME: These should be configurable!
GMSGFMT = /usr/bin/msgfmt
MSGFMT = /usr/bin/msgfmt
XGETTEXT = xgettext --from-code=UTF-8
MSGMERGE = msgmerge
MSGMERGE_UPDATE = /usr/bin/msgmerge --update
MSGINIT = msginit
MSGCONV = msgconv
MSGFILTER = msgfilter
INSTALL = /usr/bin/install -c
INSTALL_DATA = ${INSTALL} -m 644
MKINSTALLDIRS = mkdir -p
mkinstalldirs = $(MKINSTALLDIRS)

subdir = po
top_builddir = ..
prefix = .
datadir = ${prefix}/share
localedir = $(datadir)

DOMAIN = cheetah
XGETTEXT_OPTIONS = --keyword=_ --keyword=N_ --keyword=gettext_noop
COPYRIGHT_HOLDER = The Cheetah News Team
MSGID_BUGS_ADDRESS = cheetah-admins@gnu.org.ua
EXTRA_LOCALE_CATEGORIES =

ifeq (LINGUAS,$(wildcard LINGUAS))
LINGUAS = $(shell sed 's/\#.*$$//;/^$$/d' LINGUAS)
else
LINGUAS = 
endif

all:	$(foreach lang, $(LINGUAS), $(lang)-js.mo $(lang)-php.mo)

update:	$(foreach lang, $(LINGUAS), $(lang).po-update)

install: all
	@$(mkinstalldirs) $(DESTDIR)$(datadir); \
	linguas='$(LINGUAS)'; \
	for lang in $$linguas; do \
	  dir=$(localedir)/$$lang/LC_MESSAGES; \
	  $(mkinstalldirs) $(DESTDIR)$$dir; \
	  for part in php js; do \
	    realcat=$$lang-$$part.mo; \
	    $(INSTALL_DATA) $$realcat $(DESTDIR)$$dir/$(DOMAIN)-$$part.mo; \
	    echo "installing $$realcat as $(DESTDIR)$$dir/$(DOMAIN)-$$part.mo"; \
	    if [ $$part = php ]; then \
		(cd $(DESTDIR)$$dir/; ln -sf $(DOMAIN)-$$part.mo $(DOMAIN).mo); \
	        echo "installing $$realcat link as $(DESTDIR)$$dir/$(DOMAIN).mo"; \
	    fi; \
	  done; \
	done

.SUFFIXES: .po .gmo .mo .sed .sin .nop .po-create .po-update

.po.mo:
	@echo "$(MSGFMT) -c -o $@ $<"; \
	$(MSGFMT) -c -o t-$@ $< && mv t-$@ $@

.PRECIOUS: %-js.po %-php.po

%-js.po %-php.po: %.po
	$(AWK) -v STEM="$*" -f ./trans.awk $< > $*-php.po

.sin.sed:
	sed -e '/^#/d' $< > t-$@
	mv t-$@ $@

# This target rebuilds $(DOMAIN).pot; it is an expensive operation.
# Note that $(DOMAIN).pot is not touched if it doesn't need to be changed.
$(DOMAIN).pot-update: POTFILES.in  remove-potcdate.sed
	$(XGETTEXT) --default-domain=$(DOMAIN) --directory=$(top_srcdir) \
	  --add-comments=TRANSLATORS: $(XGETTEXT_OPTIONS) \
	  --files-from=$(srcdir)/POTFILES.in \
	  --copyright-holder='$(COPYRIGHT_HOLDER)' \
	  --msgid-bugs-address='$(MSGID_BUGS_ADDRESS)'
	test ! -f $(DOMAIN).po || { \
	  if test -f $(srcdir)/$(DOMAIN).pot; then \
	    sed -f remove-potcdate.sed < $(srcdir)/$(DOMAIN).pot > $(DOMAIN).1po && \
	    sed -f remove-potcdate.sed < $(DOMAIN).po > $(DOMAIN).2po && \
	    if cmp $(DOMAIN).1po $(DOMAIN).2po >/dev/null 2>&1; then \
	      rm -f $(DOMAIN).1po $(DOMAIN).2po $(DOMAIN).po; \
	    else \
	      rm -f $(DOMAIN).1po $(DOMAIN).2po $(srcdir)/$(DOMAIN).pot && \
	      mv $(DOMAIN).po $(srcdir)/$(DOMAIN).pot; \
	    fi; \
	  else \
	    mv $(DOMAIN).po $(srcdir)/$(DOMAIN).pot; \
	  fi; \
	}

.nop.po-create:
	@lang=`echo $@ | sed -e 's/\.po-create$$//'`; \
	echo "File $$lang.po does not exist. If you are a translator, you can create it through 'msginit'." 1>&2; \
	exit 1

.nop.po-update:
	@lang=`echo $@ | sed -e 's/\.po-update$$//'`; \
	if test "$(PACKAGE)" = "gettext-tools"; then PATH=`pwd`/../src:$$PATH; fi; \
	tmpdir=`pwd`; \
	echo "$$lang:"; \
	test "$(srcdir)" = . && cdcmd="" || cdcmd="cd $(srcdir) && "; \
	echo "$${cdcmd}$(MSGMERGE) $$lang.po $(DOMAIN).pot -o $$lang.new.po"; \
	cd $(srcdir); \
	if $(MSGMERGE) $$lang.po $(DOMAIN).pot -o $$tmpdir/$$lang.new.po; then \
	  if cmp $$lang.po $$tmpdir/$$lang.new.po >/dev/null 2>&1; then \
	    rm -f $$tmpdir/$$lang.new.po; \
	  else \
	    if mv -f $$tmpdir/$$lang.new.po $$lang.po; then \
	      :; \
	    else \
	      echo "msgmerge for $$lang.po failed: cannot move $$tmpdir/$$lang.new.po to $$lang.po" 1>&2; \
	      exit 1; \
	    fi; \
	  fi; \
	else \
	  echo "msgmerge for $$lang.po failed!" 1>&2; \
	  rm -f $$tmpdir/$$lang.new.po; \
	fi

$(foreach lang, $(LINGUAS), $(lang).nop):

clean: 
	rm -f *.mo $(foreach lang, $(LINGUAS), $(lang)-js.po $(lang)-php.po)
