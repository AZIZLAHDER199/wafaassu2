from django.contrib import admin
from django import forms
from django.urls import reverse
from django.shortcuts import render
from django.http import HttpResponseRedirect
from .models import USER, SuiviCarburant, Intervention, SocieteAssistance, AdminActionLog, GroupeIntervention, Facture

class ExcelUploadForm(forms.Form):
    file = forms.FileField(label='Fichier Excel')
    file_type = forms.ChoiceField(
        choices=[('intervention', 'Intervention'), ('suivi_carburant', 'Suivi Carburant')],
        label='Type de fichier'
    )

@admin.register(SuiviCarburant)
class SuiviCarburantAdmin(admin.ModelAdmin):
    list_display = ('vehicule', 'date', 'service', 'pompiste', 'smitoStation', 'prix', 'user')
    list_filter = ('date', 'service', 'smitoStation', 'user')
    search_fields = ('vehicule', 'service', 'pompiste')

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('upload_excel/', self.admin_site.admin_view(self.upload_excel_view), name='suivi_carburant_upload_excel'),
        ]
        return custom_urls + urls

    def upload_excel_view(self, request):
        if not request.user.is_staff:
            self.message_user(request, "Seuls les administrateurs peuvent uploader des fichiers.", level='error')
            return HttpResponseRedirect(reverse('admin:USERS_suivicarburant_changelist'))

        if request.method == 'POST':
            form = ExcelUploadForm(request.POST, request.FILES)
            if form.is_valid():
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                import os

                # Save file temporarily
                file_content = ContentFile(request.FILES['file'].read())
                temp_file_name = f'temp_{request.FILES["file"].name}'
                file_path = default_storage.save(temp_file_name, file_content)

                # Prepare data for API call
                with open(file_path, 'rb') as file_data:
                    data = {
                        'file': file_data,
                        'file_type': form.cleaned_data['file_type']
                    }
                    from django.test import Client
                    client = Client()
                    client.force_login(request.user)
                    response = client.post('/api/upload_excel/', data=data)

                # Clean up temporary file after use
                default_storage.delete(file_path)

                # Check response content type and parse accordingly
                if 'application/json' in response['Content-Type']:
                    try:
                        json_data = response.json()
                        if response.status_code == 201:
                            self.message_user(request, json_data.get('message', 'Upload réussi.'))
                        else:
                            self.message_user(request, json_data.get('error', 'Erreur lors de l\'upload.'), level='error')
                    except ValueError:
                        self.message_user(request, 'Erreur: Réponse JSON invalide.', level='error')
                else:
                    self.message_user(request, f'Erreur: Réponse non-JSON reçue (Content-Type: {response["Content-Type"]}). Vérifiez l\'endpoint /api/upload_excel/.', level='error')

                return HttpResponseRedirect(reverse('admin:USERS_suivicarburant_changelist'))
        else:
            form = ExcelUploadForm()

        context = {
            'title': 'Upload Fichier Excel - Suivi Carburant',
            'form': form,
            'opts': self.model._meta,
        }
        return render(request, 'admin/users/suivicarburant/upload_excel.html', context)

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_upload_button'] = True
        return super().changelist_view(request, extra_context=extra_context)

@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = ('ref_dossier', 'assure', 'date_intervention', 'evenement', 'status', 'cout_prestation_ttc', 'societe_assistance', 'user')
    list_filter = ('date_intervention', 'status', 'societe_assistance', 'user')
    search_fields = ('ref_dossier', 'assure', 'evenement')

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path('upload_excel/', self.admin_site.admin_view(self.upload_excel_view), name='intervention_upload_excel'),
        ]
        return custom_urls + urls

    def upload_excel_view(self, request):
        if not request.user.is_staff:
            self.message_user(request, "Seuls les administrateurs peuvent uploader des fichiers.", level='error')
            return HttpResponseRedirect(reverse('admin:USERS_intervention_changelist'))

        if request.method == 'POST':
            form = ExcelUploadForm(request.POST, request.FILES)
            if form.is_valid():
                from django.core.files.storage import default_storage
                from django.core.files.base import ContentFile
                import os

                # Save file temporarily
                file_content = ContentFile(request.FILES['file'].read())
                temp_file_name = f'temp_{request.FILES["file"].name}'
                file_path = default_storage.save(temp_file_name, file_content)

                # Prepare data for API call
                with open(file_path, 'rb') as file_data:
                    data = {
                        'file': file_data,
                        'file_type': form.cleaned_data['file_type']
                    }
                    from django.test import Client
                    client = Client()
                    client.force_login(request.user)
                    response = client.post('/api/upload_excel/', data=data)

                # Clean up temporary file after use
                default_storage.delete(file_path)

                # Check response content type and parse accordingly
                if 'application/json' in response['Content-Type']:
                    try:
                        json_data = response.json()
                        if response.status_code == 201:
                            self.message_user(request, json_data.get('message', 'Upload réussi.'))
                        else:
                            self.message_user(request, json_data.get('error', 'Erreur lors de l\'upload.'), level='error')
                    except ValueError:
                        self.message_user(request, 'Erreur: Réponse JSON invalide.', level='error')
                else:
                    self.message_user(request, f'Erreur: Réponse non-JSON reçue (Content-Type: {response["Content-Type"]}). Vérifiez l\'endpoint /api/upload_excel/.', level='error')

                return HttpResponseRedirect(reverse('admin:USERS_intervention_changelist'))
        else:
            form = ExcelUploadForm()

        context = {
            'title': 'Upload Fichier Excel - Intervention',
            'form': form,
            'opts': self.model._meta,
        }
        return render(request, 'admin/users/intervention/upload_excel.html', context)

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_upload_button'] = True
        return super().changelist_view(request, extra_context=extra_context)

@admin.register(SocieteAssistance)
class SocieteAssistanceAdmin(admin.ModelAdmin):
    list_display = ('nom', 'ice', 'adresse')
    search_fields = ('nom', 'ice')

@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ('admin_username', 'action', 'timestamp', 'model_name', 'severity')
    list_filter = ('timestamp', 'severity', 'model_name')
    search_fields = ('action', 'admin_username')

@admin.register(USER)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active')
    search_fields = ('username', 'email')

@admin.register(GroupeIntervention)
class GroupeInterventionAdmin(admin.ModelAdmin):
    list_display = ('groupe_id', 'date_created')
    search_fields = ('groupe_id',)

@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ('facture_num', 'date', 'billing_company_name_display', 'montant_ttc', 'user')
    list_filter = ('date', 'billing_company_obj')
    search_fields = ('facture_num', 'billing_company_name_display')