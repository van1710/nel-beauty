from django.contrib import admin
from .models import Produit, Reservation

admin.site.register(Produit)

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    # Colonnes affichées dans la liste
    list_display = ('numero_commande', 'email_client', 'produit', 'date_rdv', 'est_paye')
    # Champs de recherche
    search_fields = ('numero_commande', 'email_client')
    # Filtres sur le côté
    list_filter = ('est_paye', 'date_rdv', 'produit')