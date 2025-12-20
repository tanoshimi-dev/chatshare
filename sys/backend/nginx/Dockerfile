FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directory for static files
RUN mkdir -p /usr/share/nginx/html/static

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
