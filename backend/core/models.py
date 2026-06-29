from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

# Executive Position Choices
LOCAL_EXECUTIVE_POSITIONS = [
    ("president", "President"),
    ("vice_president", "Vice President"),
    ("secretary", "Secretary"),
    ("assistant_secretary", "Assistant Secretary"),
    ("financial_secretary", "Financial Secretary"),
    ("treasurer", "Treasurer"),
    ("organizer", "Organizer"),
    ("evangelism_coordinator", "Evangelism Coordinator"),
]

DISTRICT_EXECUTIVE_POSITIONS = [
    ("president", "President"),
    ("presidents_rep", "President's Rep"),
    ("secretary", "Secretary"),
    ("assistant_secretary", "Assistant Secretary"),
    ("financial_secretary", "Financial Secretary"),
    ("treasurer", "Treasurer"),
    ("organizer", "Organizer"),
    ("evangelism_coordinator", "Evangelism Coordinator"),
]

# Executive Level Choices
EXECUTIVE_LEVEL_CHOICES = [
    ("local", "Local Executive"),
    ("district", "District Executive"),
    ("both", "Both Local & District Executive"),
]


class Congregation(models.Model):
    name = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=100, blank=True)
    background_color = models.CharField(max_length=20, default="#f0f0f0")
    pin = models.CharField(
        max_length=4, default="1234", help_text="4-digit PIN for congregation access"
    )
    initials = models.CharField(
        max_length=10, blank=True, default="",
        help_text="Short initials used for member ID generation (e.g. AE)"
    )
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="User account for this congregation",
    )
    is_district = models.BooleanField(
        default=False, help_text="Is this a district congregation?"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=100, default='Local Executive')
    congregation = models.ForeignKey(Congregation, on_delete=models.CASCADE, null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    def get_full_name(self):
        return self.user.get_full_name() or self.user.username

    def get_email(self):
        return self.user.email

    def get_phone(self):
        return self.phone_number

    def get_role(self):
        return self.role


class LoginAttempt(models.Model):
    """Track login attempts to prevent brute force attacks"""
    ip_address = models.GenericIPAddressField()
    username = models.CharField(max_length=150)
    attempt_count = models.IntegerField(default=0)
    first_attempt = models.DateTimeField(auto_now_add=True)
    last_attempt = models.DateTimeField(auto_now=True)
    is_blocked = models.BooleanField(default=False)
    blocked_until = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['ip_address', 'username']

    def __str__(self):
        return f"{self.username} from {self.ip_address}"

    def is_blocked_now(self):
        """Check if the user is currently blocked"""
        if not self.is_blocked or not self.blocked_until:
            return False
        return timezone.now() < self.blocked_until

    def get_remaining_block_time(self):
        """Get remaining block time in hours and minutes"""
        if not self.is_blocked_now():
            return 0, 0
        
        remaining = self.blocked_until - timezone.now()
        hours = int(remaining.total_seconds() // 3600)
        minutes = int((remaining.total_seconds() % 3600) // 60)
        return hours, minutes


class Guilder(models.Model):
    # Section A – Personal Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(
        max_length=10, choices=[("Male", "Male"), ("Female", "Female")]
    )
    phone_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True)
    place_of_residence = models.CharField(max_length=100)
    residential_address = models.CharField(max_length=100)
    profession = models.CharField(max_length=100, blank=True)
    hometown = models.CharField(max_length=100)
    relative_contact = models.CharField(max_length=100)
    congregation = models.ForeignKey(Congregation, on_delete=models.CASCADE)

    # Section B – Church Participation
    membership_status = models.CharField(
        max_length=20,
        choices=[("Active", "Active"), ("Inactive", "Inactive"), ("Distant", "Distant")],
        default="Active",
    )
    position = models.CharField(max_length=100, blank=True)
    favorite_quote = models.TextField(blank=True)
    is_baptized = models.BooleanField(default=True)
    is_confirmed = models.BooleanField(default=True)
    is_communicant = models.BooleanField(default=True)
    attends_weekly_meetings = models.BooleanField(default=True)
    attends_sunday_service = models.BooleanField(default=True)
    joins_other_activities = models.BooleanField(default=True)

    # Executive Information
    is_executive = models.BooleanField(
        default=False, help_text="Is this person an executive member?"
    )
    executive_position = models.CharField(
        max_length=50,
        choices=LOCAL_EXECUTIVE_POSITIONS + DISTRICT_EXECUTIVE_POSITIONS,
        blank=True,
        null=True,
        help_text="Primary executive position if applicable",
    )
    executive_level = models.CharField(
        max_length=20,
        choices=EXECUTIVE_LEVEL_CHOICES,
        default="local",
        help_text="Level of executive role (Local, District, or Both)",
    )
    # Additional fields for dual roles
    local_executive_position = models.CharField(
        max_length=50,
        choices=LOCAL_EXECUTIVE_POSITIONS,
        blank=True,
        null=True,
        help_text="Local executive position if applicable",
    )
    district_executive_position = models.CharField(
        max_length=50,
        choices=DISTRICT_EXECUTIVE_POSITIONS,
        blank=True,
        null=True,
        help_text="District executive position if applicable",
    )

    # Permissions/roles
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)

    # Auto-generated unique member ID (e.g. AE/YPG/001)
    member_id = models.CharField(max_length=30, unique=True, blank=True, null=True)

    # Profile picture
    profile_picture = models.ImageField(upload_to='member_pictures/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number}) - {self.congregation.name}"

    def get_primary_executive_position(self):
        """Get the primary executive position based on level"""
        if self.executive_level == "local":
            return self.local_executive_position or self.executive_position
        elif self.executive_level == "district":
            return self.district_executive_position or self.executive_position
        elif self.executive_level == "both":
            return self.local_executive_position or self.district_executive_position or self.executive_position
        return self.executive_position

    def save(self, *args, **kwargs):
        if not self.member_id:
            initials = (self.congregation.initials or '').strip().upper()
            if initials:
                count = Guilder.objects.filter(congregation=self.congregation).count() + 1
                self.member_id = f"{initials}/YPG/{count:03d}"
        super().save(*args, **kwargs)

    def is_local_executive(self):
        """Check if this person is a local executive"""
        return self.is_executive and self.executive_level in ["local", "both"]

    def is_district_executive(self):
        """Check if this person is a district executive"""
        return self.is_executive and self.executive_level in ["district", "both"]

    def is_dual_executive(self):
        """Check if this person is both local and district executive"""
        return self.is_executive and self.executive_level == "both"

    class Meta:
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['congregation', 'membership_status']),
            models.Index(fields=['is_executive', 'executive_position']),
        ]


class SundayAttendance(models.Model):
    congregation = models.ForeignKey(Congregation, on_delete=models.CASCADE)
    date = models.DateField()
    male_count = models.PositiveIntegerField()
    female_count = models.PositiveIntegerField()
    total_count = models.PositiveIntegerField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["congregation", "date"]
        ordering = ["-date"]
        indexes = [
            models.Index(fields=['congregation', 'date']),
            models.Index(fields=['date']),
        ]

    def save(self, *args, **kwargs):
        self.total_count = self.male_count + self.female_count
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.congregation.name} - {self.date} | Total: {self.total_count}"


class BirthdayMessageLog(models.Model):
    guilder = models.ForeignKey(Guilder, on_delete=models.CASCADE)
    sent_date = models.DateField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["guilder", "sent_date"]

    def __str__(self):
        return f"Birthday SMS to {self.guilder.first_name} on {self.sent_date}"


class BulkProfileCart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    congregation = models.ForeignKey(Congregation, on_delete=models.CASCADE)
    profiles = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    submitted = models.BooleanField(default=False)

    def __str__(self):
        return f"Cart by {self.user.username} for {self.congregation.name} ({'Submitted' if self.submitted else 'Pending'})"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("birthday", "Birthday"),
        ("new_member", "New Member"),
        ("attendance", "Attendance"),
        ("system", "System"),
        ("edit", "Edit"),
        ("delete", "Delete"),
        ("manual", "Manual"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications_sent"
    )
    congregation = models.ForeignKey(Congregation, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    # New fields for change tracking and recipient
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications_received",
        null=True,
        blank=True,
    )
    change_details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['congregation', 'notification_type']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.user.username}"


class SystemSettings(models.Model):
    """System-wide settings for configurable messages and notifications"""
    SETTING_TYPES = [
        ("attendance_reminder", "Attendance Reminder"),
        ("birthday_message", "Birthday Message"),
        ("welcome_message", "Welcome Message"),
        ("joint_program_notification", "Joint Program Notification"),
    ]

    setting_type = models.CharField(max_length=50, choices=SETTING_TYPES, unique=True)
    title = models.CharField(max_length=200, help_text="Title for this setting")
    message_template = models.TextField(help_text="Message template. Use {congregation}, {date}, {day} as placeholders")
    is_active = models.BooleanField(default=True, help_text="Whether this setting is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"
        ordering = ["setting_type"]

    def __str__(self):
        return f"{self.get_setting_type_display()} - {self.title}"

    def get_formatted_message(self, **kwargs):
        """Return the message template with placeholders replaced"""
        message = self.message_template
        for key, value in kwargs.items():
            message = message.replace(f"{{{key}}}", str(value))
        return message


# Quiz Models
class Quiz(models.Model):
    """Model for storing quiz information"""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    question = models.TextField()
    option_a = models.CharField(max_length=500)
    option_b = models.CharField(max_length=500)
    option_c = models.CharField(max_length=500)
    option_d = models.CharField(max_length=500)
    correct_answer = models.CharField(max_length=1, choices=[
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
    ])
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    password = models.CharField(max_length=50, default="youth2024")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'start_time', 'end_time']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def is_currently_active(self):
        """Check if quiz is currently active based on time"""
        now = timezone.now()
        return self.is_active and self.start_time <= now <= self.end_time

    @property
    def has_ended(self):
        """Check if quiz has ended"""
        return timezone.now() > self.end_time

    @property
    def has_started(self):
        """Check if quiz has started"""
        return timezone.now() >= self.start_time


class QuizSubmission(models.Model):
    """Model for storing quiz submissions"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='submissions')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    congregation = models.CharField(max_length=100)
    selected_answer = models.CharField(max_length=1, choices=[
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
    ])
    is_correct = models.BooleanField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['quiz', 'phone_number']),
            models.Index(fields=['quiz', 'is_correct']),
            models.Index(fields=['submitted_at']),
        ]
        # Ensure one submission per phone number per quiz
        unique_together = ['quiz', 'phone_number']

    def __str__(self):
        return f"{self.name} - {self.quiz.title} - {'Correct' if self.is_correct else 'Incorrect'}"

    def save(self, *args, **kwargs):
        # Automatically determine if answer is correct
        self.is_correct = self.selected_answer == self.quiz.correct_answer
        super().save(*args, **kwargs)



