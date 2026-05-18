from rest_framework import serializers
from .models import Facture, SuiviCarburant, Intervention, USER, AdminActionLog, SocieteAssistance, GroupeIntervention


class USERSerializer(serializers.ModelSerializer):
    class Meta:
        model = USER
        fields = ['id', 'username', 'email', 'age', 'is_active', 'is_staff', 'date_joined']


class SocieteAssistanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocieteAssistance
        fields = ['id', 'nom', 'ice', 'adresse']


class SocieteAssistanceNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocieteAssistance
        fields = ['id', 'nom', 'ice', 'adresse']


class GroupeInterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupeIntervention
        fields = '__all__'

    def validate_groupe_id(self, value):
        if GroupeIntervention.objects.filter(groupe_id=value).exists():
            raise serializers.ValidationError("Groupe ID déjà utilisé!")
        return value


class InterventionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    societe_assistance = SocieteAssistanceNestedSerializer(read_only=True, required=False, allow_null=True)
    societe_assistance_id = serializers.PrimaryKeyRelatedField(
        queryset=SocieteAssistance.objects.all(),
        source='societe_assistance',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Intervention
        fields = '__all__'

    def create(self, validated_data):
        return Intervention.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class SuiviCarburantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SuiviCarburant
        fields = ['id', 'vehicule', 'date', 'prix', 'service', 'pompiste', 'smitoStation', 'user']


class FactureSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    billing_company_name_display = serializers.SerializerMethodField()

    def get_billing_company_name_display(self, obj):
        if obj.billing_company_obj:
            return obj.billing_company_obj.nom
        return obj.billing_company_name_display or ''

    class Meta:
        model = Facture
        fields = ['id', 'facture_num', 'date', 'billing_company_name_display', 'montant_ttc', 'user', 'pdf_file']


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_username = serializers.CharField(source='admin_user.username', read_only=True)

    class Meta:
        model = AdminActionLog
        fields = ['id', 'timestamp', 'admin_username', 'action', 'details', 'severity']
        read_only_fields = ['id', 'timestamp', 'admin_username']
