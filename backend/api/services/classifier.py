import json
import logging
import time
from typing import Any

import google.generativeai as genai
from api.config import get_settings
from api.services.prompts import CLASSIFY_SYSTEM_INSTRUCTION, CLASSIFY_USER_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()

INCIDENT_TYPE_MAP: dict[str, str] = {
    "theft": "theft",
    "pickpocketing": "theft",
    "shoplifting": "theft",
    "robbery": "robbery",
    "snatching": "robbery",
    "mugging": "robbery",
    "harassment": "harassment",
    "eve teasing": "harassment",
    "catcalling": "harassment",
    "stalking": "harassment",
    "assault": "assault",
    "physical attack": "assault",
    "fighting": "assault",
    "suspicious": "suspicious_activity",
    "loitering": "suspicious_activity",
    "vandalism": "vandalism",
    "property damage": "vandalism",
    "graffiti": "vandalism",
}

MAX_RETRIES = 2
RETRY_DELAY_S = 1.0


class ClassifierService:
    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=CLASSIFY_SYSTEM_INSTRUCTION,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                top_p=0.95,
                response_mime_type="application/json",
            ),
        )

    def classify(self, title: str, description: str) -> dict[str, Any]:
        combined = f"{title}. {description}" if title else description
        truncated = combined[:3000]

        for attempt in range(1 + MAX_RETRIES):
            try:
                response = self.model.generate_content(
                    CLASSIFY_USER_PROMPT.format(
                        title=title or "(no title)",
                        description=truncated,
                    ),
                )

                raw_text = (response.text or "").strip()
                result = json.loads(raw_text)

                label = str(result.get("label", "other")).lower().strip()
                confidence = max(0.0, min(1.0, float(result.get("confidence", 0.5))))
                reasoning = str(result.get("reasoning", ""))
                mapped = INCIDENT_TYPE_MAP.get(label, "other")

                return {
                    "label": label,
                    "mapped_type": mapped,
                    "confidence": confidence,
                    "reasoning": reasoning,
                    "raw_response": raw_text,
                }

            except json.JSONDecodeError:
                logger.warning(
                    "Gemini returned invalid JSON (attempt %d)",
                    attempt + 1,
                )
            except Exception as e:
                logger.warning("Gemini API error (attempt %d): %s", attempt + 1, e)

            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S * (2**attempt))

        return {
            "label": "unknown",
            "mapped_type": "other",
            "confidence": 0.0,
            "reasoning": "",
            "raw_response": "",
        }

    def classify_batch(self, items: list[dict[str, str]]) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for item in items:
            result = self.classify(
                title=item.get("title", ""),
                description=item.get("description", ""),
            )
            results.append(result)
        return results


_classifier_instance: ClassifierService | None = None


def get_classifier() -> ClassifierService:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = ClassifierService()
    return _classifier_instance
