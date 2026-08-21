import json

from django.contrib.auth.models import User
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
