#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Serveur Python simple pour gérer :
- sauvegarde des fichiers XML
- ajout et lecture des notifications (Observer côté backend)
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import xml.etree.ElementTree as ET
import os
import json
from urllib.parse import urlparse, parse_qs

DATA_DIR = "data"
NOTIF_JSON = os.path.join(DATA_DIR, "notifications.json")

class XMLHandler(SimpleHTTPRequestHandler):

    # ===============================
    # CORS
    # ===============================
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    # ===============================
    # GET
    # ===============================
    def do_GET(self):
        parsed = urlparse(self.path)

        # 🔔 GET /notifications?userId=xxx
        if parsed.path == "/notifications":
            query = parse_qs(parsed.query)
            user_id = query.get("userId", [None])[0]

            if not os.path.exists(NOTIF_JSON):
                self._send_json([])
                return

            with open(NOTIF_JSON, "r", encoding="utf-8") as f:
                all_notifs = json.load(f)

            # Si userId est "all", retourner toutes les notifications
            # Sinon, retourner seulement celles de l'utilisateur ou "all"
            if user_id and user_id != "all":
                all_notifs = [n for n in all_notifs if n.get("userId") == user_id or n.get("userId") == "all"]
            elif user_id == "all":
                # Retourner toutes les notifications (celles avec userId="all")
                all_notifs = [n for n in all_notifs if n.get("userId") == "all"]

            # Trier par timestamp décroissant (plus récentes en premier)
            all_notifs.sort(key=lambda x: x.get("timestamp", 0), reverse=True)

            self._send_json(all_notifs)
            return

        # fichiers statiques (html, js, xml…)
        return super().do_GET()

    # ===============================
    # POST
    # ===============================
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        # ===============================
        # 1️⃣ SAVE XML
        # ===============================
        if self.path == "/save-xml":
            try:
                data = json.loads(post_data.decode("utf-8"))
                file_path = data.get("file")
                xml_content = data.get("xml")

                if not file_path or not xml_content:
                    self.send_error(400, "Missing file or xml")
                    return

                if not file_path.startswith("data/"):
                    self.send_error(403, "Access denied")
                    return

                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(xml_content)

                self._send_json({"success": True, "message": "XML saved"})

            except Exception as e:
                self.send_error(500, str(e))

        # ===============================
        # 2️⃣ ADD NOTIFICATION (Observer)
        # ===============================
        elif self.path == "/add-notification":
            try:
                data = json.loads(post_data.decode("utf-8"))

                user_id = data.get("userId")
                message = data.get("message")
                notif_type = data.get("type", "info")

                if not message:
                    self.send_error(400, "Missing message")
                    return

                # créer data/ si absent
                os.makedirs(DATA_DIR, exist_ok=True)

                # charger les notifications existantes
                notifications = []
                if os.path.exists(NOTIF_JSON):
                    with open(NOTIF_JSON, "r", encoding="utf-8") as f:
                        notifications = json.load(f)

                # Si userId est "all", créer une notification pour tous les utilisateurs
                # Sinon, créer une notification pour l'utilisateur spécifique
                import time
                timestamp = int(time.time() * 1000)  # Timestamp en millisecondes

                new_notif = {
                    "id": f"notif_{int(time.time() * 1000)}",  # ID unique basé sur timestamp
                    "userId": user_id if user_id else "all",
                    "message": message,
                    "type": notif_type,
                    "read": False,
                    "timestamp": timestamp
                }

                notifications.append(new_notif)

                # Limiter à 100 notifications (garder seulement les plus récentes)
                if len(notifications) > 100:
                    notifications = notifications[-100:]

                with open(NOTIF_JSON, "w", encoding="utf-8") as f:
                    json.dump(notifications, f, indent=2, ensure_ascii=False)

                self._send_json({"success": True})

            except Exception as e:
                self.send_error(500, str(e))

        else:
            self.send_error(404, "Not found")

    # ===============================
    # Helpers
    # ===============================
    def _send_json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        pass


def run(port=8000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, XMLHandler)

    print("=" * 60)
    print("✅ Serveur démarré")
    print(f"📍 http://localhost:{port}")
    print("📝 POST /save-xml")
    print("🔔 POST /add-notification")
    print("📥 GET  /notifications?userId=xxx")
    print("=" * 60)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Serveur arrêté")
        httpd.server_close()


if __name__ == "__main__":
    run()
