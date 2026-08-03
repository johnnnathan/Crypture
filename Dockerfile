FROM nginx:alpine

COPY ./frontend/src/ /usr/share/nginx/html

EXPOSE 80
