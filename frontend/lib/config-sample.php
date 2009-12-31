<?php
/* After modifying this file, do not forget to update its SCM version
   by running cheetah/backend/ch_update_conf.php. */

$CONF['dbHost']     = 'localhost';
$CONF['dbDatabase'] = 'DATABASE';
$CONF['dbUser']     = 'USERNAME';
$CONF['dbPassword'] = 'PASSWORD';
$CONF['secureProto'] = 'https';
$CONF['baseDir'] = '/websites/cheetah';
$CONF['site'] = 'www.cheetah-news.com';
$CONF['guestAccount'] = 'guest@cheetah';
$CONF['mailFrom']  = 'E-MAIL ADDRESS';
$CONF['mailHelp']  = 'E-MAIL ADDRESS';
$CONF['mailAdmin'] = 'E-MAIL ADDRESS';
$CONF['siteContentDir'] = '/websites/cheetah/site-content';
$CONF['sysName'] = 'Cheetah News Service';
$CONF['textdomain'] = 'cheetah';
$CONF['miscDir'] = '/backup';
$CONF['localePath'] = '/websites/cheetah/po/share:/usr/share/locale:/usr/local/share/locale';
$CONF['openIdStorePath'] = '/tmp/cheetah_openid';

## Conditions for invitation assignment:
# Maximum number of days expired since last access
$CONF['invLastAccessDays'] = 2;
# Minimal number of logins.
$CONF['invLogCount'] = 14;
## Run stats and examine 'Max. users:' row of its output to get the
## total number of available accounts.
# Number of users obtaining constant number of invitations
$CONF['initInvUsers'] = 200;
# Base number of invitations
$CONF['invBase'] = 5;
# Modulus
$CONF['invMod'] = 10;

$CONF['feedEngine'] = 'cth';
$CONF['google.key'] = 'GOOGLE-API-KEY';
$CONF['google.mapkey'] = 'GOOGLE-MAP-KEY';
$CONF['google.fcid'] = 'FC-CODE';
$CONF['google.analytics'] = 'GA-CODE';

?>
