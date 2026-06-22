from django.urls import path, include
from rest_framework import routers
from . import views 
from .views import (
    login_user, 
    register_user, 
    verifier_annulation, 
    creer_session_paiement, 
    stripe_webhook, 
    reset_password_request, 
    mes_reservations,
    confirmer_paiement_session,
    dates_occupees
)

router = routers.DefaultRouter()
router.register(r'produits', views.ProduitView, basename='produit')
router.register(r'avis', views.AvisView, basename='avis')

urlpatterns = [
    path('', include(router.urls)), 
    path('login/', login_user, name='login'),
    path('register/', register_user, name='register'),
    path('creer-session-paiement/', creer_session_paiement, name='creer_session_paiement'),
    path('webhook/stripe/', stripe_webhook, name='stripe_webhook'),
    path('verifier-annulation/', verifier_annulation, name='verifier_annulation'),
    path('reset-password/', reset_password_request, name='reset_password'),
    path('mes-reservations/', mes_reservations, name='mes_reservations'),
    path('confirmer-paiement/', confirmer_paiement_session, name='confirmer_paiement_session'),
    path('dates-occupees/', dates_occupees, name='dates_occupees'),
]