from rest_framework import serializers
from .models import Produit, Reservation, Avis

class AvisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avis
        fields = ['id', 'produit', 'nom_cliente', 'note', 'commentaire', 'date_publication']

class ProduitSerializer(serializers.ModelSerializer):
    avis = AvisSerializer(many=True, read_only=True)
    class Meta:
        model = Produit
        fields = ['id', 'nom_fr', 'nom_en', 'description_fr', 'description_en', 'categorie', 'prix', 'image',  'avis']