import stripe, json, random, string
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login

from django.db import transaction, IntegrityError

from rest_framework import viewsets
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Produit, Reservation, Avis
from .serializers import ProduitSerializer, AvisSerializer

# --- RÉCUPÉRATION DES CRÉNEAUX OCCUPÉS ---
@api_view(['GET'])
@permission_classes([AllowAny])
def dates_occupees(request):
    reservations = Reservation.objects.filter(est_paye=True, statut='CONFIRME')
    dates_prises = []
    for r in reservations:
        if r.date_rdv and r.heure_rdv:
            dates_prises.append(f"{r.date_rdv}T{r.heure_rdv}")
    return Response({"datesOccupees": dates_prises})

# Configuration Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# --- VUES GÉNÉRIQUES ---
class ProduitView(viewsets.ModelViewSet):
    serializer_class = ProduitSerializer
    queryset = Produit.objects.all()

class AvisView(viewsets.ModelViewSet):
    serializer_class = AvisSerializer
    queryset = Avis.objects.all()

# --- LOGIQUE DE PAIEMENT STRIPE (BILINGUE) ---
@api_view(['POST'])
@permission_classes([AllowAny])
def creer_session_paiement(request):
    try:
        data = request.data
        produit = Produit.objects.get(id=data.get('produit_id'))
        prix_final = float(produit.prix) * 0.70
        montant_acompte = prix_final * 0.30
        
        # On intercepte la langue choisie sur le site (fr par défaut)
        langue_front = data.get('langue', 'fr')
        
        # 👑 LA CORRECTION : Définition propre de la variable nom_produit bilingue
        nom_produit = produit.nom_fr if langue_front == 'fr' else produit.nom_en
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'cad',
                    'product_data': {
                        'name': f"Deposit - {nom_produit}" if langue_front == 'en' else f"Acompte - {nom_produit}"
                    },
                    'unit_amount': int(montant_acompte * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:3000/paiement-reussi?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=f'http://localhost:3000/reserver/{produit.id}',
            # Envoi de la langue dans les métadonnées pour que le Webhook puisse la lire
            metadata={
                'produit_id': produit.id, 
                'date_rdv': data.get('date'), 
                'heure_rdv': data.get('heure'),
                'langue': langue_front
            }
        )
        return JsonResponse({'url': session.url})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    try:
        event = stripe.Event.construct_from(json.loads(payload), stripe.api_key)
    except Exception:
        return HttpResponse(status=400)

    if event['type'] == 'checkout.session.completed':
        session_obj = event['data']['object']
        session = session_obj._to_dict_recursive()
        meta = session['metadata']
        email_client = session['customer_details']['email']
        prod = Produit.objects.get(id=meta['produit_id'])

        user_associe = User.objects.filter(email=email_client).first()
        stripe_transaction_id = session.get('payment_intent') or session.get('id')

        res = Reservation.objects.create(
            user=user_associe,
            produit=prod, 
            email_client=email_client,
            date_rdv=meta['date_rdv'], 
            heure_rdv=meta['heure_rdv'], 
            est_paye=True,
            stripe_id=stripe_transaction_id
        )

        # ✉️ MAIL 1 : CONFIRMATION DE RENDEZ-VOUS BILINGUE
        langue_client = meta.get('langue', 'fr').lower()

        if langue_client == 'en':
            sujet = "Appointment Confirmation - Nel Beauty ✨"
            message_corps = (
                f"Hello,\n\n"
                f"We are pleased to confirm your booking for: {prod.nom}.\n\n"
                f"📍 Details:\n"
                f"- Date: {res.date_rdv}\n"
                f"- Time: {res.heure_rdv}\n"
                f"- Order Reference: {res.numero_commande}\n\n"
                f"The 30% deposit has been successfully received. The remaining balance will be due at the salon.\n\n"
                f"⚠️ Cancellation Policy:\n"
                f"Free cancellation is available up to 24 hours before your appointment. Past this deadline, the deposit will be retained.\n\n"
                f"See you soon,\nThe Nel Beauty Team"
            )
        else:
            sujet = "Confirmation de votre rendez-vous - Nel Beauty ✨"
            message_corps = (
                f"Bonjour,\n\n"
                f"Nous avons le plaisir de vous confirmer votre réservation pour : {prod.nom}.\n\n"
                f"📍 Détails :\n"
                f"- Date : {res.date_rdv}\n"
                f"- Heure : {res.heure_rdv}\n"
                f"- Numéro de commande : {res.numero_commande}\n\n"
                f"L'acompte de 30% a été reçu. Le reste sera à régler sur place.\n\n"
                f"⚠️ Politique d'annulation :\n"
                f"Annulation gratuite jusqu'à 24h avant le rendez-vous. Passé ce délai, l'acompte est conservé.\n\n"
                f"À très bientôt,\nL'équipe Nel Beauty"
            )
        
        send_mail(sujet, message_corps, settings.EMAIL_HOST_USER, [email_client])

    return HttpResponse(status=200)

# --- HISTORIQUE DES RÉSERVATIONS ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_reservations(request):
    reservations = Reservation.objects.filter(user=request.user).order_by('-date_rdv')
    data = []
    for r in reservations:
        data.append({
            "id": r.id,
            "coiffure": r.produit.nom,
            "date": r.date_rdv,
            "heure": r.heure_rdv,
            "numero": r.numero_commande,
            "paye": r.est_paye,
            "statut": r.statut
        })
    return Response(data)

# --- LOGIQUE D'ANNULATION AVEC REMBOURSEMENT AUTOMATIQUE STRIPE (BILINGUE) ---
@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def verifier_annulation(request):
    try:
        data = request.data
        email = data.get('email')
        numero = data.get('numero_commande')
        langue_client = data.get('langue', 'fr').lower()
        
        resa = Reservation.objects.get(email_client=email, numero_commande=numero)
        
        if resa.statut == 'ANNULE':
            msg_deja = "This reservation is already cancelled." if langue_client == 'en' else "Cette réservation est déjà annulée."
            return JsonResponse({'status': 'error', 'message': msg_deja}, status=400)

        maintenant = timezone.now().date()
        difference = resa.date_rdv - maintenant

        if difference >= timedelta(days=1):
            # 👑 CORRECTION SÉCURISÉE : S'adapte aux champs nom_fr et nom_en du modèle Produit
            nom_coiffure = resa.produit.nom_fr if langue_client == 'fr' else resa.produit.nom_en
            email_dest = resa.email_client

            # Remboursement via l'API Stripe
            if resa.stripe_id and resa.est_paye:
                try:
                    if resa.stripe_id.startswith('cs_'):
                        session_stripe = stripe.checkout.Session.retrieve(resa.stripe_id)
                        stripe.Refund.create(payment_intent=session_stripe.payment_intent)
                    else:
                        stripe.Refund.create(payment_intent=resa.stripe_id)
                except stripe.error.StripeError as stripe_err:
                    return JsonResponse({'status': 'error', 'message': f"Stripe Error : {str(stripe_err)}"}, status=500)

            # ✉️ MAIL 2 : CONFIRMATION D'ANNULATION BILINGUE
            if langue_client == 'en':
                sujet_annul = "Cancellation & Refund Confirmed - Nel Beauty ❌"
                corps_annul = (
                    f"Hello,\n\n"
                    f"Your cancellation for {nom_coiffure} (Order: {numero}) has been successfully processed.\n"
                    f"In accordance with our policy, your deposit has been fully refunded to your card (allow 5 to 10 business days depending on your bank).\n\n"
                    f"Best regards,\nThe Nel Beauty Team"
                )
            else:
                sujet_annul = "Annulation et Remboursement confirmés - Nel Beauty ❌"
                corps_annul = (
                    f"Bonjour,\n\n"
                    f"Votre annulation pour {nom_coiffure} (Commande: {numero}) a bien été prise en compte.\n"
                    f"Conformément à nos politiques, votre acompte a été automatiquement recrédité sur votre carte bancaire (délai de 5 à 10 jours selon votre banque).\n\n"
                    f"À bientôt,\nL'équipe Nel Beauty"
                )

            send_mail(sujet_annul, corps_annul, settings.EMAIL_HOST_USER, [email_dest])
            
            # Sauvegarde des modifications de statut
            resa.statut = 'ANNULE'
            resa.est_paye = False
            resa.save()
            
            msg_succes = "Your appointment has been cancelled and deposit refunded." if langue_client == 'en' else "Votre rendez-vous a été annulé et votre acompte remboursé."
            return JsonResponse({'status': 'success', 'message': msg_succes})
        else:
            msg_delai = "Cancellation deadline exceeded (24h rule)." if langue_client == 'en' else "Délai des 24h dépassé. L'annulation est impossible."
            return JsonResponse({'status': 'error', 'message': msg_delai}, status=400)
            
    except Reservation.DoesNotExist:
        msg_introuvable = "Booking not found." if langue_client == 'en' else "Réservation introuvable. Vérifiez vos informations."
        return JsonResponse({'status': 'error', 'message': msg_introuvable}, status=404)

# --- AUTHENTICATION & ENREGISTREMENT (BILINGUE) ---
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    email = request.data.get('email')
    password = request.data.get('password')
    langue_client = request.data.get('langue', 'fr').lower()

    if User.objects.filter(username=email).exists():
        msg_existe = "This user already exists." if langue_client == 'en' else "Cet utilisateur existe déjà."
        return Response({"error": msg_existe}, status=400)
    
    try:
        User.objects.create_user(username=email, email=email, password=password)
        
        # ✉️ MAIL 3 : BIENVENUE BILINGUE
        if langue_client == 'en':
            sujet_welcome = "Welcome to Nel Beauty! ✨"
            corps_welcome = (
                f"Hello,\n\n"
                f"Your account has been successfully created with the email: {email}.\n"
                f"You can now log in to view your upcoming appointments and manage your profile.\n\n"
                f"Thank you for your trust,\nThe Nel Beauty Team"
            )
        else:
            sujet_welcome = "Bienvenue chez Nel Beauty ! ✨"
            corps_welcome = (
                f"Bonjour,\n\n"
                f"Votre account a été créé avec succès avec l'adresse e-mail : {email}.\n"
                f"Vous pouvez dès à présent vous connecter pour suivre vos rendez-vous et gérer votre profil.\n\n"
                f"Merci de votre confiance,\nL'équipe Nel Beauty"
            )
            
        send_mail(sujet_welcome, corps_welcome, settings.EMAIL_HOST_USER, [email])
        return Response({"message": "Succès !"}, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({"message": "Connexion réussie"}, status=200)
    return Response({"error": "E-mail ou mot de passe incorrect."}, status=400)

# --- RESET MOT DE PASSE ---
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_request(request):
    email = request.data.get('email')
    user = User.objects.filter(email=email).first()
    if user:
        temp_pass = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        user.set_password(temp_pass)
        user.save()
        send_mail(
            "Nouveau mot de passe temporaire - Nel Beauty",
            f"Votre mot de passe temporaire est : {temp_pass}",
            settings.EMAIL_HOST_USER, [email],
        )
        return Response({"message": "Email envoyé !"}, status=200)
    return Response({"error": "Utilisateur non trouvé"}, status=404)


# --- 👑 AJOUT FINAL : CONFIRMATION DIRECTE EN LOCAL VIA LE FRONTEND NEXT.JS ---
@api_view(['POST'])
@permission_classes([AllowAny])
def confirmer_paiement_session(request):
    try:
        session_id = request.data.get('session_id')
        if not session_id:
            return JsonResponse({'error': 'session_id manquant'}, status=400)

        session_obj = stripe.checkout.Session.retrieve(session_id)
        session = session_obj._to_dict_recursive()
        
        metadata = session.get('metadata', {}) or {}
        customer_details = session.get('customer_details', {}) or {}
        email_client = customer_details.get('email')
        
        if not email_client:
            return JsonResponse({'message': 'Aucun email trouve dans la session'}, status=200)
            
        produit_id = metadata.get('produit_id')
        try:
            prod = Produit.objects.get(id=produit_id)
        except Produit.DoesNotExist:
            return JsonResponse({'error': 'Produit introuvable'}, status=400)

        user_associe = User.objects.filter(email=email_client).first()
        payment_intent = session.get('payment_intent')
        stripe_transaction_id = payment_intent or session_id

        reservation = Reservation.objects.filter(stripe_session_id=session_id).first()

        if not reservation:
            cree = False
            while not cree:
                try:
                    with transaction.atomic():
                        code_aleatoire = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
                        nouveau_numero = f"NB-{code_aleatoire}"
                        
                        reservation = Reservation.objects.create(
                            user=user_associe,
                            produit=prod,
                            email_client=email_client,
                            date_rdv=metadata.get('date_rdv'),
                            heure_rdv=metadata.get('heure_rdv'),
                            est_paye=True,
                            stripe_id=stripe_transaction_id,
                            stripe_session_id=session_id,
                            numero_commande=nouveau_numero,
                            statut='CONFIRME'
                        )
                        cree = True
                except IntegrityError:
                    continue
        else:
            if not reservation.est_paye:
                reservation.est_paye = True
                reservation.stripe_id = stripe_transaction_id
                reservation.save()

        langue_client = metadata.get('langue', 'fr').lower()
        nom_final_produit = prod.nom_en if langue_client == 'en' else prod.nom_fr

        if langue_client == 'en':
            sujet = "Appointment Confirmation - Nel Beauty ✨"
            message_corps = (
                f"Hello,\n\n"
                f"We are pleased to confirm your booking for: {nom_final_produit}.\n\n"
                f"📍 Details:\n"
                f"- Date: {reservation.date_rdv}\n"
                f"- Time: {reservation.heure_rdv}\n"
                f"- Order Reference: {reservation.numero_commande}\n\n"
                f"The 30% deposit has been successfully received. The remaining balance will be due at the salon.\n\n"
                f"⚠️ Cancellation Policy:\n"
                f"Free cancellation is available up to 24 hours before your appointment. Past this deadline, the deposit will be retained.\n\n"
                f"See you soon,\nThe Nel Beauty Team"
            )
        else:
            sujet = "Confirmation de votre rendez-vous - Nel Beauty ✨"
            message_corps = (
                f"Bonjour,\n\n"
                f"Nous avons le plaisir de vous confirmer votre réservation pour : {nom_final_produit}.\n\n"
                f"📍 Détails :\n"
                f"- Date : {reservation.date_rdv}\n"
                f"- Heure : {reservation.heure_rdv}\n"
                f"- Numéro de commande : {reservation.numero_commande}\n\n"
                f"L'acompte de 30% a été reçu. Le reste sera à régler sur place.\n\n"
                f"⚠️ Politique d'annulation :\n"
                f"Annulation gratuite jusqu'à 24h avant le rendez-vous. Passé ce délai, l'acompte est conservé.\n\n"
                f"À très bientôt,\nL'équipe Nel Beauty"
            )

        send_mail(sujet, message_corps, settings.EMAIL_HOST_USER, [email_client])
        return JsonResponse({'status': 'success', 'message': 'Reservation validee et mail envoye !'})

    except Exception as e:
        print("❌ ERREUR DANS CONFIRMER_PAIEMENT :", str(e))
        return JsonResponse({'error': str(e)}, status=500)