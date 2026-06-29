from django.urls import path

from . import views

app_name = "core"

urlpatterns = [
    # Dashboard URLs
    path("", views.dashboard, name="dashboard"),
    path(
        "congregation/<int:congregation_id>/",
        views.congregation_dashboard,
        name="congregation_dashboard",
    ),
    # Credential Management URLs
    path("change-pin/", views.change_pin, name="change_pin"),
    path("change-password/", views.change_password, name="change_password"),
    path("create-congregation/", views.create_congregation, name="create_congregation"),
    path("update-theme/", views.update_theme, name="update_theme"),
    # Member Management URLs
    path("members/", views.member_list, name="member_list"),
    path("members/add/", views.add_member, name="add_member"),
    path("members/<int:member_id>/", views.member_detail, name="member_detail"),
    path("members/<int:member_id>/edit/", views.edit_member, name="edit_member"),
    path("members/<int:member_id>/delete/", views.delete_member, name="delete_member"),
    # Attendance URLs
    path("attendance/", views.attendance_list, name="attendance_list"),
    path("attendance/log/", views.log_attendance, name="log_attendance"),
    path(
        "attendance/analytics/", views.attendance_analytics, name="attendance_analytics"
    ),
    path("analytics/", views.analytics_dashboard, name="analytics_dashboard"),
    path("analytics/advanced/", views.advanced_analytics, name="advanced_analytics"),
    # Bulk Operations URLs
    path("bulk/", views.bulk_registration, name="bulk_registration"),
    path("bulk/cart/<int:cart_id>/", views.bulk_cart, name="bulk_cart"),
    # Export URLs
    path("export/members/csv/", views.export_members_csv, name="export_members_csv"),
    path(
        "export/attendance/csv/",
        views.export_attendance_csv,
        name="export_attendance_csv",
    ),
    path("export/members/pdf/", views.export_members_pdf, name="export_members_pdf"),
    path(
        "export/attendance/pdf/",
        views.export_attendance_pdf,
        name="export_attendance_pdf",
    ),
    # Authentication API URLs
    path("api/auth/login/", views.api_login, name="api_login"),
    path("api/auth/pin-login/", views.api_pin_login, name="api_pin_login"),
    path("api/auth/logout/", views.api_logout, name="api_logout"),
    path("api/auth/verify-password/", views.api_verify_password, name="api_verify_password"),
    
    # API URLs
    path("api/members/", views.api_members, name="api_members"),
    path(
        "api/attendance/stats/", views.api_attendance_stats, name="api_attendance_stats"
    ),
    path("api/attendance/log/", views.api_log_attendance, name="api_log_attendance"),
    path("api/attendance/records/", views.api_attendance_records, name="api_attendance_records"),
    path("api/attendance/<int:attendance_id>/", views.api_update_attendance, name="api_update_attendance"),
    path("api/attendance/<int:attendance_id>/delete/", views.api_delete_attendance, name="api_delete_attendance"),
    path("api/members/add/", views.api_add_member, name="api_add_member"),
    path("api/members/update/<int:member_id>/", views.api_update_member, name="api_update_member"),
    path("api/members/<int:member_id>/delete/", views.api_delete_member, name="api_delete_member"),
    path(
        "api/analytics/attendance-chart/",
        views.api_attendance_chart_data,
        name="api_attendance_chart_data",
    ),
    path(
        "api/analytics/congregation-pie/",
        views.api_congregation_pie_data,
        name="api_congregation_pie_data",
    ),
    path(
        "api/analytics/gender-distribution/",
        views.api_gender_distribution,
        name="api_gender_distribution",
    ),
    path(
        "api/analytics/attendance-trends/",
        views.api_attendance_trends,
        name="api_attendance_trends",
    ),
    path(
        "api/executive-positions/",
        views.api_executive_positions,
        name="api_executive_positions",
    ),
    path("api/dashboard-stats/", views.api_dashboard_stats, name="api_dashboard_stats"),
    path("api/home-stats/", views.api_home_stats, name="api_home_stats"),
    # Notification API URLs
    path("api/notifications/", views.api_notifications, name="api_notifications"),
    path("api/notifications/mark-read/", views.api_mark_notification_read, name="api_mark_notification_read"),
    path("api/notifications/clear/", views.api_clear_notifications, name="api_clear_notifications"),
    path("api/notifications/send/", views.api_send_manual_notification, name="api_send_manual_notification"),
    path("api/notifications/create-test/", views.api_create_test_notifications, name="api_create_test_notifications"),
    # Birthday SMS URLs
    path("birthdays/", views.birthday_dashboard, name="birthday_dashboard"),
    path(
        "birthdays/send-sms/<int:guilder_id>/",
        views.send_birthday_sms,
        name="send_birthday_sms",
    ),
    path("api/verify-password/", views.api_verify_password, name="api_verify_password"),

    
    # Settings API URLs
    path('api/settings/profile/', views.api_settings_profile, name='api_settings_profile'),
    path('api/settings/security/', views.api_settings_security, name='api_settings_security'),
    path('api/settings/website/', views.api_settings_website, name='api_settings_website'),
    path('api/validate-pin/', views.api_validate_pin, name='api_validate_pin'),
    path('api/congregation/initials/', views.api_congregation_initials, name='api_congregation_initials'),
    path('api/get-current-pin/', views.api_get_current_pin, name='api_get_current_pin'),
    
    # Data Management API URLs
    path('api/data/export/csv/', views.api_export_csv, name='api_export_csv'),
    path('api/data/export/excel/', views.api_export_excel, name='api_export_excel'),
    path('api/data/export/pdf/', views.api_export_pdf, name='api_export_pdf'),
    path('api/data/backup/create/', views.api_create_backup, name='api_create_backup'),
    path('api/data/backup/restore/', views.api_restore_backup, name='api_restore_backup'),
    path('api/data/clear/', views.api_clear_data, name='api_clear_data'),
    
    # Reminder Settings API URLs
    path('api/reminder-settings/', views.api_reminder_settings, name='api_reminder_settings'),
    
    # Analytics API URLs
    path('api/analytics/detailed/', views.api_analytics_detailed, name='api_analytics_detailed'),
    
    # Blog API URLs
    path('api/blog/', views.api_blog, name='api_blog'),
    path('api/blog/<int:blog_id>/', views.api_blog, name='api_blog_detail'),
    
    # Media API URLs
    path('api/media/', views.api_media, name='api_media'),
    path('api/media/<int:media_id>/', views.api_media, name='api_media_detail'),
    
    # Events API URLs
    path('api/events/', views.api_events, name='api_events'),
    path('api/events/<int:event_id>/', views.api_events, name='api_events_detail'),
    
    # Council API URLs
    path('api/council/', views.api_council, name='api_council'),
]
