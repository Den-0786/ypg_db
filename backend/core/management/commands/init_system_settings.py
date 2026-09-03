from django.core.management.base import BaseCommand
from core.models import SystemSettings


class Command(BaseCommand):
    help = "Initialize default system settings for reminder messages"

    def handle(self, *args, **options):
        default_settings = [
            {
                "setting_type": "attendance_reminder",
                "title": "Attendance Reminder",
                "message_template": "Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you! - Ahinsan District YPG",
                "is_active": True,
            },
            {
                "setting_type": "birthday_message",
                "title": "Birthday Message",
                "message_template": "On your special day, {name}, Ahinsan District YPG celebrates you! Wishing you joy, good health, and God's abundant favour in the year ahead. Happy Birthday!",
                "is_active": True,
            },
            {
                "setting_type": "welcome_message",
                "title": "Welcome Message",
                "message_template": "Welcome {name} to {congregation}! We're so glad to have you join our family at Ahinsan District YPG.",
                "is_active": True,
            },
            {
                "setting_type": "joint_program_notification",
                "title": "Joint Program Notification",
                "message_template": "Joint program scheduled for {date} ({day}) at {location}. All congregations are invited by Ahinsan District YPG!",
                "is_active": True,
            },
        ]

        created_count = 0
        updated_count = 0

        for setting_data in default_settings:
            setting, created = SystemSettings.objects.get_or_create(
                setting_type=setting_data["setting_type"],
                defaults={
                    "title": setting_data["title"],
                    "message_template": setting_data["message_template"],
                    "is_active": setting_data["is_active"],
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created {setting.get_setting_type_display()}: {setting.title}"
                    )
                )
            else:
                # Update existing setting if needed
                if (setting.title != setting_data["title"] or 
                    setting.message_template != setting_data["message_template"] or
                    setting.is_active != setting_data["is_active"]):
                    setting.title = setting_data["title"]
                    setting.message_template = setting_data["message_template"]
                    setting.is_active = setting_data["is_active"]
                    setting.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f"Updated {setting.get_setting_type_display()}: {setting.title}"
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f"System settings initialization complete! "
                f"Created: {created_count}, Updated: {updated_count}"
            )
        ) 