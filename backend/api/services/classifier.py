import logging
from typing import Optional

import google.generativeai as genai

from api.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

INCIDENT_TYPE_MAP = {
    "theft": "theft",
    "pickpocketing": "theft",
    "shoplifting": "theft",
    "robbery": "robbery",
    "snatching": "robbery",
    "mugging": "robbery",
    "harassment": "harassment",
    "eve teasing": "harassment",
    "catcalling": "harassment",
    "assault": "assault",
    "physical attack": "assault",
    "fighting": "assault",
    "suspicious": "suspicious_activity",
    "loitering": "suspicious_activity",
    "stalking": "suspicious_activity",
    "vandalism": "vandalism",
    "property damage": "vandalism",
    "graffiti": "vandalism",
}

CLASSIFICATION_PROMPT = """You are a crime incident classifier. Given a description of an incident, classify it into exactly one category.

Categories:
- theft: stealing items without force (pickpocketing, shoplifting, burglary)
- robbery: taking property by force or threat (snatching, mugging, armed robbery)
- harassment: unwanted verbal or physical conduct (eve teasing, catcalling, stalking)
- assault: physical attack causing bodily harm (fighting, beating, hitting)
- suspicious_activity: behavior that seems unusual or potentially criminal (loitering, surveillance)
- vandalism: intentional destruction of property (graffiti, breaking things)
- other: anything that doesn't fit the above

Return ONLY valid JSON with this exact structure:
{"label": "category_name", "confidence": 0.0-1.0, "reasoning": "one sentence explanation"}

Description: {description}"""


class ClassifierService:
    def __init__(self):
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(settings.gemini_model)

    def classify(self, description: str) -> dict:
        try:
            prompt = CLASSIFICATION_PROMPT.format(description=description[:2000])
            response = self.model.generate_content(prompt)

            raw_text = response.text.strip()
            raw_text = (
                raw_text.removeprefix("```json")
                .removeprefix("```")
                .removesuffix("```")
                .strip()
            )

            import json

            result = json.loads(raw_text)

            label = result.get("label", "other")
            confidence = max(0.0, min(1.0, float(result.get("confidence", 0.5))))

            mapped = INCIDENT_TYPE_MAP.get(label.lower(), "other")

            return {
                "label": label,
                "mapped_type": mapped,
                "confidence": confidence,
                "reasoning": result.get("reasoning", ""),
                "raw_response": response.text,
            }

        except Exception as e:
            logger.warning("Gemini classification failed: %s", e)
            return {
                "label": "unknown",
                "mapped_type": "other",
                "confidence": 0.0,
                "reasoning": "",
                "raw_response": "",
            }


_classifier_instance: Optional[ClassifierService] = None


def get_classifier() -> ClassifierService:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = ClassifierService()
    return _classifier_instance
