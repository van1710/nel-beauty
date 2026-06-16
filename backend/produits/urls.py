from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    dates_occupees, 
    creer_session_paiement, 
    stripe_webhook, 
    mes_reservations, 
    verifier_annulation, 
    register_user, 
    login_user, 
    reset_password_request,
    ProduitView, 
    AvisView,
    confirmer_paiement_session  # Route importée ici
)

router = DefaultRouter()
router.register(r'produits', ProduitView, basename='produit')
router.register(r'avis', AvisView, basename='avis')

urlpatterns = [
    path('', include(router.urls)),
    path('dates-occupees/', dates_occupees, name='dates_occupees'),
    path('creer-session-paiement/', creer_session_paiement, name='creer_session_paiement'),
    path('stripe-webhook/', stripe_webhook, name='stripe_webhook'),
    path('mes-reservations/', mes_reservations, name='mes_reservations'),
    path('verifier-annulation/', verifier_annulation, name='verifier_annulation'),
    path('register/', register_user, name='register_user'),
    path('login/', login_user, name='login_user'),
    path('reset-password/', reset_password_request, name='reset_password_request'),
    
    # URL de secours pour déclencher la confirmation sans passer par un webhook en local
    path('confirmer-paiement/', confirmer_paiement_session, name='confirmer_paiement_session'),
]