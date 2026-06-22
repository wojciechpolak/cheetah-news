#!/bin/sh
set -eu

base_dir=/websites/cheetah
frontend_dir="$base_dir/frontend"
lib_dir="$frontend_dir/lib"

db_host="${CHEETAH_DB_HOST:-db}"
db_database="${CHEETAH_DB_DATABASE:-cheetah}"
db_user="${CHEETAH_DB_USER:-cheetah}"
db_password="${CHEETAH_DB_PASSWORD:-cheetah}"
site="${CHEETAH_SITE:-localhost:8080}"

cat > "$lib_dir/config.php" <<EOF
<?php
\$CONF['dbHost'] = '$db_host';
\$CONF['dbDatabase'] = '$db_database';
\$CONF['dbUser'] = '$db_user';
\$CONF['dbPassword'] = '$db_password';
\$CONF['secureProto'] = 'http';
\$CONF['baseDir'] = '$base_dir';
\$CONF['site'] = '$site';
\$CONF['guestAccount'] = 'guest@cheetah';
\$CONF['mailFrom'] = 'cheetah@example.local';
\$CONF['mailHelp'] = 'cheetah@example.local';
\$CONF['mailAdmin'] = 'cheetah@example.local';
\$CONF['siteContentDir'] = '$base_dir/site-content';
\$CONF['sysName'] = 'Cheetah News Local Demo';
\$CONF['textdomain'] = 'cheetah';
\$CONF['miscDir'] = '/backup';
\$CONF['localePath'] = '$base_dir/po/share:/usr/share/locale:/usr/local/share/locale';
\$CONF['openIdStorePath'] = '/tmp/cheetah_openid';
\$CONF['trsExpireDays'] = 7;
\$CONF['feedEngine'] = 'cthonly';
\$CONF['whatsnew'] = false;
?>
EOF

php "$base_dir/backend/d-update.php" > "$lib_dir/d-sigs.php"

cat > "$lib_dir/facebook.php" <<'EOF'
<?php
class FacebookApiException extends Exception {}
class Facebook {
  function __construct ($config = array ()) {}
  function getUser () { return 0; }
  function api ($path) { return array (); }
}
?>
EOF

mkdir -p "$frontend_dir/Auth/OpenID"
cat > "$frontend_dir/Auth/OpenID/Consumer.php" <<'EOF'
<?php
if (!defined ('Auth_OpenID_CANCEL')) define ('Auth_OpenID_CANCEL', 'cancel');
if (!defined ('Auth_OpenID_FAILURE')) define ('Auth_OpenID_FAILURE', 'failure');
if (!defined ('Auth_OpenID_SUCCESS')) define ('Auth_OpenID_SUCCESS', 'success');
class Auth_OpenID_Consumer {
  function __construct ($store = null) {}
  function begin ($identifier) { return false; }
  function complete ($return_to = '') {
    $r = new stdClass ();
    $r->status = Auth_OpenID_FAILURE;
    $r->message = 'OpenID is disabled in the local Docker demo.';
    return $r;
  }
}
?>
EOF
cat > "$frontend_dir/Auth/OpenID/FileStore.php" <<'EOF'
<?php
class Auth_OpenID_FileStore {
  function __construct ($path) {}
}
?>
EOF
cat > "$frontend_dir/Auth/OpenID/SReg.php" <<'EOF'
<?php
class Auth_OpenID_SRegRequest {
  static function build ($required = null, $optional = null, $policy_url = null) { return false; }
}
class Auth_OpenID_SRegResponse {
  static function fromSuccessResponse ($response) { return new Auth_OpenID_SRegResponse (); }
  function contents () { return array (); }
}
?>
EOF

exec "$@"
