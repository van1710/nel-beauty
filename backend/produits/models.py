import uuid
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User

def valider_date_future(value):
    if value < timezone.now().date():
        raise ValidationError("Vous ne pouvez pas réserver dans le passé !")

class Produit(models.Model):
    CHOIX_CATEGORIE = [
        ('TRESSE', 'Tresse'),
        ('NAPPY', 'Nappy'),
        ('TISSAGE', 'Tissage'),
    ]
    nom_fr = models.CharField(max_length=100)
    nom_en = models.CharField(max_length=100)
    description_fr = models.TextField()
    description_en = models.TextField()
    categorie = models.CharField(max_length=20, choices=CHOIX_CATEGORIE, default='TRESSE')
    prix = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='coiffure/', null=True, blank=True)
    quantite = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.nom_fr} ({self.get_categorie_display()})"
        
class Reservation(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    email_client = models.EmailField()
    date_rdv = models.DateField(validators=[valider_date_future])
    heure_rdv = models.CharField(max_length=10) 
    numero_commande = models.CharField(max_length=20, unique=True, editable=False)
    est_paye = models.BooleanField(default=False)
    statut = models.CharField(max_length=20, choices=[('CONFIRME', 'Confirmé'), ('ANNULE', 'Annulé')], default='CONFIRME')
    stripe_id = models.CharField(max_length=255, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reservations')


    def save(self, *args, **kwargs):
        if not self.numero_commande:
            self.numero_commande = f"NB-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

        doublon_existe = Reservation.objects.filter(
            date_rdv=self.date_rdv,
            heure_rdv=self.heure_rdv,
            est_paye=True,
            statut='CONFIRME'
        ).exclude(pk=self.pk).exists()

        if doublon_existe:
            raise ValidationError("Désolé, ce créneau horaire (date et heure) est déjà réservé et payé par une autre cliente.")

        # 3. Si tout est beau, on enregistre dans MongoDB
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Réservation {self.numero_commande} - {self.email_client}"

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Avis(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='avis')
    nom_cliente = models.CharField(max_length=100)
    note = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    commentaire = models.TextField()
    
    # AJOUT : Pour permettre aux clientes de téléverser la photo de leurs tresses
    photo = models.ImageField(upload_to='avis_photos/', null=True, blank=True)
    
    date_publication = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Avis Client"
        verbose_name_plural = "Avis Clients"

    # AJOUT : Pour voir directement qui a écrit l'avis dans ton admin Django
    def __str__(self):
        return f"Avis de {self.nom_cliente} ({self.note}/5) pour {self.produit.nom}"