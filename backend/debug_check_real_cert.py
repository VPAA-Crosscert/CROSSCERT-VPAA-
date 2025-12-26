
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crosscert.settings')
django.setup()

from certificates.models import Certificate
from events.models import EventRegistration

email = 'catherine.arnado@hcdc.edu.ph'
print(f"DEBUG: Checking for {email} using certificates.models.Certificate")

reg_count = EventRegistration.objects.filter(email__iexact=email).count()
cert_count = Certificate.objects.filter(registration__email__iexact=email).count()

print(f"DEBUG: Registrations: {reg_count}")
print(f"DEBUG: Certificates (certificates.models): {cert_count}")

# Check all certs
all_certs = Certificate.objects.all().count()
print(f"DEBUG: Total Certificates (certificates.models): {all_certs}")
