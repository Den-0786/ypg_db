

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0024_alter_guilder_original_new_member_id'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomSMSLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('message', models.TextField()),
                ('sender', models.CharField(blank=True, default='', max_length=150)),
                ('recipient_filter', models.CharField(choices=[('all', 'All Guilders'), ('active', 'Active Only'), ('congregation', 'By Congregation')], default='all', max_length=30)),
                ('recipient_count', models.PositiveIntegerField(default=0)),
                ('sent_at', models.DateTimeField(auto_now_add=True)),
                ('congregation', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='core.congregation')),
                ('sent_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-sent_at'],
            },
        ),
        migrations.CreateModel(
            name='ScheduledSMSLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_type', models.CharField(choices=[('new_month', 'Happy New Month'), ('new_year', 'Happy New Year'), ('dues_reminder', 'Dues Reminder')], max_length=20)),
                ('sent_date', models.DateField()),
                ('recipient_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-sent_date'],
                'unique_together': {('message_type', 'sent_date')},
            },
        ),
    ]
