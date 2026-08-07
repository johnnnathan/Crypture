FROM nginx:alpine

COPY ./frontend/app/ /usr/share/nginx/html

EXPOSE 80
