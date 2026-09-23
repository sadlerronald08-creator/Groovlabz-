import asyncio, os, base64
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
from PIL import Image

SRC = "/app/frontend/public/shop/galaxy-v.jpg"


async def main():
    with open(SRC, "rb") as f:
        ref = base64.b64encode(f.read()).decode()
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id="fix-galaxy-logo", system_message="You edit product photos precisely.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    prompt = ("Edit this photo. Keep EVERYTHING identical (guitar, galaxy finish, green hardware, background, lighting, framing). "
              "Only change the text printed on the headstock: replace 'GROOVE LABS' with exactly 'GROOVLABZ' (one word, ends with Z) "
              "in the same glowing cyan-blue font, same position and angle along the headstock.")
    for attempt in range(3):
        try:
            _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt, file_contents=[ImageContent(ref)]))
            if images:
                with open("/tmp/galaxy-fixed.png", "wb") as f:
                    f.write(base64.b64decode(images[0]["data"]))
                print("ok")
                return
        except Exception as e:
            print("retry", str(e)[:100])
            await asyncio.sleep(2)
    print("FAILED")

asyncio.run(main())
