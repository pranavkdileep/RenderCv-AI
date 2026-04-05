import os
from openai import OpenAI


client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="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"
)


SYSTEM_PROMPT = """
You generate short, human-like Reddit comments.

STYLE:
- Informal, practical, easy to understand
- Sound like a real redditor giving advice
- Keep it short (1–4 sentences)
- Avoid legal or professional jargon
- Do not over explain
- Use same language as the post

- Occasionally simulate tiny human imperfections
  (minor lowercase starts, small filler words like imo, tbh, kinda)

RULES:
- No emojis unless absolutely natural
- No  – or — dashes, use simple punctuation
- No marketing or AI-style phrasing
- No long paragraphs
- Output ONLY the comment text.
"""


def generate_reddit_comment(post_text: str, image_urls=None):
    """
    post_text: str
    image_urls: list[str] | None
    """

    user_content = [
        {"type": "text", "text": f"Reddit post:\n{post_text}"}
    ]

    if image_urls:
        for url in image_urls:
            user_content.append({
                "type": "image_url",
                "image_url": {"url": url}
            })

    response = client.chat.completions.create(
        model="qwen/qwen3.5-397b-a17b",
        temperature=0.7,
        max_tokens=120,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content}
        ]
    )

    return response.choices[0].message.content.strip()



if __name__ == "__main__":
    post = """
    Why do Malayalis seem underrepresented in certain elite Indian/global corporate settings?
    Noticed something of late and I’m curious if others see this too.

    In global (Harvard, Stanford etc) and Indian Tier 1 institutions (IIT/IIMs) and elite work tracks like consulting/ investment banking→ global corporate tracks, I tend to see a large number of Northies. But I don’t seem to see as many Malayalis in these specific settings.

    At the same time, Malayalis are extremely strong in migration numbers.

    Is this just my perception bias? Or are there any other reasons?
    """

    images = [
        # optional image URLs from your web app
        #"https://tmpfiles.org/dl/26189015/screenshotfrom2026-02-2516-12-36.png"
    ]

    # comment = generate_reddit_comment(post, images)
    # print(comment)