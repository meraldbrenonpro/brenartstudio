# Bren'Art Studio — image statique servie par Nginx (déploiement Coolify)
#
# Étape 1 : (re)générer les pages statiques par URL depuis index.html
FROM node:22-alpine AS build
WORKDIR /site
COPY . .
RUN node build-static.mjs

# Étape 2 : servir avec Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site /usr/share/nginx/html
# Nettoyage des fichiers de build inutiles dans l'image finale
RUN rm -rf /usr/share/nginx/html/.git \
           /usr/share/nginx/html/.claude \
           /usr/share/nginx/html/.agents \
           /usr/share/nginx/html/Dockerfile \
           /usr/share/nginx/html/.dockerignore \
           /usr/share/nginx/html/nginx.conf \
           /usr/share/nginx/html/build-static.mjs \
           /usr/share/nginx/html/IMPORT-NOTES.md \
           /usr/share/nginx/html/skills-lock.json
EXPOSE 80
