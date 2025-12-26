import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crosscert.settings')
django.setup()

from crosscert.email_utils import (
    send_registration_confirmation,
    send_attendance_confirmation,
    send_post_event_evaluation_email,
    send_certificate_ready_email,
    send_event_created_notification
)

def send_test_emails(recipient_email):
    print(f"Sending test emails to: {recipient_email}...")
    
    # 1. Registration Confirmation
    print("- Sending Registration Confirmation...")
    send_registration_confirmation(
        participant_name="Test Participant",
        event_title="HCDC Innovation Summit 2025",
        event_date="December 27, 2025",
        event_time="09:00 AM - 05:00 PM",
        venue="HCDC Gymnasium",
        to_email=recipient_email
    )
    
    # 2. Attendance Confirmation
    print("- Sending Attendance Confirmation...")
    send_attendance_confirmation(
        participant_name="Test Participant",
        event_title="HCDC Innovation Summit 2025",
        event_date="December 27, 2025",
        venue="HCDC Gymnasium",
        to_email=recipient_email
    )
    
    # 3. Evaluation Notification
    print("- Sending Evaluation Email...")
    send_post_event_evaluation_email(
        participant_name="Test Participant",
        event_title="HCDC Innovation Summit 2025",
        evaluation_url="http://localhost:3000/evaluate/123", # Note: Link removed in HTML, but kept in text/logic for compatibility
        to_email=recipient_email
    )
    
    # 4. Certificate Ready
    print("- Sending Certificate Ready Email (with attachment)...")
    mock_cert_path = os.path.join(os.path.dirname(__file__), "mock_certificate.pdf")
    send_certificate_ready_email(
        participant_name="Test Participant",
        event_title="HCDC Innovation Summit 2025",
        certificate_file_path=mock_cert_path,
        to_email=recipient_email
    )
    
    # 5. Event Created Notification
    print("- Sending Event Created Notification...")
    send_event_created_notification(
        event_title="Faculty Development Workshop",
        event_date="January 15, 2026",
        organizer_email=recipient_email
    )
    
    print("\n✅ All test emails sent successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python send_test_email.py <recipient_email>")
        sys.exit(1)
    
    recipient = sys.argv[1]
    send_test_emails(recipient)
