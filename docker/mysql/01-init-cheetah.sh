#!/bin/sh
set -eu

tmp_sql=/tmp/cheetah.sql

sed -E \
  -e 's/ NOT NULL REFERENCES [A-Za-z0-9_]+\.[A-Za-z0-9_]+//g' \
  -e "s/text not null default ''/text not null/Ig" \
  /docker-source/cheetah.sql > "$tmp_sql"

mysql --protocol=socket -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" < "$tmp_sql"

mysql --protocol=socket -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" <<'SQL'
INSERT INTO user (email, pass, active, lang, showActive, oldestFirst, refresh)
VALUES ('guest@cheetah', '!', 'yes', 'en', 1, 0, 0);

SET @guest_id = LAST_INSERT_ID();

INSERT INTO feed (url, description) VALUES
  ('https://news.ycombinator.com/rss', 'Hacker News'),
  ('https://lobste.rs/rss', 'Lobsters'),
  ('https://feeds.arstechnica.com/arstechnica/index', 'Ars Technica');

INSERT INTO subscription (userid, feedid, pri, latest, expand, folder, active, description)
SELECT @guest_id, id, 100 - id, 10, 0, 0, 1, description
FROM feed
WHERE url IN (
  'https://news.ycombinator.com/rss',
  'https://lobste.rs/rss',
  'https://feeds.arstechnica.com/arstechnica/index'
);
SQL
