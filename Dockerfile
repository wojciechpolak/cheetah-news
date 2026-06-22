FROM php:7.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      libcurl4-openssl-dev \
      libonig-dev \
      mariadb-client \
    && docker-php-ext-install curl gettext mysqli \
    && a2enmod rewrite headers deflate \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /websites/cheetah

COPY . /websites/cheetah
COPY docker/web/apache-cheetah.conf /etc/apache2/sites-available/000-default.conf
COPY docker/web/php-cheetah.ini /usr/local/etc/php/conf.d/cheetah.ini

RUN sed -i "s/preg_split (':', \\\$currentHeader, 2)/explode (':', \\\$currentHeader, 2)/" /websites/cheetah/frontend/lib/http.class.php \
    && cp /websites/cheetah/frontend/htaccess /websites/cheetah/frontend/.htaccess \
    && mkdir -p /tmp/cheetah_openid /backup /websites/cheetah/frontend/trs \
    && chown -R www-data:www-data /tmp/cheetah_openid /backup /websites/cheetah/frontend/trs \
    && chmod +x /websites/cheetah/docker/web/entrypoint.sh

ENTRYPOINT ["/websites/cheetah/docker/web/entrypoint.sh"]
CMD ["apache2-foreground"]
