from rest_framework import serializers
from .models import Produit, Reservation, Avis

class AvisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avis
        fields = ['id', 'produit', 'nom_cliente', 'note', 'commentaire', 'photo', 'date_publication']

class ProduitSerializer(serializers.ModelSerializer):
    avis = AvisSerializer(many=True, read_only=True)
    nom = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Produit
        fields = ['id', 'nom', 'description', 'categorie', 'prix', 'image', 'avis']

    def get_nom(self, obj):
        # Récupère la langue depuis la requête (ex: /api/produits/?lang=en)
        lang = self.context['request'].query_params.get('lang', 'fr')
        return obj.nom_en if lang == 'en' else obj.nom_fr

    def get_description(self, obj):
        lang = self.context['request'].query_params.get('lang', 'fr')
        return obj.description_en if lang == 'en' else obj.description_fr