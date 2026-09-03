from django.contrib import admin

from .models import (BirthdayMessageLog, BulkProfileCart, Congregation,
                     Executive, Guilder, Role, SundayAttendance, Notification, SystemSettings, Quiz, QuizSubmission, UserProfile, LoginAttempt)


@admin.register(Congregation)
class CongregationAdmin(admin.ModelAdmin):
    list_display = ("name", "location")
    search_fields = ("name", "location")


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "congregation", "phone_number", "created_at")
    list_filter = ("role", "congregation", "created_at")
    search_fields = ("user__username", "user__first_name", "user__last_name", "user__email")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("User Information", {
            "fields": ("user", "role", "congregation"),
        }),
        ("Contact Information", {
            "fields": ("phone_number", "emergency_contact", "emergency_contact_name"),
        }),
        ("Personal Information", {
            "fields": ("bio", "address", "date_of_birth", "avatar"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("username", "ip_address", "attempt_count", "is_blocked", "last_attempt")
    list_filter = ("is_blocked", "last_attempt")
    search_fields = ("username", "ip_address")
    readonly_fields = ("first_attempt", "last_attempt")
    
    fieldsets = (
        ("Login Information", {
            "fields": ("username", "ip_address"),
        }),
        ("Attempt Tracking", {
            "fields": ("attempt_count", "is_blocked", "blocked_until"),
        }),
        ("Timestamps", {
            "fields": ("first_attempt", "last_attempt"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Guilder)
class GuilderAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "phone_number", "gender", "congregation")
    search_fields = ("first_name", "last_name", "phone_number")
    list_filter = ("gender", "congregation", "membership_status")


@admin.register(Executive)
class ExecutiveAdmin(admin.ModelAdmin):
    list_display = ("guilder", "level", "local_position", "district_position", "congregation", "is_active")
    search_fields = ("guilder__first_name", "guilder__last_name")
    list_filter = ("level", "is_active", "congregation")


@admin.register(SundayAttendance)
class SundayAttendanceAdmin(admin.ModelAdmin):
    list_display = ("congregation", "date", "male_count", "female_count", "total_count")
    list_filter = ("congregation", "date")
    search_fields = ("congregation__name",)


@admin.register(BirthdayMessageLog)
class BirthdayMessageLogAdmin(admin.ModelAdmin):
    list_display = ("guilder", "sent_date")
    list_filter = ("sent_date",)


@admin.register(BulkProfileCart)
class BulkProfileCartAdmin(admin.ModelAdmin):
    list_display = ("user", "congregation", "created_at", "submitted")
    list_filter = ("congregation", "submitted", "created_at")


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ["setting_type", "title", "is_active", "updated_at"]
    list_filter = ["setting_type", "is_active"]
    search_fields = ["title", "message_template"]
    readonly_fields = ["created_at", "updated_at"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("setting_type", "title", "is_active"),
            "description": "Configure system-wide message templates for different notifications."
        }),
        ("Message Template", {
            "fields": ("message_template",),
            "description": "Use placeholders in your message template. Available placeholders: {congregation}, {date}, {day}, {name}, {location}"
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("setting_type",)
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        """Custom save to provide helpful feedback"""
        super().save_model(request, obj, form, change)
        if change:
            messages.success(request, f"'{obj.title}' settings updated successfully!")
        else:
            messages.success(request, f"'{obj.title}' settings created successfully!")
    
    def get_queryset(self, request):
        """Order by setting type for better organization"""
        return super().get_queryset(request).order_by('setting_type')
    
    def get_list_display(self, request):
        """Add helpful actions"""
        list_display = list(super().get_list_display(request))
        return list_display
    
    def get_actions(self, request):
        """Add bulk actions"""
        actions = super().get_actions(request)
        actions['activate_selected'] = self.activate_selected
        actions['deactivate_selected'] = self.deactivate_selected
        return actions
    
    def activate_selected(self, request, queryset):
        """Bulk activate selected settings"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Successfully activated {updated} setting(s).")
    activate_selected.short_description = "Activate selected settings"
    
    def deactivate_selected(self, request, queryset):
        """Bulk deactivate selected settings"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Successfully deactivated {updated} setting(s).")
    deactivate_selected.short_description = "Deactivate selected settings"


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "is_active", "start_time", "end_time", "created_at")
    list_filter = ("is_active", "created_at", "start_time", "end_time")
    search_fields = ("title", "question", "created_by__username")
    readonly_fields = ("created_at", "updated_at")
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "description", "is_active"),
        }),
        ("Question & Options", {
            "fields": ("question", "option_a", "option_b", "option_c", "option_d", "correct_answer"),
        }),
        ("Timing", {
            "fields": ("start_time", "end_time"),
        }),
        ("Access Control", {
            "fields": ("password", "created_by"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ("created_by",)
        return self.readonly_fields
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(QuizSubmission)
class QuizSubmissionAdmin(admin.ModelAdmin):
    list_display = ("name", "quiz", "phone_number", "congregation", "selected_answer", "is_correct", "submitted_at")
    list_filter = ("is_correct", "submitted_at", "quiz", "congregation")
    search_fields = ("name", "phone_number", "congregation", "quiz__title")
    readonly_fields = ("submitted_at",)
    
    fieldsets = (
        ("Submission Details", {
            "fields": ("quiz", "name", "phone_number", "congregation"),
        }),
        ("Answer", {
            "fields": ("selected_answer", "is_correct"),
        }),
        ("Timestamps", {
            "fields": ("submitted_at",),
            "classes": ("collapse",)
        }),
    )
    
    def has_add_permission(self, request):
        # Disable manual addition of submissions - they should only be created via API
        return False
