from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Congregation, Role
from django.db import transaction


class Command(BaseCommand):
    help = 'Setup district and local congregation credentials'

    def handle(self, *args, **options):
        with transaction.atomic():
            # Create District Congregation and User
            self.stdout.write("Creating District credentials...")
            
            # Create district user
            district_user, created = User.objects.get_or_create(
                username='district_admin',
                defaults={
                    'first_name': 'District',
                    'last_name': 'Administrator',
                    'email': 'ypgahinsandistrict@gmail.com',
                    'is_staff': True,
                    'is_superuser': False,
                }
            )
            if created:
                district_user.set_password('district2024')
                district_user.save()
                self.stdout.write(self.style.SUCCESS(f"✓ District user created: username=district_admin, password=district2024"))
            else:
                self.stdout.write(self.style.WARNING("District user already exists"))

            # Create district congregation
            district_congregation, created = Congregation.objects.get_or_create(
                name='District Admin',
                defaults={
                    'location': 'District Level',
                    'pin': '1234',
                    'user': district_user,
                    'is_district': True,
                    'background_color': '#4CAF50',
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"✓ District Admin congregation created: PIN=1234"))
            else:
                self.stdout.write(self.style.WARNING("District congregation already exists"))

            # Create Local Congregations
            local_congregations = [
                {
                    'name': 'Emmanuel Congregation Ahinsan',
                    'location': 'Ahinsan, Kumasi',
                    'username': 'emmanuel',
                    'password': 'emmanuel123',
                    'pin': '1234',
                    'color': '#2196F3'
                },
                {
                    'name': 'Peniel Congregation Esreso No1',
                    'location': 'Esreso No1, Kumasi',
                    'username': 'peniel',
                    'password': 'peniel123',
                    'pin': '1234',
                    'color': '#FF9800'
                },
                {
                    'name': 'Mizpah Congregation Odagya No1',
                    'location': 'Odagya No1, Kumasi',
                    'username': 'mizpah_odagya1',
                    'password': 'mizpah2024',
                    'pin': '1234',
                    'color': '#9C27B0'
                },
                {
                    'name': 'Christ Congregation Ahinsan Estate',
                    'location': 'Ahinsan Estate, Kumasi',
                    'username': 'christ_ahinsan',
                    'password': 'christ2024',
                    'pin': '1234',
                    'color': '#F44336'
                },
                {
                    'name': 'Ebenezer Congregation Dompoase Aprabo',
                    'location': 'Dompoase Aprabo, Kumasi',
                    'username': 'ebenezer_dompoase',
                    'password': 'ebenezer2024',
                    'pin': '1234',
                    'color': '#00BCD4'
                },
                {
                    'name': 'Favour Congregation Esreso No2',
                    'location': 'Esreso No2, Kumasi',
                    'username': 'favour_esreso2',
                    'password': 'favour2024',
                    'pin': '1234',
                    'color': '#795548'
                },
                {
                    'name': 'Liberty Congregation Esreso High Tension',
                    'location': 'Esreso High Tension, Kumasi',
                    'username': 'liberty_esreso',
                    'password': 'liberty2024',
                    'pin': '1234',
                    'color': '#607D8B'
                },
                {
                    'name': 'Odagya No2',
                    'location': 'Odagya No2, Kumasi',
                    'username': 'odagya2',
                    'password': 'odagya2024',
                    'pin': '1234',
                    'color': '#E91E63'
                },
                {
                    'name': 'NOM',
                    'location': 'NOM Location, Kumasi',
                    'username': 'nom_congregation',
                    'password': 'nom2024',
                    'pin': '1234',
                    'color': '#3F51B5'
                },
                {
                    'name': 'Kokobriko',
                    'location': 'Kokobriko, Kumasi',
                    'username': 'kokobriko',
                    'password': 'kokobriko2024',
                    'pin': '1234',
                    'color': '#4CAF50'
                },
            ]

            self.stdout.write("\nCreating Local congregation credentials...")
            
            for i, local_data in enumerate(local_congregations, 1):
                # Create local user
                local_user, created = User.objects.get_or_create(
                    username=local_data['username'],
                    defaults={
                        'first_name': local_data['name'],
                        'last_name': 'Administrator',
                        'email': f'{local_data["username"]}@ypg.com',
                        'is_staff': True,
                        'is_superuser': False,
                    }
                )
                if created:
                    local_user.set_password(local_data['password'])
                    local_user.save()
                    self.stdout.write(self.style.SUCCESS(f"✓ {local_data['name']} user created: username={local_data['username']}, password={local_data['password']}"))
                else:
                    self.stdout.write(self.style.WARNING(f"{local_data['name']} user already exists"))

                # Create local congregation
                local_congregation, created = Congregation.objects.get_or_create(
                    name=local_data['name'],
                    defaults={
                        'location': local_data['location'],
                        'pin': local_data['pin'],
                        'user': local_user,
                        'is_district': False,
                        'background_color': local_data['color'],
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"✓ {local_data['name']} congregation created: PIN={local_data['pin']}"))
                else:
                    self.stdout.write(self.style.WARNING(f"{local_data['name']} congregation already exists"))

            # Create basic roles
            roles = [
                {'name': 'Admin', 'description': 'Full administrative access'},
                {'name': 'Secretary', 'description': 'Secretary access'},
                {'name': 'Treasurer', 'description': 'Treasurer access'},
                {'name': 'Member', 'description': 'Basic member access'},
            ]

            self.stdout.write("\nCreating roles...")
            for role_data in roles:
                role, created = Role.objects.get_or_create(
                    name=role_data['name'],
                    defaults={'description': role_data['description']}
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f"✓ Role created: {role_data['name']}"))
                else:
                    self.stdout.write(self.style.WARNING(f"Role already exists: {role_data['name']}"))

            self.stdout.write(self.style.SUCCESS("\n🎉 All credentials have been set up successfully!"))
            self.stdout.write("\n📋 CREDENTIALS SUMMARY:")
            self.stdout.write("=" * 50)
            self.stdout.write("DISTRICT:")
            self.stdout.write("  Username: district_admin")
            self.stdout.write("  Password: district2024")
            self.stdout.write("  PIN: 1234")
            self.stdout.write("\nLOCAL CONGREGATIONS:")
            for i, local_data in enumerate(local_congregations, 1):
                self.stdout.write(f"  Local {i}:")
                self.stdout.write(f"    Username: {local_data['username']}")
                self.stdout.write(f"    Password: {local_data['password']}")
                self.stdout.write(f"    PIN: {local_data['pin']}")
            self.stdout.write("=" * 50)
