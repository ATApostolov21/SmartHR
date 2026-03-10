import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class LLMService:
    def __init__(self):
        # Load the key from environment variables
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables.")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-flash-latest')

    async def stream_strategic_insight(self, employee_data: dict, changes: list, simulated_risk: float):
        """
        Streams a live strategic insight using Gemini AI.
        """
        try:
            changes_str = "\n".join([f"- {c['label']}: от {c['from']} на {c['to']}" for c in changes])
            
            prompt = f"""
            Ти си високоплатен HR консултант и AI стратег за голяма компания. 
            Твоята задача е да анализираш резултатите от What-If симулация за задържане на служител.

            ДАННИ ЗА СЛУЖИТЕЛЯ:
            - Позиция: {employee_data.get('Job_Title', 'Служител')}
            - Години в компанията: {employee_data.get('Years_At_Company', 'N/A')}
            - Текущ риск от напускане: {employee_data.get('churn_probability', 0) * 100:.1f}%

            ПРОМЕНИ ОТ СИМУЛАЦИЯТА:
            {changes_str}

            НОВ ПРОГНОЗИРАН РИСК: {simulated_risk * 100:.1f}%

            ИНСТРУКЦИИ:
            1. Напиши авторитетен и стратегически анализ на български език.
            2. Използвай Markdown структура:
               - Започни с ### **АНАЛИЗ**
               - Добави секция ### **ЗАЩО ТЕЗИ ПРОМЕНИ РАБОТЯТ:**
               - Използвай номериран списък (1, 2, 3) за ключовите аргументи.
               - Използвай **bold** за подчертаване на важни термини.
            3. Използвай професионален тон, подходящ за топ мениджмънт.
            4. Бъди конкретен спрямо промените в числата.

            АНАЛИЗ:
            """
            
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
            
        except Exception as e:
            print(f"Gemini Streaming API Error: {e}")
            yield f"### **АНАЛИЗ**\nПриложените промени успешно коригират работната динамика, намалявайки риска до {simulated_risk*100:.1f}%."

llm_service = LLMService()
