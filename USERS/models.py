# USERS/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings
from django.core.exceptions import ValidationError
from decimal import Decimal

# Add this new model for Sociétés d'Assistance
class SocieteAssistance(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    ice = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    # You can add more fields if needed, e.g., 'phone', 'email'

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Société d'Assistance"
        verbose_name_plural = "Sociétés d'Assistance"


class UserManager(BaseUserManager):
    def create_user(self, username, email, age=None, password=None, **extra_fields):
        if not username:
            raise ValueError('Username khass ykun m3mr!')
        if not email:
            raise ValueError('Email khass ykun m3mr!')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, age=age, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, age=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser khass ykun is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser khass ykun is_superuser=True.')
        return self.create_user(username, email, age, password, **extra_fields)

class USER(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    age = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    class Meta:
        ordering = ['-date_joined']

class GroupeIntervention(models.Model):
    groupe_id = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.groupe_id

    class Meta:
        ordering = ['-date_created']

class Intervention(models.Model):
    EVENT_CHOICES = [
        ('Remorquage Interurbain', 'Remorquage Interurbain'),
        ('Panne Mécanique', 'Panne Mécanique'),
        ('Accident', 'Accident'),
        ('Assistance', 'Assistance'),
    ]
    STATUS_CHOICES = [
        ('En cours', 'En cours'),
        ('Annulé', 'Annulé'),
        ('Complété', 'Complété'),
    ]

    user = models.ForeignKey('USER', on_delete=models.SET_NULL, null=True)
    # CHANGE THIS FIELD: Make it a ForeignKey to SocieteAssistance
    # societe_assistance = models.CharField(max_length=100, default="WAFA IMA ASSISTANCE")
    societe_assistance = models.ForeignKey(SocieteAssistance, on_delete=models.SET_NULL, null=True, blank=True, related_name='interventions_assigned')

    ref_dossier = models.CharField(max_length=50, db_index=True)
    groupe = models.ForeignKey('GroupeIntervention', on_delete=models.SET_NULL, null=True, blank=True)
    assure = models.CharField(max_length=100)
    date_intervention = models.DateField(null=True)
    evenement = models.CharField(max_length=100, choices=EVENT_CHOICES)
    immatriculation = models.CharField(max_length=50)
    marque = models.CharField(max_length=50)
    point_attach = models.CharField(max_length=100, default="TAMANAR")
    lieu_intervention = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    # cout_prestation_ttc and tva are already DecimalField, which is good.
    cout_prestation_ttc = models.DecimalField(max_digits=10, decimal_places=2)
    tva = models.DecimalField(max_digits=10, decimal_places=2, editable=False , default=0.2) # This TVA is calculated. If it's a rate, name it tva_rate.
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="En cours")

    def save(self, *args, **kwargs):
        # The frontend now calculates tva_amount, so this might not be needed if tva is the amount
        # If tva is the rate (e.g., 20 for 20%), then this calculation is still valid for internal consistency
        # Assuming `tva` field here represents the *amount* of TVA already.
        # If tva_rate is 20%, you should have a separate field for rate or just use a constant.
        # Let's assume `tva` is the *calculated amount* here.
        # If `self.tva` should be automatically calculated from `cout_prestation_ttc`
        # and a constant rate (e.g., 20%), then uncomment/adjust:
        # tva_rate_constant = Decimal('0.20') # 20%
        # montant_ht_calculated = self.cout_prestation_ttc / (Decimal('1.0') + tva_rate_constant)
        # self.tva = self.cout_prestation_ttc - montant_ht_calculated
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ref_dossier} - {self.assure}"

    class Meta:
        ordering = ['-date_intervention']

class Facture(models.Model):
    # This choice is now redundant if using ForeignKey to SocieteAssistance.
    # Keep it only if you want a categorical classification different from actual company name.
    SOCIETE_CHOICES = [
        ('MAI', 'MAI'),
        ('IMA', 'IMA'),
        ('RMA', 'RMA'),
    ]

    user = models.ForeignKey('USER', on_delete=models.SET_NULL, null=True)
    facture_num = models.CharField(max_length=50, unique=True, db_index=True)
    intervention = models.OneToOneField(Intervention, on_delete=models.CASCADE, null=True, blank=True)
    pdf_file = models.FileField(upload_to='factures_pdfs/', blank=True, null=True) # Ensure blank=True as well
    date = models.DateField()
    # CHANGE THIS FIELD: Use ForeignKey to SocieteAssistance for billing company
    # billing_company = models.CharField(max_length=100)
    billing_company_obj = models.ForeignKey(SocieteAssistance, on_delete=models.SET_NULL, null=True, blank=True, related_name='billed_factures')

    # Keep these if you want to explicitly store the derived name, ICE, address,
    # or allow manual override if not linking to SocieteAssistance object directly.
    # Otherwise, you can just use `billing_company_obj.nom`, `billing_company_obj.ice`, `billing_company_obj.adresse`
    # when reading the Facture object (e.g., in serializers or views).
    billing_company_name_display = models.CharField(max_length=100, blank=True, null=True) # To store the name for display
    ice = models.CharField(max_length=50, blank=True, null=True)
    adresse = models.CharField(max_length=200, blank=True, null=True)

    reference = models.CharField(max_length=50)
    point_attach = models.CharField(max_length=100, default="TAMANAR")
    lieu_intervention = models.CharField(max_length=100)
    destination = models.CharField(max_length=100, blank=True)
    perimetre = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    montant_ht = models.DecimalField(max_digits=10, decimal_places=2)
    tva = models.DecimalField(max_digits=10, decimal_places=2) # This is the TVA amount
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2)

    def clean(self):
        # Ensure calculated values are consistent.
        # This validation will run on `full_clean()`.
        # If the frontend is sending calculated values, this is a good double-check.
        if self.montant_ht is not None and self.tva is not None and self.montant_ttc is not None:
            # Using Decimal context for precision in validation
            expected_ttc = self.montant_ht + self.tva
            if abs(self.montant_ttc - expected_ttc) > Decimal('0.01'):
                raise ValidationError("Montant TTC doit être égal à Montant HT + TVA!")

    def save(self, *args, **kwargs):
        # Auto-populate display fields from linked SocieteAssistance object
        if self.billing_company_obj and not self.billing_company_name_display:
            self.billing_company_name_display = self.billing_company_obj.nom
        if self.billing_company_obj and not self.ice:
            self.ice = self.billing_company_obj.ice
        if self.billing_company_obj and not self.adresse:
            self.adresse = self.billing_company_obj.adresse

        self.full_clean() # Run clean method before saving
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Facture {self.facture_num}"

    class Meta:
        ordering = ['-date']

class AdminActionLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_actions_made'
    )
    admin_username = models.CharField(max_length=150, blank=True, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    model_name = models.CharField(max_length=100, blank=True)
    record_id = models.CharField(max_length=50, blank=True)
    severity_choices = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    severity = models.CharField(max_length=20, choices=severity_choices, default='Low')

    def __str__(self):
        return f"{self.timestamp.strftime('%Y-%m-%d %H:%M')} - {self.admin_username}: {self.action}"

    class Meta:
        ordering = ['-timestamp']

class SuiviCarburant(models.Model):
    user = models.ForeignKey('USER', on_delete=models.SET_NULL, null=True)
    date = models.DateField()
    vehicule = models.CharField(max_length=50)
    service = models.CharField(max_length=50)
    pompiste = models.CharField(max_length=50, blank=True)
    smitoStation = models.CharField(max_length=50, blank=True)
    prix = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.vehicule} - {self.date}"

    class Meta:
        ordering = ['-date']


