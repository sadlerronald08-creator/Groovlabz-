import asyncio, os, base64, sys
from dotenv import load_dotenv
load_dotenv("/app/backend/.env")
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

OUT = "/app/frontend/public/shop"
STYLE = ("Professional e-commerce product photograph, studio lighting, dark charcoal recording-studio background with subtle "
         "electric-blue rim light, centered, sharp focus, no text overlays except the GROOVLABZ brand mark, no watermark, 4:5 portrait.")

JOBS = {
    "gigbag": ("A padded black Flying-V shaped guitar gig bag standing upright, zipped, with backpack straps, a small front accessory pocket, and an embroidered glowing electric-blue infinity symbol with 'GROOVLABZ' text on the front.", None),
    "lightning-v": ("Full-body shot of a Flying-V electric guitar standing on a stand: glossy PEARL WHITE body (bright white, not dark) struck with vivid electric-blue lightning bolts and cyan sparks, "
                    "electric-blue binding around the body edge, chrome humbuckers and hardware, white headstock with 'GROOVLABZ' in blue and block inlays on the rosewood fretboard.", "/app/frontend/public/jamnow/flying-v.png"),
    "storm-v": ("Full-body shot of a Flying-V electric guitar standing on a stand: glossy BLACK body struck with vivid electric-blue and violet lightning bolts, "
                "blue binding, chrome humbuckers, black headstock with 'GROOVLABZ' in blue and a small glowing infinity symbol inlay on the fretboard.", "/app/frontend/public/jamnow/flying-v.png"),
    "groovmic-bt": ("A sleek black handheld wireless vocal microphone with a matte metal grille, thin glowing electric-blue LED ring around the base, small 'GROOVLABZ ∞' mark, Bluetooth symbol lit in blue, standing upright on a compact charging dock.", None),
    "groovwah": ("A rugged black wah guitar pedal with a rocker treadle, electric-blue LED status light, blue rubber grip pad on the treadle, 'GROOVLABZ WAH' printed in blue on the side, 3/4 angle view.", None),
    "groovamp-12": ("A 12-watt combo guitar amplifier: black tolex cabinet, dark metal grille cloth, brushed-steel control panel with six black knobs, glowing blue power LED, 'GROOVLABZ' badge with infinity logo on the grille, front 3/4 view.", None),
    "groovamp-10": ("A compact 10-watt practice guitar amplifier: black cabinet, blue piping, dark grille, five knobs on a top panel, glowing blue LED, 'GROOVLABZ' badge with infinity logo on the grille, front view.", None),
    "groovamp-7": ("A small portable 7-watt battery guitar amplifier with a black leather strap handle, rounded corners, blue accent stripe, three knobs, glowing blue LED, 'GROOVLABZ' badge with infinity logo, front 3/4 view.", None),
    "strings-green": ("A set of six coiled electric guitar strings coated in vivid NEON GREEN, glowing slightly, arranged fanned on a matte black surface next to a black envelope pack printed 'GROOVLABZ NEON STRINGS' in green.", None),
    "strings-purple": ("A set of six coiled electric guitar strings coated in vivid NEON PURPLE, glowing slightly, arranged fanned on a matte black surface next to a black envelope pack printed 'GROOVLABZ NEON STRINGS' in purple.", None),
    "strings-blue": ("A set of six coiled electric guitar strings coated in vivid NEON ELECTRIC BLUE, glowing slightly, arranged fanned on a matte black surface next to a black envelope pack printed 'GROOVLABZ NEON STRINGS' in blue.", None),
}


async def gen(key):
    prompt, ref = JOBS[key]
    chat = LlmChat(api_key=os.environ["EMERGENT_LLM_KEY"], session_id=f"gen-{key}", system_message="You generate product photos.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    files = []
    if ref:
        with open(ref, "rb") as f:
            files = [ImageContent(base64.b64encode(f.read()).decode())]
        prompt = "Use the exact same guitar shape, headstock and hardware as in the reference image, but re-finish it: " + prompt
    for attempt in range(3):
        try:
            _, images = await chat.send_message_multimodal_response(UserMessage(text=f"{prompt} {STYLE}", file_contents=files))
            if images:
                with open(f"{OUT}/{key}.png", "wb") as f:
                    f.write(base64.b64decode(images[0]["data"]))
                print("ok", key)
                return
        except Exception as e:
            print("retry", key, str(e)[:120])
            await asyncio.sleep(2)
    print("FAILED", key)


async def main():
    keys = sys.argv[1:] or list(JOBS)
    await asyncio.gather(*(gen(k) for k in keys))

asyncio.run(main())
