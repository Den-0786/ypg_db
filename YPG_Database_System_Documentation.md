# YPG Database System - Complete Documentation

## Project Overview

The YPG Database System is a comprehensive web application designed for managing Young People's Guild (YPG) congregations, members, attendance, and administrative functions. The system consists of a Django backend API and a Next.js frontend.

## System Architecture

### Backend (Django)

- **Framework**: Django 5.2.4
- **Database**: PostgreSQL (Neon)
- **Deployment**: Render
- **URL**: https://ypg-database-system.onrender.com

### Frontend (Next.js)

- **Framework**: Next.js 15.4.5
- **Deployment**: Vercel
- **URL**: https://ypgdatabasesystem.vercel.app

## Features

### District Admin Features

- Dashboard with congregation overview
- Member management across all congregations
- Attendance tracking and analytics
- Bulk member operations
- Quiz management system
- Data export/import capabilities
- System settings and security management

### Local Congregation Features

- Local dashboard for congregation-specific data
- Member management for local congregation
- Attendance logging and tracking
- Local analytics and reporting
- PIN-based authentication
- Profile and security settings

## Congregation Credentials

### District Admin

- **Username**: district_admin
- **Password**: district2025
- **Access**: Full system access to all congregations

### Local Congregations

#### 1. Emmanuel Congregation Ahinsan

- **Username**: emmanuel
- **Password**: emmanuel2025

#### 2. Peniel Congregation Esreso No1

- **Username**: peniel
- **Password**: peniel2025

#### 3. Mizpah Congregation Odagya No1

- **Username**: mizpah_odagya1
- **Password**: mizpah2024

#### 4. Christ Congregation Ahinsan Estate

- **Username**: christ_ahinsan
- **Password**: christ2025

#### 5. Ebenezer Congregation Dompoase Aprabo

- **Username**: ebenezer_dompoase
- **Password**: ebenezer2025

#### 6. Favour Congregation Esreso No2

- **Username**: favour_esreso2
- **Password**: favour2024

#### 7. Liberty Congregation Esreso High Tension

- **Username**: liberty_esreso
- **Password**: liberty2024

#### 8. Odagya No2

- **Username**: odagya2
- **Password**: odagya2024

#### 9. NOM

- **Username**: nom_congregation
- **Password**: nom2024

#### 10. Kokobriko

- **Username**: kokobriko
- **Password**: kokobriko2024

## Technical Specifications

### Backend Environment Variables

```
SECRET_KEY=4@4tnc3p*$!ukj7tqhp62r88sn1%-n$sag-+mo7ge)-745d+7c
DEBUG=False
DATABASE_URL=postgres://neondb_owner:npg_eKH7rJIzkQ6p@ep-fancy-snow-a26n2w5v-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
ALLOWED_HOSTS=ypg-database-system.onrender.com,localhost,127.0.0.1
SESSION_COOKIE_SECURE=true
CSRF_COOKIE_SECURE=true
CORS_ALLOWED_ORIGINS=https://ypgdatabasesystem.vercel.app,https://ypgdatabasesystem-git-main-den-0786s-projects.vercel.app,https://ypgdatabasesystem-kkwg6u58d-den-0786s-projects.vercel.app
CSRF_TRUSTED_ORIGINS=https://ypg-database-system.onrender.com,https://ypgdatabasesystem.vercel.app,https://ypgdatabasesystem-git-main-den-0786s-projects.vercel.app,https://ypgdatabasesystem-kkwg6u58d-den-0786s-projects.vercel.app
```

### Frontend Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://ypg-database-system.onrender.com
```

## API Endpoints

### Authentication

- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/validate-pin/` - PIN validation

### Members

- `GET /api/members/` - Get members
- `POST /api/members/add/` - Add new member
- `PUT /api/members/update/{id}/` - Update member
- `DELETE /api/members/delete/{id}/` - Delete member

### Attendance

- `GET /api/attendance/records/` - Get attendance records
- `POST /api/attendance/log/` - Log attendance
- `DELETE /api/attendance/{id}/delete/` - Delete attendance record

### Settings

- `GET /api/settings/profile/` - Get profile settings
- `PUT /api/settings/profile/` - Update profile
- `GET /api/settings/security/` - Get security settings
- `PUT /api/settings/security/` - Update security settings

### Notifications

- `GET /api/notifications/` - Get notifications
- `POST /api/notifications/send/` - Send notification
- `POST /api/notifications/mark-read/` - Mark as read
- `POST /api/notifications/clear/` - Clear notifications

## Database Models

### Core Models

- **Congregation**: Stores congregation information
- **Guilder**: Member information and details
- **SundayAttendance**: Attendance records
- **Notification**: System notifications
- **Quiz**: Quiz management
- **LoginAttempt**: Login tracking for security

## Security Features

### Authentication

- Username/password authentication
- PIN-based authentication for congregations
- Session management
- Auto-logout functionality

### Rate Limiting

- Login attempt tracking
- Progressive blocking system
- IP-based attempt monitoring

### Data Protection

- CSRF protection
- Secure cookies
- CORS configuration
- Input validation

## Deployment Information

### Render Backend

- **Service Type**: Web Service
- **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **Start Command**: `gunicorn ypg_db.wsgi`
- **Root Directory**: backend

### Vercel Frontend

- **Framework**: Next.js
- **Root Directory**: frontend
- **Build Command**: `npm run build`

## File Structure

```
ypg_db/
├── backend/
│   ├── core/
│   │   ├── models.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── migrations/
│   ├── ypg_db/
│   │   ├── settings.py
│   │   └── urls.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   ├── dashboard/
    │   │   ├── local/
    │   │   └── login/
    │   └── utils/
    └── package.json
```

## Usage Instructions

### For District Admins

1. Navigate to https://ypgdatabasesystem.vercel.app
2. Login with district_admin / district2024
3. Access full system dashboard
4. Manage all congregations and members
5. View system-wide analytics

### For Congregation Users

1. Navigate to https://ypgdatabasesystem.vercel.app
2. Login with congregation credentials
3. Access local congregation dashboard
4. Manage local members and attendance
5. View local analytics

## Maintenance

### Regular Tasks

- Monitor system performance
- Backup database regularly
- Update security settings
- Review user access logs

### Troubleshooting

- Check Render logs for backend issues
- Check Vercel logs for frontend issues
- Verify environment variables
- Test API connectivity

## Support Information

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- JavaScript enabled

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contact Information

For technical support or system issues, contact the development team.

---

_Document generated on: September 16, 2025_
_System Version: 1.0.0_
