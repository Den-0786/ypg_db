from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import BirthdayMessageLog, Guilder
from core.sms import send_sms


class Command(BaseCommand):
    help = "Send birthday SMS messages to guilders"

    def handle(self, *args, **options):
        today = timezone.now().date()
        birthdays_today = Guilder.objects.filter(
            date_of_birth__month=today.month, date_of_birth__day=today.day
        )

        sent_count = 0
        failed_count = 0
        for guilder in birthdays_today:
            # Idempotency: never send twice on the same day
            if BirthdayMessageLog.objects.filter(
                guilder=guilder, sent_date=today
            ).exists():
                continue

            phone = (guilder.phone_number or "").strip()
            if not phone:
                self.stdout.write(
                    self.style.WARNING(
                        f"No phone number for {guilder.first_name} {guilder.last_name}, skipping"
                    )
                )
                continue

            message = (
                f"Happy Birthday {guilder.first_name}! "
                "May God bless you abundantly and grant you favour all year round. "
                "- Ahinsan District YPG"
            )

            if send_sms(phone, message):
                BirthdayMessageLog.objects.create(
                    guilder=guilder, sent_date=today, message=message
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"SMS sent to {guilder.first_name} {guilder.last_name}"
                    )
                )
                sent_count += 1
            else:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to send to {guilder.first_name} {guilder.last_name}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {sent_count} birthday messages sent, {failed_count} failed"
            )
        )
