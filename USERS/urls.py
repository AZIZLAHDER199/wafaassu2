# Fichier: USERS/urls.py

from django.urls import path
from .views import *

urlpatterns = [
    # Auth & Basic Operations
    path('apilogin/', api_login, name='api_login'),
    # For admins to add users
path('dashboard/interventions/monthly/', monthly_interventions),
    path('dashboard/factures/monthly/', monthly_factures),
    path('dashboard/carburant/monthly/', monthly_carburant),
    path('dashboard/intervention_types/', intervention_types),
    path('dashboard/insurance_companies/', insurance_companies),
    path('dashboard/top_locations/', top_locations),
    path('dashboard/fleet_consumption/', fleet_consumption),
    path('dashboard/profit_loss/', profit_loss),
    # Data Entry & Retrieval for standard users/admin data views
    path('suivi_carburant/', add_suivi_carburant, name='add_suivi_carburant'),
    path('intervention/', add_intervention, name='add_intervention'),
    path('facture/', add_facture, name='add_facture'),
      path('get_suivi_carburant_stats/', get_suivi_carburant_stats_by_month, name='get_suivi_carburant_stats'),
    path('get_interventions/', get_interventions, name='get_interventions'),
    path('get_suivi_carburant/', get_suivi_carburant, name='get_suivi_carburant'),
    path('get_factures/', get_factures, name='get_factures'),
    path('get_users/', get_users, name='get_users'), # For admins to get all users

    # MODIFIED: generate_facture_pdf NOW ACCEPTS AN ID (pk)
    # HAD L'LIGNE HIYA L'MOHEMA BZZAF BACH YKHEDM GENERATE PDF
        path('generate_facture_pdf/<int:pk>/', generate_facture_pdf, name='generate_facture_pdf'),
    
    # Admin Dashboard Specific Stats
    path('get_signup_stats/', get_signup_stats, name='get_signup_stats'),

    # Update/Delete paths for specific instances (requires PK)
    path('facture/<int:pk>/', update_delete_facture, name='update_delete_facture'),
    path('suivi_carburant/<int:pk>/', update_delete_suivi_carburant, name='update_delete_suivi_carburant'),
    path('user/<int:pk>/', update_delete_user, name='user_detail_update_delete'),
    path('intervention/<int:pk>/', update_delete_intervention, name='update_delete_intervention'), # Make sure this is present

    # NEW: Paths for Admin Action History
    
    # NEW: Path to get unique Lieu d'Intervention choices

    path('api/next_facture_number/', get_next_facture_number, name='next_facture_number'),
  
      path('societes_assistance/', SocieteAssistanceList.as_view(), name='societes_assistance_list'), # AJOUTEZ CETTE LIGNE
      path('next_facture_number/', get_next_facture_number, name='next_facture_number'),
       path('download_facture_pdf/<int:pk>/', download_facture_pdf, name='download_facture_pdf'), 
       path('upload_excel/', ExcelUploadView.as_view(), name='upload_excel'),
       path('societes-assistance/', SocieteAssistanceList.as_view(), name='societe_assistance_list'), 
       path('admin/USERS/<str:model_type>/export_excel/', ExportToExcelView.as_view(), name='export_excel')
]