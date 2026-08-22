from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Congregation, SundayAttendance, SundayReminderLog
from core.sms import send_sms


class Command(BaseCommand):
    help = (
        "SMS local leaders who have not submitted their Sunday attendance "
        "by 5PM. Safe to run multiple times - each congregation is reminded "
        "at most once per Sunday."
    )

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()

        if today.weekday() != 6:  # 6 = Sunday
            return

        if now.hour < 17:
            self.stdout.write("Before 5PM - skipping.")
            return

        reminded = 0
        for congregation in Congregation.objects.filter(
            is_district=False
        ).exclude(leader_phone=""):
            already_submitted = SundayAttendance.objects.filter(
                congregation=congregation, date=today
            ).exists()
            already_reminded = SundayReminderLog.objects.filter(
                congregation=congregation, sent_date=today
            ).exists()
            if already_submitted or already_reminded:
                continue

            message = (
                f"YPG Ahinsan: {congregation.name} has not yet submitted today's "
                "Sunday attendance. Kindly submit it before the day ends. Thank you."
            )
            if send_sms(congregation.leader_phone, message):
                SundayReminderLog.objects.create(
                    congregation=congregation, sent_date=today
                )
                self.stdout.write(self.style.SUCCESS(f"Reminder sent to {congregation.name}"))
                reminded += 1

        self.stdout.write(self.style.SUCCESS(f"Sent {reminded} Sunday reminder(s)"))
