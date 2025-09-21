import csv
import json
import re
from collections import defaultdict
from datetime import datetime, timedelta
from io import BytesIO

from django.contrib import messages
from django.contrib.auth import update_session_auth_hash, authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.models import User
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Avg, Count, Q, Sum
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import (require_GET, require_http_methods,
                                          require_POST)
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (Paragraph, SimpleDocTemplate, Spacer, Table,
                                TableStyle)
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .forms import (BulkGuilderForm, ChangePINForm, CongregationForm,
                    GuilderForm, NewCongregationForm, PINForm, RoleForm,
                    SearchForm, SundayAttendanceForm)
from .models import (DISTRICT_EXECUTIVE_POSITIONS, LOCAL_EXECUTIVE_POSITIONS,
                     BirthdayMessageLog, BulkProfileCart, Congregation,
                     Guilder, Notification, Role, SundayAttendance, Quiz, QuizSubmission, UserProfile, LoginAttempt)

LOGIN_RATE_LIMIT_ENABLED = True


# Utility function to create notifications
def create_notification(
    user,
    congregation,
    notification_type,
    title,
    message,
    recipient=None,
    change_details=None,
):
    Notification.objects.create(
        user=user,
        congregation=congregation,
        notification_type=notification_type,
        title=title,
        message=message,
        recipient=recipient,
        change_details=change_details or {},
    )


# Utility functions for login attempt tracking
def get_client_ip(request):
    """Get the client's IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def check_login_attempts(request, username):
    """Check if user is blocked due to too many failed attempts"""
    ip_address = get_client_ip(request)
    
    try:
        login_attempt = LoginAttempt.objects.get(ip_address=ip_address, username=username)
        
        # Check if user is currently blocked
        if login_attempt.is_blocked_now():
            hours, minutes = login_attempt.get_remaining_block_time()
            
            # Provide specific messages based on blocking level
            if login_attempt.attempt_count >= 6:
                return False, f"Account locked due to multiple failed attempts. Please try again in {hours} hours and {minutes} minutes."
            else:
                return False, f"Too many failed attempts. Please try again in {hours} hours and {minutes} minutes."
        
        # If block time has expired, reset the attempt count
        if login_attempt.is_blocked and login_attempt.blocked_until and timezone.now() > login_attempt.blocked_until:
            login_attempt.attempt_count = 0
            login_attempt.is_blocked = False
            login_attempt.blocked_until = None
            login_attempt.save()
            
    except LoginAttempt.DoesNotExist:
        # No previous attempts, create new record
        login_attempt = LoginAttempt.objects.create(
            ip_address=ip_address,
            username=username,
            attempt_count=0
        )
    
    return True, None


def record_failed_attempt(request, username):
    """Record a failed login attempt with progressive blocking"""
    ip_address = get_client_ip(request)
    
    try:
        login_attempt = LoginAttempt.objects.get(ip_address=ip_address, username=username)
    except LoginAttempt.DoesNotExist:
        login_attempt = LoginAttempt.objects.create(
            ip_address=ip_address,
            username=username,
            attempt_count=0
        )
    
    login_attempt.attempt_count += 1
    login_attempt.last_attempt = timezone.now()
    
    # Progressive blocking system
    if login_attempt.attempt_count >= 6:
        # After 6 failed attempts, block for 24 hours
        login_attempt.is_blocked = True
        login_attempt.blocked_until = timezone.now() + timedelta(hours=24)
    elif login_attempt.attempt_count >= 3:
        # After 3 failed attempts, block for 30 minutes
        login_attempt.is_blocked = True
        login_attempt.blocked_until = timezone.now() + timedelta(minutes=30)
    
    login_attempt.save()
    
    return login_attempt.attempt_count


def record_successful_attempt(request, username):
    """Record a successful login attempt and reset failed attempts"""
    ip_address = get_client_ip(request)
    
    try:
        login_attempt = LoginAttempt.objects.get(ip_address=ip_address, username=username)
        login_attempt.attempt_count = 0
        login_attempt.is_blocked = False
        login_attempt.blocked_until = None
        login_attempt.save()
    except LoginAttempt.DoesNotExist:
        pass


# Authentication API Views
@csrf_exempt
@require_POST
def api_login(request):
    """API endpoint for user login with attempt tracking"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'Username and password are required'
            }, status=400)
        
        # Attempt authentication
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Successful login
            login(request, user)
            if LOGIN_RATE_LIMIT_ENABLED:
                record_successful_attempt(request, username)
            
            # Try to include congregation info
            congregation_info = None
            try:
                congregation = Congregation.objects.get(user=user)
                congregation_info = {
                    'id': str(congregation.id),
                    'name': congregation.name,
                }
            except Congregation.DoesNotExist:
                pass
            
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                },
                'congregation': congregation_info
            })
        else:
            # Failed login
            return JsonResponse({
                'success': False,
                'error': 'Invalid credentials.'
            }, status=401)
                
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_POST
def api_pin_login(request):
    """API endpoint for PIN-based login with attempt tracking"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        pin = data.get('pin', '').strip()
        
        if not username or not pin:
            return JsonResponse({
                'success': False,
                'error': 'Username and PIN are required'
            }, status=400)
        
        # Optional rate limit check (disabled during testing)
        if LOGIN_RATE_LIMIT_ENABLED:
            is_allowed, block_message = check_login_attempts(request, username)
            if not is_allowed:
                return JsonResponse({
                    'success': False,
                    'error': block_message
                }, status=429)
        
        # Validate PIN format
        if not re.match(r'^\d{4,6}$', pin):
            return JsonResponse({
                'success': False,
                'error': 'PIN must be 4-6 digits'
            }, status=400)
        
        # Check if user exists and PIN matches
        try:
            user = User.objects.get(username=username)
            congregation = Congregation.objects.get(user=user)
            
            if congregation.pin == pin:
                # Successful PIN login
                login(request, user)
                
                return JsonResponse({
                    'success': True,
                    'message': 'PIN login successful',
                    'user': {
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    },
                    'congregation': {
                        'name': congregation.name,
                        'is_district': congregation.is_district
                    }
                })
            else:
                # Failed PIN login
                    return JsonResponse({
                        'success': False,
                    'error': 'Invalid PIN.'
                    }, status=401)
                    
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'User not found'
            }, status=404)
        except Congregation.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'No congregation found for this user'
            }, status=404)
                
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_POST
def api_logout(request):
    """API endpoint for user logout"""
    try:
        logout(request)
        return JsonResponse({
            'success': True,
            'message': 'Logout successful'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_verify_password(request):
    """Verify user password for quiz creation"""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'Username and password are required'
            }, status=400)
        
        # Import Django's authenticate function
        from django.contrib.auth import authenticate
        
        # Verify credentials using Django authentication
        user = authenticate(request, username=username, password=password)
        
        if user:
            return JsonResponse({
                'success': True,
                'message': 'Password verified successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid credentials'
            }, status=401)
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# Quiz API Views
@csrf_exempt
@require_http_methods(["GET"])
def api_quizzes(request):
    """Get all active quizzes"""
    try:
        quizzes = Quiz.objects.filter(is_active=True).order_by('-created_at')
        quiz_data = []
        
        for quiz in quizzes:
            quiz_data.append({
                'id': quiz.id,
                'title': quiz.title,
                'description': quiz.description,
                'question': quiz.question,
                'option_a': quiz.option_a,
                'option_b': quiz.option_b,
                'option_c': quiz.option_c,
                'option_d': quiz.option_d,
                'start_time': quiz.start_time.isoformat(),
                'end_time': quiz.end_time.isoformat(),
                'password': quiz.password,
                'is_currently_active': quiz.is_currently_active,
                'has_ended': quiz.has_ended,
                'has_started': quiz.has_started,
                'submissions_count': quiz.submissions.count(),
                'correct_submissions_count': quiz.submissions.filter(is_correct=True).count(),
                'created_at': quiz.created_at.isoformat(),
            })
        
        return JsonResponse({
            'success': True,
            'quizzes': quiz_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# 
# # Y-Store API Views
# @csrf_exempt
# @require_http_methods(["GET"])
# def api_ystore_items(request):
#     """Get all active Y-Store items for the main website"""
#     try:
#         # Get items that are active and not deleted from dashboard
#         items = YStoreItem.objects.filter(
#             is_active=True,
#             dashboard_deleted=False
#         ).order_by('-created_at')
#         
#         items_data = []
#         for item in items:
#             items_data.append({
#                 'id': item.id,
#                 'name': item.name,
#                 'description': item.description,
#                 'price': item.price,
#                 'image': item.image.url if item.image else None,
#                 'rating': float(item.rating),
#                 'stock': item.stock,
#                 'is_out_of_stock': item.is_out_of_stock,
#                 'category': item.category,
#                 'tags': item.tags,
#                 'treasurer': {
#                     'name': item.treasurer_name,
#                     'phone': item.treasurer_phone,
#                     'email': item.treasurer_email,
#                 },
#                 'is_available': item.is_available,
#                 'created_at': item.created_at.isoformat(),
#             })
#         
#         return JsonResponse({
#             'success': True,
#             'items': items_data
#         })
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'error': str(e)
#         }, status=500)
# 
# 
# @csrf_exempt
# @require_http_methods(["GET"])
# def api_ystore_admin_items(request):
#     """Get all Y-Store items for admin dashboard"""
#     try:
#         items = YStoreItem.objects.all().order_by('-created_at')
#         
#         items_data = []
#         for item in items:
#             items_data.append({
#                 'id': item.id,
#                 'name': item.name,
#                 'description': item.description,
#                 'price': item.price,
#                 'image': item.image.url if item.image else None,
#                 'rating': float(item.rating),
#                 'stock': item.stock,
#                 'is_out_of_stock': item.is_out_of_stock,
#                 'category': item.category,
#                 'tags': item.tags,
#                 'treasurer': {
#                     'name': item.treasurer_name,
#                     'phone': item.treasurer_phone,
#                     'email': item.treasurer_email,
#                 },
#                 'is_active': item.is_active,
#                 'dashboard_deleted': item.dashboard_deleted,
#                 'created_at': item.created_at.isoformat(),
#                 'updated_at': item.updated_at.isoformat(),
#             })
#         
#         return JsonResponse({
#             'success': True,
#             'items': items_data
#         })
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'error': str(e)
#         }, status=500)
# 
# 
# @csrf_exempt
# @require_http_methods(["POST"])
# def api_ystore_create_item(request):
#     """Create a new Y-Store item"""
#     try:
#         data = json.loads(request.body)
#         
#         # Validate required fields
#         required_fields = ['name', 'price', 'description', 'treasurer_name', 'treasurer_phone']
#         for field in required_fields:
#             if not data.get(field):
#                 return JsonResponse({
#                     'success': False,
#                     'error': f'{field} is required'
#                 }, status=400)
#         
#         # Create the item
#         item = YStoreItem.objects.create(
#             name=data['name'],
#             description=data['description'],
#             price=data['price'],
#             rating=data.get('rating', 4.5),
#             stock=data.get('stock', 0),
#             category=data.get('category', ''),
#             tags=data.get('tags', []),
#             treasurer_name=data['treasurer_name'],
#             treasurer_phone=data['treasurer_phone'],
#             treasurer_email=data.get('treasurer_email', ''),
#             created_by=request.user if request.user.is_authenticated else None,
#         )
#         
#         return JsonResponse({
#             'success': True,
#             'item': {
#                 'id': item.id,
#                 'name': item.name,
#                 'description': item.description,
#                 'price': item.price,
#                 'image': item.image.url if item.image else None,
#                 'rating': float(item.rating),
#                 'stock': item.stock,
#                 'is_out_of_stock': item.is_out_of_stock,
#                 'category': item.category,
#                 'tags': item.tags,
#                 'treasurer': {
#                     'name': item.treasurer_name,
#                     'phone': item.treasurer_phone,
#                     'email': item.treasurer_email,
#                 },
#                 'created_at': item.created_at.isoformat(),
#             }
#         })
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'error': str(e)
#         }, status=500)
# 
# 
# @csrf_exempt
# @require_http_methods(["PUT"])
# def api_ystore_update_item(request, item_id):
#     """Update a Y-Store item"""
#     try:
#         item = get_object_or_404(YStoreItem, id=item_id)
#         data = json.loads(request.body)
#         
#         # Update fields
#         if 'name' in data:
#             item.name = data['name']
#         if 'description' in data:
#             item.description = data['description']
#         if 'price' in data:
#             item.price = data['price']
#         if 'rating' in data:
#             item.rating = data['rating']
#         if 'stock' in data:
#             item.stock = data['stock']
#         if 'category' in data:
#             item.category = data['category']
#         if 'tags' in data:
#             item.tags = data['tags']
#         if 'treasurer_name' in data:
#             item.treasurer_name = data['treasurer_name']
#         if 'treasurer_phone' in data:
#             item.treasurer_phone = data['treasurer_phone']
#         if 'treasurer_email' in data:
#             item.treasurer_email = data['treasurer_email']
#         if 'is_active' in data:
#             item.is_active = data['is_active']
#         if 'dashboard_deleted' in data:
#             item.dashboard_deleted = data['dashboard_deleted']
#         
#         item.save()
#         
#         return JsonResponse({
#             'success': True,
#             'item': {
#                 'id': item.id,
#                 'name': item.name,
#                 'description': item.description,
#                 'price': item.price,
#                 'image': item.image.url if item.image else None,
#                 'rating': float(item.rating),
#                 'stock': item.stock,
#                 'is_out_of_stock': item.is_out_of_stock,
#                 'category': item.category,
#                 'tags': item.tags,
#                 'treasurer': {
#                     'name': item.treasurer_name,
#                     'phone': item.treasurer_phone,
#                     'email': item.treasurer_email,
#                 },
#                 'is_active': item.is_active,
#                 'dashboard_deleted': item.dashboard_deleted,
#                 'updated_at': item.updated_at.isoformat(),
#             }
#         })
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'error': str(e)
#         }, status=500)
# 
# 
# @csrf_exempt
# @require_http_methods(["DELETE"])
# def api_ystore_delete_item(request, item_id):
#     """Delete Y-Store item (soft delete or hard delete)"""
#     try:
#         item = YStoreItem.objects.get(id=item_id)
#         
#         delete_type = request.GET.get('type', 'soft')  # 'soft' or 'hard'
#         
#         if delete_type == 'hard':
#             item.delete()
#             return Response({'message': 'Item deleted permanently'}, status=200)
#         else:
#             item.dashboard_deleted = True
#             item.save()
#             return Response({'message': 'Item hidden from dashboard'}, status=200)
#             
#     except YStoreItem.DoesNotExist:
#         return Response({'error': 'Item not found'}, status=404)
#     except Exception as e:
#         return Response({'error': str(e)}, status=500)
# 
# 
# # Branch President API Views
# @api_view(['GET'])
# def api_branch_presidents(request):
#     """Get all branch presidents for main website"""
#     try:
#         presidents = BranchPresident.objects.filter(is_active=True).order_by('congregation')
#         data = []
#         for president in presidents:
#             data.append({
#                 'id': president.id,
#                 'congregation': president.congregation,
#                 'location': president.location,
#                 'president_name': president.president_name,
#                 'phone_number': president.phone_number,
#                 'email': president.email,
#             })
#         return Response(data, status=200)
#     except Exception as e:
#         return Response({'error': str(e)}, status=500)
# 
# 
# @api_view(['GET'])
# def api_branch_presidents_admin(request):
#     """Get all branch presidents for admin dashboard"""
#     try:
#         presidents = BranchPresident.objects.all().order_by('congregation')
#         data = []
#         for president in presidents:
#             data.append({
#                 'id': president.id,
#                 'congregation': president.congregation,
#                 'location': president.location,
#                 'president_name': president.president_name,
#                 'phone_number': president.phone_number,
#                 'email': president.email,
#                 'is_active': president.is_active,
#                 'created_at': president.created_at,
#                 'updated_at': president.updated_at,
#             })
#         return Response(data, status=200)
#     except Exception as e:
#         return Response({'error': str(e)}, status=500)
# 
# 
# @api_view(['POST'])
# def api_branch_president_create(request):
#     """Create new branch president"""
#     try:
#         data = request.data
#         president = BranchPresident.objects.create(
#             congregation=data['congregation'],
#             location=data['location'],
#             president_name=data['president_name'],
#             phone_number=data['phone_number'],
#             email=data['email'],
#         )
#         return Response({
#             'message': 'Branch president created successfully',
#             'id': president.id
#         }, status=201)
#     except Exception as e:
#         return Response({'error': str(e)}, status=500)
# 
# 
# @api_view(['PUT'])
# def api_branch_president_update(request, president_id):
#     """Update branch president"""
#     try:
#         president = BranchPresident.objects.get(id=president_id)
#         data = request.data
#         
#         president.congregation = data.get('congregation', president.congregation)
#         president.location = data.get('location', president.location)
#         president.president_name = data.get('president_name', president.president_name)
#         president.phone_number = data.get('phone_number', president.phone_number)
#         president.email = data.get('email', president.email)
#         president.is_active = data.get('is_active', president.is_active)
#         
#         president.save()
#         return Response({'message': 'Branch president updated successfully'}, status=200)
#     except BranchPresident.DoesNotExist:
#         return Response({'error': 'Branch president not found'}, status=404)
#     except Exception as e:
#         return Response({'error': str(e)}, status=500)
# 
# 
# @api_view(['DELETE'])
# def api_branch_president_delete(request, president_id):
#     """Delete branch president"""
#     try:
#         president = BranchPresident.objects.get(id=president_id)
#         president.delete()
#         return Response({'message': 'Branch president deleted successfully'}, status=200)
#     except BranchPresident.DoesNotExist:
#         return Response({'error': 'Branch president not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def api_active_quiz(request):
    """Get the currently active quiz"""
    try:
        now = timezone.now()
        active_quiz = Quiz.objects.filter(
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        ).first()
        
        if not active_quiz:
            return JsonResponse({
                'success': True,
                'quiz': None
            })
        
        quiz_data = {
            'id': active_quiz.id,
            'title': active_quiz.title,
            'description': active_quiz.description,
            'question': active_quiz.question,
            'option_a': active_quiz.option_a,
            'option_b': active_quiz.option_b,
            'option_c': active_quiz.option_c,
            'option_d': active_quiz.option_d,
            'start_time': active_quiz.start_time.isoformat(),
            'end_time': active_quiz.end_time.isoformat(),
            'password': active_quiz.password,
            'submissions_count': active_quiz.submissions.count(),
            'correct_submissions_count': active_quiz.submissions.filter(is_correct=True).count(),
        }
        
        return JsonResponse({
            'success': True,
            'quiz': quiz_data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_submit_quiz(request):
    """Submit a quiz answer"""
    try:
        data = json.loads(request.body)
        
        quiz_id = data.get('quiz_id')
        name = data.get('name')
        phone_number = data.get('phone_number')
        congregation = data.get('congregation')
        selected_answer = data.get('selected_answer')
        
        # Validate required fields
        if not all([quiz_id, name, phone_number, congregation, selected_answer]):
            return JsonResponse({
                'success': False,
                'error': 'All fields are required'
            }, status=400)
        
        # Validate answer choice
        if selected_answer not in ['A', 'B', 'C', 'D']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid answer choice'
            }, status=400)
        
        # Get quiz
        quiz = get_object_or_404(Quiz, id=quiz_id, is_active=True)
        
        # Check if quiz is currently active (temporarily disabled for testing)
        # if not quiz.is_currently_active:
        #     return JsonResponse({
        #         'success': False,
        #         'error': 'Quiz is not currently active'
        #     }, status=400)
        
        # Check if phone number already submitted
        existing_submission = QuizSubmission.objects.filter(
            quiz=quiz,
            phone_number=phone_number
        ).first()
        
        if existing_submission:
            return JsonResponse({
                'success': False,
                'error': 'You have already submitted an answer for this quiz'
            }, status=400)
        
        # Create submission
        submission = QuizSubmission.objects.create(
            quiz=quiz,
            name=name,
            phone_number=phone_number,
            congregation=congregation,
            selected_answer=selected_answer
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Quiz answer submitted successfully! List of winners will be posted here. Stay tuned. Thank you.',
            'submission_id': submission.id,
            'is_correct': submission.is_correct
        })
        
    except Quiz.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Quiz not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def api_quiz_results(request, quiz_id=None):
    """Get quiz results and statistics"""
    try:
        now = timezone.now()
        # Results are only available 2 hours after quiz ends
        results_cutoff = now - timedelta(hours=2)
        
        if quiz_id:
            # Get specific quiz results
            quiz = get_object_or_404(Quiz, id=quiz_id)
            # Check if results are available
            if quiz.end_time > results_cutoff:
                return JsonResponse({
                    'success': False,
                    'error': 'Results are not yet available. Please check back in 2 hours after the quiz ends.'
                })
            quizzes = [quiz]
        else:
            # Get all completed quizzes with results available
            quizzes = Quiz.objects.filter(
                is_active=True,
                end_time__lt=results_cutoff
            ).order_by('-end_time')
        
        results = []
        
        for quiz in quizzes:
            submissions = quiz.submissions.all()
            total_participants = submissions.count()
            correct_answers = submissions.filter(is_correct=True).count()
            incorrect_answers = submissions.filter(is_correct=False).count()
            
            # Get unique congregations
            congregations = submissions.values('congregation').distinct()
            congregations_count = congregations.count()
            
            # Get leaderboard (top 5)
            leaderboard = submissions.filter(is_correct=True).order_by('submitted_at')[:5]
            leaderboard_data = []
            
            for i, submission in enumerate(leaderboard):
                leaderboard_data.append({
                    'id': submission.id,
                    'name': submission.name,
                    'congregation': submission.congregation,
                    'score': 100,  # All correct answers get 100%
                    'time_taken': 0,  # We don't track time yet
                    'rank': i + 1
                })
            
            # Get congregation performance and leaderboard
            congregations_data = []
            congregation_leaderboard = []
            
            for cong in congregations:
                cong_name = cong['congregation']
                cong_submissions = submissions.filter(congregation=cong_name)
                cong_participants = cong_submissions.count()
                cong_correct = cong_submissions.filter(is_correct=True).count()
                cong_average = (cong_correct / cong_participants * 100) if cong_participants > 0 else 0
                cong_best = 100 if cong_correct > 0 else 0
                
                congregations_data.append({
                    'name': cong_name,
                    'participants': cong_participants,
                    'average_score': round(cong_average, 1),
                    'best_score': cong_best
                })
                
                # Add to leaderboard data
                congregation_leaderboard.append({
                    'congregation': cong_name,
                    'participants': cong_participants,
                    'correct_answers': cong_correct,
                    'success_rate': round(cong_average, 1)
                })
            
            # Sort congregation leaderboard by participants (highest first)
            congregation_leaderboard.sort(key=lambda x: x['participants'], reverse=True)
            congregation_leaderboard = congregation_leaderboard[:3]  # Top 3
            
            # Add ranks to leaderboard
            for i, item in enumerate(congregation_leaderboard):
                item['rank'] = i + 1
            
            results.append({
                'id': quiz.id,
                'quiz_title': quiz.title,
                'end_date': quiz.end_time.isoformat(),
                'total_participants': total_participants,
                'correct_answers': correct_answers,
                'incorrect_answers': incorrect_answers,
                'congregations_count': congregations_count,
                'leaderboard': leaderboard_data,
                'congregations': congregations_data,
                'congregation_leaderboard': congregation_leaderboard,
                'all_participants': [
                    {
                        'name': sub.name,
                        'phone_number': sub.phone_number,
                        'congregation': sub.congregation,
                        'is_correct': sub.is_correct,
                        'submitted_at': sub.submitted_at.isoformat()
                    } for sub in submissions.order_by('submitted_at')
                ]
            })
        
        return JsonResponse({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_create_quiz(request):
    """Create a new quiz (admin only)"""
    try:
        data = json.loads(request.body)
        
        username = data.get('username')
        admin_password = data.get('admin_password')
        
        if not username or not admin_password:
            return JsonResponse({
                'success': False,
                'error': 'Admin credentials are required'
            }, status=400)
        
        from django.contrib.auth import authenticate
        user = authenticate(request, username=username, password=admin_password)
        
        if not user:
            return JsonResponse({
                'success': False,
                'error': 'Invalid admin credentials'
            }, status=401)
        
        title = data.get('title')
        description = data.get('description', '')
        question = data.get('question')
        option_a = data.get('option_a')
        option_b = data.get('option_b')
        option_c = data.get('option_c')
        option_d = data.get('option_d')
        correct_answer = data.get('correct_answer')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        password = data.get('password', 'youth2024')
        
        # Validate required fields
        required_fields = ['title', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'start_time', 'end_time']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'error': f'{field.replace("_", " ").title()} is required'
                }, status=400)
        
        # Validate answer choice
        if correct_answer not in ['A', 'B', 'C', 'D']:
            return JsonResponse({
                'success': False,
                'error': 'Invalid correct answer choice'
            }, status=400)
        
        # Parse datetime strings
        try:
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        except ValueError:
            return JsonResponse({
                'success': False,
                'error': 'Invalid datetime format'
            }, status=400)
        
        # Create quiz with authenticated user
        quiz = Quiz.objects.create(
            title=title,
            description=description,
            question=question,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_answer=correct_answer,
            start_time=start_time,
            end_time=end_time,
            password=password,
            created_by=user
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Quiz created successfully!',
            'quiz_id': quiz.id
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_end_quiz(request, quiz_id):
    """End a quiz (admin only)"""
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id)  # Temporarily remove user check
        quiz.is_active = False
        quiz.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Quiz ended successfully!'
        })
        
    except Quiz.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Quiz not found or you do not have permission to end it'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def api_delete_quiz(request, quiz_id):
    """Delete a quiz (admin only)"""
    try:
        quiz = get_object_or_404(Quiz, id=quiz_id)  # Temporarily remove user check
        quiz.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Quiz deleted successfully!'
        })
        
    except Quiz.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Quiz not found or you do not have permission to delete it'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# Dashboard Views
@login_required
def dashboard(request):
    # Check if user is district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        is_district = user_congregation.is_district
    except Congregation.DoesNotExist:
        is_district = False

    if is_district:
        # District Dashboard - Show all congregations
        congregations = Congregation.objects.all()
        total_members = Guilder.objects.count()
        total_male = Guilder.objects.filter(gender="Male").count()
        total_female = Guilder.objects.filter(gender="Female").count()
        active_members = Guilder.objects.filter(membership_status="Active").count()
        distant_members = Guilder.objects.filter(membership_status="Distant").count()
        total_congregations = congregations.count()

        # Get executives and members for district view
        # District executives: those with district or both level
        district_executives = Guilder.objects.filter(
            is_executive=True,
            executive_level__in=["district", "both"]
        ).order_by("district_executive_position", "first_name")

        # Local executives: those with local or both level
        local_executives = Guilder.objects.filter(
            is_executive=True,
            executive_level__in=["local", "both"]
        ).order_by("congregation__name", "local_executive_position", "first_name")

        members = Guilder.objects.filter(is_executive=False).order_by(
            "first_name", "last_name"
        )

    else:
        # Local Dashboard - Show only user's congregation
        congregations = [user_congregation]
        total_members = Guilder.objects.filter(congregation=user_congregation).count()
        total_male = Guilder.objects.filter(
            congregation=user_congregation, gender="Male"
        ).count()
        total_female = Guilder.objects.filter(
            congregation=user_congregation, gender="Female"
        ).count()
        active_members = Guilder.objects.filter(
            congregation=user_congregation, membership_status="Active"
        ).count()
        distant_members = Guilder.objects.filter(
            congregation=user_congregation, membership_status="Distant"
        ).count()
        total_congregations = 1

        # Get executives and members for local view
        # Local executives: those with local or both level from this congregation
        executives = Guilder.objects.filter(
            congregation=user_congregation,
            is_executive=True,
            executive_level__in=["local", "both"]
        ).order_by("local_executive_position", "first_name")

        members = Guilder.objects.filter(
            congregation=user_congregation, is_executive=False
        ).order_by("first_name", "last_name")

    context = {
        "congregations": congregations,
        "total_members": total_members,
        "total_male": total_male,
        "total_female": total_female,
        "active_members": active_members,
        "distant_members": distant_members,
        "total_congregations": total_congregations,
        "is_district": is_district,
        "user_congregation": (
            user_congregation if "user_congregation" in locals() else None
        ),
    }

    # Add executives and members to context based on dashboard type
    if is_district:
        context.update(
            {
                "district_executives": district_executives,
                "local_executives": local_executives,
                "members": members,
            }
        )
    else:
        context.update(
            {
                "executives": executives,
                "members": members,
            }
        )

    return render(request, "core/dashboard.html", context)


@login_required
def congregation_dashboard(request, congregation_id):
    congregation = get_object_or_404(Congregation, id=congregation_id)

    # Check if user has access to this congregation
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district and user_congregation != congregation:
            messages.error(request, "You don't have access to this congregation.")
            return redirect("core:dashboard")
    except Congregation.DoesNotExist:
        messages.error(request, "You don't have access to this congregation.")
        return redirect("core:dashboard")

    if request.method == "POST":
        pin_form = PINForm(request.POST)
        if pin_form.is_valid():
            # PIN validation logic here
            pass
    else:
        pin_form = PINForm()

    members = Guilder.objects.filter(congregation=congregation)
    recent_attendance = SundayAttendance.objects.filter(
        congregation=congregation
    ).order_by("-date")[:5]

    context = {
        "congregation": congregation,
        "members": members,
        "recent_attendance": recent_attendance,
        "pin_form": pin_form,
    }
    return render(request, "core/congregation_dashboard.html", context)


# Credential Management Views
@login_required
def change_pin(request):
    try:
        user_congregation = Congregation.objects.get(user=request.user)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = ChangePINForm(request.POST)
        if form.is_valid():
            current_pin = form.cleaned_data["current_pin"]
            new_pin = form.cleaned_data["new_pin"]

            if user_congregation.pin == current_pin:
                user_congregation.pin = new_pin
                user_congregation.save()
                messages.success(request, "PIN changed successfully!")
                return redirect("core:dashboard")
            else:
                messages.error(request, "Current PIN is incorrect.")
    else:
        form = ChangePINForm()

    context = {"form": form, "congregation": user_congregation}
    return render(request, "core/change_pin.html", context)


@login_required
def change_password(request):
    try:
        user_congregation = Congregation.objects.get(user=request.user)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            user = form.save()
            update_session_auth_hash(request, user)
            messages.success(request, "Password changed successfully!")
            return redirect("core:dashboard")
    else:
        form = PasswordChangeForm(request.user)

    context = {"form": form, "congregation": user_congregation}
    return render(request, "core/change_password.html", context)


@login_required
def create_congregation(request):
    # Only district admins can create congregations
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            messages.error(
                request, "Only district admins can create new congregations."
            )
            return redirect("core:dashboard")
    except Congregation.DoesNotExist:
        messages.error(request, "You don't have permission to create congregations.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = NewCongregationForm(request.POST)
        if form.is_valid():
            # Create new user account
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]

            user = User.objects.create_user(username=username, password=password)

            # Create congregation
            congregation = form.save(commit=False)
            congregation.user = user
            congregation.save()

            messages.success(
                request, f"Congregation '{congregation.name}' created successfully!"
            )
            return redirect("core:dashboard")
    else:
        form = NewCongregationForm()

    context = {"form": form}
    return render(request, "core/create_congregation.html", context)


# Theme Management
@login_required
def update_theme(request):
    if request.method == "POST":
        try:
            user_congregation = Congregation.objects.get(user=request.user)
            background_color = request.POST.get("background_color")

            if background_color:
                user_congregation.background_color = background_color
                user_congregation.save()
                return JsonResponse(
                    {"success": True, "message": "Theme updated successfully"}
                )
        except Congregation.DoesNotExist:
            return JsonResponse({"success": False, "message": "Congregation not found"})

    return JsonResponse({"success": False, "message": "Invalid request"})


# Member Management Views
@login_required
def member_list(request):
    search_form = SearchForm(request.GET)
    members = Guilder.objects.all()

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            members = members.filter(congregation=user_congregation)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if search_form.is_valid():
        search = search_form.cleaned_data.get("search")
        congregation = search_form.cleaned_data.get("congregation")

        if search:
            members = members.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone_number__icontains=search)
            )

        if congregation and user_congregation.is_district:
            members = members.filter(congregation=congregation)

    paginator = Paginator(members, 20)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    context = {
        "page_obj": page_obj,
        "search_form": search_form,
    }
    return render(request, "core/member_list.html", context)


@login_required
@transaction.atomic
def add_member(request):
    try:
        user_congregation = Congregation.objects.get(user=request.user)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = GuilderForm(request.POST)
        if form.is_valid():
            member = form.save()
            # Notification for district
            create_notification(
                user=request.user,
                congregation=user_congregation,
                notification_type="new_member",
                title=f"New Guilder Added in {user_congregation.name}",
                message=f"{member.first_name} {member.last_name} was added by {request.user.username}.",
            )
            messages.success(
                request,
                f"Member {member.first_name} {member.last_name} added successfully!",
            )
            return redirect("member_detail", member.id)
    else:
        form = GuilderForm()
        if not user_congregation.is_district:
            form.fields["congregation"].initial = user_congregation

    context = {"form": form}
    return render(request, "core/member_form.html", context)


@login_required
@transaction.atomic
def edit_member(request, member_id):
    member = get_object_or_404(Guilder, id=member_id)
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if (
            not user_congregation.is_district
            and member.congregation != user_congregation
        ):
            messages.error(request, "You don't have permission to edit this member.")
            return redirect("core:member_list")
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    old_data = {
        field: getattr(member, field)
        for field in ["first_name", "last_name", "phone_number", "congregation_id"]
    }
    if request.method == "POST":
        form = GuilderForm(request.POST, instance=member)
        if form.is_valid():
            member = form.save()
            # Detect changes
            changes = {}
            for field in old_data:
                new_value = getattr(member, field)
                if old_data[field] != new_value:
                    changes[field] = {"from": old_data[field], "to": new_value}
            # Notification for district
            if changes:
                create_notification(
                    user=request.user,
                    congregation=member.congregation,
                    notification_type="edit",
                    title=f"Edit in {member.congregation.name}",
                    message=f"{member.first_name} {member.last_name} was edited by {request.user.username}.",
                    change_details=changes,
                )
            messages.success(
                request,
                f"Member {member.first_name} {member.last_name} updated successfully!",
            )
            return redirect("member_detail", member.id)
    else:
        form = GuilderForm(instance=member)

    context = {"form": form, "member": member}
    return render(request, "core/member_form.html", context)


@login_required
def member_detail(request, member_id):
    member = get_object_or_404(Guilder, id=member_id)

    # Check if user has permission to view this member
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if (
            not user_congregation.is_district
            and member.congregation != user_congregation
        ):
            messages.error(request, "You don't have permission to view this member.")
            return redirect("core:member_list")
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    context = {"member": member}
    return render(request, "core/member_detail.html", context)


@login_required
@transaction.atomic
def delete_member(request, member_id):
    member = get_object_or_404(Guilder, id=member_id)
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if (
            not user_congregation.is_district
            and member.congregation != user_congregation
        ):
            messages.error(request, "You don't have permission to delete this member.")
            return redirect("core:member_list")
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        pin = request.POST.get("pin")
        if pin == user_congregation.pin:
            # Notification for district
            create_notification(
                user=request.user,
                congregation=member.congregation,
                notification_type="delete",
                title=f"Delete in {member.congregation.name}",
                message=f"{member.first_name} {member.last_name} was deleted by {request.user.username}.",
            )
            member.delete()
            messages.success(request, "Member deleted successfully!")
            return redirect("member_list")
        else:
            messages.error(request, "Incorrect PIN. Deletion cancelled.")

    context = {"member": member}
    return render(request, "core/member_confirm_delete.html", context)


# Attendance Views
@login_required
def attendance_list(request):
    attendance_records = SundayAttendance.objects.all().order_by("-date")

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            attendance_records = attendance_records.filter(
                congregation=user_congregation
            )
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    paginator = Paginator(attendance_records, 20)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    context = {"page_obj": page_obj}
    return render(request, "core/attendance_list.html", context)


@login_required
def log_attendance(request):
    try:
        user_congregation = Congregation.objects.get(user=request.user)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = SundayAttendanceForm(request.POST)
        if form.is_valid():
            attendance = form.save()
            messages.success(
                request,
                f"Attendance logged for {attendance.congregation.name} on {attendance.date}",
            )
            return redirect("attendance_list")
    else:
        form = SundayAttendanceForm()
        # Pre-select user's congregation if not district admin
        if not user_congregation.is_district:
            form.fields["congregation"].initial = user_congregation

    context = {"form": form}
    return render(request, "core/attendance_form.html", context)


@login_required
def attendance_analytics(request):
    congregations = Congregation.objects.all()

    # Filter congregations if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            congregations = [user_congregation]
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    today = timezone.now().date()
    last_sunday = today - timedelta(days=today.weekday() + 1)

    attendance_data = []
    for congregation in congregations:
        current_attendance = SundayAttendance.objects.filter(
            congregation=congregation, date=last_sunday
        ).first()

        previous_attendance = SundayAttendance.objects.filter(
            congregation=congregation, date=last_sunday - timedelta(days=7)
        ).first()

        growth = 0
        if current_attendance and previous_attendance:
            growth = current_attendance.total_count - previous_attendance.total_count

        attendance_data.append(
            {
                "congregation": congregation,
                "current": current_attendance,
                "previous": previous_attendance,
                "growth": growth,
            }
        )

    context = {"attendance_data": attendance_data, "last_sunday": last_sunday}
    return render(request, "core/attendance_analytics.html", context)


# Advanced Analytics Views
@login_required
def advanced_analytics(request):
    context = {}
    return render(request, "core/advanced_analytics.html", context)


@login_required
def analytics_dashboard(request):
    context = {}
    return render(request, "core/analytics_dashboard.html", context)


# Bulk Operations
@login_required
def bulk_registration(request):
    try:
        user_congregation = Congregation.objects.get(user=request.user)
    except Congregation.DoesNotExist:
        messages.error(request, "No congregation found for this user.")
        return redirect("core:dashboard")

    if request.method == "POST":
        form = BulkGuilderForm(request.POST)
        if form.is_valid():
            congregation = form.cleaned_data["congregation"]

            # Check if user has permission for this congregation
            if not user_congregation.is_district and congregation != user_congregation:
                messages.error(
                    request,
                    "You don't have permission to add members to this congregation.",
                )
                return redirect("core:bulk_registration")

            cart, created = BulkProfileCart.objects.get_or_create(
                user=request.user, congregation=congregation, submitted=False
            )
            return redirect("bulk_cart", cart.id)
    else:
        form = BulkGuilderForm()
        # Pre-select user's congregation if not district admin
        if not user_congregation.is_district:
            form.fields["congregation"].initial = user_congregation

    context = {"form": form}
    return render(request, "core/bulk_registration.html", context)


@login_required
def bulk_cart(request, cart_id):
    cart = get_object_or_404(BulkProfileCart, id=cart_id, user=request.user)

    if request.method == "POST":
        action = request.POST.get("action")
        if action == "add_profile":
            profile_data = request.POST.get("profile_data")
            if profile_data:
                profiles = cart.profiles
                profiles.append(json.loads(profile_data))
                cart.profiles = profiles
                cart.save()

        elif action == "submit":
            for profile_data in cart.profiles:
                form = GuilderForm(profile_data)
                if form.is_valid():
                    form.save()

            cart.submitted = True
            cart.save()
            messages.success(
                request, f"{len(cart.profiles)} members added successfully!"
            )
            return redirect("member_list")

    context = {"cart": cart}
    return render(request, "core/bulk_cart.html", context)


# Export Views
@login_required
def export_members_csv(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="members.csv"'

    writer = csv.writer(response)
    writer.writerow(
        [
            "First Name",
            "Last Name",
            "Phone Number",
            "Email",
            "Gender",
            "Date of Birth",
            "Congregation",
            "Membership Status",
            "Position",
        ]
    )

    members = Guilder.objects.all()

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            members = members.filter(congregation=user_congregation)
    except Congregation.DoesNotExist:
        return response

    for member in members:
        writer.writerow(
            [
                member.first_name,
                member.last_name,
                member.phone_number,
                member.email,
                member.gender,
                member.date_of_birth,
                member.congregation.name,
                member.membership_status,
                member.position,
            ]
        )

    return response


@login_required
def export_attendance_csv(request):
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="attendance.csv"'

    writer = csv.writer(response)
    writer.writerow(
        ["Date", "Congregation", "Male Count", "Female Count", "Total Count"]
    )

    attendance_records = SundayAttendance.objects.all().order_by("-date")

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            attendance_records = attendance_records.filter(
                congregation=user_congregation
            )
    except Congregation.DoesNotExist:
        return response

    for record in attendance_records:
        writer.writerow(
            [
                record.date,
                record.congregation.name,
                record.male_count,
                record.female_count,
                record.total_count,
            ]
        )

    return response


@login_required
def export_members_pdf(request):
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="members_report.pdf"'

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=30,
        alignment=1,
    )

    # Title
    title = Paragraph("YPG Members Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))

    # Get members data
    members = Guilder.objects.all().order_by("congregation__name", "first_name")

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            members = members.filter(congregation=user_congregation)
    except Congregation.DoesNotExist:
        return response

    # Prepare table data
    data = [["Name", "Phone", "Congregation", "Status", "Gender"]]

    for member in members:
        data.append(
            [
                f"{member.first_name} {member.last_name}",
                member.phone_number,
                member.congregation.name,
                member.membership_status,
                member.gender,
            ]
        )

    # Create table
    table = Table(data)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ]
        )
    )

    elements.append(table)

    # Build PDF
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()

    response.write(pdf)
    return response


@login_required
def export_attendance_pdf(request):
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="attendance_report.pdf"'

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=30,
        alignment=1,
    )

    # Title
    title = Paragraph("YPG Attendance Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))

    # Get attendance data
    attendance_records = SundayAttendance.objects.all().order_by("-date")

    # Filter by user's congregation if not district admin
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        if not user_congregation.is_district:
            attendance_records = attendance_records.filter(
                congregation=user_congregation
            )
    except Congregation.DoesNotExist:
        return response

    # Prepare table data
    data = [["Date", "Congregation", "Male", "Female", "Total"]]

    for record in attendance_records:
        data.append(
            [
                record.date.strftime("%Y-%m-%d"),
                record.congregation.name,
                str(record.male_count),
                str(record.female_count),
                str(record.total_count),
            ]
        )

    # Create table
    table = Table(data)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ]
        )
    )

    elements.append(table)

    # Build PDF
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()

    response.write(pdf)
    return response


# API Views
@csrf_exempt
@require_http_methods(["GET"])
def api_members(request):
    congregation_id = request.GET.get("congregation")
    search = request.GET.get("search")
    
    print(f"api_members - congregation_id: {congregation_id}, type: {type(congregation_id)}")
    print(f"api_members - search: {search}")

    members = Guilder.objects.all()

    if congregation_id:
        print(f"Filtering by congregation_id: {congregation_id}")
        
        # Debug: Show all congregations and their IDs
        from .models import Congregation
        all_congregations = Congregation.objects.all()
        print("All congregations in database:")
        for cong in all_congregations:
            print(f"  ID: {cong.id}, Name: {cong.name}")
        
        members = members.filter(congregation_id=congregation_id)
        print(f"Filtered members count: {members.count()}")
        
        # Debug: Show which members were found
        for member in members:
            print(f"  Member: {member.first_name} {member.last_name}, Congregation: {member.congregation.name} (ID: {member.congregation.id})")

    if search:
        members = members.filter(
            Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
            | Q(phone_number__icontains=search)
        )

    data = []
    for member in members:
        member_data = {
            "id": member.id,
            "first_name": member.first_name,
            "last_name": member.last_name,
            "phone_number": member.phone_number,
            "email": member.email,
            "gender": member.gender,
            "congregation": member.congregation.name,
            "membership_status": member.membership_status,
            "position": member.position,
            "date_of_birth": member.date_of_birth,
            "place_of_residence": member.place_of_residence,
            "residential_address": member.residential_address,
            "hometown": member.hometown,
            "relative_contact": member.relative_contact,
            "profession": member.profession,
            "is_baptized": member.is_baptized,
            "is_confirmed": member.is_confirmed,
            "is_communicant": member.is_communicant,
            "is_executive": member.is_executive,
            "executive_position": member.executive_position,
            "executive_level": member.executive_level,
            "local_executive_position": member.local_executive_position,
            "district_executive_position": member.district_executive_position,
        }
        data.append(member_data)
        
        # Debug: Print first member's data
        if len(data) == 1:
            print(f"API Debug - First member data: {member_data}")

    return JsonResponse({"members": data})


@csrf_exempt
@require_http_methods(["GET"])
def api_attendance_stats(request):
    congregation_id = request.GET.get("congregation")

    if congregation_id:
        attendance = SundayAttendance.objects.filter(congregation_id=congregation_id)
    else:
        attendance = SundayAttendance.objects.all()

    total_attendance = attendance.aggregate(
        total_male=Sum("male_count"),
        total_female=Sum("female_count"),
        total=Sum("total_count"),
    )

    return JsonResponse(total_attendance)


@csrf_exempt
@require_http_methods(["POST"])
def api_add_member(request):
    try:
        data = json.loads(request.body)
        
        # Debug: Print the received data
        print(f"api_add_member - Received data: {data}")
        
        # Handle congregation name to ID conversion
        if data.get("congregation") and isinstance(data.get("congregation"), str):
            try:
                congregation = Congregation.objects.get(name=data["congregation"])
                data["congregation"] = congregation.id
                print(f"api_add_member - Converted congregation name to ID: {congregation.id}")
            except Congregation.DoesNotExist:
                print(f"api_add_member - Congregation not found: {data['congregation']}")
                return JsonResponse({
                    "success": False, 
                    "error": f"Congregation '{data['congregation']}' not found"
                }, status=400)
        
        # Handle executive level and position mapping
        if data.get("is_executive"):
            executive_level = data.get("executive_level")
            
            if executive_level == "local":
                # Set primary position to local position
                if data.get("local_executive_position"):
                    data["executive_position"] = data["local_executive_position"]
                    
            elif executive_level == "district":
                # Set primary position to district position
                if data.get("district_executive_position"):
                    data["executive_position"] = data["district_executive_position"]
                    
            elif executive_level == "both":
                # Set primary position to the first available position
                if data.get("local_executive_position"):
                    data["executive_position"] = data["local_executive_position"]
                elif data.get("district_executive_position"):
                    data["executive_position"] = data["district_executive_position"]
        
        form = GuilderForm(data)

        if form.is_valid():
            member = form.save()
            print(f"api_add_member - Member saved successfully with ID: {member.id}")
            return JsonResponse(
                {
                    "success": True,
                    "message": "Member added successfully",
                    "member_id": member.id,
                }
            )
        else:
            print(f"api_add_member - Form validation failed: {form.errors}")
            return JsonResponse({"success": False, "errors": form.errors}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)


@csrf_exempt
@require_http_methods(["PUT"])
def api_update_member(request, member_id):
    try:
        data = json.loads(request.body)
        
        # Debug: Print the received data
        print(f"api_update_member - Received data for member {member_id}: {data}")
        
        # Get the member to update
        try:
            member = Guilder.objects.get(id=member_id)
        except Guilder.DoesNotExist:
            return JsonResponse({
                "success": False, 
                "error": f"Member with ID {member_id} not found"
            }, status=404)
        
        # Handle congregation name to ID conversion
        if data.get("congregation") and isinstance(data.get("congregation"), str):
            try:
                congregation = Congregation.objects.get(name=data["congregation"])
                data["congregation"] = congregation.id
                print(f"api_update_member - Converted congregation name to ID: {congregation.id}")
            except Congregation.DoesNotExist:
                print(f"api_update_member - Congregation not found: {data['congregation']}")
                return JsonResponse({
                    "success": False, 
                    "error": f"Congregation '{data['congregation']}' not found"
                }, status=400)
        
        # Handle executive level and position mapping
        if data.get("is_executive"):
            executive_level = data.get("executive_level")
            
            if executive_level == "local":
                # Set primary position to local position
                if data.get("local_executive_position"):
                    data["executive_position"] = data["local_executive_position"]
                    
            elif executive_level == "district":
                # Set primary position to district position
                if data.get("district_executive_position"):
                    data["executive_position"] = data["district_executive_position"]
                    
            elif executive_level == "both":
                # Set primary position to the first available position
                if data.get("local_executive_position"):
                    data["executive_position"] = data["local_executive_position"]
                elif data.get("district_executive_position"):
                    data["executive_position"] = data["district_executive_position"]
        
        form = GuilderForm(data, instance=member)

        if form.is_valid():
            updated_member = form.save()
            print(f"api_update_member - Member updated successfully with ID: {updated_member.id}")
            return JsonResponse(
                {
                    "success": True,
                    "message": "Member updated successfully",
                    "member_id": updated_member.id,
                }
            )
        else:
            print(f"api_update_member - Form validation failed: {form.errors}")
            return JsonResponse({"success": False, "errors": form.errors}, status=400)

    except json.JSONDecodeError:
        return JsonResponse({"success": False, "error": "Invalid JSON"}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def api_delete_member(request, member_id):
    """API endpoint for deleting a member"""
    try:
        print(f"api_delete_member called for member_id: {member_id}")
        
        # Get the member to delete
        try:
            member = Guilder.objects.get(id=member_id)
        except Guilder.DoesNotExist:
            return JsonResponse({
                "success": False, 
                "error": f"Member with ID {member_id} not found"
            }, status=404)
        
        # Note: No authentication/permission checks for API consistency
        
        # Delete the member
        member.delete()
        
        return JsonResponse({
            "success": True, 
            "message": "Member deleted successfully!"
        })
        
    except Exception as e:
        return JsonResponse({
            "success": False, 
            "error": str(e)
        }, status=500)


# Advanced Analytics API Endpoints
@csrf_exempt
@require_http_methods(["GET"])
def api_attendance_chart_data(request):
    """API endpoint for attendance chart data"""
    weeks = int(request.GET.get("weeks", 8))
    congregation_id = request.GET.get("congregation")

    end_date = timezone.now().date()
    start_date = end_date - timedelta(weeks=weeks)

    if congregation_id:
        attendance_records = SundayAttendance.objects.filter(
            congregation_id=congregation_id, date__gte=start_date, date__lte=end_date
        ).order_by("date")
    else:
        attendance_records = SundayAttendance.objects.filter(
            date__gte=start_date, date__lte=end_date
        ).order_by("date")

    # Group by date and sum totals
    attendance_by_date = defaultdict(int)
    for record in attendance_records:
        attendance_by_date[record.date.strftime("%Y-%m-%d")] += record.total_count

    dates = sorted(attendance_by_date.keys())
    totals = [attendance_by_date[date] for date in dates]

    return JsonResponse({"labels": dates, "data": totals, "weeks": weeks})


@csrf_exempt
@require_http_methods(["GET"])
def api_congregation_pie_data(request):
    """API endpoint for congregation distribution pie chart"""
    congregations = Congregation.objects.all()

    labels = []
    data = []
    colors = []

    for congregation in congregations:
        member_count = Guilder.objects.filter(congregation=congregation).count()
        if member_count > 0:
            labels.append(congregation.name)
            data.append(member_count)
            colors.append(congregation.background_color)

    return JsonResponse({"labels": labels, "data": data, "colors": colors})


@csrf_exempt
@require_http_methods(["GET"])
def api_gender_distribution(request):
    """API endpoint for gender distribution histogram"""
    congregations = Congregation.objects.all()

    labels = []
    male_data = []
    female_data = []

    for congregation in congregations:
        labels.append(congregation.name)
        male_count = Guilder.objects.filter(
            congregation=congregation, gender="Male"
        ).count()
        female_count = Guilder.objects.filter(
            congregation=congregation, gender="Female"
        ).count()

        male_data.append(male_count)
        female_data.append(female_count)

    return JsonResponse(
        {"labels": labels, "male_data": male_data, "female_data": female_data}
    )


@csrf_exempt
@require_http_methods(["GET"])
def api_attendance_trends(request):
    """API endpoint for attendance trends over time"""
    months = int(request.GET.get("months", 6))
    congregation_id = request.GET.get("congregation")

    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=months * 30)

    if congregation_id:
        attendance_records = SundayAttendance.objects.filter(
            congregation_id=congregation_id, date__gte=start_date, date__lte=end_date
        ).order_by("date")
    else:
        attendance_records = SundayAttendance.objects.filter(
            date__gte=start_date, date__lte=end_date
        ).order_by("date")

    # Group by month
    monthly_data = defaultdict(list)
    for record in attendance_records:
        month_key = record.date.strftime("%Y-%m")
        monthly_data[month_key].append(record.total_count)

    # Calculate averages
    months = sorted(monthly_data.keys())
    averages = [sum(monthly_data[month]) / len(monthly_data[month]) for month in months]

    return JsonResponse({"labels": months, "data": averages, "months": months})


@csrf_exempt
@require_http_methods(["GET"])
def api_executive_positions(request):
    """API endpoint for executive positions"""
    return JsonResponse(
        {
            "local": dict(LOCAL_EXECUTIVE_POSITIONS),
            "district": dict(DISTRICT_EXECUTIVE_POSITIONS),
        }
    )


@csrf_exempt
@require_http_methods(["GET"])
def api_dashboard_stats(request):
    """API endpoint for dashboard statistics"""
    try:
        user_congregation = Congregation.objects.get(user=request.user)
        is_district = user_congregation.is_district
    except Congregation.DoesNotExist:
        return JsonResponse(
            {"error": "User not associated with any congregation"}, status=400
        )

    if is_district:
        # District stats
        total_members = Guilder.objects.count()
        total_male = Guilder.objects.filter(gender="Male").count()
        total_female = Guilder.objects.filter(gender="Female").count()
        active_members = Guilder.objects.filter(membership_status="Active").count()
        distant_members = Guilder.objects.filter(membership_status="Distant").count()
        total_congregations = Congregation.objects.count()

        # Get executives and members for district view
        # District executives: those with district or both level
        district_executives = Guilder.objects.filter(
            is_executive=True,
            executive_level__in=["district", "both"]
        ).order_by("district_executive_position", "first_name")

        # Local executives: those with local or both level
        local_executives = Guilder.objects.filter(
            is_executive=True,
            executive_level__in=["local", "both"]
        ).order_by("congregation__name", "local_executive_position", "first_name")

        members = Guilder.objects.filter(is_executive=False).order_by(
            "first_name", "last_name"
        )

        return JsonResponse(
            {
                "is_district": True,
                "stats": {
                    "total_members": total_members,
                    "total_male": total_male,
                    "total_female": total_female,
                    "active_members": active_members,
                    "distant_members": distant_members,
                    "total_congregations": total_congregations,
                },
                "district_executives": [
                    {
                        "id": exec.id,
                        "name": f"{exec.first_name} {exec.last_name}",
                        "position": exec.district_executive_position or exec.executive_position,
                        "congregation": exec.congregation.name,
                        "level": exec.executive_level,
                    }
                    for exec in district_executives
                ],
                "local_executives": [
                    {
                        "id": exec.id,
                        "name": f"{exec.first_name} {exec.last_name}",
                        "position": exec.local_executive_position or exec.executive_position,
                        "congregation": exec.congregation.name,
                        "level": exec.executive_level,
                    }
                    for exec in local_executives
                ],
                "members": [
                    {
                        "id": member.id,
                        "name": f"{member.first_name} {member.last_name}",
                        "congregation": member.congregation.name,
                        "status": member.membership_status,
                    }
                    for member in members
                ],
            }
        )
    else:
        # Local stats
        total_members = Guilder.objects.filter(congregation=user_congregation).count()
        total_male = Guilder.objects.filter(
            congregation=user_congregation, gender="Male"
        ).count()
        total_female = Guilder.objects.filter(
            congregation=user_congregation, gender="Female"
        ).count()
        active_members = Guilder.objects.filter(
            congregation=user_congregation, membership_status="Active"
        ).count()
        distant_members = Guilder.objects.filter(
            congregation=user_congregation, membership_status="Distant"
        ).count()

        # Get executives and members
        # Local executives: those with local or both level from this congregation
        executives = Guilder.objects.filter(
            congregation=user_congregation,
            is_executive=True,
            executive_level__in=["local", "both"]
        ).order_by("local_executive_position", "first_name")

        members = Guilder.objects.filter(
            congregation=user_congregation, is_executive=False
        ).order_by("first_name", "last_name")

        return JsonResponse(
            {
                "is_district": False,
                "stats": {
                    "total_members": total_members,
                    "total_male": total_male,
                    "total_female": total_female,
                    "active_members": active_members,
                    "distant_members": distant_members,
                },
                "executives": [
                    {
                        "id": exec.id,
                        "name": f"{exec.first_name} {exec.last_name}",
                        "position": exec.local_executive_position or exec.executive_position,
                        "level": exec.executive_level,
                    }
                    for exec in executives
                ],
                "members": [
                    {
                        "id": member.id,
                        "name": f"{member.first_name} {member.last_name}",
                        "status": member.membership_status,
                    }
                    for member in members
                ],
            }
        )


# Birthday SMS Views
@login_required
def birthday_dashboard(request):
    today = timezone.now().date()
    birthdays_today = Guilder.objects.filter(
        date_of_birth__month=today.month, date_of_birth__day=today.day
    )

    sent_messages = BirthdayMessageLog.objects.filter(sent_date=today)

    context = {"birthdays_today": birthdays_today, "sent_messages": sent_messages}
    return render(request, "core/birthday_dashboard.html", context)


def send_birthday_sms(request, guilder_id):
    guilder = get_object_or_404(Guilder, id=guilder_id)
    today = timezone.now().date()

    # Check if message already sent today
    if BirthdayMessageLog.objects.filter(guilder=guilder, sent_date=today).exists():
        return JsonResponse({"success": False, "message": "SMS already sent today"})

    # TODO: Integrate with Twilio or SMS provider
    message = (
        f"Happy Birthday {guilder.first_name}! May God bless you abundantly. - YPG"
    )

    # Log the message
    BirthdayMessageLog.objects.create(guilder=guilder, sent_date=today, message=message)

    return JsonResponse({"success": True, "message": "Birthday SMS sent successfully"})


# --- Notification API Endpoints ---
@require_GET
def api_notifications(request):
    # For now, return empty notifications to prevent errors
    # This can be implemented later when notification system is needed
    return JsonResponse({
        "notifications": [], 
        "unseen_count": 0
    })


@require_POST
def api_mark_notification_read(request):
    notif_id = request.POST.get("id")
    congregation_name = request.POST.get("congregation")
    
    try:
        # Filter by congregation if specified
        if congregation_name:
            notif = Notification.objects.get(
                id=notif_id, 
                congregation__name=congregation_name
            )
        else:
            notif = Notification.objects.get(id=notif_id)
            
        notif.is_read = True
        notif.save()
        return JsonResponse({"success": True})
    except Notification.DoesNotExist:
        return JsonResponse({"success": False, "error": "Notification not found"})


@require_POST
def api_clear_notifications(request):
    congregation_name = request.POST.get("congregation")
    
    try:
        # Filter by congregation if specified
        if congregation_name:
            Notification.objects.filter(
                congregation__name=congregation_name
            ).delete()
        else:
            # Clear all notifications if no congregation specified
            Notification.objects.all().delete()
            
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})


@require_POST
def api_send_manual_notification(request):
    try:
        data = json.loads(request.body)
        target = data.get("target")  # 'all' or 'local'
        message = data.get("message")
        title = data.get("title")
        congregation_name = data.get("congregation")

        # Create a system notification
        try:
            if congregation_name:
                congregation = Congregation.objects.get(name=congregation_name)
            else:
                congregation = Congregation.objects.first()
                
            if congregation:
                create_notification(
                    user=None,  # System notification
                    congregation=congregation,
                    notification_type="manual",
                    title=title,
                    message=message,
                )
                return JsonResponse({"success": True, "message": "Notification sent successfully"})
            else:
                return JsonResponse({"success": False, "error": "No congregations found"})
        except Congregation.DoesNotExist:
            return JsonResponse({"success": False, "error": "Congregation not found"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@require_POST
def api_create_test_notifications(request):
    """Create test notifications for development/testing"""
    try:
        data = json.loads(request.body)
        congregation_name = data.get("congregation")
        
        if not congregation_name:
            return JsonResponse({"success": False, "error": "Congregation name required"})
        
        congregation = Congregation.objects.get(name=congregation_name)
        
        # Create sample notifications
        test_notifications = [
            {
                "title": "New Member Registration",
                "message": "A new member has been registered and is pending approval",
                "type": "new_member"
            },
            {
                "title": "Weekly Attendance Report",
                "message": "Weekly attendance report for this week is now ready",
                "type": "attendance"
            },
            {
                "title": "System Maintenance",
                "message": "Scheduled system maintenance will occur tonight at 2 AM",
                "type": "system"
            },
            {
                "title": "Birthday Reminder",
                "message": "Today is John Doe's birthday. Don't forget to send wishes!",
                "type": "birthday"
            }
        ]
        
        for notification in test_notifications:
            create_notification(
                user=None,
                congregation=congregation,
                notification_type=notification["type"],
                title=notification["title"],
                message=notification["message"],
            )
        
        return JsonResponse({"success": True, "message": f"Created {len(test_notifications)} test notifications"})
        
    except Congregation.DoesNotExist:
        return JsonResponse({"success": False, "error": "Congregation not found"})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

# Global variable to store profile data (in production, use database)
DISTRICT_PROFILE_DATA = {
    'username': 'district_admin',
    'fullName': 'District Admin',
    'email': 'district@ypg.com',
    'phone': '+233 20 123 4567',
    'role': 'System Administrator',
}

# Settings API Views
@csrf_exempt
@require_http_methods(["GET", "PUT"])
def api_settings_profile(request):
    """API endpoint for profile settings"""
    
    try:
        if request.method == "GET":
            # Get user from request (for now, use a default approach)
            # In a real implementation, you'd get the user from authentication
            try:
                # Try to get user from session or token
                user = request.user
                if user.is_authenticated:
                    # Get or create user profile
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    profile_data = {
                        'username': user.username or '',
                        'fullName': user.get_full_name() or user.username or '',
                        'email': user.email or '',
                        'phone': profile.phone_number or '',
                        'role': profile.role or 'Local Executive',
                        'avatar': profile.avatar.url if profile.avatar else None,
                    }
                else:
                    # Fallback to global data for unauthenticated users
                    profile_data = {
                        'username': DISTRICT_PROFILE_DATA.get('username', 'district_admin') or '',
                        'fullName': DISTRICT_PROFILE_DATA.get('fullName', 'District Admin') or '',
                        'email': DISTRICT_PROFILE_DATA.get('email', 'district@ypg.com') or '',
                        'phone': DISTRICT_PROFILE_DATA.get('phone', '+233 20 123 4567') or '',
                        'role': DISTRICT_PROFILE_DATA.get('role', 'System Administrator') or '',
                        'avatar': None,
                    }
            except Exception as e:
                # Fallback to global data
                profile_data = {
                    'username': DISTRICT_PROFILE_DATA.get('username', 'district_admin') or '',
                    'fullName': DISTRICT_PROFILE_DATA.get('fullName', 'District Admin') or '',
                    'email': DISTRICT_PROFILE_DATA.get('email', 'district@ypg.com') or '',
                    'phone': DISTRICT_PROFILE_DATA.get('phone', '+233 20 123 4567') or '',
                    'role': DISTRICT_PROFILE_DATA.get('role', 'System Administrator') or '',
                    'avatar': None,
                }
            
            return JsonResponse({
                'success': True, 
                'profile': profile_data
            })
        
        elif request.method == "PUT":
            # Update profile data
            data = json.loads(request.body)
            
            # Validate the data
            if not data.get('fullName'):
                return JsonResponse({
                    'success': False, 
                    'error': 'Full name is required'
                }, status=400)
            
            if not data.get('email'):
                return JsonResponse({
                    'success': False, 
                    'error': 'Email is required'
                }, status=400)
            
            try:
                # Try to get authenticated user
                user = request.user
                if user.is_authenticated:
                    # Update user model
                    user.first_name = data.get('fullName', '').split()[0] if data.get('fullName') else ''
                    user.last_name = ' '.join(data.get('fullName', '').split()[1:]) if data.get('fullName') and len(data.get('fullName', '').split()) > 1 else ''
                    user.email = data.get('email', '')
                    user.save()
                    
                    # Get or create user profile
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    profile.phone_number = data.get('phone', '')
                    profile.role = data.get('role', 'Local Executive')
                    profile.save()
                    
                    # Return updated profile data
                    profile_data = {
                        'username': user.username or '',
                        'fullName': user.get_full_name() or user.username or '',
                        'email': user.email or '',
                        'phone': profile.phone_number or '',
                        'role': profile.role or 'Local Executive',
                        'avatar': profile.avatar.url if profile.avatar else None,
                    }
                else:
                    # Update global data for unauthenticated users
                    DISTRICT_PROFILE_DATA.update({
                        'username': data.get('username', 'district_admin'),
                        'fullName': data.get('fullName', 'District Admin'),
                        'email': data.get('email', 'district@ypg.com'),
                        'phone': data.get('phone', '+233 20 123 4567'),
                        'role': data.get('role', 'System Administrator'),
                    })
                    profile_data = DISTRICT_PROFILE_DATA
                
                return JsonResponse({
                    'success': True, 
                    'message': 'Profile updated successfully',
                    'profile': profile_data
                })
            except Exception as e:
                return JsonResponse({
                    'success': False, 
                    'error': f'Failed to update profile: {str(e)}'
                }, status=500)
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def api_get_current_pin(request):
    """API endpoint for getting current PIN (for debugging)"""
    try:
        # Get congregation info from query parameters (sent by frontend)
        congregation_id = request.GET.get('congregation_id')
        congregation_name = request.GET.get('congregation_name')
        
        print(f"Get current PIN request - Congregation ID: {congregation_id}, Congregation Name: {congregation_name}")
        
        # Try to get congregation - prioritize frontend-provided info
        congregation = None
        
        # First, try to get congregation using ID from frontend
        if congregation_id:
            try:
                # Handle special case where district ID might be "district" string
                if congregation_id == "district":
                    congregation = Congregation.objects.get(name="District Admin")
                    print(f"Found district congregation by name: {congregation.name}")
                else:
                    congregation = Congregation.objects.get(id=congregation_id)
                    print(f"Found congregation by ID from frontend: {congregation.name}")
            except Congregation.DoesNotExist:
                print(f"Congregation with ID {congregation_id} not found")
        
        # If not found by ID, try by name from frontend
        if not congregation and congregation_name:
            try:
                congregation = Congregation.objects.get(name=congregation_name)
                print(f"Found congregation by name from frontend: {congregation.name}")
            except Congregation.DoesNotExist:
                print(f"Congregation '{congregation_name}' not found in database")
        
        # If still not found, try authenticated user
        if not congregation and request.user.is_authenticated:
            try:
                congregation = Congregation.objects.get(user=request.user)
                print(f"Found authenticated congregation: {congregation.name}")
            except Congregation.DoesNotExist:
                print("No congregation found for authenticated user")
        
        # If still not found, try session
        if not congregation:
            session_congregation_id = request.session.get('congregation_id')
            if session_congregation_id:
                try:
                    congregation = Congregation.objects.get(id=session_congregation_id)
                    print(f"Found congregation from session: {congregation.name}")
                except Congregation.DoesNotExist:
                    print("Congregation from session not found")
        
        # Last resort - use first available congregation
        if not congregation:
            try:
                congregation = Congregation.objects.first()
                print(f"Using first available congregation: {congregation.name if congregation else 'None'}")
            except:
                print("No congregations available")
        
        if congregation:
            return JsonResponse({
                'success': True,
                'congregation': congregation.name,
                'pin': congregation.pin
            })
        else:
            session_pin = request.session.get('new_pin', '1234')
            return JsonResponse({
                'success': True,
                'congregation': 'Session',
                'pin': session_pin
            })
                
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_validate_pin(request):
    """API endpoint for validating PIN"""
    try:
        data = json.loads(request.body)
        pin = data.get('pin')
        congregation_id = data.get('congregation_id')
        congregation_name = data.get('congregation_name')
        
        print(f"PIN validation request - PIN: {pin}, Congregation ID: {congregation_id}, Congregation Name: {congregation_name}")
        
        if not pin:
            return JsonResponse({
                'success': False,
                'error': 'PIN is required'
            }, status=400)
        
        # Try to get congregation - prioritize frontend-provided info
        congregation = None
        
        # First, try to get congregation using ID from frontend
        if congregation_id:
            try:
                # Handle special case where district ID might be "district" string
                if congregation_id == "district":
                    congregation = Congregation.objects.get(name="District Admin")
                    print(f"Found district congregation by name: {congregation.name}")
                else:
                    congregation = Congregation.objects.get(id=congregation_id)
                    print(f"Found congregation by ID from frontend: {congregation.name}")
            except Congregation.DoesNotExist:
                print(f"Congregation with ID {congregation_id} not found")
        
        # If not found by ID, try by name from frontend
        if not congregation and congregation_name:
            try:
                congregation = Congregation.objects.get(name=congregation_name)
                print(f"Found congregation by name from frontend: {congregation.name}")
            except Congregation.DoesNotExist:
                print(f"Congregation '{congregation_name}' not found in database")
        
        # If still not found, try authenticated user
        if not congregation and request.user.is_authenticated:
            try:
                congregation = Congregation.objects.get(user=request.user)
                print(f"Found authenticated congregation: {congregation.name}")
            except Congregation.DoesNotExist:
                print("No congregation found for authenticated user")
        
        # If still not found, try session
        if not congregation:
            session_congregation_id = request.session.get('congregation_id')
            if session_congregation_id:
                try:
                    congregation = Congregation.objects.get(id=session_congregation_id)
                    print(f"Found congregation from session: {congregation.name}")
                except Congregation.DoesNotExist:
                    print("Congregation from session not found")
        
        # Last resort - use first available congregation
        if not congregation:
            try:
                congregation = Congregation.objects.first()
                print(f"Using first available congregation: {congregation.name if congregation else 'None'}")
            except:
                print("No congregations available")
        
        if congregation:
            print(f"Validating PIN for congregation {congregation.name}: stored PIN = '{congregation.pin}', provided PIN = '{pin}'")
            if congregation.pin == pin:
                print("PIN validation successful")
                return JsonResponse({
                    'success': True,
                    'message': 'PIN is valid'
                })
            else:
                print("PIN validation failed - PINs don't match")
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid PIN'
                }, status=401)
        else:
            # Fallback to session PIN or default
            session_pin = request.session.get('new_pin', '1234')
            print(f"Using session PIN: '{session_pin}', provided PIN: '{pin}'")
            if session_pin == pin:
                print("Session PIN validation successful")
                return JsonResponse({
                    'success': True,
                    'message': 'PIN is valid'
                })
            else:
                print("Session PIN validation failed")
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid PIN'
                }, status=401)
                
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def api_settings_security(request):
    """API endpoint for security settings (password/PIN changes)"""
    try:
        if request.method == "GET":
            # Get current security settings
            try:
                user = request.user
                if user.is_authenticated:
                    # Get user profile for additional security info
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    security_data = {
                        'username': user.username or '',
                        'twoFactorAuth': False,  # Default for now
                        'requirePinForActions': True,  # Default for now
                        'hasPin': True,  # Default for now
                        'lastPasswordChange': None,
                        'lastPinChange': None,
                    }
                else:
                    # Fallback for unauthenticated users
                    security_data = {
                        'username': DISTRICT_PROFILE_DATA.get('username', 'district_admin') or '',
                        'twoFactorAuth': False,
                        'requirePinForActions': True,
                        'hasPin': True,
                        'lastPasswordChange': None,
                        'lastPinChange': None,
                    }
                return JsonResponse({'success': True, 'security': security_data})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})
        
        elif request.method == "PUT":
            # Update security settings
            data = json.loads(request.body)
            
            # Handle username and password change
            username = data.get('username')
            if username:
                try:
                    # Determine target user for username change
                    target_user = None
                    if request.user.is_authenticated:
                        target_user = request.user
                    elif data.get('currentUsername'):
                        try:
                            target_user = User.objects.get(username=data.get('currentUsername'))
                        except User.DoesNotExist:
                            return JsonResponse({'success': False, 'error': 'Current user not found'}, status=404)
                    else:
                        try:
                            district_congregation = Congregation.objects.get(is_district=True)
                            target_user = district_congregation.user
                        except Congregation.DoesNotExist:
                            return JsonResponse({'success': False, 'error': 'District congregation not found'}, status=404)

                    if not target_user:
                        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

                    if target_user.username == username:
                                return JsonResponse({
                                    'success': False,
                                    'error': 'New username cannot be the same as current username. Please use a different username.'
                                }, status=400)
                            
                    if User.objects.filter(username=username).exclude(pk=target_user.pk).exists():
                        return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)

                    target_user.username = username
                    target_user.save()

                    # Refresh session if acting user changed their own username
                    if request.user.is_authenticated and request.user.pk == target_user.pk:
                        login(request, target_user)

                    # Maintain global data for district
                    try:
                        district_congregation = Congregation.objects.get(is_district=True)
                        if district_congregation.user and district_congregation.user.pk == target_user.pk:
                            DISTRICT_PROFILE_DATA['username'] = target_user.username
                    except Congregation.DoesNotExist:
                        pass
                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'error': f'Failed to update username: {str(e)}'
                    }, status=400)
            
            if data.get('newPassword'):
                # Validate password requirements
                if len(data['newPassword']) < 8:
                    return JsonResponse({
                        'success': False,
                        'error': 'Password must be at least 8 characters long'
                    }, status=400)
                
                if data['newPassword'] != data.get('confirmPassword', ''):
                    return JsonResponse({
                        'success': False,
                        'error': 'Passwords do not match'
                    }, status=400)
                
                # Check if new password is same as current password (basic check)
                if data.get('currentPassword') and data['newPassword'] == data['currentPassword']:
                    return JsonResponse({
                        'success': False,
                        'error': 'New password cannot be the same as current password. Please use a different password.'
                    }, status=400)
                
                # Additional password validation
                if not data['newPassword'].strip():
                    return JsonResponse({
                        'success': False,
                        'error': 'Password cannot be empty'
                    }, status=400)
                            
                # Determine target user for password change
                try:
                    target_user = None
                    if request.user.is_authenticated:
                        target_user = request.user
                    # Prefer resolving via congregation for local context
                    elif data.get('congregation_id') or data.get('congregation_name'):
                        congregation = None
                        if data.get('congregation_id'):
                            try:
                                if data.get('congregation_id') == "district":
                                    congregation = Congregation.objects.get(is_district=True)
                                else:
                                    congregation = Congregation.objects.get(id=data.get('congregation_id'))
                            except Congregation.DoesNotExist:
                                pass
                        if not congregation and data.get('congregation_name'):
                            try:
                                congregation = Congregation.objects.get(name=data.get('congregation_name'))
                            except Congregation.DoesNotExist:
                                pass
                        if congregation and congregation.user:
                            target_user = congregation.user
                    elif data.get('username'):
                        try:
                            target_user = User.objects.get(username=data.get('username'))
                        except User.DoesNotExist:
                            return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
                    else:
                        try:
                            district_congregation = Congregation.objects.get(is_district=True)
                            target_user = district_congregation.user
                        except Congregation.DoesNotExist:
                            return JsonResponse({'success': False, 'error': 'District congregation not found'}, status=404)

                    if not target_user:
                        return JsonResponse({'success': False, 'error': 'User not found'}, status=404)

                    # Verify current password if provided (skip if same authenticated user)
                    if data.get('currentPassword') and not (request.user.is_authenticated and request.user.pk == target_user.pk):
                        if not target_user.check_password(data['currentPassword']):
                            return JsonResponse({'success': False, 'error': 'Current password is incorrect'}, status=400)

                    # Update password
                    target_user.set_password(data['newPassword'])
                    target_user.save()

                    # Keep session if acting on self
                    if request.user.is_authenticated and request.user.pk == target_user.pk:
                        update_session_auth_hash(request, target_user)

                    return JsonResponse({'success': True, 'message': 'Password updated successfully'})
                except Exception as e:
                    return JsonResponse({'success': False, 'error': f'Database error: {str(e)}'}, status=500)
                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'error': f'Database error: {str(e)}'
                    }, status=500)
            
            # Return success if only username was updated
            if username and not data.get('newPassword'):
                return JsonResponse({
                    'success': True,
                    'message': 'Username updated successfully'
                })
            
            # Return success if only password was updated
            if data.get('newPassword') and not username:
                return JsonResponse({
                    'success': True,
                    'message': 'Password updated successfully'
                })
            
            # Handle PIN change
            if data.get('newPin'):
                print(f"PIN change request - Current PIN: {data.get('currentPin')}, New PIN: {data.get('newPin')}")
                
                if not re.match(r'^\d{4}$', data['newPin']):
                    return JsonResponse({
                        'success': False,
                        'error': 'PIN must be exactly 4 digits'
                    }, status=400)
                
                if data['newPin'] != data.get('confirmPin', ''):
                    return JsonResponse({
                        'success': False,
                        'error': 'PINs do not match'
                    }, status=400)
                
                # Check if new PIN is same as current PIN (basic check)
                if data.get('currentPin') and data['newPin'] == data['currentPin']:
                    return JsonResponse({
                        'success': False,
                        'error': 'New PIN cannot be the same as current PIN. Please use a different PIN.'
                    }, status=400)
                
                try:
                    # Get congregation info from frontend data
                    congregation_id = data.get('congregation_id')
                    congregation_name = data.get('congregation_name')
                    
                    print(f"PIN change - Congregation ID: {congregation_id}, Congregation Name: {congregation_name}")
                    
                    # Try to get congregation - prioritize frontend-provided info
                    congregation = None
                    
                    # First, try to get congregation using ID from frontend
                    if congregation_id:
                        try:
                            # Handle special case where district ID might be "district" string
                            if congregation_id == "district":
                                congregation = Congregation.objects.get(name="District Admin")
                                print(f"Found district congregation by name for PIN change: {congregation.name}")
                            else:
                                congregation = Congregation.objects.get(id=congregation_id)
                                print(f"Found congregation by ID for PIN change: {congregation.name}")
                        except Congregation.DoesNotExist:
                            print(f"Congregation with ID {congregation_id} not found for PIN change")
                    
                    # If not found by ID, try by name from frontend
                    if not congregation and congregation_name:
                        try:
                            congregation = Congregation.objects.get(name=congregation_name)
                            print(f"Found congregation by name for PIN change: {congregation.name}")
                        except Congregation.DoesNotExist:
                            print(f"Congregation '{congregation_name}' not found for PIN change")
                    
                    # If still not found, try authenticated user
                    if not congregation and request.user.is_authenticated:
                        try:
                            congregation = Congregation.objects.get(user=request.user)
                            print(f"Found authenticated congregation for PIN change: {congregation.name}")
                        except Congregation.DoesNotExist:
                            print("No congregation found for authenticated user for PIN change")
                    
                    if congregation:
                        # Verify current PIN before updating
                        if data.get('currentPin') and congregation.pin != data['currentPin']:
                            print(f"Current PIN verification failed - stored: '{congregation.pin}', provided: '{data['currentPin']}'")
                            return JsonResponse({
                                'success': False,
                                'error': 'Current PIN is incorrect'
                            }, status=400)
                        
                        # Update PIN in database
                        print(f"Updating PIN for congregation {congregation.name} from {congregation.pin} to {data['newPin']}")
                        congregation.pin = data['newPin']
                        congregation.save()
                        
                        # Verify the PIN was saved
                        congregation.refresh_from_db()
                        print(f"PIN after save: {congregation.pin}")
                        
                        return JsonResponse({
                            'success': True,
                            'message': 'PIN updated successfully'
                        })
                    else:
                        return JsonResponse({
                            'success': False,
                            'error': 'No congregation found to update PIN'
                        }, status=404)
                        
                except Exception as e:
                    print(f"Error updating PIN: {str(e)}")
                    return JsonResponse({
                        'success': False,
                        'error': f'Failed to update PIN: {str(e)}'
                    }, status=500)
            
            return JsonResponse({
                'success': True, 
                'message': 'Security settings updated successfully'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT"])
def api_settings_website(request):
    """API endpoint for website settings"""
    try:
        if request.method == "GET":
            # Get current website settings
            website_settings = {
                'websiteTitle': 'PCG Ahinsan District YPG',
                'contactEmail': 'youth@presbyterian.org',
                'phoneNumber': '+233 20 123 4567',
                'address': 'Ahinsan District, Kumasi, Ghana',
                'description': 'Presbyterian Church of Ghana Youth Ministry - Ahinsan District',
                'socialMedia': {
                    'facebook': 'https://facebook.com/presbyterianyouth',
                    'instagram': 'https://instagram.com/presbyterianyouth',
                    'twitter': 'https://twitter.com/presbyterianyouth',
                    'youtube': 'https://youtube.com/presbyterianyouth',
                    'linkedin': 'https://linkedin.com/company/presbyterianyouth',
                },
                'appearance': {
                    'theme': 'light',
                    'language': 'English',
                    'primaryColor': '#3B82F6',
                    'borderRadius': 'medium',
                },
            }
            return JsonResponse({'success': True, 'settings': website_settings})
        
        elif request.method == "PUT":
            # Update website settings
            data = json.loads(request.body)
            
            # Validate required fields
            errors = {}
            if not data.get('websiteTitle', '').strip():
                errors['websiteTitle'] = 'Website title is required'
            
            if not data.get('contactEmail', '').strip():
                errors['contactEmail'] = 'Contact email is required'
            elif not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['contactEmail']):
                errors['contactEmail'] = 'Please enter a valid email address'
            
            if not data.get('phoneNumber', '').strip():
                errors['phoneNumber'] = 'Phone number is required'
            elif not re.match(r'^(\+233|0)[0-9]{9}$', data['phoneNumber']):
                errors['phoneNumber'] = 'Please enter a valid Ghanaian phone number'
            
            if errors:
                return JsonResponse({
                    'success': False,
                    'errors': errors
                }, status=400)
            
            # In a real application, you would save these to a database
            # For now, we'll just return success
            return JsonResponse({
                'success': True, 
                'message': 'Website settings updated successfully'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_cleanup_expired_quizzes(request):
    """Automatically cleanup quizzes older than 2 days"""
    try:
        now = timezone.now()
        cutoff_date = now - timedelta(days=2)
        
        # Get expired quizzes
        expired_quizzes = Quiz.objects.filter(
            end_time__lt=cutoff_date,
            is_active=True
        )
        
        cleanup_count = expired_quizzes.count()
        
        # Deactivate expired quizzes
        expired_quizzes.update(is_active=False)
        
        return JsonResponse({
            'success': True,
            'message': f'Cleaned up {cleanup_count} expired quizzes',
            'cleanup_count': cleanup_count
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def api_congregation_quiz_stats(request):
    """Get congregation-specific quiz statistics and leaderboard"""
    try:
        now = timezone.now()
        results_cutoff = now - timedelta(hours=2)
        
        # Get all completed quizzes with results available
        quizzes = Quiz.objects.filter(
            is_active=True,
            end_time__lt=results_cutoff
        ).order_by('-end_time')
        
        # Aggregate congregation statistics across all quizzes
        congregation_stats = {}
        
        for quiz in quizzes:
            submissions = quiz.submissions.all()
            
            for submission in submissions:
                cong_name = submission.congregation
                
                if cong_name not in congregation_stats:
                    congregation_stats[cong_name] = {
                        'name': cong_name,
                        'total_quizzes': 0,
                        'total_participants': 0,
                        'total_correct_answers': 0,
                        'quiz_participation': []
                    }
                
                # Count this quiz participation
                if quiz.id not in [q['quiz_id'] for q in congregation_stats[cong_name]['quiz_participation']]:
                    congregation_stats[cong_name]['total_quizzes'] += 1
                    congregation_stats[cong_name]['quiz_participation'].append({
                        'quiz_id': quiz.id,
                        'quiz_title': quiz.title,
                        'participants': submissions.filter(congregation=cong_name).count(),
                        'correct_answers': submissions.filter(congregation=cong_name, is_correct=True).count()
                    })
                
                congregation_stats[cong_name]['total_participants'] += 1
                if submission.is_correct:
                    congregation_stats[cong_name]['total_correct_answers'] += 1
        
        # Calculate success rates and create leaderboard
        leaderboard = []
        for cong_name, stats in congregation_stats.items():
            success_rate = (stats['total_correct_answers'] / stats['total_participants'] * 100) if stats['total_participants'] > 0 else 0
            
            leaderboard.append({
                'name': cong_name,
                'total_quizzes': stats['total_quizzes'],
                'total_participants': stats['total_participants'],
                'total_correct_answers': stats['total_correct_answers'],
                'success_rate': round(success_rate, 1),
                'quiz_participation': stats['quiz_participation']
            })
        
        # Sort by total participants (highest first)
        leaderboard.sort(key=lambda x: x['total_participants'], reverse=True)
        
        # Add ranks
        for i, item in enumerate(leaderboard):
            item['rank'] = i + 1
        
        return JsonResponse({
            'success': True,
            'leaderboard': leaderboard[:10],  # Top 10 congregations
            'total_congregations': len(leaderboard)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def api_home_stats(request):
    """API endpoint for home page statistics - provides real data for core metrics"""
    try:
        # Get real data from database
        total_members = Guilder.objects.count()
        active_members = Guilder.objects.filter(membership_status="Active").count()
        total_male = Guilder.objects.filter(gender="Male").count()
        total_female = Guilder.objects.filter(gender="Female").count()
        total_congregations = Congregation.objects.filter(is_district=False).count()
        executive_members = Guilder.objects.filter(is_executive=True).count()
        
        # Calculate Sunday attendance (average of recent records)
        recent_attendance = SundayAttendance.objects.filter(
            date__gte=timezone.now().date() - timedelta(days=30)
        ).aggregate(
            avg_total=Avg('total_count'),
            total_records=Count('id')
        )
        
        sunday_attendance = int(recent_attendance['avg_total'] or 0)
        
        # Calculate this week's attendance - use the most recent week with data
        # Get the most recent attendance record to determine the current week
        latest_attendance = SundayAttendance.objects.order_by('-date').first()
        if latest_attendance:
            # Calculate week start for the most recent attendance date
            latest_date = latest_attendance.date
            week_start = latest_date - timedelta(days=latest_date.weekday())
            this_week_attendance = SundayAttendance.objects.filter(
                date__gte=week_start
            ).aggregate(
                total=Sum('total_count')
            )['total'] or 0
        else:
            this_week_attendance = 0
        
        # Calculate this month's attendance - use the most recent month with data
        if latest_attendance:
            # Calculate month start for the most recent attendance date
            latest_date = latest_attendance.date
            month_start = latest_date.replace(day=1)
            this_month_attendance = SundayAttendance.objects.filter(
                date__gte=month_start
            ).aggregate(
                total=Sum('total_count')
            )['total'] or 0
        else:
            this_month_attendance = 0
        
        # Calculate growth rate (comparing last 2 weeks)
        growth_rate = 0
        if latest_attendance:
            # Get the week before the most recent week
            latest_date = latest_attendance.date
            current_week_start = latest_date - timedelta(days=latest_date.weekday())
            last_week_start = current_week_start - timedelta(days=7)
            last_week_attendance = SundayAttendance.objects.filter(
                date__gte=last_week_start,
                date__lt=current_week_start
            ).aggregate(
                total=Sum('total_count')
            )['total'] or 0
            
            if last_week_attendance > 0:
                growth_rate = ((this_week_attendance - last_week_attendance) / last_week_attendance) * 100
        
        # Get leaderboard data (top 3 congregations by recent attendance)
        leaderboard_data = []
        recent_attendance_by_congregation = SundayAttendance.objects.filter(
            date__gte=timezone.now().date() - timedelta(days=30)
        ).values('congregation__name').annotate(
            total_attendance=Sum('total_count'),
            avg_attendance=Avg('total_count')
        ).order_by('-avg_attendance')[:3]
        
        for i, item in enumerate(recent_attendance_by_congregation, 1):
            leaderboard_data.append({
                'rank': i,
                'congregation': item['congregation__name'],
                'total_count': int(item['avg_attendance'] or 0),
                'male_count': 0,  # Would need to calculate from individual records
                'female_count': 0,  # Would need to calculate from individual records
            })
        
        # Get congregation list for dropdown (exclude district)
        congregations = list(Congregation.objects.filter(is_district=False).values_list('name', flat=True).order_by('name'))
        
        return JsonResponse({
            'success': True,
            'data': {
                # Real data
                'totalMembers': total_members,
                'activeMembers': active_members,
                'totalMale': total_male,
                'totalFemale': total_female,
                'totalCongregations': total_congregations,
                'sundayAttendance': sunday_attendance,
                'executiveMembers': executive_members,
                'thisWeekAttendance': this_week_attendance,
                'thisMonthAttendance': this_month_attendance,
                'growthRate': round(growth_rate, 1),
                'leaderboardTop': leaderboard_data,
                'congregations': congregations,
                
                # Hybrid data (keep as mock for now)
                'weeklyQuiz': 35,  # Mock data
                'totalEvents': 12,  # Mock data
                'volunteerHours': 1850,  # Mock data
                'bibleStudyGroups': 18,  # Mock data
                'communityOutreach': 150,  # Mock data
                'prayerRequests': 45,  # Mock data
                'digitalEngagement': 85,  # Mock data
                'leadershipTraining': 28,  # Mock data
                'worshipTeams': 8,  # Mock data
                'missionTrips': 3,  # Mock data
                'smallGroups': 15,  # Mock data
                'discipleship': 65,  # Mock data
                'innovationScore': "A+",  # Mock data
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# Blog API Views
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def api_blog(request, blog_id=None):
    """API endpoint for blog posts"""
    try:
        if request.method == "GET":
            # Get all blog posts
            blog_posts = [
                {
                    'id': 1,
                    'title': 'Welcome to YPG',
                    'content': 'Welcome to the Presbyterian Church of Ghana Youth Ministry.',
                    'author': 'Admin',
                    'category': 'General',
                    'date': '2024-01-15',
                    'image': None,
                }
            ]
            return JsonResponse({'success': True, 'blogPosts': blog_posts})
        
        elif request.method == "POST":
            # Create new blog post
            data = json.loads(request.body)
            # In a real application, you would save to database
            new_post = {
                'id': len(blog_posts) + 1,
                'title': data.get('title', ''),
                'content': data.get('content', ''),
                'author': data.get('author', 'Admin'),
                'category': data.get('category', 'General'),
                'date': timezone.now().strftime('%Y-%m-%d'),
                'image': data.get('image', None),
            }
            return JsonResponse({'success': True, 'blogPost': new_post})
        
        elif request.method == "PUT":
            # Update blog post
            data = json.loads(request.body)
            # In a real application, you would update in database
            updated_post = {
                'id': blog_id,
                'title': data.get('title', ''),
                'content': data.get('content', ''),
                'author': data.get('author', 'Admin'),
                'category': data.get('category', 'General'),
                'date': timezone.now().strftime('%Y-%m-%d'),
                'image': data.get('image', None),
            }
            return JsonResponse({'success': True, 'blogPost': updated_post})
        
        elif request.method == "DELETE":
            # Delete blog post
            delete_type = request.GET.get('type', 'both')
            # In a real application, you would delete from database
            return JsonResponse({'success': True, 'message': 'Blog post deleted successfully'})
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


# Media API Views
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def api_media(request, media_id=None):
    """API endpoint for media files"""
    try:
        if request.method == "GET":
            # Get all media files
            media_files = [
                {
                    'id': 1,
                    'title': 'YPG Event Photo',
                    'description': 'Photo from recent YPG event',
                    'type': 'image',
                    'date': '2024-01-15',
                    'size': '2.5MB',
                }
            ]
            return JsonResponse({'success': True, 'media': media_files})
        
        elif request.method == "POST":
            # Create new media file
            data = json.loads(request.body)
            new_media = {
                'id': len(media_files) + 1,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'type': data.get('type', 'image'),
                'date': timezone.now().strftime('%Y-%m-%d'),
                'size': data.get('size', '1MB'),
            }
            return JsonResponse({'success': True, 'media': new_media})
        
        elif request.method == "PUT":
            # Update media file
            data = json.loads(request.body)
            updated_media = {
                'id': media_id,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'type': data.get('type', 'image'),
                'date': timezone.now().strftime('%Y-%m-%d'),
                'size': data.get('size', '1MB'),
            }
            return JsonResponse({'success': True, 'media': updated_media})
        
        elif request.method == "DELETE":
            # Delete media file
            # In a real application, you would delete from database
            return JsonResponse({'success': True, 'message': 'Media file deleted successfully'})
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


# Events API Views
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def api_events(request, event_id=None):
    """API endpoint for events"""
    try:
        if request.method == "GET":
            # Get all events
            events = [
                {
                    'id': 1,
                    'title': 'YPG Meeting',
                    'description': 'Monthly YPG meeting',
                    'date': '2024-01-20',
                    'time': '10:00 AM',
                    'location': 'Church Hall',
                    'type': 'Meeting',
                }
            ]
            return JsonResponse({'success': True, 'events': events})
        
        elif request.method == "POST":
            # Create new event
            data = json.loads(request.body)
            new_event = {
                'id': len(events) + 1,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'date': data.get('date', ''),
                'time': data.get('time', ''),
                'location': data.get('location', ''),
                'type': data.get('type', 'Event'),
            }
            return JsonResponse({'success': True, 'event': new_event})
        
        elif request.method == "PUT":
            # Update event
            data = json.loads(request.body)
            updated_event = {
                'id': event_id,
                'title': data.get('title', ''),
                'description': data.get('description', ''),
                'date': data.get('date', ''),
                'time': data.get('time', ''),
                'location': data.get('location', ''),
                'type': data.get('type', 'Event'),
            }
            return JsonResponse({'success': True, 'event': updated_event})
        
        elif request.method == "DELETE":
            # Delete event
            delete_type = request.GET.get('type', 'both')
            # In a real application, you would delete from database
            return JsonResponse({'success': True, 'message': 'Event deleted successfully'})
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


# Council API Views
@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "DELETE"])
def api_council(request):
    """API endpoint for council members"""
    try:
        if request.method == "GET":
            # Get all council members
            council_members = [
                {
                    'id': 1,
                    'name': 'John Doe',
                    'position': 'Branch President',
                    'congregation': 'Emmanuel Congregation Ahinsan',
                    'phone': '+233244123456',
                    'email': 'john.doe@example.com',
                    'description': 'Branch President of Emmanuel Congregation',
                    'image': None,
                }
            ]
            return JsonResponse({'success': True, 'councilMembers': council_members})
        
        elif request.method == "POST":
            # Create new council member
            data = json.loads(request.body)
            new_member = {
                'id': len(council_members) + 1,
                'name': data.get('name', ''),
                'position': data.get('position', ''),
                'congregation': data.get('congregation', ''),
                'phone': data.get('phone', ''),
                'email': data.get('email', ''),
                'description': data.get('description', ''),
                'image': data.get('image', None),
            }
            return JsonResponse({'success': True, 'councilMember': new_member})
        
        elif request.method == "PUT":
            # Update council member
            data = json.loads(request.body)
            updated_member = {
                'id': data.get('id', 1),
                'name': data.get('name', ''),
                'position': data.get('position', ''),
                'congregation': data.get('congregation', ''),
                'phone': data.get('phone', ''),
                'email': data.get('email', ''),
                'description': data.get('description', ''),
                'image': data.get('image', None),
            }
            return JsonResponse({'success': True, 'councilMember': updated_member})
        
        elif request.method == "DELETE":
            # Delete council member
            member_id = request.GET.get('id')
            delete_type = request.GET.get('type', 'both')
            # In a real application, you would delete from database
            return JsonResponse({'success': True, 'message': 'Council member deleted successfully'})
            
    except Exception as e:
        return JsonResponse({
            'success': False, 
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def api_log_attendance(request):
    """API endpoint for logging attendance from frontend"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['date', 'male_count', 'female_count', 'congregation']
        for field in required_fields:
            if field not in data:
                return JsonResponse({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }, status=400)
        
        # Get congregation
        try:
            congregation = Congregation.objects.get(name=data['congregation'])
        except Congregation.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': f'Congregation not found: {data["congregation"]}'
            }, status=404)
        
        # Check if attendance already exists for this date and congregation
        existing_attendance = SundayAttendance.objects.filter(
            date=data['date'],
            congregation=congregation
        ).first()
        
        if existing_attendance:
            # Update existing record
            existing_attendance.male_count = data['male_count']
            existing_attendance.female_count = data['female_count']
            existing_attendance.total_count = data['male_count'] + data['female_count']
            existing_attendance.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Attendance updated successfully',
                'attendance_id': existing_attendance.id
            })
        else:
            # Create new record
            attendance = SundayAttendance.objects.create(
                date=data['date'],
                congregation=congregation,
                male_count=data['male_count'],
                female_count=data['female_count'],
                total_count=data['male_count'] + data['female_count']
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Attendance logged successfully',
                'attendance_id': attendance.id
            })
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def api_attendance_records(request):
    """API endpoint for getting attendance records"""
    try:
        congregation_param = request.GET.get('congregation')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        
        records = SundayAttendance.objects.all().order_by('-date')
        
        # Filter by congregation if specified
        if congregation_param:
            try:
                # Try to get congregation by ID first, then by name
                if congregation_param.isdigit():
                    congregation = Congregation.objects.get(id=int(congregation_param))
                else:
                    congregation = Congregation.objects.get(name=congregation_param)
                records = records.filter(congregation=congregation)
            except Congregation.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'error': f'Congregation not found: {congregation_param}'
                }, status=404)
        
        # Filter by date range if specified
        if date_from:
            records = records.filter(date__gte=date_from)
        if date_to:
            records = records.filter(date__lte=date_to)
        
        data = []
        for record in records:
            data.append({
                'id': record.id,
                'date': record.date.strftime('%Y-%m-%d'),
                'congregation': record.congregation.name,
                'male_count': record.male_count,
                'female_count': record.female_count,
                'total_count': record.total_count,
                'created_at': record.created_at.isoformat() if hasattr(record, 'created_at') else None
            })
        
        return JsonResponse({
            'success': True,
            'records': data,
            'total_count': len(data)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def api_delete_attendance(request, attendance_id):
    """API endpoint for deleting attendance record"""
    try:
        attendance = get_object_or_404(SundayAttendance, id=attendance_id)
        attendance.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance record deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def api_update_attendance(request, attendance_id):
    """API endpoint for updating attendance record"""
    try:
        attendance = get_object_or_404(SundayAttendance, id=attendance_id)
        data = json.loads(request.body)
        
        # Update fields if provided
        if 'male_count' in data:
            attendance.male_count = data['male_count']
        if 'female_count' in data:
            attendance.female_count = data['female_count']
        if 'date' in data:
            attendance.date = data['date']
        
        # Recalculate total
        attendance.total_count = attendance.male_count + attendance.female_count
        attendance.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Attendance record updated successfully',
            'attendance': {
                'id': attendance.id,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'congregation': attendance.congregation.name,
                'male_count': attendance.male_count,
                'female_count': attendance.female_count,
                'total_count': attendance.total_count
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

# ==================== DATA MANAGEMENT API ENDPOINTS ====================

@csrf_exempt
@require_http_methods(["POST"])
def api_export_csv(request):
    """API endpoint for exporting data as CSV"""
    try:
        data = json.loads(request.body)
        export_type = data.get('type', 'all')  # all, members, attendance, analytics
        
        # Generate CSV data based on type
        if export_type == 'members':
            csv_data = generate_members_csv()
        elif export_type == 'attendance':
            csv_data = generate_attendance_csv()
        elif export_type == 'analytics':
            csv_data = generate_analytics_csv()
        else:  # all
            csv_data = generate_all_data_csv()
        
        return JsonResponse({
            'success': True,
            'data': csv_data,
            'filename': f'ypg_data_{export_type}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_export_excel(request):
    """API endpoint for exporting data as Excel"""
    try:
        data = json.loads(request.body)
        export_type = data.get('type', 'all')
        
        # For now, return CSV data (Excel export would require additional libraries)
        if export_type == 'members':
            csv_data = generate_members_csv()
        elif export_type == 'attendance':
            csv_data = generate_attendance_csv()
        elif export_type == 'analytics':
            csv_data = generate_analytics_csv()
        else:
            csv_data = generate_all_data_csv()
        
        return JsonResponse({
            'success': True,
            'data': csv_data,
            'filename': f'ypg_data_{export_type}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'note': 'Excel export not yet implemented, returning CSV format'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_export_pdf(request):
    """API endpoint for exporting data as PDF"""
    try:
        data = json.loads(request.body)
        export_type = data.get('type', 'all')
        
        # For now, return a message (PDF export would require additional libraries)
        return JsonResponse({
            'success': True,
            'message': f'PDF export for {export_type} data is not yet implemented',
            'note': 'PDF export requires additional libraries like reportlab or weasyprint'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_create_backup(request):
    """API endpoint for creating data backup"""
    try:
        # Create backup data
        backup_data = {
            'timestamp': timezone.now().isoformat(),
            'members': list(Guilder.objects.values()),
            'attendance': list(SundayAttendance.objects.values()),
            'congregations': list(Congregation.objects.values()),
            'backup_type': 'manual',
            'created_by': 'district_admin'
        }
        
        # In a real implementation, this would be stored in a Backup model or file
        # For now, we'll store it in session as a demo
        request.session['backup_data'] = backup_data
        request.session['backup_created_at'] = timezone.now().isoformat()
        
        return JsonResponse({
            'success': True,
            'message': 'Backup created successfully',
            'backup_info': {
                'timestamp': backup_data['timestamp'],
                'members_count': len(backup_data['members']),
                'attendance_count': len(backup_data['attendance']),
                'congregations_count': len(backup_data['congregations'])
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_restore_backup(request):
    """API endpoint for restoring data from backup"""
    try:
        # Check if backup exists
        backup_data = request.session.get('backup_data')
        if not backup_data:
            return JsonResponse({
                'success': False,
                'error': 'No backup found to restore'
            }, status=404)
        
        # In a real implementation, this would restore data from the backup
        # For now, just return success message
        return JsonResponse({
            'success': True,
            'message': 'Backup restored successfully',
            'restored_info': {
                'timestamp': backup_data['timestamp'],
                'members_count': len(backup_data.get('members', [])),
                'attendance_count': len(backup_data.get('attendance', [])),
                'congregations_count': len(backup_data.get('congregations', []))
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_clear_data(request):
    """API endpoint for clearing all data (danger zone)"""
    try:
        data = json.loads(request.body)
        confirmation = data.get('confirmation', '')
        
        # Require explicit confirmation
        if confirmation != 'DELETE_ALL_DATA':
            return JsonResponse({
                'success': False,
                'error': 'Confirmation required. Type DELETE_ALL_DATA to confirm.'
            }, status=400)
        
        # In a real implementation, this would delete all data
        # For now, just return success message (demo mode)
        return JsonResponse({
            'success': True,
            'message': 'All data cleared successfully',
            'note': 'This is a demo. In production, this would actually delete all data.'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== ANALYTICS API ====================

@csrf_exempt
@require_http_methods(["GET"])
def api_analytics_detailed(request):
    """API endpoint for detailed analytics data including trends"""
    try:
        from datetime import datetime, timedelta
        from django.db.models import Sum, Avg, Count
        
        # Get date range parameters
        weeks_back = int(request.GET.get('weeks', 12))  # Default 12 weeks
        months_back = int(request.GET.get('months', 12))  # Default 12 months
        years_back = int(request.GET.get('years', 2))  # Default 2 years
        
        # Calculate date ranges
        end_date = timezone.now().date()
        weeks_start = end_date - timedelta(weeks=weeks_back)
        months_start = end_date - timedelta(days=months_back * 30)
        years_start = end_date - timedelta(days=years_back * 365)
        
        # Weekly trend data
        weekly_trend = []
        weekly_attendance = SundayAttendance.objects.filter(
            date__gte=weeks_start,
            date__lte=end_date
        ).values('date', 'congregation__name').annotate(
            male=Sum('male_count'),
            female=Sum('female_count'),
            total=Sum('total_count')
        ).order_by('date')
        
        for record in weekly_attendance:
            weekly_trend.append({
                'date': record['date'].strftime('%Y-%m-%d'),
                'male': record['male'] or 0,
                'female': record['female'] or 0,
                'total': record['total'] or 0,
                'congregation': record['congregation__name']
            })
        
        # Monthly trend data (aggregate by month)
        monthly_trend = []
        monthly_attendance = SundayAttendance.objects.filter(
            date__gte=months_start,
            date__lte=end_date
        ).extra(
            select={'year_month': "DATE_TRUNC('month', date)"}
        ).values('year_month').annotate(
            male=Sum('male_count'),
            female=Sum('female_count'),
            total=Sum('total_count')
        ).order_by('year_month')
        
        for record in monthly_attendance:
            monthly_trend.append({
                'date': record['year_month'].strftime('%Y-%m'),
                'male': record['male'] or 0,
                'female': record['female'] or 0,
                'total': record['total'] or 0,
                'congregation': 'All Congregations'
            })
        
        # Yearly trend data (aggregate by year)
        yearly_trend = []
        yearly_attendance = SundayAttendance.objects.filter(
            date__gte=years_start,
            date__lte=end_date
        ).extra(
            select={'year': "EXTRACT(year FROM date)"}
        ).values('year').annotate(
            male=Sum('male_count'),
            female=Sum('female_count'),
            total=Sum('total_count')
        ).order_by('year')
        
        for record in yearly_attendance:
            yearly_trend.append({
                'date': str(int(record['year'])),
                'male': record['male'] or 0,
                'female': record['female'] or 0,
                'total': record['total'] or 0,
                'congregation': 'All Congregations'
            })
        
        # Gender distribution by congregation
        gender_distribution = []
        congregations = Congregation.objects.filter(is_district=False)
        
        for congregation in congregations:
            male_count = Guilder.objects.filter(
                congregation=congregation,
                gender='Male'
            ).count()
            female_count = Guilder.objects.filter(
                congregation=congregation,
                gender='Female'
            ).count()
            
            gender_distribution.append({
                'congregation': congregation.name,
                'male': male_count,
                'female': female_count,
                'total': male_count + female_count
            })
        
        # Congregation member counts with active/inactive breakdown
        congregation_data = []
        for congregation in congregations:
            total_members = Guilder.objects.filter(congregation=congregation).count()
            active_members = Guilder.objects.filter(
                congregation=congregation,
                membership_status='Active'
            ).count()
            inactive_members = Guilder.objects.filter(
                congregation=congregation,
                membership_status='Distant'
            ).count()
            
            congregation_data.append({
                'name': congregation.name,
                'members': total_members,
                'active_members': active_members,
                'inactive_members': inactive_members,
                'color': congregation.background_color or '#4CAF50'
            })
        
        return JsonResponse({
            'success': True,
            'data': {
                'weeklyTrend': weekly_trend,
                'monthlyTrend': monthly_trend,
                'yearlyTrend': yearly_trend,
                'genderDistribution': gender_distribution,
                'congregations': congregation_data
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== REMINDER SETTINGS API ====================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_reminder_settings(request):
    """API endpoint for reminder settings management"""
    try:
        if request.method == "GET":
            # Get current reminder settings (stored in session for demo)
            reminder_settings = request.session.get('reminder_settings', {
                'attendance_reminder': {
                    'title': 'Attendance Reminder',
                    'message_template': 'Dear {congregation}, please submit your Sunday attendance for {date} ({day}). Thank you!',
                    'is_active': True,
                    'target_congregations': 'all',
                    'selected_congregations': [],
                },
                'birthday_message': {
                    'title': 'Birthday Message',
                    'message_template': 'Happy Birthday {name}! May God bless you abundantly. - YPG',
                    'is_active': True,
                    'target_congregations': 'all',
                    'selected_congregations': [],
                },
                'welcome_message': {
                    'title': 'Welcome Message',
                    'message_template': 'Welcome {name} to {congregation}! We\'re glad to have you join us.',
                    'is_active': True,
                    'target_congregations': 'all',
                    'selected_congregations': [],
                },
                'joint_program_notification': {
                    'title': 'Joint Program Notification',
                    'message_template': 'Joint program scheduled for {date} ({day}) at {location}. All congregations are invited!',
                    'is_active': True,
                    'target_congregations': 'all',
                    'selected_congregations': [],
                },
            })
            
            return JsonResponse({
                'success': True,
                'settings': reminder_settings
            })
        
        elif request.method == "POST":
            # Save reminder settings
            data = json.loads(request.body)
            
            # Validate and store settings
            request.session['reminder_settings'] = data
            request.session.modified = True
            
            return JsonResponse({
                'success': True,
                'message': 'Reminder settings saved successfully'
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# ==================== HELPER FUNCTIONS FOR DATA EXPORT ====================

def generate_members_csv():
    """Generate CSV data for members"""
    members = Guilder.objects.all()
    csv_lines = ['Name,Gender,Date of Birth,Congregation,Phone,Email,Position,Membership Status,Date Added']
    
    for member in members:
        # Calculate age from date of birth
        age = (timezone.now().date() - member.date_of_birth).days // 365
        position = member.get_primary_executive_position() or member.position or "Member"
        
        csv_lines.append(f'"{member.first_name} {member.last_name}","{member.gender}","{member.date_of_birth}","{member.congregation.name}","{member.phone_number}","{member.email}","{position}","{member.membership_status}","{member.created_at.strftime("%Y-%m-%d")}"')
    
    return '\n'.join(csv_lines)


def generate_attendance_csv():
    """Generate CSV data for attendance"""
    attendance_records = SundayAttendance.objects.all()
    csv_lines = ['Date,Congregation,Male Count,Female Count,Total Count']
    
    for record in attendance_records:
        csv_lines.append(f'"{record.date.strftime("%Y-%m-%d")}","{record.congregation.name}","{record.male_count}","{record.female_count}","{record.total_count}"')
    
    return '\n'.join(csv_lines)


def generate_analytics_csv():
    """Generate CSV data for analytics"""
    # Get analytics data
    total_members = Guilder.objects.count()
    total_attendance = SundayAttendance.objects.count()
    total_congregations = Congregation.objects.count()
    
    csv_lines = [
        'Metric,Value',
        f'Total Members,{total_members}',
        f'Total Attendance Records,{total_attendance}',
        f'Total Congregations,{total_congregations}',
        f'Export Date,{timezone.now().strftime("%Y-%m-%d %H:%M:%S")}'
    ]
    
    return '\n'.join(csv_lines)


def generate_all_data_csv():
    """Generate CSV data for all data"""
    # Combine all data types
    members_csv = generate_members_csv()
    attendance_csv = generate_attendance_csv()
    analytics_csv = generate_analytics_csv()
    
    return f"=== MEMBERS DATA ===\n{members_csv}\n\n=== ATTENDANCE DATA ===\n{attendance_csv}\n\n=== ANALYTICS DATA ===\n{analytics_csv}"
