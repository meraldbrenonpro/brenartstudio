# Bren'Art Studio — image statique servie par Nginx (déploiement Coolify)
#
# Étape 1 : (re)générer les pages statiques par URL depuis index.html
FROM node:22-alpine AS build
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
RUN node build-static.mjs

# Étape 2 : servir avec Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Seuls les fichiers publics sont nécessaires pour servir le site statique.
COPY --from=build /site/index.html /site/support.js /site/robots.txt /site/sitemap.xml /site/llms.txt /site/og-image.jpg /usr/share/nginx/html/
COPY --from=build /site/assets/ /usr/share/nginx/html/assets/
COPY --from=build /site/uploads/ /usr/share/nginx/html/uploads/
COPY --from=build /site/portfolio/ /usr/share/nginx/html/portfolio/
COPY --from=build /site/services/ /usr/share/nginx/html/services/
COPY --from=build /site/a-propos/ /usr/share/nginx/html/a-propos/
COPY --from=build /site/contact/ /usr/share/nginx/html/contact/
COPY --from=build /site/mentions-legales/ /usr/share/nginx/html/mentions-legales/
COPY --from=build /site/confidentialite/ /usr/share/nginx/html/confidentialite/
COPY --from=build /site/cgv/ /usr/share/nginx/html/cgv/
EXPOSE 80
