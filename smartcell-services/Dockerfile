FROM php:8.4-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    zip \
    unzip \
    nginx \
    gettext-base \
    sqlite3 \
    libsqlite3-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    libicu-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    exif \
    pcntl \
    bcmath \
    intl \
    gd \
    zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PATH="/root/.config/composer/vendor/bin:/root/.composer/vendor/bin:${PATH}"

RUN chmod +x /usr/bin/composer \
    && composer --version

# Configuración PHP
RUN sed -i 's/listen = 127.0.0.1:9000/listen = 0.0.0.0:9000/' /usr/local/etc/php-fpm.d/www.conf \
    && php-fpm -t \
    && echo "upload_max_filesize = 50M" >> /usr/local/etc/php/php.ini \
    && echo "post_max_size = 50M" >> /usr/local/etc/php/php.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/php.ini

WORKDIR /var/www/html

# Copiar proyecto
COPY . /var/www/html

# Instalar dependencias Laravel
RUN composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# Crear SQLite
RUN mkdir -p database \
    && touch database/database.sqlite

# Permisos Laravel
RUN chmod -R 775 storage bootstrap/cache database \
    && chown -R www-data:www-data /var/www/html

# Configuración Laravel
RUN php artisan config:clear
RUN php artisan cache:clear
RUN php artisan route:clear

# Migraciones
RUN php artisan migrate --force || true

# Configuración nginx
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf.template

# Puerto Render
ENV PORT=80

EXPOSE 80

# Iniciar servicios
CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && php-fpm -D && exec nginx -g 'daemon off;'"]