"""Unit tests for _safe_parse_diagnosis() in llm_service.py.

Tests cover all parsing scenarios: pure JSON, fenced JSON, text with JSON,
nested objects, malformed input, and empty responses.
"""

import pytest

from app.services.llm_service import _safe_parse_diagnosis, GeminiDiagnosisResult


class TestSafeParseDiagnosis:
    """Test suite for _safe_parse_diagnosis() function."""

    def test_pure_json(self):
        """Test parsing pure JSON without any formatting."""
        raw = '{"status": "diagnosed", "disease_id": "d1", "disease_name": "Leaf Blight", "confidence": 0.85, "severity": "high", "symptoms": ["brown spots"], "treatment_steps": ["apply fungicide"], "prevention": ["crop rotation"], "care_tips": ["monitor daily"]}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_id == "d1"
        assert result.disease_name == "Leaf Blight"
        assert result.confidence == 0.85
        assert result.severity == "high"
        assert result.symptoms == ["brown spots"]
        assert result.treatment_steps == ["apply fungicide"]
        assert result.prevention == ["crop rotation"]
        assert result.care_tips == ["monitor daily"]

    def test_json_fenced_with_json_tag(self):
        """Test parsing JSON wrapped in ```json ... ``` fences."""
        raw = '```json\n{"status": "healthy", "disease_id": null, "disease_name": null, "confidence": 0.95, "severity": null, "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": ["keep watering"]}\n```'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "healthy"
        assert result.disease_id is None
        assert result.disease_name is None
        assert result.confidence == 0.95
        assert result.severity is None
        assert result.care_tips == ["keep watering"]

    def test_json_fenced_without_language_tag(self):
        """Test parsing JSON wrapped in ``` ... ``` fences (no language tag)."""
        raw = '```\n{"status": "uncertain", "disease_id": null, "disease_name": null, "confidence": 0.2, "severity": null, "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": ["take clearer photo"]}\n```'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"
        assert result.confidence == 0.2
        assert result.care_tips == ["take clearer photo"]

    def test_explanatory_text_before_json(self):
        """Test parsing JSON with explanatory text before the JSON block."""
        raw = 'Here is the diagnosis based on the image you provided:\n\n{"status": "diagnosed", "disease_id": "d2", "disease_name": "Powdery Mildew", "confidence": 0.78, "severity": "moderate", "symptoms": ["white powder on leaves"], "treatment_steps": ["remove affected leaves", "apply sulfur spray"], "prevention": ["improve air circulation"], "care_tips": ["check neighboring plants"]}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == "Powdery Mildew"
        assert result.confidence == 0.78
        assert result.severity == "moderate"
        assert len(result.symptoms) == 1
        assert len(result.treatment_steps) == 2

    def test_explanatory_text_after_json(self):
        """Test parsing JSON with explanatory text after the JSON block."""
        raw = '{"status": "diagnosed", "disease_id": "d3", "disease_name": "Rust", "confidence": 0.82, "severity": "high", "symptoms": ["orange pustules"], "treatment_steps": ["apply fungicide"], "prevention": ["avoid overhead watering"], "care_tips": ["remove infected debris"]}\n\nThis diagnosis is based on visible symptoms. Please consult a local agronomist for confirmation.'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == "Rust"
        assert result.confidence == 0.82
        assert result.severity == "high"

    def test_explanatory_text_before_and_after_json(self):
        """Test parsing JSON with text both before and after."""
        raw = 'Based on the leaf image analysis, here is the diagnosis:\n\n{"status": "diagnosed", "disease_id": "d4", "disease_name": "Bacterial Leaf Blight", "confidence": 0.75, "severity": "moderate", "symptoms": ["water-soaked lesions"], "treatment_steps": ["apply copper-based bactericide"], "prevention": ["use certified seeds"], "care_tips": ["monitor spread"]}\n\nNote: Early detection is key to managing this disease.'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == "Bacterial Leaf Blight"
        assert result.confidence == 0.75

    def test_nested_json_objects(self):
        """Test parsing JSON with nested objects and arrays."""
        raw = '{"status": "diagnosed", "disease_id": "d5", "disease_name": "Mosaic Virus", "confidence": 0.88, "severity": "high", "symptoms": ["mottled leaves", "stunted growth"], "treatment_steps": ["remove infected plants", "disinfect tools"], "prevention": ["control aphid vectors", "use resistant varieties"], "care_tips": ["inspect new transplants", "rotate crops"]}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == "Mosaic Virus"
        assert len(result.symptoms) == 2
        assert len(result.treatment_steps) == 2
        assert len(result.prevention) == 2
        assert len(result.care_tips) == 2

    def test_malformed_json_returns_uncertain(self):
        """Test that malformed JSON returns uncertain fallback."""
        raw = '{"status": "diagnosed", "disease_name": "Test", "confidence": 0.5'  # Missing closing brace
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"
        assert result.confidence == 0.0
        assert "Could not parse" in result.care_tips[0]

    def test_empty_response_returns_uncertain(self):
        """Test that empty response returns uncertain fallback."""
        raw = ""
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"
        assert result.confidence == 0.0
        assert "Could not parse" in result.care_tips[0]

    def test_whitespace_only_returns_uncertain(self):
        """Test that whitespace-only response returns uncertain fallback."""
        raw = "   \n\t  "
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"
        assert result.confidence == 0.0
        assert "Could not parse" in result.care_tips[0]

    def test_no_json_object_returns_uncertain(self):
        """Test that text with no JSON object returns uncertain fallback."""
        raw = "This is just plain text with no JSON structure at all."
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"
        assert result.confidence == 0.0
        assert "Could not parse" in result.care_tips[0]

    def test_fenced_json_with_preamble(self):
        """Test parsing fenced JSON with explanatory text before the fence."""
        raw = 'I have analyzed the leaf image. Here are my findings:\n\n```json\n{"status": "diagnosed", "disease_id": "d6", "disease_name": "Downy Mildew", "confidence": 0.79, "severity": "moderate", "symptoms": ["yellow patches on upper leaves", "fuzzy growth underneath"], "treatment_steps": ["apply copper spray"], "prevention": ["ensure good drainage"], "care_tips": ["avoid wetting foliage"]}\n```\n\nPlease take action promptly.'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == "Downy Mildew"
        assert result.confidence == 0.79

    def test_invalid_status_defaults_to_uncertain(self):
        """Test that invalid status value defaults to uncertain."""
        raw = '{"status": "invalid_status", "disease_id": null, "disease_name": null, "confidence": 0.5, "severity": null, "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "uncertain"

    def test_invalid_confidence_defaults_to_zero(self):
        """Test that non-numeric confidence defaults to 0.0."""
        raw = '{"status": "diagnosed", "disease_id": "d7", "disease_name": "Test Disease", "confidence": "not_a_number", "severity": "low", "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.confidence == 0.0

    def test_confidence_clamped_to_valid_range(self):
        """Test that confidence is clamped to [0.0, 1.0]."""
        raw_high = '{"status": "diagnosed", "disease_id": "d8", "disease_name": "Test", "confidence": 1.5, "severity": null, "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result_high = _safe_parse_diagnosis(raw_high)
        assert result_high.confidence == 1.0

        raw_low = '{"status": "diagnosed", "disease_id": "d9", "disease_name": "Test", "confidence": -0.5, "severity": null, "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result_low = _safe_parse_diagnosis(raw_low)
        assert result_low.confidence == 0.0

    def test_invalid_severity_defaults_to_none(self):
        """Test that invalid severity defaults to None."""
        raw = '{"status": "diagnosed", "disease_id": "d10", "disease_name": "Test", "confidence": 0.7, "severity": "extreme", "symptoms": [], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result = _safe_parse_diagnosis(raw)

        assert result.severity is None

    def test_missing_fields_use_defaults(self):
        """Test that missing fields use default values."""
        raw = '{"status": "healthy"}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "healthy"
        assert result.disease_id is None
        assert result.disease_name is None
        assert result.confidence == 0.0  # Missing confidence defaults to 0.0
        assert result.severity is None
        assert result.symptoms == []
        assert result.treatment_steps == []
        assert result.prevention == []
        assert result.care_tips == []

    def test_json_with_escaped_characters(self):
        """Test parsing JSON with escaped characters in strings."""
        raw = r'{"status": "diagnosed", "disease_id": "d11", "disease_name": "Test \"Quoted\" Disease", "confidence": 0.65, "severity": "low", "symptoms": ["spots with \"quotes\"", "lines\nwith\nnewlines"], "treatment_steps": [], "prevention": [], "care_tips": []}'
        result = _safe_parse_diagnosis(raw)

        assert result.status == "diagnosed"
        assert result.disease_name == 'Test "Quoted" Disease'
        assert len(result.symptoms) == 2
