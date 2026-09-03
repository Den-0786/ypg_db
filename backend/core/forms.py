from django import forms
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import datetime

from .models import (BulkProfileCart, Congregation, Executive, Guilder, Role,
                     SundayAttendance)


class SundayAttendanceForm(forms.ModelForm):
    class Meta:
        model = SundayAttendance
        fields = ["congregation", "date", "male_count", "female_count"]
        widgets = {
            "date": forms.DateInput(attrs={"type": "date"}),
            "male_count": forms.NumberInput(attrs={"min": "0"}),
            "female_count": forms.NumberInput(attrs={"min": "0"}),
        }


class GuilderForm(forms.ModelForm):
    class Meta:
        model = Guilder
        fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "phone_number",
            "email",
            "place_of_residence",
            "residential_address",
            "profession",
            "hometown",
            "relative_contact",
            "congregation",
            "membership_status",
            "member_level",
            "member_type",
            "purpose_of_joining",
            "position",
            "favorite_quote",
            "is_baptized",
            "is_confirmed",
            "is_communicant",
            "attends_weekly_meetings",
            "attends_sunday_service",
            "joins_other_activities",
            "role",
            "profile_picture",
        ]
        widgets = {
            "date_of_birth": forms.DateInput(attrs={"type": "date"}),
            "phone_number": forms.TextInput(attrs={"placeholder": "+233XXXXXXXXX"}),
            "email": forms.EmailInput(attrs={"placeholder": "optional@email.com"}),
            "favorite_quote": forms.Textarea(attrs={"rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["date_of_birth"].required = False
        self.fields["member_level"].required = False
        self.fields["member_level"].initial = "local"
        self.fields["member_type"].required = False
        self.fields["member_type"].initial = "existing"
        self.fields["purpose_of_joining"].required = False

    def clean_date_of_birth(self):
        dob = self.cleaned_data.get("date_of_birth")
        if dob is None:
            return None
        if isinstance(dob, str) and dob:
            dob = dob.strip()
            for fmt in ("%Y-%m-%d", "%m-%d", "%d-%m", "%m/%d/%Y", "%d/%m/%Y"):
                try:
                    parsed = datetime.strptime(dob, fmt)
                    return parsed.replace(year=1900).date()
                except ValueError:
                    continue
            raise forms.ValidationError("Invalid date format. Use MM-DD or YYYY-MM-DD.")
        if isinstance(dob, datetime):
            return dob.replace(year=1900).date()
        return dob

    def clean_phone_number(self):
        phone = self.cleaned_data.get("phone_number")
        if phone:
            phone = phone.strip()
            # Keep phone numbers in 0XXXXXXXXX format as expected by frontend
            # Only convert if it's in +233 format to 0 format
            if phone.startswith("+233"):
                phone = "0" + phone[4:]  # Convert +233XXXXXXXXX to 0XXXXXXXXX
            # Ensure it starts with 0 and is 10 digits
            if not phone.startswith("0"):
                phone = "0" + phone.lstrip("0")
        return phone

    def clean(self):
        cleaned_data = super().clean()
        first_name = cleaned_data.get("first_name")
        last_name = cleaned_data.get("last_name")
        congregation = cleaned_data.get("congregation")

        # Skip duplicate check for instance being updated (exclude self)
        instance = getattr(self, 'instance', None)
        existing = Guilder.objects.filter(
            first_name__iexact=first_name,
            last_name__iexact=last_name,
            congregation=congregation,
        )
        if instance and instance.pk:
            existing = existing.exclude(pk=instance.pk)

        if first_name and last_name and congregation and existing.exists():
            raise forms.ValidationError(
                f"A member named '{first_name} {last_name}' already exists in "
                f"'{congregation}'. Please check for duplicates before adding."
            )

        return cleaned_data


class CongregationForm(forms.ModelForm):
    class Meta:
        model = Congregation
        fields = ["name", "location", "background_color"]
        widgets = {"background_color": forms.TextInput(attrs={"type": "color"})}


class NewCongregationForm(forms.ModelForm):
    username = forms.CharField(
        max_length=150, help_text="Username for congregation login"
    )
    password = forms.CharField(
        widget=forms.PasswordInput(), help_text="Password for congregation login"
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(), help_text="Confirm password"
    )

    class Meta:
        model = Congregation
        fields = ["name", "location", "background_color", "pin"]
        widgets = {
            "background_color": forms.TextInput(attrs={"type": "color"}),
            "pin": forms.TextInput(attrs={"maxlength": "6", "pattern": "[0-9]{6}"}),
        }

    def clean_confirm_password(self):
        password = self.cleaned_data.get("password")
        confirm_password = self.cleaned_data.get("confirm_password")

        if password and confirm_password and password != confirm_password:
            raise ValidationError("Passwords don't match.")
        return confirm_password

    def clean_username(self):
        username = self.cleaned_data.get("username")
        if User.objects.filter(username=username).exists():
            raise ValidationError("This username is already taken.")
        return username


class ChangePINForm(forms.Form):
    current_pin = forms.CharField(
        max_length=4,
        widget=forms.PasswordInput(attrs={"placeholder": "Current PIN"}),
        help_text="Enter your current 4-digit PIN",
    )
    new_pin = forms.CharField(
        max_length=4,
        widget=forms.PasswordInput(attrs={"placeholder": "New PIN"}),
        help_text="Enter your new 4-digit PIN",
    )
    confirm_pin = forms.CharField(
        max_length=4,
        widget=forms.PasswordInput(attrs={"placeholder": "Confirm new PIN"}),
        help_text="Confirm your new 4-digit PIN",
    )

    def clean_current_pin(self):
        pin = self.cleaned_data.get("current_pin")
        if not pin.isdigit() or len(pin) != 4:
            raise ValidationError("PIN must be a 4-digit number.")
        return pin

    def clean_new_pin(self):
        pin = self.cleaned_data.get("new_pin")
        if not pin.isdigit() or len(pin) != 4:
            raise ValidationError("PIN must be a 4-digit number.")
        return pin

    def clean_confirm_pin(self):
        new_pin = self.cleaned_data.get("new_pin")
        confirm_pin = self.cleaned_data.get("confirm_pin")

        if new_pin and confirm_pin and new_pin != confirm_pin:
            raise ValidationError("PINs don't match.")
        return confirm_pin


class RoleForm(forms.ModelForm):
    class Meta:
        model = Role
        fields = ["name", "description"]


class BulkGuilderForm(forms.Form):
    congregation = forms.ModelChoiceField(
        queryset=Congregation.objects.all(), empty_label="Select Congregation"
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["congregation"].widget.attrs.update({"class": "form-select"})


class PINForm(forms.Form):
    pin = forms.CharField(
        max_length=4,
        widget=forms.PasswordInput(attrs={"placeholder": "Enter 4-digit PIN"}),
    )

    def clean_pin(self):
        pin = self.cleaned_data.get("pin")
        if not pin.isdigit() or len(pin) != 4:
            raise ValidationError("PIN must be a 4-digit number.")
        return pin


class SearchForm(forms.Form):
    search = forms.CharField(
        max_length=100,
        required=False,
        widget=forms.TextInput(
            attrs={"placeholder": "Search by name or phone number..."}
        ),
    )
    congregation = forms.ModelChoiceField(
        queryset=Congregation.objects.all(),
        required=False,
        empty_label="All Congregations",
    )
