from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import USER, Intervention, SuiviCarburant, Facture, AdminActionLog, SocieteAssistance, GroupeIntervention 
from .serializers import (
    InterventionSerializer,
    SuiviCarburantSerializer,
    FactureSerializer,
    AdminActionLogSerializer,
    USERSerializer,
    SocieteAssistanceSerializer,
    GroupeInterventionSerializer,
    SocieteAssistanceNestedSerializer
)
from django.db.models.functions import TruncMonth
from django.db.models import Count
from django.utils import timezone
from decimal import Decimal

from io import BytesIO
from datetime import date, datetime
from django.core.files.base import ContentFile
from django.conf import settings
import os

# reportlab imports
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.platypus import KeepTogether

# Helper function to convert number to text (remains, used by template)
def convert_number_to_text(number):
    try:
        number_decimal = Decimal(str(number))

        num_int = int(number_decimal.to_integral_value())
        num_dec = int(round((number_decimal - number_decimal.to_integral_value()) * 100))

        units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
        teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-uf"]
        tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"]

        def num_to_word_hundreds(n):
            part = ""
            if n >= 100:
                if n == 100:
                    part += "cent"
                elif n % 100 == 0:
                    part += units[n // 100] + " cents"
                else:
                    part += units[n // 100] + " cent"
                n %= 100
                if n > 0:
                    part += " "
            
            if n >= 10 and n <= 19:
                part += teens[n - 10]
            elif n >= 20:
                part += tens[n // 10]
                if n % 10 > 0:
                    if n // 10 == 7 or n // 10 == 9:
                        part += "-et-" + teens[(n % 10)] if n % 10 != 0 else ""
                    elif n // 10 == 8 and n % 10 != 0:
                        part += "-" + units[n % 10]
                    else:
                        part += "-" + units[n % 10] if n % 10 != 0 else ""
                elif n // 10 == 8 and n % 10 == 0:
                    part += "s"
            elif n > 0:
                part += units[n]
            return part.strip()

        text = ""
        if num_int >= 1_000_000_000:
            text += num_to_word_hundreds(num_int // 1_000_000_000) + " milliard " + ("s" if num_int // 1_000_000_000 > 1 else "")
            num_int %= 1_000_000_000
        if num_int >= 1_000_000:
            text += num_to_word_hundreds(num_int // 1_000_000) + " million " + ("s" if num_int // 1_000_000 > 1 else "")
            num_int %= 1_000_000
        if num_int >= 1000:
            if num_int // 1000 == 1:
                text += "mille "
            else:
                text += num_to_word_hundreds(num_int // 1000) + " mille "
            num_int %= 1000
        text += num_to_word_hundreds(num_int)

        if text.strip() == "":
            text = "zéro"

        if num_dec > 0:
            text += " virgule "
            if num_dec < 10:
                text += "zéro"
            text += str(num_dec) + " centimes"

        return text.upper().replace("SEPTANTE", "SOIXANTE-DIX").replace("NONANTE", "QUATRE-VINGT-DIX").replace("HUITANTE", "QUATRE-VINGT").strip()

    except Exception as e:
        print(f"Error converting number to text: {e}")
        return str(number)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class AdminActionLogListCreate(generics.ListCreateAPIView):
    queryset = AdminActionLog.objects.all()
    serializer_class = AdminActionLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    def perform_create(self, serializer):
        serializer.save(admin_user=self.request.user, admin_username=self.request.user.username)

class AdminActionLogRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = AdminActionLog.objects.all()
    serializer_class = AdminActionLogSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    def perform_destroy(self, instance):
        instance.delete()

@api_view(['POST'])
def api_login(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(request, username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful!',
                'username': user.username,
                'is_admin': user.is_superuser,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({'error': 'POST request required'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_intervention(request):
    data = request.data.copy()
    data['user'] = request.user.id
    if data.get('societe_assistance') == '':
        data['societe_assistance'] = None
    serializer = InterventionSerializer(data=data)
    if serializer.is_valid():
        intervention = serializer.save(user=request.user)
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action="Ajout d'une intervention",
            details=f"Intervention ID: {intervention.id}, Ref: {intervention.ref_dossier}",
            severity="Medium"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interventions(request):
    status_filter = request.query_params.get('status', None)
    date_from = request.query_params.get('date_from', None)
    interventions = Intervention.objects.all()
    if status_filter:
        interventions = interventions.filter(status=status_filter)
    if date_from:
        interventions = interventions.filter(date_intervention__gte=date_from)
    serializer = InterventionSerializer(interventions, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_delete_intervention(request, pk):
    try:
        intervention = Intervention.objects.get(pk=pk)
    except Intervention.DoesNotExist:
        return Response({'error': 'Intervention not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        if not request.user.is_staff and intervention.user != request.user:
            return Response({'error': 'Vous n\'avez pas la permission de voir cette intervention.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = InterventionSerializer(intervention)
        return Response(serializer.data, status=status.HTTP_200_OK)
    if not request.user.is_staff and intervention.user != request.user:
        return Response({'error': 'Vous n\'avez pas la permission de modifier ou supprimer cette intervention.'}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'PUT':
        data = request.data.copy()
        if data.get('societe_assistance') == '':
            data['societe_assistance'] = None
        serializer = InterventionSerializer(intervention, data=data, partial=True)
        if serializer.is_valid():
            updated_intervention = serializer.save()
            AdminActionLog.objects.create(
                admin_user=request.user,
                admin_username=request.user.username,
                action=f"Mise à jour intervention '{updated_intervention.ref_dossier}'",
                details=f"Intervention ID: {updated_intervention.id} a été mise à jour. Champs: {', '.join(request.data.keys())}.",
                severity='Medium'
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        ref_dossier = intervention.ref_dossier
        intervention_id = intervention.id
        intervention.delete()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action=f"Suppression intervention '{ref_dossier}'",
            details=f"L'intervention ID {intervention_id} a été supprimée.",
            severity='High'
        )
        return Response({'message': 'Intervention deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_suivi_carburant(request):
    data = request.data.copy()
    data['user'] = request.user.id
    serializer = SuiviCarburantSerializer(data=data)
    if serializer.is_valid():
        suivi = serializer.save()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action="Ajout d'un suivi carburant",
            details=f"Suivi Carburant ID: {suivi.id}, Véhicule: {suivi.vehicule}",
            severity="Medium"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_suivi_carburant(request):
    date_from = request.query_params.get('date_from', None)
    station_filter = request.query_params.get('station', None)
    suivi_carburants = SuiviCarburant.objects.all()
    if date_from:
        suivi_carburants = suivi_carburants.filter(date__gte=date_from)
    if station_filter:
        suivi_carburants = suivi_carburants.filter(station__icontains=station_filter)
    serializer = SuiviCarburantSerializer(suivi_carburants, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_delete_suivi_carburant(request, pk):
    try:
        suivi = SuiviCarburant.objects.get(pk=pk)
    except SuiviCarburant.DoesNotExist:
        return Response({'error': 'SuiviCarburant not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = SuiviCarburantSerializer(suivi)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = SuiviCarburantSerializer(suivi, data=request.data, partial=True)
        if serializer.is_valid():
            updated_suivi = serializer.save()
            AdminActionLog.objects.create(
                admin_user=request.user,
                admin_username=request.user.username,
                action=f"Mise à jour suivi carburant '{updated_suivi.vehicule}'",
                details=f"Suivi Carburant ID: {updated_suivi.id} a été mis à jour. Champs: {', '.join(request.data.keys())}.",
                severity='Medium'
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        vehicule = suivi.vehicule
        suivi_id = suivi.id
        suivi.delete()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action=f"Suppression suivi carburant '{vehicule}'",
            details=f"Le suivi carburant ID {suivi_id} a été supprimé.",
            severity='High'
        )
        return Response({'message': 'SuiviCarburant deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_facture(request):
    data = request.data.copy()
    data['user'] = request.user.id
    intervention_id = data.get('intervention')
    if intervention_id:
        try:
            intervention = Intervention.objects.get(pk=intervention_id)
            data['intervention'] = intervention.id
        except Intervention.DoesNotExist:
            return Response({'error': 'Intervention liée non trouvée.'}, status=status.HTTP_400_BAD_REQUEST)
    if 'billing_company_name' in data and not isinstance(data['billing_company_name'], int):
        try:
            societe = SocieteAssistance.objects.get(nom=data['billing_company_name'])
            data['billing_company_obj'] = societe.id
        except SocieteAssistance.DoesNotExist:
            return Response({'error': 'Societe de facturation non trouvée.'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = FactureSerializer(data=data)
    if serializer.is_valid():
        facture = serializer.save()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action="Ajout d'une facture",
            details=f"Facture ID: {facture.id}, Numéro: {facture.facture_num}",
            severity="Medium"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_factures(request):
    societe = request.query_params.get('societe_assistance', None)
    date_from = request.query_params.get('date_from', None)
    factures = Facture.objects.all()
    if societe:
        factures = factures.filter(billing_company_obj__nom=societe)
    if date_from:
        factures = factures.filter(date__gte=date_from)
    serializer = FactureSerializer(factures, many=True)
    return Response(serializer.data)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_delete_facture(request, pk):
    try:
        facture = Facture.objects.get(pk=pk)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = FactureSerializer(facture)
        return Response(serializer.data)
    elif request.method == 'PUT':
        data = request.data.copy()
        if data.get('billing_company_name') == '':
            data['billing_company_obj'] = None
        serializer = FactureSerializer(facture, data=data, partial=True)
        if serializer.is_valid():
            updated_facture = serializer.save()
            AdminActionLog.objects.create(
                admin_user=request.user,
                admin_username=request.user.username,
                action=f"Mise à jour Facture '{updated_facture.facture_num}'",
                details=f"Facture ID: {updated_facture.id} a été mise à jour. Champs: {', '.join(request.data.keys())}.",
                severity='Medium'
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        facture_num = facture.facture_num
        facture_id = facture.id
        facture.delete()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action=f"Suppression Facture '{facture_num}'",
            details=f"La facture ID {facture_id} a été supprimée.",
            severity='High'
        )
        return Response({'message': 'Facture deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def add_user(request):
    if request.method == 'POST':
        try:
            data = request.data
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            age = data.get('age')
            if not username or not email or not password:
                return Response({'error': 'Username, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
            if USER.objects.filter(username=username).exists():
                return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
            if USER.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            user = USER(username=username, email=email, age=age)
            user.set_password(password)
            user.full_clean()
            user.save()
            AdminActionLog.objects.create(
                admin_user=request.user,
                admin_username=request.user.username,
                action="Ajout d'un utilisateur",
                details=f"Utilisateur '{username}' (ID: {user.id}) a été créé.",
                severity="Medium"
            )
            return Response({'message': 'User added successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': f'Failed to add user: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'error': 'POST request required'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    try:
        if request.user.is_staff and request.user.is_superuser:
            users = USER.objects.all().values('id', 'username', 'email', 'is_active', 'is_staff', 'date_joined')
        else:
            users = USER.objects.filter(pk=request.user.pk).values('id', 'username', 'email', 'is_active')
        users_list = [
            {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'active': user['is_active'],
                'is_staff': user.get('is_staff', False),
                'date_joined': user.get('date_joined', None),
            }
            for user in users
        ]
        return Response(users_list)
    except Exception as e:
        return Response({'error': f'Failed to fetch users: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_delete_user(request, pk):
    try:
        user = USER.objects.get(pk=pk)
    except USER.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        serializer = USERSerializer(user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = USERSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            if 'password' in request.data:
                user.set_password(request.data['password'])
            updated_user = serializer.save()
            AdminActionLog.objects.create(
                admin_user=request.user,
                admin_username=request.user.username,
                action=f"Mise à jour utilisateur '{updated_user.username}'",
                details=f"Utilisateur ID: {updated_user.id} a été mise à jour. Champs: {', '.join(request.data.keys())}.",
                severity='Medium'
            )
            return Response(USERSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        username = user.username
        user_id = user.id
        user.delete()
        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action=f"Suppression utilisateur '{username}'",
            details=f"L'utilisateur ID {user_id} a été supprimée.",
            severity='High'
        )
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_signup_stats(request):
    today = timezone.now()
    six_months_ago = today - timezone.timedelta(days=180)
    signup_stats = USER.objects.filter(date_joined__gte=six_months_ago) \
                         .annotate(month=TruncMonth('date_joined')) \
                         .values('month') \
                         .annotate(signups=Count('id')) \
                         .order_by('month')
    formatted_stats = []
    for stat in signup_stats:
        formatted_stats.append({
            'month': stat['month'].strftime('%b'),
            'signups': stat['signups']
        })
    return Response(formatted_stats)

class SocieteAssistanceList(generics.ListCreateAPIView):
    queryset = SocieteAssistance.objects.all()
    serializer_class = SocieteAssistanceSerializer
    permission_classes = [IsAuthenticated]

class SocieteAssistanceDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = SocieteAssistance.objects.all()
    serializer_class = SocieteAssistanceSerializer
    permission_classes = [IsAuthenticated]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_next_facture_number(request):
    try:
        last_facture = Facture.objects.order_by('-id').first()
        if last_facture and last_facture.facture_num:
            last_num_str = last_facture.facture_num.split('/')[0]
            last_num = int(last_num_str)
            next_num = last_num + 1
        else:
            next_num = 1
        current_year = timezone.now().year
        facture_num = f"{next_num}/{current_year}"
        return Response({'facture_num': facture_num}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error getting next facture number: {e}")
        return Response({'error': 'Failed to retrieve next facture number'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_facture_pdf(request, pk):
    try:
        facture = Facture.objects.get(pk=pk)
        if not facture.pdf_file:
            return Response({'error': 'Le fichier PDF n\'existe pas pour cette facture.'}, status=status.HTTP_404_NOT_FOUND)
        with facture.pdf_file.open('rb') as pdf:
            response = HttpResponse(pdf.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{facture.pdf_file.name}"'
            return response
    except Facture.DoesNotExist:
        return Response({'error': 'Facture non trouvée.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"An unexpected error occurred during PDF download: {str(e)}")
        return Response({'error': 'Une erreur inattendue est survenue lors du téléchargement.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



LOGO_PATH = os.path.join(os.path.dirname(__file__), 'static', 'USERS', 'logo.png')

PRIMARY   = colors.HexColor('#1e3a8a')
ACCENT    = colors.HexColor('#f97316')
LIGHT_BG  = colors.HexColor('#eff6ff')
BORDER    = colors.HexColor('#c7d2fe')
TEXT_DARK = colors.HexColor('#0f172a')
TEXT_MUTED= colors.HexColor('#64748b')
WHITE     = colors.white
GREEN_BG  = colors.HexColor('#d1fae5')
GREEN_FG  = colors.HexColor('#065f46')

def build_facture_pdf(ctx: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=14*mm, bottomMargin=14*mm,
    )
    W = A4[0] - 36*mm

    styles = getSampleStyleSheet()
    def S(name, **kw):
        base = styles['Normal']
        return ParagraphStyle(name, parent=base, **kw)

    title_s   = S('title',   fontSize=16, textColor=WHITE,    alignment=TA_CENTER, fontName='Helvetica-Bold', leading=20)
    sub_s     = S('sub',     fontSize=8,  textColor=ACCENT,   alignment=TA_CENTER, fontName='Helvetica-Bold', letterSpacing=1)
    h2_s      = S('h2',      fontSize=10, textColor=PRIMARY,  fontName='Helvetica-Bold', leading=14)
    body_s    = S('body',    fontSize=9,  textColor=TEXT_DARK, leading=13)
    muted_s   = S('muted',   fontSize=8,  textColor=TEXT_MUTED, leading=11)
    bold_s    = S('bold',    fontSize=9,  textColor=TEXT_DARK, fontName='Helvetica-Bold', leading=13)
    right_s   = S('right',   fontSize=9,  textColor=TEXT_DARK, alignment=TA_RIGHT, leading=13)
    num_s     = S('num',     fontSize=22, textColor=PRIMARY,  fontName='Helvetica-Bold', alignment=TA_RIGHT, leading=26)
    total_s   = S('total',   fontSize=11, textColor=GREEN_FG, fontName='Helvetica-Bold', alignment=TA_RIGHT, leading=15)
    words_s   = S('words',   fontSize=9,  textColor=PRIMARY,  fontName='Helvetica-BoldOblique', leading=13)
    footer_s  = S('footer',  fontSize=7,  textColor=TEXT_MUTED, alignment=TA_CENTER, leading=10)

    story = []

    # ── HEADER BANNER ──────────────────────────────────────────────
    has_logo = os.path.exists(LOGO_PATH)
    if has_logo:
        logo_img = Image(LOGO_PATH, width=44*mm, height=17*mm)
        logo_cell = logo_img
    else:
        logo_cell = Paragraph('<b>TAMANAR</b>', S('lc', fontSize=14, textColor=WHITE, fontName='Helvetica-Bold'))

    header_inner = Table(
        [[logo_cell,
          [Paragraph('FACTURE', title_s),
           Paragraph('TAMANAR ASSISTANCE', sub_s)]]],
        colWidths=[50*mm, W - 50*mm],
        hAlign='LEFT',
    )
    header_inner.setStyle(TableStyle([
        ('VALIGN',      (0,0),(-1,-1), 'MIDDLE'),
        ('ALIGN',       (1,0),(1,0),   'CENTER'),
        ('LEFTPADDING', (0,0),(0,0),   4),
    ]))

    header_wrap = Table([[header_inner]], colWidths=[W])
    header_wrap.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), PRIMARY),
        ('ROUNDEDCORNERS', [8]),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 10),
    ]))
    story.append(header_wrap)
    story.append(Spacer(1, 6*mm))

    # ── META ROW  (N° facture | Date) ──────────────────────────────
    meta = Table([
        [Paragraph(f'N° <b>{ctx["facture_num"]}</b>', num_s),
         Paragraph(f'Date : <b>{ctx["date"]}</b>', right_s)],
    ], colWidths=[W*0.6, W*0.4])
    meta.setStyle(TableStyle([
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING',(0,0),(-1,-1), 2),
    ]))
    story.append(meta)
    story.append(HRFlowable(width=W, thickness=2, color=ACCENT, spaceAfter=5))

    # ── FROM / TO ───────────────────────────────────────────────────
    from_lines = [
        Paragraph('DE :', h2_s),
        Paragraph('<b>TAMANAR ASSISTANCE</b>', bold_s),
        Paragraph('Point d\'attache : ' + ctx.get('point_attach',''), body_s),
    ]
    to_lines = [
        Paragraph('DESTINATAIRE :', h2_s),
        Paragraph(f'<b>{ctx.get("destinataire","")}</b>', bold_s),
        Paragraph(f'ICE : {ctx.get("ice","")}', body_s),
        Paragraph(ctx.get("adresse",""), body_s),
    ]
    addr_table = Table([[from_lines, to_lines]], colWidths=[W*0.45, W*0.55])
    addr_table.setStyle(TableStyle([
        ('VALIGN',       (0,0),(-1,-1), 'TOP'),
        ('BACKGROUND',   (0,0),(0,0),   LIGHT_BG),
        ('BACKGROUND',   (1,0),(1,0),   colors.HexColor('#fff7ed')),
        ('BOX',          (0,0),(0,0),   0.5, BORDER),
        ('BOX',          (1,0),(1,0),   0.5, ACCENT),
        ('ROUNDEDCORNERS',[6]),
        ('TOPPADDING',   (0,0),(-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    story.append(addr_table)
    story.append(Spacer(1, 5*mm))

    # ── MISSION INFO TABLE ─────────────────────────────────────────
    def row(label, value):
        return [Paragraph(label, muted_s), Paragraph(str(value) if value else '—', body_s)]

    info_data = [
        row('Référence dossier',       ctx.get('reference','')),
        row('Lieu d\'intervention',    ctx.get('lieu_intervention','')),
        row('Destination',             ctx.get('destination','')),
        row('Périmètre',               ctx.get('perimetre','')),
    ]
    info_tbl = Table(info_data, colWidths=[45*mm, W - 45*mm])
    info_tbl.setStyle(TableStyle([
        ('VALIGN',       (0,0),(-1,-1), 'TOP'),
        ('TOPPADDING',   (0,0),(-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1), 4),
        ('LEFTPADDING',  (0,0),(-1,-1), 6),
        ('RIGHTPADDING', (0,0),(-1,-1), 6),
        ('ROWBACKGROUNDS',(0,0),(-1,-1), [WHITE, LIGHT_BG]),
        ('LINEBELOW',    (0,0),(-1,-2), 0.3, BORDER),
        ('BOX',          (0,0),(-1,-1), 0.5, BORDER),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 4*mm))

    # ── DESCRIPTION ────────────────────────────────────────────────
    story.append(Paragraph('Objet / Description :', h2_s))
    story.append(Spacer(1, 2))
    desc_tbl = Table([[Paragraph(ctx.get('description',''), body_s)]], colWidths=[W])
    desc_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
        ('BOX',          (0,0),(-1,-1), 0.5, BORDER),
        ('LEFTBORDER',   (0,0),(0,-1),  3,   PRIMARY),
        ('TOPPADDING',   (0,0),(-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    story.append(desc_tbl)
    story.append(Spacer(1, 5*mm))

    # ── AMOUNTS TABLE ──────────────────────────────────────────────
    def fmt(v): return f"{float(v):,.2f} MAD".replace(',', ' ')

    amounts_data = [
        [Paragraph('Désignation', S('ah', fontSize=9, textColor=WHITE, fontName='Helvetica-Bold')),
         Paragraph('Montant', S('ah2', fontSize=9, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_RIGHT))],
        [Paragraph('Montant HT', body_s),        Paragraph(fmt(ctx['montant_ht']),  right_s)],
        [Paragraph('TVA (20%)',   body_s),        Paragraph(fmt(ctx['tva_amount']),  right_s)],
        [Paragraph('<b>Montant TTC</b>', bold_s), Paragraph(f'<b>{fmt(ctx["montant_ttc"])}</b>', total_s)],
    ]
    amt_tbl = Table(amounts_data, colWidths=[W*0.65, W*0.35])
    amt_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,0),  PRIMARY),
        ('BACKGROUND',   (0,3),(-1,3),  GREEN_BG),
        ('ROWBACKGROUNDS',(0,1),(-1,2), [WHITE, LIGHT_BG]),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
        ('TOPPADDING',   (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 10),
        ('BOX',          (0,0),(-1,-1), 0.5, BORDER),
        ('LINEBELOW',    (0,0),(-1,-2), 0.3, BORDER),
        ('LINEBELOW',    (0,2),(-1,2),  1.5, ACCENT),
    ]))
    story.append(amt_tbl)
    story.append(Spacer(1, 3*mm))

    # ── AMOUNT IN WORDS ────────────────────────────────────────────
    words_tbl = Table(
        [[Paragraph(f'Arrêtée la présente facture à la somme de :<br/>'
                    f'<b>{ctx.get("montant_ttc_text","")}</b> Dirhams TTC', words_s)]],
        colWidths=[W]
    )
    words_tbl.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
        ('BOX',          (0,0),(-1,-1), 1, PRIMARY),
        ('TOPPADDING',   (0,0),(-1,-1), 7),
        ('BOTTOMPADDING',(0,0),(-1,-1), 7),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ]))
    story.append(words_tbl)
    story.append(Spacer(1, 8*mm))

    # ── SIGNATURE ─────────────────────────────────────────────────
    sig_tbl = Table([
        [Paragraph('Cachet et Signature', S('sig', fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER))],
        [Spacer(1, 18*mm)],
    ], colWidths=[W*0.4], hAlign='RIGHT')
    sig_tbl.setStyle(TableStyle([
        ('BOX',          (0,0),(-1,-1), 0.5, BORDER),
        ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
        ('TOPPADDING',   (0,0),(-1,-1), 5),
    ]))
    story.append(sig_tbl)

    # ── FOOTER ─────────────────────────────────────────────────────
    story.append(Spacer(1, 4*mm))
    story.append(HRFlowable(width=W, thickness=1, color=BORDER))
    story.append(Spacer(1, 2))
    story.append(Paragraph(
        'TAMANAR ASSISTANCE — Remorquage &amp; Assistance Routière Expert Auto | '
        f'Généré le {ctx.get("current_date","")}',
        footer_s
    ))

    doc.build(story)
    return buf.getvalue()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_facture_pdf(request, pk):
    try:
        intervention = Intervention.objects.get(pk=pk)
        last_facture = Facture.objects.order_by('-id').first()
        next_num = 1
        if last_facture and last_facture.facture_num:
            last_num_str = last_facture.facture_num.split('/')[0]
            last_num = int(last_num_str)
            next_num = last_num + 1
        current_year = timezone.now().year
        facture_num_to_save = f"{next_num}/{current_year}"
        data = request.data.copy()

        facture_data_for_db = {
            'user': request.user,
            'intervention': intervention,
            'facture_num': facture_num_to_save,
            'date': data.get('date', timezone.now().strftime('%Y-%m-%d')),
            'billing_company_name_display': data.get('billing_company', 'N/A'),
            'ice': data.get('ice', 'N/A'),
            'adresse': data.get('adresse', 'N/A'),
            'reference': data.get('reference', intervention.ref_dossier or 'N/A'),
            'point_attach': data.get('point_attach', intervention.point_attach or 'N/A'),
            'lieu_intervention': data.get('lieu_intervention', intervention.lieu_intervention or 'N/A'),
            'destination': data.get('destination', intervention.destination or 'N/A'),
            'perimetre': data.get('perimetre', 'Rayon 50 KM'),
            'description': data.get('description', f"Assistance pour véhicule {intervention.evenement or ''} - Véhicule {intervention.marque or ''} ({intervention.immatriculation or ''}) du {intervention.date_intervention.strftime('%d/%m/%Y') if intervention.date_intervention else ''} à {intervention.lieu_intervention or ''} vers {intervention.destination or ''}."),
            'montant_ttc': Decimal(str(data.get('montant_ttc', '0.0'))),
        }

        if 'montant_ttc' in data and data['montant_ttc'] is not None:
            montant_ttc_decimal = Decimal(str(data['montant_ttc']))
            tva_rate = Decimal('0.20')
            montant_ht_recalc = montant_ttc_decimal / (Decimal('1') + tva_rate)
            tva_amount_recalc = montant_ttc_decimal - montant_ht_recalc
            facture_data_for_db['montant_ht'] = montant_ht_recalc.quantize(Decimal('0.01'))
            facture_data_for_db['tva'] = tva_amount_recalc.quantize(Decimal('0.01'))
            facture_data_for_db['montant_ttc'] = montant_ttc_decimal.quantize(Decimal('0.01'))
        else:
            facture_data_for_db['montant_ht'] = Decimal('0.0')
            facture_data_for_db['tva'] = Decimal('0.0')
            facture_data_for_db['montant_ttc'] = Decimal('0.0')

        if isinstance(facture_data_for_db['date'], str):
            try:
                facture_data_for_db['date'] = datetime.strptime(facture_data_for_db['date'], '%Y-%m-%d').date()
            except ValueError:
                facture_data_for_db['date'] = timezone.now().date()

        facture_instance = Facture.objects.filter(intervention=intervention).first()
        if facture_instance:
            for field, value in facture_data_for_db.items():
                setattr(facture_instance, field, value)
            facture_instance.save()
            print(f"Updating existing Facture {facture_instance.id} for Intervention {pk}")
        else:
            facture_instance = Facture.objects.create(**facture_data_for_db)
            print(f"Created new Facture {facture_instance.id} for Intervention {pk}")

        montant_ttc_text_for_pdf = convert_number_to_text(facture_instance.montant_ttc).upper()
        context_for_template = {
            'facture_num': facture_instance.facture_num,
            'date': facture_instance.date.strftime("%d/%m/%Y"),
            'destinataire': facture_instance.billing_company_name_display,
            'ice': facture_instance.ice,
            'adresse': facture_instance.adresse,
            'reference': facture_instance.reference,
            'point_attach': facture_instance.point_attach,
            'lieu_intervention': facture_instance.lieu_intervention,
            'destination': facture_instance.destination,
            'perimetre': facture_instance.perimetre,
            'description': facture_instance.description,
            'montant_ht': facture_instance.montant_ht,
            'tva_amount': facture_instance.tva,
            'montant_ttc': facture_instance.montant_ttc,
            'montant_ttc_text': montant_ttc_text_for_pdf,
            'current_date': date.today().strftime("%d/%m/%Y"),
        }
        print(f"Context for template: {context_for_template}")  # Debug context

        pdf_data = build_facture_pdf(context_for_template)
        try:
            facture_instance.pdf_file.save(
                f'facture_{facture_instance.facture_num.replace("/", "_")}.pdf',
                ContentFile(pdf_data)
            )
        except Exception:
            pass

        AdminActionLog.objects.create(
            admin_user=request.user,
            admin_username=request.user.username,
            action="Génération et Enregistrement Facture",
            details=f"Facture ID: {facture_instance.id}, Numéro: {facture_instance.facture_num} générée pour Intervention ID: {intervention.id}",
            severity="Medium"
        )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="facture_{facture_instance.facture_num.replace("/", "_")}.pdf"'
        return response
    except Intervention.DoesNotExist:
        return Response({'error': 'Intervention not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"An unexpected error occurred during PDF generation: {str(e)}")
        return Response({'error': f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)        


# في ملف C:\samba\wafadash\USERS\views.py

# ... (الـ imports من الفوق)
from django.db.models import Sum # <--- خاص تزيد هاد الـ import

# ... (باقي الـ functions)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_suivi_carburant_stats_by_month(request):
    try:
        suivi_carburants = SuiviCarburant.objects.all()
        # إذا كان المستخدم ليس من الـ Staff، غادي نوريو ليه غير البيانات ديالو
        # تجميع البيانات حسب الشهر و حساب المجموع ديال الـ prix
        monthly_stats = suivi_carburants.annotate(month=TruncMonth('date')).values('month').annotate(total_prix=Sum('prix')).order_by('month')
        
        formatted_stats = []
        for stat in monthly_stats:
            formatted_stats.append({
                'month': stat['month'].strftime('%Y-%m'), # باش يبان الشهر و السنة
                'total_prix': float(stat['total_prix'])
            })
        
        return Response(formatted_stats, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f"Failed to get monthly stats: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ... (باقي الـ functions)

# في ملف C:\samba\wafadash\USERS\views.py

# ... (الـ imports من الفوق)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_suivi_carburant(request):
    date_from = request.query_params.get('date_from', None)
    station_filter = request.query_params.get('station', None)
    suivi_carburants = SuiviCarburant.objects.all()
    if date_from:
        suivi_carburants = suivi_carburants.filter(date__gte=date_from)
    if station_filter:
        suivi_carburants = suivi_carburants.filter(smitoStation__icontains=station_filter)
    serializer = SuiviCarburantSerializer(suivi_carburants, many=True)
    return Response(serializer.data)



# C:\samba\wafadash\USERS\views.py

from django.db.models import Sum # تأكد من أن هذه المكتبة موجودة

# ... (باقي الـ imports و الـ functions)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_factures(request):
    societe = request.query_params.get('societe_assistance', None)
    date_from = request.query_params.get('date_from', None)
    
    # NEW: نستعملو prefetch_related لتحسين الأداء
    factures = Facture.objects.all().prefetch_related('billing_company_obj')
    
    if societe:
        factures = factures.filter(billing_company_obj__nom=societe)
    if date_from:
        factures = factures.filter(date__gte=date_from)
    
    serializer = FactureSerializer(factures, many=True)
    return Response(serializer.data)

# ... (باقي الـ functions)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from .models import SuiviCarburant, Intervention, SocieteAssistance, AdminActionLog
from .serializers import SuiviCarburantSerializer, InterventionSerializer, FactureSerializer, SocieteAssistanceSerializer
from django.db.models import Q, Sum
import pandas as pd
from datetime import datetime
import os

class ExcelUploadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        if not request.user.is_staff:
            return Response({"error": "Seuls les administrateurs peuvent uploader des fichiers."}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        file_type = request.POST.get('file_type')  # 'intervention' or 'suivi_carburant'

        if not file:
            return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.endswith(('.xlsx', '.xls')):
            return Response({"error": "Le fichier doit être au format Excel (.xlsx ou .xls)."}, status=status.HTTP_400_BAD_REQUEST)
        if file_type not in ['intervention', 'suivi_carburant']:
            return Response({"error": "Type de fichier invalide. Choisissez 'intervention' ou 'suivi_carburant'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Save file temporarily
            temp_file_path = f'temp_{file.name}'
            with open(temp_file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)

            # Read Excel file
            df = pd.read_excel(temp_file_path, header=None)

            # Remove temp file
            os.remove(temp_file_path)

            if file_type == 'suivi_carburant':
                return self.handle_suivi_carburant(df, request.user)
            elif file_type == 'intervention':
                return self.handle_intervention(df, request.user)

        except Exception as e:
            return Response({"error": f"Erreur lors du traitement du fichier: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    def handle_suivi_carburant(self, df, user):
        valid_stations = ['AFRICA', 'TOTAL', 'SHELL', 'PETROM', '']
        errors = []
        created_count = 0

        # Skip header rows and start from row 5 (index 4)
        df = df.iloc[4:].reset_index(drop=True)
        df.columns = ['date', 'vehicule', 'service', 'pompiste', 'prix']

        for index, row in df.iterrows():
            if pd.isna(row['date']) or pd.isna(row['vehicule']) or pd.isna(row['prix']):
                errors.append(f"Ligne {index + 5}: Données manquantes (date, vehicule ou prix).")
                continue

            try:
                # Convert Excel date (numeric) to Python datetime
                if isinstance(row['date'], (int, float)):
                    date = pd.Timestamp('1899-12-30') + pd.to_timedelta(row['date'], unit='D')
                else:
                    date = pd.to_datetime(row['date'], errors='coerce')
                if pd.isna(date):
                    errors.append(f"Ligne {index + 5}: Format de date invalide.")
                    continue

                vehicule = str(row['vehicule'])[:50] if not pd.isna(row['vehicule']) else ''
                service = str(row['service'])[:50] if not pd.isna(row['service']) else ''
                pompiste = str(row['pompiste'])[:50] if not pd.isna(row['pompiste']) else ''
                prix = float(row['prix']) if not pd.isna(row['prix']) else 0
                smito_station = ''  # Default to empty since smitoStation is not in Excel

                if not vehicule or not service:
                    errors.append(f"Ligne {index + 5}: Véhicule ou service manquant.")
                    continue

                SuiviCarburant.objects.create(
                    user=user,
                    date=date,
                    vehicule=vehicule,
                    service=service,
                    pompiste=pompiste,
                    smitoStation=smito_station,
                    prix=prix
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Ligne {index + 5}: Erreur: {str(e)}")

        # Log the action
        AdminActionLog.objects.create(
            user=user,
            action=f"Upload de {created_count} entrées Suivi Carburant via Excel."
        )

        return Response({
            "message": f"{created_count} entrées créées avec succès.",
            "errors": errors if errors else None
        }, status=status.HTTP_201_CREATED)

    def handle_intervention(self, df, user):
        errors = []
        created_count = 0

        # Skip header rows and start from row 4 (index 3)
        df = df.iloc[3:].reset_index(drop=True)
        df.columns = [
            'societe_assistance', 'ref_dossier', 'facture_num', 'assure',
            'date_intervention', 'evenement', 'immatriculation', 'marque',
            'point_attach', 'lieu_intervention', 'destination', 'cout_prestation_ttc',
            'tva', 'status'
        ]

        for index, row in df.iterrows():
            if pd.isna(row['ref_dossier']) and pd.isna(row['facture_num']):
                continue  # Skip rows with no ref_dossier or facture_num

            try:
                # Convert Excel date (numeric) to Python datetime
                if isinstance(row['date_intervention'], (int, float)):
                    date_intervention = pd.Timestamp('1899-12-30') + pd.to_timedelta(row['date_intervention'], unit='D')
                else:
                    date_intervention = pd.to_datetime(row['date_intervention'], errors='coerce')
                if pd.isna(date_intervention):
                    errors.append(f"Ligne {index + 4}: Format de date invalide.")
                    continue

                societe_assistance = None
                if not pd.isna(row['societe_assistance']):
                    societe_name = str(row['societe_assistance']).strip()
                    societe_assistance, _ = SocieteAssistance.objects.get_or_create(
                        nom=societe_name,
                        defaults={'ice': '', 'adresse': ''}
                    )

                ref_dossier = str(row['ref_dossier'])[:50] if not pd.isna(row['ref_dossier']) else ''
                facture_num = str(row['facture_num'])[:50] if not pd.isna(row['facture_num']) else ''
                assure = str(row['assure'])[:100] if not pd.isna(row['assure']) else ''
                evenement = str(row['evenement'])[:100] if not pd.isna(row['evenement']) else ''
                immatriculation = str(row['immatriculation'])[:20] if not pd.isna(row['immatriculation']) else ''
                marque = str(row['marque'])[:50] if not pd.isna(row['marque']) else ''
                point_attach = str(row['point_attach'])[:100] if not pd.isna(row['point_attach']) else ''
                lieu_intervention = str(row['lieu_intervention'])[:100] if not pd.isna(row['lieu_intervention']) else ''
                destination = str(row['destination'])[:100] if not pd.isna(row['destination']) else ''
                status = str(row['status'])[:50] if not pd.isna(row['status']) else ''
                cout_prestation_ttc = float(row['cout_prestation_ttc']) if not pd.isna(row['cout_prestation_ttc']) else 0
                tva = float(row['tva']) if not pd.isna(row['tva']) else 0

                Intervention.objects.create(
                    user=user,
                    date_intervention=date_intervention,
                    societe_assistance=societe_assistance,
                    ref_dossier=ref_dossier,
                    assure=assure,
                    evenement=evenement,
                    immatriculation=immatriculation,
                    marque=marque,
                    point_attach=point_attach,
                    lieu_intervention=lieu_intervention,
                    destination=destination,
                    status=status,
                    cout_prestation_ttc=cout_prestation_ttc,
                    tva=tva
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Ligne {index + 4}: Erreur: {str(e)}")

        # Log the action
        AdminActionLog.objects.create(
            user=user,
            action=f"Upload de {created_count} interventions via Excel."
        )

        return Response({
            "message": f"{created_count} interventions créées avec succès.",
            "errors": errors if errors else None
        }, status=status.HTTP_201_CREATED)

# ... (rest of the views.py remains the same)


import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
from .models import Intervention, SuiviCarburant, SocieteAssistance
from django.core.files.storage import default_storage
import os
from django.http import HttpResponseServerError
from django.db import IntegrityError
from decimal import Decimal

logger = logging.getLogger(__name__)

class ExcelUploadView(APIView):
    def post(self, request, *args, **kwargs):
        logger.info("Upload Excel request received")
        file_obj = request.FILES.get('file')
        file_type = request.POST.get('file_type')

        if not file_obj or not file_type:
            logger.warning("Missing file or file_type")
            return Response({"error": "Fichier ou type manquant."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_path = default_storage.save(file_obj.name, file_obj)
            logger.info(f"Temporary file saved at: {file_path}")

            if not os.path.exists(file_path):
                logger.error(f"File not found after saving: {file_path}")
                return Response({"error": "Fichier non trouvé après sauvegarde."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                df = pd.read_excel(file_path)
                logger.info(f"Excel data loaded: Columns {df.columns.tolist()}, Sample rows {df.head().to_dict() if not df.empty else 'Empty'}")
            except Exception as e:
                logger.error(f"Error reading Excel file: {str(e)}", exc_info=True)
                return Response({"error": f"Erreur lors de la lecture du fichier Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            if file_type == 'intervention':
                data = []
                EVENT_CHOICES = [choice[0] for choice in Intervention.EVENT_CHOICES]
                STATUS_CHOICES = [choice[0] for choice in Intervention.STATUS_CHOICES]
                for index, row in df.iterrows():
                    if pd.notna(row.get('Ref Dossier')):
                        logger.debug(f"Processing row {index} for Intervention: Raw data {row.to_dict()}")
                        societe_name = row.get('Société d\'Assistance', '').strip()
                        societe_assistance, created = SocieteAssistance.objects.get_or_create(nom=societe_name)
                        logger.info(f"Société {societe_name} {'created' if created else 'exists'}")

                        intervention = Intervention(
                            societe_assistance=societe_assistance,
                            ref_dossier=str(row.get('Ref Dossier', ''))[:50],
                            assure=str(row.get('Assuré', ''))[:100],
                            date_intervention=pd.to_datetime(row.get('Date d\'intervention', ''), errors='coerce').date() if pd.notna(row.get('Date d\'intervention')) else None,
                            evenement=next((e for e in EVENT_CHOICES if e.lower() in str(row.get('Evènement', '')).lower()), 'Remorquage Interurbain')[:100],
                            immatriculation=str(row.get('Immatriculation', ''))[:50],
                            marque=str(row.get('Marque', ''))[:50],
                            point_attach=str(row.get('Point d\'attach', 'TAMANAR'))[:100],
                            lieu_intervention=str(row.get('Lieu d\'intervention', ''))[:100],
                            destination=str(row.get('Destination', ''))[:100],
                            cout_prestation_ttc=Decimal(str(row.get('Cout de Prestation TTC', 0))) if pd.notna(row.get('Cout de Prestation TTC')) else Decimal('0'),
                            status=next((s for s in STATUS_CHOICES if s.lower() in str(row.get('status', '')).lower()), 'En cours')[:50],
                            user=request.user
                        )
                        try:
                            intervention.full_clean()
                            logger.debug(f"Row {index} for Intervention validated: {intervention.__dict__}")
                            data.append(intervention)
                        except ValidationError as e:
                            logger.warning(f"Validation error for row {index}: {str(e)}")
                            continue
                if not data:
                    logger.warning(f"No valid data to create interventions. Checked {len(df)} rows")
                    return Response({"message": "0 interventions créées avec succès."}, status=status.HTTP_201_CREATED)
                created_interventions = Intervention.objects.bulk_create(data, ignore_conflicts=True)
                created_count = len(created_interventions)
                logger.info(f"Created {created_count} interventions")
                return Response({"message": f"{created_count} interventions créées avec succès."}, status=status.HTTP_201_CREATED)

            elif file_type == 'suivi_carburant':
                data = []
                for index, row in df.iterrows():
                    if pd.notna(row.get('VEHICULE')):  # Changed to match your header
                        logger.debug(f"Processing row {index} for SuiviCarburant: Raw data {row.to_dict()}")
                        # Convert DATE to datetime
                        date_value = row.get('DATE', '')
                        date_obj = pd.to_datetime(date_value, errors='coerce').date() if pd.notna(date_value) else None
                        if not date_obj:
                            logger.warning(f"Invalid date for row {index}: {date_value}")
                            continue

                        suivi = SuiviCarburant(
                            vehicule=str(row.get('VEHICULE', ''))[:50],
                            date=date_obj,
                            service=str(row.get('SERVICE', ''))[:50],
                            pompiste=str(row.get('POMPISTE', ''))[:50],
                            smitoStation='',  # Not in your file, set to empty
                            prix=Decimal(str(row.get('PRIX DH', 0))) if pd.notna(row.get('PRIX DH')) else Decimal('0'),
                            user=request.user
                        )
                        try:
                            suivi.full_clean()
                            logger.debug(f"Row {index} for SuiviCarburant validated: {suivi.__dict__}")
                            data.append(suivi)
                        except ValidationError as e:
                            logger.warning(f"Validation error for row {index}: {str(e)}")
                            continue
                if not data:
                    logger.warning(f"No valid data to create suivi carburant entries. Checked {len(df)} rows")
                    return Response({"message": "0 entrées créées avec succès."}, status=status.HTTP_201_CREATED)
                created_suivis = SuiviCarburant.objects.bulk_create(data, ignore_conflicts=True)
                created_count = len(created_suivis)
                logger.info(f"Created {created_count} suivi carburant entries")
                return Response({"message": f"{created_count} entrées créées avec succès."}, status=status.HTTP_201_CREATED)

            else:
                return Response({"error": "Type de fichier non supporté."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error in upload: {str(e)}", exc_info=True)
            return Response({"error": f"Erreur inattendue: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            if os.path.exists(file_path):
                default_storage.delete(file_path)
                logger.info(f"Temporary file deleted: {file_path}")






import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import pandas as pd
from django.http import HttpResponse
from .models import Intervention, SuiviCarburant, SocieteAssistance
from django.core.files.storage import default_storage
import os
from django.http import HttpResponseServerError
from django.db import IntegrityError
from decimal import Decimal
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)

class ExcelUploadView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, *args, **kwargs):
        logger.info("Upload Excel request received")
        file_obj = request.FILES.get('file')
        file_type = request.POST.get('file_type')

        if not file_obj or not file_type:
            return Response({"error": "Fichier ou type manquant."}, status=status.HTTP_400_BAD_REQUEST)

        file_path = None
        try:
            file_path = default_storage.save(file_obj.name, file_obj)
            if not os.path.exists(file_path):
                return Response({"error": "Fichier non trouvé après sauvegarde."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            try:
                df = pd.read_excel(file_path)
            except Exception as e:
                return Response({"error": f"Erreur lors de la lecture du fichier Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            if file_type == 'intervention':
                data = []
                EVENT_CHOICES = [choice[0] for choice in Intervention.EVENT_CHOICES]
                STATUS_CHOICES = [choice[0] for choice in Intervention.STATUS_CHOICES]
                for index, row in df.iterrows():
                    if pd.notna(row.get('Ref Dossier')):
                        societe_name = str(row.get("Société d'Assistance", '')).strip()
                        societe_assistance, _ = SocieteAssistance.objects.get_or_create(nom=societe_name)
                        intervention = Intervention(
                            societe_assistance=societe_assistance,
                            ref_dossier=str(row.get('Ref Dossier', ''))[:50],
                            assure=str(row.get('Assuré', ''))[:100],
                            date_intervention=pd.to_datetime(row.get("Date d'intervention", ''), errors='coerce').date() if pd.notna(row.get("Date d'intervention")) else None,
                            evenement=next((e for e in EVENT_CHOICES if e.lower() in str(row.get('Evènement', '')).lower()), 'Remorquage Interurbain')[:100],
                            immatriculation=str(row.get('Immatriculation', ''))[:50],
                            marque=str(row.get('Marque', ''))[:50],
                            point_attach=str(row.get("Point d'attach", 'TAMANAR'))[:100],
                            lieu_intervention=str(row.get("Lieu d'intervention", ''))[:100],
                            destination=str(row.get('Destination', ''))[:100],
                            cout_prestation_ttc=Decimal(str(row.get('Cout de Prestation TTC', 0))) if pd.notna(row.get('Cout de Prestation TTC')) else Decimal('0'),
                            status=next((s for s in STATUS_CHOICES if s.lower() in str(row.get('status', '')).lower()), 'En cours')[:50],
                            user=request.user,
                        )
                        try:
                            intervention.full_clean()
                            data.append(intervention)
                        except Exception:
                            continue
                if not data:
                    return Response({"message": "0 interventions créées avec succès."}, status=status.HTTP_201_CREATED)
                created = Intervention.objects.bulk_create(data, ignore_conflicts=True)
                return Response({"message": f"{len(created)} interventions créées avec succès."}, status=status.HTTP_201_CREATED)

            elif file_type == 'suivi_carburant':
                data = []
                for index, row in df.iterrows():
                    if pd.notna(row.get('VEHICULE')):
                        date_value = row.get('DATE', '')
                        date_obj = pd.to_datetime(date_value, errors='coerce').date() if pd.notna(date_value) else None
                        if not date_obj:
                            continue
                        suivi = SuiviCarburant(
                            vehicule=str(row.get('VEHICULE', ''))[:50],
                            date=date_obj,
                            service=str(row.get('SERVICE', ''))[:50],
                            pompiste=str(row.get('POMPISTE', ''))[:50],
                            smitoStation='',
                            prix=Decimal(str(row.get('PRIX DH', 0))) if pd.notna(row.get('PRIX DH')) else Decimal('0'),
                            user=request.user,
                        )
                        try:
                            suivi.full_clean()
                            data.append(suivi)
                        except Exception:
                            continue
                if not data:
                    return Response({"message": "0 entrées créées avec succès."}, status=status.HTTP_201_CREATED)
                created = SuiviCarburant.objects.bulk_create(data, ignore_conflicts=True)
                return Response({"message": f"{len(created)} entrées créées avec succès."}, status=status.HTTP_201_CREATED)

            else:
                return Response({"error": "Type de fichier non supporté."}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Unexpected error in upload: {str(e)}", exc_info=True)
            return Response({"error": f"Erreur inattendue: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        finally:
            if file_path and os.path.exists(file_path):
                default_storage.delete(file_path)


@method_decorator(login_required, name='dispatch')
class ExportToExcelView(APIView):
       def get(self, request, model_type):
           logger.info(f"Export to Excel request received for model: {model_type}")
           response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
           response['Content-Disposition'] = f'attachment; filename={model_type}_export_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.xlsx'

           if model_type == 'suivi_carburant':
               queryset = SuiviCarburant.objects.all()
               data = {
                   'DATE': [q.date.strftime('%Y-%m-%d') for q in queryset],
                   'VEHICULE': [q.vehicule for q in queryset],
                   'SERVICE': [q.service for q in queryset],
                   'POMPISTE': [q.pompiste for q in queryset],
                   'PRIX DH': [float(q.prix) for q in queryset]
               }
               df = pd.DataFrame(data)
               df.to_excel(response, index=False, sheet_name='Suivi Carburant')
               logger.info(f"Exported {len(queryset)} SuiviCarburant entries to Excel")

           elif model_type == 'intervention':
               queryset = Intervention.objects.all()
               data = {
                   'REF DOSSIER': [q.ref_dossier for q in queryset],
                   'ASSURE': [q.assure for q in queryset],
                   'DATE INTERVENTION': [q.date_intervention.strftime('%Y-%m-%d') if q.date_intervention else '' for q in queryset],
                   'EVENEMENT': [q.evenement for q in queryset],
                   'IMMATRICULATION': [q.immatriculation for q in queryset],
                   'MARQUE': [q.marque for q in queryset],
                   'COUT PRESTATION TTC': [float(q.cout_prestation_ttc) for q in queryset],
                   'STATUS': [q.status for q in queryset]
               }
               df = pd.DataFrame(data)
               df.to_excel(response, index=False, sheet_name='Interventions')
               logger.info(f"Exported {len(queryset)} Intervention entries to Excel")

           else:
               logger.warning(f"Unsupported model type: {model_type}")
               return Response({"error": "Type de modèle non supporté."}, status=status.HTTP_400_BAD_REQUEST)

           return response   





           
from django.db.models import Count, Sum
from django.http import JsonResponse
from django.db.models.functions import TruncMonth
from .models import Intervention, SuiviCarburant, Facture
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_interventions(request):
    data = Intervention.objects.annotate(month=TruncMonth('date_intervention')) \
        .values('month').annotate(total=Count('id')).order_by('month')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_factures(request):
    data = Facture.objects.annotate(month=TruncMonth('date')) \
        .values('month').annotate(total=Sum('montant_ttc')).order_by('month')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monthly_carburant(request):
    data = SuiviCarburant.objects.annotate(month=TruncMonth('date')) \
        .values('month').annotate(total=Sum('prix')).order_by('month')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def intervention_types(request):
    data = Intervention.objects.values('evenement').annotate(total=Count('id')).order_by('-total')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def insurance_companies(request):
    data = Intervention.objects.values('billing_company').annotate(total=Count('id')).order_by('-total')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_locations(request):
    data = Intervention.objects.values('assure').annotate(total=Count('id')).order_by('-total')[:5]  # Top 5 locations
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def fleet_consumption(request):
    data = SuiviCarburant.objects.values('vehicule').annotate(total=Sum('prix')).order_by('-total')
    return JsonResponse(list(data), safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profit_loss(request):
    interventions = Intervention.objects.aggregate(total_income=Sum('cout_prestation_ttc'))['total_income'] or 0
    carburant = SuiviCarburant.objects.aggregate(total_expense=Sum('prix'))['total_expense'] or 0
    data = {'month': 'Total', 'profit_loss': float(interventions - carburant)}
    return JsonResponse([data], safe=False)        

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count
from .models import Intervention, Facture

@api_view(['GET'])
def insurance_companies(request):
    # Use 'societe_assistance' from Intervention model
    data = Intervention.objects.values('societe_assistance__nom').annotate(total=Count('id')).filter(societe_assistance__isnull=False).order_by('-total')
    
    # Optionally, you can also include data from Facture model if needed
    facture_data = Facture.objects.values('billing_company_obj__nom').annotate(total=Count('id')).order_by('-total')
    
    # Combine or choose one source based on your needs
    # Here, I'll use Intervention data as the primary source
    result = [
        {'company': item['societe_assistance__nom'], 'total': item['total']}
        for item in data if item['societe_assistance__nom']  # Filter out None values
    ]
    
    return Response(result)                    


class ExportToExcelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, model_type):
        filename = f"{model_type}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # =========================
        # INTERVENTIONS
        # =========================
        if model_type == "intervention":
            qs = Intervention.objects.all()

            df = pd.DataFrame(list(qs.values(
                "ref_dossier",
                "assure",
                "date_intervention",
                "evenement",
                "immatriculation",
                "marque",
                "status",
                "cout_prestation_ttc",
            )))

            df.rename(columns={
                "ref_dossier": "REF DOSSIER",
                "assure": "ASSURÉ",
                "date_intervention": "DATE",
                "evenement": "ÉVÉNEMENT",
                "immatriculation": "IMMATRICULATION",
                "marque": "MARQUE",
                "status": "STATUT",
                "cout_prestation_ttc": "COÛT TTC (DH)",
            }, inplace=True)

            df.to_excel(response, index=False, sheet_name="Interventions")
            return response

        # =========================
        # SUIVI CARBURANT
        # =========================
        elif model_type == "suivi_carburant":
            qs = SuiviCarburant.objects.all()

            df = pd.DataFrame(list(qs.values(
                "date",
                "vehicule",
                "service",
                "pompiste",
                "smitoStation",
                "prix",
            )))

            df.rename(columns={
                "date": "DATE",
                "vehicule": "VÉHICULE",
                "service": "SERVICE",
                "pompiste": "POMPISTE",
                "smitoStation": "STATION",
                "prix": "PRIX (DH)",
            }, inplace=True)

            df.to_excel(response, index=False, sheet_name="Suivi Carburant")
            return response

        # =========================
        # FACTURES
        # =========================
        elif model_type == "facture":
            qs = Facture.objects.all()

            df = pd.DataFrame(list(qs.values(
                "facture_num",
                "date",
                "billing_company_name_display",
                "montant_ht",
                "tva",
                "montant_ttc",
            )))

            df.rename(columns={
                "facture_num": "NUMÉRO",
                "date": "DATE",
                "billing_company_name_display": "SOCIÉTÉ",
                "montant_ht": "MONTANT HT",
                "tva": "TVA",
                "montant_ttc": "MONTANT TTC",
            }, inplace=True)

            df.to_excel(response, index=False, sheet_name="Factures")
            return response

        # =========================
        # ERROR
        # =========================
        return HttpResponse("Type non supporté", status=400)
