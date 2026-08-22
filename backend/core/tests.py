import json

from django.contrib.auth.models import User
from django.core import mail
from django.test import TestCase
from django.urls import reverse

from .models import Congregation, DataBackup, Guilder, SundayAttendance


class BackupAuthTests(TestCase):
    def setUp(self):
        self.district_user = User.objects.create_user(
            username='district_admin', password='pass12345'
        )
        self.district_cong = Congregation.objects.create(
            name='District Admin', is_district=True, user=self.district_user
        )
        self.local_user = User.objects.create_user(
            username='emmanuel', password='pass12345'
        )
        self.local_cong = Congregation.objects.create(
            name='Emmanuel Congregation Ahinsan', user=self.local_user
        )

    def test_anonymous_cannot_create_backup(self):
        response = self.client.post('/api/data/backup/create/')
        self.assertEqual(response.status_code, 403)

    def test_local_user_cannot_create_backup(self):
        self.client.force_login(self.local_user)
        response = self.client.post('/api/data/backup/create/')
        self.assertEqual(response.status_code, 403)

    def test_local_user_cannot_restore_backup(self):
        self.client.force_login(self.local_user)
        response = self.client.post('/api/data/backup/restore/')
        self.assertEqual(response.status_code, 403)

    def test_local_user_cannot_clear_data(self):
        self.client.force_login(self.local_user)
        response = self.client.post(
            '/api/data/clear/',
            data=json.dumps({'confirmation': 'DELETE_ALL_DATA'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)


class CongregationIsolationTests(TestCase):
    """Local users must never see or touch other congregations' members."""

    def setUp(self):
        self.district_user = User.objects.create_user(
            username='district_admin', password='pass12345'
        )
        self.district_cong = Congregation.objects.create(
            name='District Admin', is_district=True, user=self.district_user
        )
        self.local_user = User.objects.create_user(
            username='emmanuel', password='pass12345'
        )
        self.local_cong = Congregation.objects.create(
            name='Emmanuel Congregation Ahinsan', user=self.local_user
        )
        self.other_user = User.objects.create_user(
            username='liberty', password='pass12345'
        )
        self.other_cong = Congregation.objects.create(
            name='Liberty Congregation', user=self.other_user
        )
        self.own_member = Guilder.objects.create(
            first_name='Own', last_name='Member',
            congregation=self.local_cong,
        )
        self.foreign_member = Guilder.objects.create(
            first_name='Foreign', last_name='Member',
            congregation=self.other_cong,
        )

    def test_local_user_pinned_to_own_congregation(self):
        self.client.force_login(self.local_user)
        response = self.client.get('/api/members/?congregation=999')
        names = [m['first_name'] for m in response.json()['members']]
        self.assertEqual(names, ['Own'])

    def test_local_user_cannot_delete_foreign_member(self):
        self.client.force_login(self.local_user)
        response = self.client.delete(f'/api/members/{self.foreign_member.id}/delete/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Guilder.objects.filter(id=self.foreign_member.id).exists())

    def test_district_admin_can_delete_any_member(self):
        self.client.force_login(self.district_user)
        response = self.client.delete(f'/api/members/{self.foreign_member.id}/delete/')
        self.assertEqual(response.status_code, 200)

    def test_signup_endpoint_is_disabled(self):
        """Signup is admin-only onboarding now; the public endpoint is gone."""
        for congregation in ('Liberty Congregation', 'District Admin'):
            response = self.client.post(
                '/api/auth/signup/',
                data=json.dumps({
                    'username': 'squatter', 'email': 's@x.com',
                    'password': 'longenough1', 'congregation': congregation,
                }),
                content_type='application/json',
            )
            self.assertEqual(response.status_code, 404)
        self.other_cong.refresh_from_db()
        self.assertEqual(self.other_cong.user, self.other_user)


class DataEndpointAuthTests(TestCase):
    """Member data must never be served to anonymous callers."""

    def test_anonymous_cannot_list_members(self):
        response = self.client.get('/api/members/')
        self.assertEqual(response.status_code, 401)

    def test_anonymous_cannot_get_dashboard_stats(self):
        response = self.client.get('/api/dashboard-stats/')
        self.assertEqual(response.status_code, 401)

    def test_anonymous_cannot_add_member(self):
        response = self.client.post(
            '/api/members/add/',
            data=json.dumps({'first_name': 'X'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

    def test_anonymous_cannot_export_excel(self):
        response = self.client.get('/api/export/excel/')
        self.assertIn(response.status_code, (401, 404))

    def test_login_page_still_public(self):
        response = self.client.post(
            '/api/auth/login/',
            data=json.dumps({'username': 'nobody', 'password': 'wrong'}),
            content_type='application/json',
        )
        # 401 here is the endpoint's own "Invalid credentials" response,
        # not the authentication gate.
        self.assertEqual(response.json().get('error'), 'Invalid credentials.')


class BackupRoundTripTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='district_admin', password='pass12345'
        )
        self.district_cong = Congregation.objects.create(
            name='District Admin', is_district=True, user=self.admin
        )
        self.local_cong = Congregation.objects.create(
            name='Emmanuel Congregation Ahinsan', initials='EA'
        )
        self.client.force_login(self.admin)
        self.member = Guilder.objects.create(
            first_name='Kofi',
            last_name='Mensah',
            gender='Male',
            phone_number='0244000000',
            place_of_residence='Ahinsan',
            residential_address='Ahinsan',
            hometown='Ahinsan',
            relative_contact='0244000001',
            congregation=self.local_cong,
            member_id='EA/YPG/001',
        )
        self.attendance = SundayAttendance.objects.create(
            congregation=self.local_cong,
            date='2026-08-16',
            male_count=10,
            female_count=12,
        )

    def test_create_backup_persists_snapshot(self):
        response = self.client.post('/api/data/backup/create/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        backup = DataBackup.objects.get(id=data['backup_info']['id'])
        self.assertEqual(backup.members_count, 1)
        self.assertEqual(backup.attendance_count, 1)
        self.assertEqual(backup.congregations_count, 2)
        self.assertEqual(backup.created_by, self.admin)
        payload_member = next(
            m for m in backup.payload['members'] if m['id'] == self.member.id
        )
        self.assertEqual(payload_member['member_id'], 'EA/YPG/001')

    def test_restore_recovers_deleted_data(self):
        self.client.post('/api/data/backup/create/')
        original_member_id = self.member.id
        original_attendance_id = self.attendance.id
        self.member.delete()
        self.attendance.delete()
        self.assertEqual(Guilder.objects.count(), 0)
        self.assertEqual(SundayAttendance.objects.count(), 0)

        response = self.client.post('/api/data/backup/restore/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])

        restored = Guilder.objects.get(member_id='EA/YPG/001')
        self.assertEqual(restored.id, original_member_id)
        self.assertEqual(restored.congregation_id, self.local_cong.id)
        self.assertEqual(SundayAttendance.objects.count(), 1)
        self.assertEqual(SundayAttendance.objects.first().id, original_attendance_id)
        self.assertEqual(SundayAttendance.objects.first().total_count, 22)

    def test_restore_without_backup_returns_404(self):
        response = self.client.post('/api/data/backup/restore/')
        self.assertEqual(response.status_code, 404)

    def test_restore_takes_safety_backup_first(self):
        self.client.post('/api/data/backup/create/')
        before = DataBackup.objects.count()
        self.client.post('/api/data/backup/restore/')
        safety = DataBackup.objects.exclude(backup_type='manual').first()
        self.assertIsNotNone(safety)
        self.assertEqual(safety.backup_type, 'pre_clear')
        self.assertEqual(DataBackup.objects.count(), before + 1)

    def test_clear_requires_confirmation(self):
        response = self.client.post(
            '/api/data/clear/',
            data=json.dumps({'confirmation': 'wrong'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Guilder.objects.count(), 1)

    def test_clear_deletes_members_and_attendance_but_keeps_accounts(self):
        response = self.client.post(
            '/api/data/clear/',
            data=json.dumps({'confirmation': 'DELETE_ALL_DATA'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['cleared_info']['members_deleted'], 1)
        self.assertEqual(Guilder.objects.count(), 0)
        self.assertEqual(SundayAttendance.objects.count(), 0)
        # Congregations and login accounts survive so nobody is locked out
        self.assertTrue(Congregation.objects.filter(name='District Admin').exists())
        self.assertTrue(User.objects.filter(username='district_admin').exists())

    def test_clear_creates_reversible_safety_backup(self):
        self.client.post(
            '/api/data/clear/',
            data=json.dumps({'confirmation': 'DELETE_ALL_DATA'}),
            content_type='application/json',
        )
        safety = DataBackup.objects.get(backup_type='pre_clear')
        self.assertEqual(safety.members_count, 1)
        self.assertEqual(safety.payload['members'][0]['first_name'], 'Kofi')

        # The wipe is reversible via restore
        self.client.post('/api/data/backup/restore/')
        self.assertEqual(Guilder.objects.count(), 1)


class PasswordResetEmailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='leader', password='pass12345', email='leader@example.com'
        )

    def test_forgot_password_sends_email_without_leaking_link(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            data=json.dumps({'email': 'leader@example.com'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('reset_link', response.json())
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/reset-password/', mail.outbox[0].body)

    def test_unknown_email_gets_generic_response_and_no_email(self):
        response = self.client.post(
            '/api/auth/forgot-password/',
            data=json.dumps({'email': 'ghost@example.com'}),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        self.assertNotIn('reset_link', response.json())


class CongregationCreateTests(TestCase):
    """District admins create congregation accounts; email is mandatory."""

    def setUp(self):
        self.url = reverse('core:api_congregation_create')
        self.district_user = User.objects.create_user(
            username='district_admin', password='pass12345'
        )
        Congregation.objects.create(
            name='District Admin', is_district=True, user=self.district_user
        )
        self.local_user = User.objects.create_user(
            username='emmanuel', password='pass12345'
        )
        Congregation.objects.create(
            name='Emmanuel Congregation Ahinsan', user=self.local_user
        )
        self.valid_payload = {
            'name': 'New Test Congregation',
            'location': 'Test Town',
            'username': 'new_leader',
            'email': 'leader@example.com',
            'password': 'Str0ngPass!x',
        }

    def test_anonymous_cannot_create_congregation(self):
        response = self.client.post(
            self.url, data=json.dumps(self.valid_payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 401)

    def test_local_user_cannot_create_congregation(self):
        self.client.login(username='emmanuel', password='pass12345')
        response = self.client.post(
            self.url, data=json.dumps(self.valid_payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 403)

    def test_missing_email_is_rejected(self):
        self.client.login(username='district_admin', password='pass12345')
        payload = dict(self.valid_payload)
        del payload['email']
        response = self.client.post(
            self.url, data=json.dumps(payload), content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            Congregation.objects.filter(name='New Test Congregation').exists()
        )

    def test_invalid_email_is_rejected(self):
        self.client.login(username='district_admin', password='pass12345')
        payload = dict(self.valid_payload, email='not-an-email')
        response = self.client.post(
            self.url, data=json.dumps(payload), content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_duplicate_username_is_rejected(self):
        self.client.login(username='district_admin', password='pass12345')
        payload = dict(self.valid_payload, username='emmanuel')
        response = self.client.post(
            self.url, data=json.dumps(payload), content_type='application/json',
        )
        self.assertEqual(response.status_code, 400)

    def test_district_admin_can_create_congregation_with_email(self):
        self.client.login(username='district_admin', password='pass12345')
        response = self.client.post(
            self.url, data=json.dumps(self.valid_payload),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 201)
        congregation = Congregation.objects.get(name='New Test Congregation')
        self.assertIsNotNone(congregation.user_id)
        self.assertEqual(congregation.user.email, 'leader@example.com')
