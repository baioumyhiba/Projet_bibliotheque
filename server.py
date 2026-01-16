#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Serveur Python simple pour gérer les modifications des fichiers XML
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
import xml.etree.ElementTree as ET
import os
import json

class XMLHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        """Ajouter les headers CORS à toutes les réponses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        SimpleHTTPRequestHandler.end_headers(self)
    
    def do_OPTIONS(self):
        """Gérer les requêtes CORS preflight"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Servir les fichiers statiques (HTML, CSS, JS, XML, etc.)"""
        # Utiliser la méthode parente pour servir les fichiers
        return SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        """Gérer les requêtes POST pour sauvegarder les fichiers XML"""
        if self.path == '/save-xml':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                # Parser les données JSON
                data = json.loads(post_data.decode('utf-8'))
                file_path = data.get('file')
                xml_content = data.get('xml')
                
                if not file_path or not xml_content:
                    self.send_error(400, "Missing file or xml parameter")
                    return
                
                # Sécuriser le chemin (empêcher l'accès en dehors du répertoire data)
                if not file_path.startswith('data/'):
                    self.send_error(403, "Access denied: file must be in data/ directory")
                    return
                
                # Sauvegarder le fichier XML
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(xml_content)
                
                # Réponse de succès
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'File saved successfully'}).encode('utf-8'))
                
            except json.JSONDecodeError:
                self.send_error(400, "Invalid JSON")
            except Exception as e:
                self.send_error(500, f"Error saving file: {str(e)}")
        else:
            self.send_error(404, "Not found")
    
    def log_message(self, format, *args):
        """Override pour éviter les logs verbeux"""
        pass

def run(port=8000):
    """Démarrer le serveur"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, XMLHandler)
    print("=" * 60)
    print(f"✅ Serveur Python démarré avec succès!")
    print(f"📍 URL: http://localhost:{port}/")
    print(f"📝 Support: GET (fichiers statiques) + POST (sauvegarde XML)")
    print("=" * 60)
    print("Appuyez sur Ctrl+C pour arrêter le serveur")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du serveur...")
        httpd.server_close()
        print("✅ Serveur arrêté")

if __name__ == '__main__':
    run()


