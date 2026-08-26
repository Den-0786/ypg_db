from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Guilder, ScheduledSMSLog
from core.sms import send_sms


class Command(BaseCommand):
    help = "Send Happy New Month SMS to all guilders with a phone number"

    def handle(self, *args, **options):
        today = timezone.now().date()

        if ScheduledSMSLog.objects.filter(
            message_type='new_month', sent_date=today
        ).exists():
            self.stdout.write(self.style.WARNING("Already sent today. Skipping."))
            return

        guilders = Guilder.objects.exclude(phone_number="")
        sent_count = 0
        failed_count = 0

        for guilder in guilders:
            message = (
                "Happy New Month! May this month bring you joy, "
                "peace, and favour in all you do. "
                "- Ahinsan District YPG"
            )
            if send_sms(guilder.phone_number, message):
                sent_count += 1
            else:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to send to {guilder.first_name} {guilder.last_name}"
                    )
                )

        ScheduledSMSLog.objects.create(
            message_type='new_month',
            sent_date=today,
            recipient_count=sent_count,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {sent_count} new month messages sent, {failed_count} failed"
            )
        )
