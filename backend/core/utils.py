from django.utils.timezone import now

from .models import SundayAttendance
from .models import SystemSettings


def get_sunday_comparison():
    today = now().date()

    sundays = (
        SundayAttendance.objects.order_by("-date")
        .values_list("date", flat=True)
        .distinct()
    )[:2]

    if len(sundays) < 2:
        return None

    latest, previous = sundays[0], sundays[1]

    latest_data = (
        SundayAttendance.objects.filter(date=latest)
        .values("congregation__name")
        .annotate(male=sum("male_count"), female=sum("female_count"))
    )

    previous_data = (
        SundayAttendance.objects.filter(date=previous)
        .values("congregation__name")
        .annotate(total=sum("male_count") + sum("female_count"))
    )

    prev_map = {entry["congregation__name"]: entry["total"] for entry in previous_data}

    comparison = []
    for item in latest_data:
        name = item["congregation__name"]
        total_now = item["male"] + item["female"]
        total_before = prev_map.get(name, 0)
        growth = total_now - total_before
        change = "increase" if growth > 0 else "decrease" if growth < 0 else "no change"

        comparison.append(
            {
                "name": name,
                "male": item["male"],
                "female": item["female"],
                "total": total_now,
                "previous_total": total_before,
                "change": change,
                "growth": abs(growth),
            }
        )

    return comparison


def get_system_setting(setting_type, default_message=None):
    """
    Get a system setting by type
    
    Args:
        setting_type (str): The type of setting to retrieve
        default_message (str): Default message if setting not found
    
    Returns:
        SystemSettings object or None
    """
    try:
        return SystemSettings.objects.get(setting_type=setting_type, is_active=True)
    except SystemSettings.DoesNotExist:
        return None


def get_formatted_message(setting_type, **kwargs):
    """
    Get a formatted message from system settings
    
    Args:
        setting_type (str): The type of setting to retrieve
        **kwargs: Placeholder values to replace in the message
    
    Returns:
        str: Formatted message or default message if setting not found
    """
    setting = get_system_setting(setting_type)
    if setting:
        return setting.get_formatted_message(**kwargs)
    
    # Default messages if setting not found
    default_messages = {
        "attendance_reminder": "Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you! - Ahinsan District YPG",
        "birthday_message": "On your special day, {name}, Ahinsan District YPG celebrates you! Wishing you joy, good health, and God's abundant favour in the year ahead. Happy Birthday!",
        "welcome_message": "Welcome {name} to {congregation}! We're so glad to have you join our family at Ahinsan District YPG.",
        "joint_program_notification": "Joint program scheduled for {date} ({day}) at {location}. All congregations are invited by Ahinsan District YPG!",
    }
    
    default_message = default_messages.get(setting_type, "")
    if default_message:
        for key, value in kwargs.items():
            default_message = default_message.replace(f"{{{key}}}", str(value))
    
    return default_message


def send_reminder_message(setting_type, **kwargs):
    """
    Send a reminder message using system settings
    
    Args:
        setting_type (str): The type of setting to use
        **kwargs: Placeholder values for the message
    
    Returns:
        str: The formatted message to send
    """
    message = get_formatted_message(setting_type, **kwargs)
    
    # TODO: Integrate with SMS/email service here
    # For now, just return the formatted message
    print(f"Sending {setting_type} message: {message}")
    
    return message
