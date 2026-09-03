"""
Data migration to move existing executive data from Guilder fields
to the new Executive table.
"""
from django.db import migrations


def forwards(apps, schema_editor):
    Guilder = apps.get_model('core', 'Guilder')
    Executive = apps.get_model('core', 'Executive')

    executives = Guilder.objects.filter(is_executive=True)
    created_count = 0

    for guilder in executives:
        level = guilder.executive_level or 'local'
        local_pos = guilder.local_executive_position
        district_pos = guilder.district_executive_position

        # Skip if no position data at all
        if not local_pos and not district_pos and not guilder.executive_position:
            continue

        # If level is 'both' but only one position is set, derive the other
        if level == 'both':
            if not local_pos and district_pos:
                local_pos = district_pos
            elif local_pos and not district_pos:
                district_pos = local_pos

        Executive.objects.get_or_create(
            guilder=guilder,
            level=level,
            defaults={
                'local_position': local_pos,
                'district_position': district_pos,
                'is_active': True,
                'congregation': guilder.congregation,
            },
        )
        created_count += 1

    print(f"  Migrated {created_count} executive records to Executive table.")


def backwards(apps, schema_editor):
    """Reverse migration: copy Executive data back to Guilder fields."""
    Guilder = apps.get_model('core', 'Guilder')
    Executive = apps.get_model('core', 'Executive')

    for exec_record in Executive.objects.all():
        guilder = exec_record.guilder
        guilder.is_executive = True
        guilder.executive_level = exec_record.level
        guilder.local_executive_position = exec_record.local_position
        guilder.district_executive_position = exec_record.district_position
        guilder.save(update_fields=[
            'is_executive', 'executive_level',
            'local_executive_position', 'district_executive_position',
        ])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0026_alter_guilder_unique_together_executive'),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
