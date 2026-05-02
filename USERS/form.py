from django import forms
from .models import USER

class UserForm(forms.ModelForm):
    class Meta:
        model = USER
        fields = ['username', 'email', 'password', 'age']