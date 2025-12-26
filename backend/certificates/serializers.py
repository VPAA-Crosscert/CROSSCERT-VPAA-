"""
Serializers for Certificates app.
"""
from rest_framework import serializers
from .models import Certificate


class CertificateListSerializer(serializers.ModelSerializer):
    """Optimized serializer for certificate lists (excludes base64 to reduce network traffic)."""

    event_title = serializers.CharField(source='registration.event.title', read_only=True)
    event_id = serializers.IntegerField(source='registration.event.id', read_only=True)
    event_date = serializers.DateField(source='registration.event.date', read_only=True)
    participant_name = serializers.SerializerMethodField()
    participant_email = serializers.CharField(source='registration.email', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'certificate_number',
            'issue_date',
            'status',
            'event_id',
            'event_title',
            'event_date',
            'participant_name',
            'participant_email',
            'created_at',
        ]

    def get_participant_name(self, obj):
        return f"{obj.registration.first_name} {obj.registration.last_name}"


class CertificateDetailSerializer(serializers.ModelSerializer):
    """Full serializer including base64 PDF data for download."""

    event_title = serializers.CharField(source='registration.event.title', read_only=True)
    event_id = serializers.IntegerField(source='registration.event.id', read_only=True)
    event_date = serializers.DateField(source='registration.event.date', read_only=True)
    participant_name = serializers.SerializerMethodField()
    participant_email = serializers.CharField(source='registration.email', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'registration',
            'certificate_number',
            'issue_date',
            'status',
            'pdf_file',
            'pdf_base64',
            'event_id',
            'event_title',
            'event_date',
            'participant_name',
            'participant_email',
            'created_at',
        ]
        read_only_fields = ['pdf_file']

    def get_participant_name(self, obj):
        return f"{obj.registration.first_name} {obj.registration.last_name}"


# Keep the original for backward compatibility
class CertificateSerializer(CertificateDetailSerializer):
    """Alias for backward compatibility."""
    pass
