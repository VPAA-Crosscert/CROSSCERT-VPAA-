from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from email.mime.image import MIMEImage
import os
from typing import Optional, Dict


SENDER_EMAIL = getattr(settings, "DEFAULT_FROM_EMAIL", "crosscert.dvo@gmail.com")
LOGO_PATH = os.path.join(settings.BASE_DIR, '..', 'public', 'crosscert-typo-black.png')

# Deep Dark Red Premium Palette
PRIMARY_RED = "#7f1d1d"  # Deep Dark Red
ACCENT_RED = "#991b1b"   # Mid Dark Red
DEEP_RED = "#450a0a"     # Deepest Dark Red
LIGHT_BG = "#fef2f2"     # Very Light Rose BG

# Premium HTML Email Wrapper
def _get_html_wrapper(title: str, content: str, preheader: str = "") -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>{title}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            body {{
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #111827;
                margin: 0;
                padding: 0;
                background-color: #f3f4f6;
                -webkit-font-smoothing: antialiased;
            }}
            .preheader {{
                display: none;
                max-height: 0px;
                overflow: hidden;
                mso-hide: all;
            }}
            .wrapper {{
                width: 100%;
                table-layout: fixed;
                background-color: #f3f4f6;
                padding: 48px 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.12);
                border: 1px solid #e5e7eb;
            }}
            .header {{
                background: linear-gradient(135deg, {DEEP_RED} 0%, {PRIMARY_RED} 100%);
                padding: 72px 48px;
                text-align: center;
                color: #ffffff;
                position: relative;
            }}
            .header::after {{
                content: "";
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
                background-size: 24px 24px;
            }}
            .header h1 {{
                margin: 0;
                font-size: 34px;
                font-weight: 800;
                letter-spacing: -0.06em;
                text-transform: uppercase;
                text-shadow: 0 4px 12px rgba(0,0,0,0.2);
                position: relative;
                z-index: 1;
            }}
            .content {{
                padding: 72px 56px;
            }}
            .content p {{
                margin-bottom: 32px;
                font-size: 18px;
                color: #374151;
                line-height: 1.85;
                font-weight: 400;
            }}
            .details {{
                background-color: {LIGHT_BG};
                border: 2px solid #fee2e2;
                border-radius: 24px;
                padding: 40px;
                margin: 48px 0;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }}
            .details-title {{
                font-size: 12px;
                font-weight: 800;
                color: {PRIMARY_RED};
                text-transform: uppercase;
                letter-spacing: 0.2em;
                margin-bottom: 28px;
                display: block;
            }}
            .detail-item {{
                margin: 20px 0;
                display: flex;
                align-items: flex-start;
                border-bottom: 1px solid #fecaca;
                padding-bottom: 16px;
            }}
            .detail-item:last-child {{
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }}
            .detail-label {{
                font-weight: 700;
                color: #6b7280;
                width: 140px;
                font-size: 14px;
                flex-shrink: 0;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}
            .detail-value {{
                color: #111827;
                font-size: 17px;
                font-weight: 700;
                word-break: break-word;
            }}
            .footer {{
                padding: 64px 48px;
                text-align: center;
                background-color: #ffffff;
                border-top: 1px solid #f3f4f6;
            }}
            .footer-logo {{
                margin-bottom: 40px;
            }}
            .footer-logo img {{
                max-width: 200px;
                height: auto;
                filter: contrast(1.1);
            }}
            .social-links {{
                margin: 32px 0;
            }}
            .social-links a {{
                display: inline-block;
                margin: 0 16px;
                color: #9ca3af;
                text-decoration: none;
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                transition: color 0.3s;
            }}
            .social-links a:hover {{
                color: {PRIMARY_RED};
            }}
            .footer p {{
                font-size: 13px;
                color: #9ca3af;
                margin: 8px 0;
                line-height: 1.6;
                font-weight: 500;
            }}
            .btn {{
                display: inline-block;
                padding: 20px 48px;
                background: linear-gradient(to bottom, {ACCENT_RED}, {PRIMARY_RED});
                color: #ffffff !important;
                text-decoration: none !important;
                border-radius: 16px;
                font-weight: 800;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 16px 32px -8px rgba(127, 29, 29, 0.4);
                border: 1px solid {DEEP_RED};
            }}
            .support-card {{
                margin-top: 64px;
                padding: 32px;
                background-color: #f9fafb;
                border: 1px dashed #d1d5db;
                border-radius: 20px;
                text-align: center;
            }}
            .support-card p {{
                font-size: 14px;
                color: #6b7280;
                margin: 0;
            }}
            .support-card a {{
                color: {PRIMARY_RED};
                font-weight: 700;
                text-decoration: none;
                border-bottom: 2px solid #fee2e2;
            }}
            @media screen and (max-width: 600px) {{
                .container {{
                    margin: 0;
                    border-radius: 0;
                    border: none;
                }}
                .header, .content, .footer {{
                    padding: 48px 24px;
                }}
                .detail-label {{
                    width: 100px;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <!--[if !mso]><!-->
            <span class="preheader" style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">{preheader}</span>
            <!--<![endif]-->
            <div class="container">
                <div class="header">
                    <h1>{title}</h1>
                </div>
                <div class="content">
                    {content}
                    <div class="support-card">
                        <p>Need technical assistance? Our team is here to help. <br> <a href="mailto:crosscert.dvo@gmail.com">Contact Support</a> or visit the <a href="#">Help Center</a></p>
                    </div>
                </div>
                <div class="footer">
                    <div class="footer-logo">
                        <img src="cid:logo" alt="CROSSCERT">
                    </div>
                    <div class="social-links">
                        <a href="#">Official Website</a>
                        <a href="#">Facebook</a>
                        <a href="#">LinkedIn</a>
                        <a href="#">Instagram</a>
                    </div>
                    <p style="color: #6b7280; font-weight: 700;">Holy Cross of Davao College, Inc.</p>
                    <p>Office of the Vice President for Academic Affairs</p>
                    <p style="margin-top: 48px; font-size: 10px; font-weight: 700; color: #d1d5db; text-transform: uppercase; letter-spacing: 0.1em;">
                        &copy; 2025 CROSSCERT | Institutional Trust & Verification Platform
                    </p>
                    <p style="font-size: 10px; color: #e5e7eb;">Powered by HCDC-ICT Core Systems</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """


def _send(subject: str, body_text: str, html_content: str, to_email: str, attachments: Optional[list] = None) -> None:
    if not to_email:
        return
    
    email = EmailMultiAlternatives(
        subject=subject,
        body=body_text,
        from_email=SENDER_EMAIL,
        to=[to_email]
    )
    email.attach_alternative(html_content, "text/html")
    
    # Attach Logo as CID
    if os.path.exists(LOGO_PATH):
        try:
            with open(LOGO_PATH, 'rb') as f:
                logo_img = MIMEImage(f.read())
                logo_img.add_header('Content-ID', '<logo>')
                logo_img.add_header('Content-Disposition', 'inline', filename='logo.png')
                email.attach(logo_img)
        except Exception:
            pass
            
    # Add PDF Attachments
    if attachments:
        for attachment in attachments:
            if isinstance(attachment, str) and os.path.exists(attachment):
                email.attach_file(attachment)
            elif isinstance(attachment, tuple) and len(attachment) == 3:
                # (filename, content, mimetype)
                email.attach(*attachment)

    email.send(fail_silently=True)


def send_registration_confirmation(participant_name: str, event_title: str, event_date: str, event_time: str, venue: str, to_email: str) -> None:
    title = "Registration Confirmed"
    preheader = f"Successfully registered for {event_title}"
    content = f"""
        <p>Hi {participant_name},</p>
        <p>Your registration for <strong>{event_title}</strong> has been successfully confirmed. We are excited to have you join us!</p>
        <div class="details">
            <span class="details-title">Event Logistics</span>
            <div class="detail-item">
                <span class="detail-label">📅 Date</span>
                <span class="detail-value">{event_date}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">⏰ Time</span>
                <span class="detail-value">{event_time}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">📍 Venue</span>
                <span class="detail-value">{venue}</span>
            </div>
        </div>
        <p>Please ensure you have your digital ticket accessible on your mobile device for seamless entry at the venue.</p>
        <p>We look forward to seeing you there!</p>
    """
    body_text = f"Hi {participant_name},\n\nYour registration for {event_title} is confirmed.\nDate: {event_date}\nTime: {event_time}\nVenue: {venue}\n\nSee you there!"
    _send(f"Success: Registration for {event_title}", body_text, _get_html_wrapper(title, content, preheader), to_email)


def send_attendance_confirmation(participant_name: str, event_title: str, event_date: str, venue: str, to_email: str) -> None:
    title = "Attendance Verified"
    preheader = f"Your attendance for {event_title} has been confirmed"
    content = f"""
        <p>Hi {participant_name},</p>
        <p>This is to officially confirm your attendance for <strong>{event_title}</strong>. We hope you found the session valuable and insightful.</p>
        <div class="details" style="border-left: 8px solid #065f46; background-color: #f0fdf4; border-color: #065f46;">
            <span class="details-title" style="color: #065f46;">Verification Details</span>
            <div class="detail-item">
                <span class="detail-label">✅ Status</span>
                <span class="detail-value" style="color: #065f46;">Verified Present</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">📅 Date</span>
                <span class="detail-value">{event_date}</span>
            </div>
        </div>
        <p>Your participation has been recorded in our institutional records. You are now one step closer to receiving your official certificate.</p>
        <p>Thank you for being part of our academic community!</p>
    """
    body_text = f"Hi {participant_name},\n\nYour attendance for {event_title} has been verified.\n\nThank you for participating!"
    _send(f"Attendance Verified – {event_title}", body_text, _get_html_wrapper(title, content, preheader), to_email)


def send_post_event_evaluation_email(participant_name: str, event_title: str, evaluation_url: str, to_email: str) -> None:
    title = "Feedback Requested"
    preheader = f"Share your thoughts on {event_title} and claim your certificate"
    content = f"""
        <p>Hi {participant_name},</p>
        <p>Thank you for participating in <strong>{event_title}</strong>. We value your insights as we strive to enhance our future events and seminars.</p>
        <div class="details" style="border-left: 8px solid #92400e; background-color: #fffbeb; border-color: #92400e;">
            <span class="details-title" style="color: #92400e;">Action Required</span>
            <p style="color: #4b5563; font-size: 17px; margin-bottom: 36px; font-weight: 500;">
                Please complete the post-event evaluation to trigger the automatic generation of your Certificate of Participation.
            </p>
            <div style="text-align: center;">
                <a href="https://crosscert-vpaa.vercel.app/auth/signin" class="btn" style="background: linear-gradient(to bottom, #d97706, #92400e); box-shadow: 0 16px 32px -8px rgba(146, 64, 14, 0.35); border: 1px solid #78350f;">Start Evaluation</a>
            </div>
        </div>
        <p>Once submitted, your certificate will be immediately available in your portfolio and sent to your email.</p>
        <p>We appreciate your contribution!</p>
    """
    body_text = f"Hi {participant_name},\n\nPlease complete the evaluation for {event_title} to claim your certificate: https://crosscert-vpaa.vercel.app/auth/signin"
    _send(f"Action Required: Evaluate {event_title}", body_text, _get_html_wrapper(title, content, preheader), to_email)


def send_certificate_ready_email(participant_name: str, event_title: str, certificate_file_path: Optional[str], to_email: str) -> None:
    """Notify participant when their certificate is ready and attach the PDF."""
    title = "Certificate Issued"
    preheader = f"Congratulations! Your certificate for {event_title} is attached"
    content = f"""
        <p>Congratulations {participant_name}!</p>
        <p>We are pleased to inform you that your <strong>Certificate of Participation</strong> for <strong>{event_title}</strong> has been issued.</p>
        <div class="details" style="border-left: 8px solid {DEEP_RED}; background-color: {LIGHT_BG}; text-align: center; padding: 56px 40px; border-color: {PRIMARY_RED};">
            <span class="details-title" style="color: {PRIMARY_RED};">Official Academic Recognition</span>
            <p style="color: #374151; font-size: 17px; margin-bottom: 40px; font-weight: 600;">
                Your verified institutional certificate is attached to this email. You can also view and download all your past achievements in your CROSSCERT portfolio.
            </p>
            <a href="https://crosscert-vpaa.vercel.app/participant/certificates" class="btn">Access Portfolio</a>
        </div>
        <p>Thank you for your dedication to professional development and institutional growth. We look forward to seeing your future accomplishments!</p>
    """
    body_text = f"Congratulations {participant_name}!\n\nYour certificate for {event_title} is ready. It is attached to this email and also available in your portfolio: https://crosscert-vpaa.vercel.app/participant/certificates"
    
    attachments = []
    if certificate_file_path and os.path.exists(certificate_file_path):
        attachments.append(certificate_file_path)
    
    _send(f"Certificate Issued: {event_title}", body_text, _get_html_wrapper(title, content, preheader), to_email, attachments=attachments)


def send_event_created_notification(event_title: str, event_date: str, organizer_email: Optional[str]) -> None:
    """Notify organizer (or admin) when a new event is created."""
    if not organizer_email:
        return
    title = "New Event Created"
    content = f"""
        <p>Dear Organizer,</p>
        <p>Your event <strong>"{event_title}"</strong> has been successfully created in CROSSCERT for <strong>{event_date}</strong>.</p>
        <p>You can now manage participants, share registration QR codes, and track live attendance through the administrator dashboard.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="#" class="btn shadow-lg">Go to Dashboard</a>
        </div>
    """
    body_text = f"Dear Organizer,\n\nYour event '{event_title}' has been created for {event_date}.\n\nManage it from your dashboard."
    _send(f"New Event Created – {event_title}", body_text, _get_html_wrapper(title, content), organizer_email)


