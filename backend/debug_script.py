
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crosscert.settings')
django.setup()

from django.contrib.auth import get_user_model
from events.models import Certificate, EventRegistration, Event

User = get_user_model()
target_email = 'catherine.arnado@hcdc.edu.ph'

print(f"\n=== DEBUG REPORT for {target_email} ===\n")

# 1. Check User
try:
    user = User.objects.get(email__iexact=target_email)
    print(f"[OK] User found: ID={user.id}, email='{user.email}'")
except User.DoesNotExist:
    print(f"[FAIL] User NOT found with email '{target_email}'")
    print("Available users:")
    for u in User.objects.all():
        print(f" - {u.email}")

# 2. Check Registrations
regs = EventRegistration.objects.filter(email__iexact=target_email)
print(f"\nFound {regs.count()} registrations for '{target_email}':")
for r in regs:
    print(f" - Reg ID: {r.id}, Event: '{r.event.title}', Email: '{r.email}', Present: {r.is_present}")
    
    # Check for linked certificate
    if hasattr(r, 'certificate'):
        c = r.certificate
        print(f"   -> HAS CERTIFICATE! Cert ID: {c.id}, Issued: {c.issued_at}")
    else:
         print(f"   -> NO CERTIFICATE LINKED.")

# 3. Check Certificates directly by filtering
certs_direct = Certificate.objects.filter(registration__email__iexact=target_email)
print(f"\nDirect Certificate Query (filter by email): Found {certs_direct.count()}")
for c in certs_direct:
    print(f" - Cert ID: {c.id}, Reg Email: '{c.registration.email}'")

print("\n=== END REPORT ===")
