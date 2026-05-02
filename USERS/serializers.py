# USERS/serializers.py
from rest_framework import serializers
from .models import Facture, SuiviCarburant, Intervention, USER, AdminActionLog, SocieteAssistance, GroupeIntervention # Ensure SocieteAssistance is imported

# General User Serializer (unchanged)
class USERSerializer(serializers.ModelSerializer):
    class Meta:
        model = USER
        fields = ('id', 'username', 'email', 'age', 'is_active', 'is_staff')
        read_only_fields = ('id', 'is_staff')

# SocieteAssistance Serializer (unchanged - for general list/detail of societies)
class SocieteAssistanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocieteAssistance
        fields = '__all__'

# SocieteAssistanceNestedSerializer (To return full society details within Intervention GET responses)
class SocieteAssistanceNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocieteAssistance
        fields = ['id', 'nom', 'ice', 'adresse'] # Specify fields you want to include in nested representation

# Intervention Serializer
class InterventionSerializer(serializers.ModelSerializer):
    user = USERSerializer(read_only=True)
    # This field is for reading (GET) - it will return the nested object if linked
    societe_assistance = SocieteAssistanceNestedSerializer(read_only=True, required=False, allow_null=True)

    # This field is for writing (POST/PUT) - frontend sends the ID, backend resolves to object
    # It takes the ID (number) for writing, and then the create/update methods handle the assignment.
    # It must be write_only to avoid conflict with the read_only nested serializer.
    societe_assistance_id = serializers.PrimaryKeyRelatedField(
        queryset=SocieteAssistance.objects.all(),
        source='societe_assistance', # Map this write-only field to the actual ForeignKey field
        write_only=True, # This field is only for sending data to the API
        required=False,
        allow_null=True
    )

    class Meta:
        model = Intervention
        # Include both societe_assistance (for read) and societe_assistance_id (for write)
        fields = '__all__' # This implicitly includes all model fields and also the custom ones defined above.

    # REMOVED: validate_ref_dossier method to allow non-unique ref_dossier
    # def validate_ref_dossier(self, value):
    #     if self.instance and self.instance.ref_dossier == value:
    #         return value
    #     if Intervention.objects.filter(ref_dossier=value).exists():
    #         raise serializers.ValidationError("Référence dossier déjà utilisée!")
    #     return value

    # Override create and update methods to handle the writable nested ForeignKey correctly
    def create(self, validated_data):
        # Pop the nested serializer data if it's there (it will be an object if read_only=False was used)
        # However, with PrimaryKeyRelatedField (societe_assistance_id), the validated_data will already contain the actual SocieteAssistance object.
        # So we just ensure it's popped only if it was included directly.
        # The 'source' argument in PrimaryKeyRelatedField handles putting the correct object directly into validated_data under the FK name.
        
        # If 'societe_assistance' (the object) was passed directly in validated_data from a writable nested serializer
        # (which is not the case now with PrimaryKeyRelatedField), we would handle it here.
        
        # With PrimaryKeyRelatedField (societe_assistance_id mapped to societe_assistance),
        # validated_data already has the actual object for societe_assistance.
        
        return Intervention.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Similar to create, PrimaryKeyRelatedField handles the object assignment.
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

# Facture Serializer
class FactureSerializer(serializers.ModelSerializer):
    user = USERSerializer(read_only=True)
    intervention = serializers.PrimaryKeyRelatedField(
        queryset=Intervention.objects.all(),
        required=False,
        allow_null=True
    )
    billing_company_obj = serializers.PrimaryKeyRelatedField(
        queryset=SocieteAssistance.objects.all(),
        required=False,
        allow_null=True
    )
    billing_company_name_display = serializers.CharField(source='billing_company_obj.nom', read_only=True)

    class Meta:
        model = Facture
        fields = '__all__'

    def validate_facture_num(self, value):
        if self.instance and self.instance.facture_num == value:
            return value
        if Facture.objects.filter(facture_num=value).exists():
            raise serializers.ValidationError("Numéro facture déjà utilisé!")
        return value

# GroupeIntervention Serializer (unchanged)
class GroupeInterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupeIntervention
        fields = '__all__'

    def validate_groupe_id(self, value):
        if GroupeIntervention.objects.filter(groupe_id=value).exists():
            raise serializers.ValidationError("Groupe ID déjà utilisé!")
        return value

# SuiviCarburant Serializer (unchanged)
class SuiviCarburantSerializer(serializers.ModelSerializer):
    user = USERSerializer(read_only=True)

    class Meta:
        model = SuiviCarburant
        fields = '__all__'

# AdminActionLog Serializer (unchanged)
class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin_user.username', read_only=True)

    class Meta:
        model = AdminActionLog
        fields = ['id', 'timestamp', 'admin_username', 'action', 'details', 'severity']
        read_only_fields = ['id', 'timestamp', 'admin_username']


class InterventionSerializer(serializers.ModelSerializer):
    user = USERSerializer(read_only=True)
    # This field is for reading (GET) - it will return the nested object if linked
    societe_assistance = SocieteAssistanceNestedSerializer(read_only=True, required=False, allow_null=True) # <<< PROBLEM LINE
    # This field is for writing (POST/PUT) - frontend sends the ID, backend resolves to object
    societe_assistance_id = serializers.PrimaryKeyRelatedField(
        queryset=SocieteAssistance.objects.all(),
        source='societe_assistance',
        write_only=True,
        required=False,
        allow_null=True
    )
    class Meta:
        model = Intervention
        fields = '__all__'
    # ...        

# USERS/serializers.py
from rest_framework import serializers
from .models import Facture, SuiviCarburant, Intervention, USER, AdminActionLog, SocieteAssistance, GroupeIntervention

# ... (USERSerializer, SocieteAssistanceSerializer, SocieteAssistanceNestedSerializer remain the same) ...

class InterventionSerializer(serializers.ModelSerializer):
    user = USERSerializer(read_only=True)
    # This field is for reading (GET) - it will return the nested object if linked
    societe_assistance = SocieteAssistanceNestedSerializer(read_only=True, required=False, allow_null=True)

    # This field is for writing (POST/PUT) - frontend sends the ID, backend resolves to object.
    # We rename it to 'societe_assistance_id_writeable' to clearly separate it from the read-only nested field.
    # 'source' maps it to the actual model field name.
    societe_assistance_id_writeable = serializers.PrimaryKeyRelatedField( # CHANGED NAME for clarity
        queryset=SocieteAssistance.objects.all(),
        source='societe_assistance', # Maps to the 'societe_assistance' ForeignKey field in the model
        write_only=True, # This field is only for sending data to the API
        required=False, # If societe_assistance is not always required (based on model)
        allow_null=True # If societe_assistance can be null in model
    )

    class Meta:
        model = Intervention
        # Include all fields from the model.
        # When creating/updating, DRF uses writeable fields first.
        # For GET, it will use the nested 'societe_assistance' field if defined.
        fields = '__all__'

    # REMOVED: validate_ref_dossier method (based on previous discussion that it's non-unique)
    # If ref_dossier is still unique=True in models.py, this validation is still needed.
    # Assuming it's now unique=False or removed from models.

    # Override create and update methods to ensure proper handling of fields
    def create(self, validated_data):
        # 'societe_assistance' (the model object) will be directly in validated_data
        # because of the `source='societe_assistance'` on `societe_assistance_id_writeable`
        # and `PrimaryKeyRelatedField` handles the object conversion for you.
        
        # Ensure user is set if it's required by the model and not provided by `validated_data`
        # (This is typically handled by `serializer.save(user=request.user)` in the view)
        
        # DEBUG: Check validated_data before creation
        print("Serializer CREATE: validated_data:", validated_data)

        intervention = Intervention.objects.create(**validated_data) # Create directly
        return intervention

    def update(self, instance, validated_data):
        # The `societe_assistance` key in validated_data will contain the SocieteAssistance object
        # because of `PrimaryKeyRelatedField` and `source='societe_assistance'`.
        
        # DEBUG: Check validated_data before update
        print("Serializer UPDATE: validated_data:", validated_data)

        # Update direct fields on the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

# ... (FactureSerializer, SuiviCarburantSerializer, AdminActionLogSerializer, GroupeInterventionSerializer remain the same) ...    


# C:\samba\wafadash\USERS\serializers.py

from rest_framework import serializers
from .models import USER, Intervention, SuiviCarburant, Facture, AdminActionLog, SocieteAssistance

class USERSerializer(serializers.ModelSerializer):
    class Meta:
        model = USER
        fields = ['id', 'username', 'email', 'age', 'is_active', 'is_staff', 'date_joined']

class SocieteAssistanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocieteAssistance
        fields = ['id', 'nom', 'ice', 'adresse']

class InterventionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    societe_assistance = SocieteAssistanceSerializer(read_only=True)
    societe_assistance_id = serializers.PrimaryKeyRelatedField(
        queryset=SocieteAssistance.objects.all(), source='societe_assistance', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Intervention
        fields = '__all__'

class SuiviCarburantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = SuiviCarburant
        fields = '__all__'

# هذا هو الـ serializer المصحح
class FactureSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    intervention = serializers.StringRelatedField()
    
    # NEW: هذا السطر كيخلي الـ serializer يعرض الـ nom ديال الـ société مباشرة
    billing_company = serializers.CharField(source='billing_company_name_display', read_only=True)

    class Meta:
        model = Facture
        fields = ['id', 'facture_num', 'date', 'billing_company', 'montant_ttc', 'user', 'intervention']
        read_only_fields = ['facture_num']

class AdminActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminActionLog
        fields = '__all__'





# ... (Keep all other serializers like USERSerializer, InterventionSerializer, etc.)

# This is the corrected serializer for SuiviCarburant
class SuiviCarburantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SuiviCarburant
        # By explicitly listing the fields, you guarantee 'smitoStation' is included
        # in the API response if it exists in the database record.
        fields = [
            'id', 
            'vehicule', 
            'date', 
            'prix', 
            'service', 
            'pompiste', 
            'smitoStation', # The field that was causing the "N/A" issue
            'user'
        ]

# ... (Keep the rest of the file, like AdminActionLogSerializer, etc.)
