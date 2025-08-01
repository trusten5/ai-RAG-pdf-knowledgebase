# app/services/llm.py
from openai import OpenAI
from app.config import OPENAI_API_KEY, OPENAI_MODEL_NAME

client = OpenAI(api_key=OPENAI_API_KEY)

class Summarizer:
    def __init__(self, model=OPENAI_MODEL_NAME, max_words_per_bullet=60):
        self.model = model
        self.max_words = max_words_per_bullet

    def summarize_chunk(self, text: str, user_instruction: str = "") -> str:
        user_req = f"The user wants: {user_instruction}" if user_instruction else ""
        prompt = f"""
You are an expert strategy consultant reviewing a section of a financial, market, or company report.

{user_req}

Instructions:
1. Generate a professional, specific section title (ideally 5–8 words).
2. Write 2–5 concise, insight-driven bullet points summarizing the key information.
3. Use clean markdown format with this structure:

## [Section Title]

- Insight 1
- Insight 2
- Insight 3

Each bullet should be under {self.max_words} words and avoid fluff.

Here is the section to summarize:
{text}
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an AI assistant that summarizes financial and business documents for strategy consultants."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def meta_summarize(self, summaries: list[str], user_instruction: str = "") -> str:
        joined = "\n\n".join(summaries)
        user_req = f"The user wants: {user_instruction}" if user_instruction else ""
        prompt = f"""
You are an expert strategy consultant. Summarize the following consulting-style bullet summaries from a long report.

{user_req}

Instructions:
1. Consolidate and deduplicate information as needed.
2. Produce a well-structured summary in the same markdown bullet format.
3. Be concise: focus only on the most critical insights, not a list of every detail.
4. Do not provide anything other than headers and bullets
5. Ensure Headers are simple, short, and well worded

Summaries to combine:
{joined}
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an AI assistant for consultants."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def executive_summary(self, summaries: list[str] | str, user_instruction: str = "") -> str:
        joined = "\n\n".join(summaries) if isinstance(summaries, list) else summaries
        user_req = f"The user wants: {user_instruction}" if user_instruction else ""
        prompt = f"""
You are an expert strategy consultant. Write an executive summary (2–3 sentences, no bullets) covering only the most important findings from this document.

{user_req}

Source material:
{joined}
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an AI assistant for consultants."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def chat_on_summary(self, summary: str, user_message: str, history: list = None) -> str:
        history_str = ""
        if history:
            for turn in history:
                history_str += f"{turn['role'].capitalize()}: {turn['content']}\n"

        prompt = f"""
You are a helpful, knowledgeable assistant for strategy consultants. 
You are helping edit and refine a consulting document summary. 
Your job is to answer questions about the document, suggest edits, or rewrite sections as requested by the user.

Here is the current working summary (Markdown):

{summary}

{('Here is the chat so far, only utilize if user directly mentions it in their message:\n' + history_str) if history else ''}

User's request or question:
{user_message}

The Structure of your output is VITAL

To determine the structure of your output, determine whether the users main request is to provide edits to the existing executive summary or main summary you were given in markdown,
or if the user is asking a question about the existing summary and the information provided in it

- If you are making an edit to the executive summary, respond ONLY in this format:

Edit, Executive Summary:
<edited markdown section of executive summary ONLY, no preamble, no bullets>

- If you are making an edit to the Overall summary, respond ONLY in this format:

Edit, Overall Summary:
## <Exact Same Header of section you are providing edits to, it is vital that this exact header is included in your output in markdown format>
<Full replacement of markdown section you are writing to replace existing section ONLY, no preamble, in bullet format>

- If you are referencing a specific header or section, still only write "Edit, Overall Summary:" word for word, not the specific header, however, directly after, the entire markdown section (including its header [as ## "Header"] and all bullets), even if the user asks to edit just one bullet. Never return just a bullet or a list of bullets without the section header.

- If you are answering a question, respond ONLY in this format:

Question:
<plain English answer, no markdown, no preamble, no formatting, no extra commentary>

Instructions:
- If the user asks for clarification or information, answer using only facts present in the summary, but feel free to reword for clarity or understanding, however never use markdown when answering questions about the doc.
- If the user is asking for edits of the doc, give all edits exclusively in markdown, in the exact same format of the area of the doc you are replacing, with similar length
- If the user asks to rewrite the executive summary, output only a new executive summary, in a similar length and style to the original. Do not include extra background or a narrative.
- For other rewrites, return only the relevant markdown section(s) edited, matching the exact style and conciseness of the original.
- Keep all edits focused, concise, and professional—no extra commentary.
- Do not repeat the whole document unless the user requests a full summary.
- Ensure always that the exact format of the input is matched in the output

Return only the most helpful, relevant response, and only use outside information if the user specifically requests it.
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert AI assistant for consultants, helping edit and improve summaries."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def generate_slide_bullets(self, summary: str, user_instruction: str = "") -> str:
        prompt = f"""
You are a senior strategy consultant building professional, presentation-ready, and in-depth slides for an executive presentation. 
Your job is to turn the following summary into a clean set of slide-ready bullets, based on the user instruction.

{f"The user wants: {user_instruction}" if user_instruction else ""}

Instructions:
1. Create slides sections, each with a clear title (start with ## Title).
2. For each section, write 3–7 bullets (use '- ' markdown style), covering the key actionable insights, findings, or recommendations.
3. Each bullet should be under 20 words, highly specific, and suitable to copy into a slide deck.
4. Be concise: avoid generic statements or redundant information.
5. Do not include any commentary, intro, or extra explanation—just slide-ready markdown.

Here is the summary:
{summary}
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert consultant creating slide bullets from a business summary."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()

    def chat_on_slide_bullets(self, slide_bullets: str, user_message: str, history: list = None) -> str:
        history_str = ""
        if history:
            for turn in history:
                history_str += f"{turn['role'].capitalize()}: {turn['content']}\n"

        prompt = f"""
You are a consulting presentation assistant. Your job is to **edit, refine, or answer questions about consulting slide bullets** (not document summaries).

Here is the current working set of slide bullets (in Markdown):

{slide_bullets}

{('Here is the chat so far, only utilize if user directly mentions it in their message:\n' + history_str) if history else ''}

User's request or question:
{user_message}

Instructions:
- If the user requests a rewrite or edit to a specific bullet or section, respond ONLY in **valid markdown**. Write the full new header (as ## Header) and ALL bullets for the section, not just the edited bullet.
- If the user asks a question about the bullets, respond ONLY in plain English (no markdown).
- Never repeat the whole set of bullets unless asked for a "full rewrite".
- Edits must be ready to copy-paste into a presentation.
- Do not include any preamble, background, or commentary in your output.
"""
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert AI assistant for consultants, focused on editing and improving slide bullets for presentations."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    
    def ask_thrust(self, context_text: str, user_message: str, history: list = None) -> str:
        prompt = f"""
You are an expert consultant's assistant. You have access to all the following project briefs, summaries, executive summaries, and slide bullets.

User's question:
{user_message}

Project Knowledgebase:
{context_text}

Instructions:
- Only use information present in the project knowledgebase above.
- If referencing a specific brief, mention its title or section name.
- If you include citations, format them as [CITATION: Title/Section].
- Return a professional, concise answer.
- If you don't know, say so directly.
"""
        messages = [
            {"role": "system", "content": "You are a consultant's AI assistant who answers questions about the firm's knowledgebase, citing relevant sections as needed."},
            {"role": "user", "content": prompt}
        ]
        if history:
            for turn in history:
                messages.insert(-1, {"role": turn['role'], "content": turn['content']})
        response = client.chat.completions.create(
        model=self.model,
        messages=messages
    )

        return response.choices[0].message.content.strip()

    def ask_thrust_global(self, context_text: str, user_message: str, history: list = None) -> str:
        # This is literally the same as ask_thrust for now, but we can specialize later if needed.
        return self.ask_thrust(context_text, user_message, history)