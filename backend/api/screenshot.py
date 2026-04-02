from fastapi import APIRouter, UploadFile, File
import base64
import ollama
from llm.ollama_client import MODEL

router = APIRouter()


@router.post("/analyze")
async def analyze_screenshot(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    prompt = """
당신은 리치마작 전문가이자 친절한 코치입니다.
이 마작 게임 스크린샷을 보고 초보자도 이해할 수 있게 한국어로 설명해주세요.

다음을 포함해서 설명해주세요:
1. 현재 어떤 상황인지 (후리텐, 론 불가, 역 성립 여부, 점수 계산 등)
2. 왜 그런 상황이 발생했는지
3. 앞으로 어떻게 하면 좋은지 (가능하다면)

전문 용어는 괄호 안에 쉽게 설명해주세요.
예) 후리텐(자신이 버린 패로는 론을 선언할 수 없는 상태)
"""

    try:
        response = ollama.chat(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                    "images": [image_b64]
                }
            ]
        )
        explanation = response["message"]["content"]
    except Exception as e:
        explanation = f"분석 중 오류가 발생했습니다: {str(e)}"

    return {"explanation": explanation}
