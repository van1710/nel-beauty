import sqlite3
import psycopg2

# 1. Connexion à l'ancienne base SQLite
conn_sqlite = sqlite3.connect('db.sqlite3')
cursor_sqlite = conn_sqlite.cursor()

# 2. Connexion à ta nouvelle base PostgreSQL
# Remplis avec les vrais identifiants de ton settings.py
conn_postgres = psycopg2.connect(
    dbname="ton_nom_de_base",
    user="ton_utilisateur",
    password="ton_mot_de_passe",
    host="localhost",
    port="5432"
)
cursor_postgres = conn_postgres.cursor()

print("Début de la migration des produits...")

try:
    # Récupérer les produits de SQLite
    cursor_sqlite.execute("SELECT id, nom, prix, categorie, description_fr, description_en, nom_fr, nom_en FROM produits_produit;")
    produits = cursor_sqlite.fetchall()

    for p in produits:
        # Insérer les produits dans PostgreSQL (on ignore s'ils existent déjà)
        cursor_postgres.execute(
            """
            INSERT INTO produits_produit (id, nom, prix, categorie, description_fr, description_en, nom_fr, nom_en)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
            """,
            p
        )
    
    conn_postgres.commit()
    print(f"Succès ! {len(produits)} produits ont été transférés directement vers PostgreSQL.")

except Exception as e:
    print(f"Erreur lors de la migration : {e}")

finally:
    cursor_sqlite.close()
    conn_sqlite.close()
    cursor_postgres.close()
    conn_postgres.close()