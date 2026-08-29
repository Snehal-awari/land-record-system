import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def generate_sample_712(output_path: Path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Document dimensions: High resolution scanned A4 (approx 1200 x 1700)
    width, height = 1200, 1650
    # Aged/scanned government paper tone
    img = Image.new("RGB", (width, height), color=(252, 251, 247))
    draw = ImageDraw.Draw(img)
    
    # Fonts
    font_path_dev = "C:/Windows/Fonts/Nirmala.ttc"
    if not os.path.exists(font_path_dev):
        font_path_dev = "C:/Windows/Fonts/mangal.ttf"
    font_path_en = "C:/Windows/Fonts/arial.ttf"
    font_path_en_bold = "C:/Windows/Fonts/arialbd.ttf"
    
    try:
        font_title = ImageFont.truetype(font_path_dev, 28)
        font_sub = ImageFont.truetype(font_path_dev, 20)
        font_header = ImageFont.truetype(font_path_dev, 16)
        font_body = ImageFont.truetype(font_path_dev, 15)
        font_bold = ImageFont.truetype(font_path_dev, 17)
        font_small = ImageFont.truetype(font_path_dev, 13)
        font_watermark = ImageFont.truetype(font_path_dev, 60)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub = font_header = font_body = font_bold = font_small = font_watermark = font_title

    # Watermark
    draw.text((250, 750), "शासन प्रत / DEMO RECORD 2026", fill=(235, 235, 230), font=font_watermark)

    # Outer border
    draw.rectangle([(30, 30), (width - 30, height - 30)], outline=(60, 60, 60), width=3)
    draw.rectangle([(35, 35), (width - 35, height - 35)], outline=(120, 120, 120), width=1)

    # Header section
    draw.text((width // 2, 60), "महाराष्ट्र शासन - महसूल व वन विभाग", fill=(10, 30, 80), font=font_title, anchor="mm")
    draw.text((width // 2, 95), "गाव नमुना सात (अधिकार अभिलेख पत्रक) आणि गाव नमुना बारा (पिकांची पाहणी)", fill=(30, 30, 30), font=font_sub, anchor="mm")
    draw.text((width // 2, 125), "Government of Maharashtra - Form 7/12 Land Record Extract", fill=(80, 80, 80), font=font_header, anchor="mm")

    # Administrative line
    draw.line([(50, 150), (width - 50, 150)], fill=(80, 80, 80), width=2)
    
    # Village, Taluka, District details
    draw.text((60, 170), "गाव (Village): खेड (Khed)", fill=(10, 10, 10), font=font_bold)
    draw.text((450, 170), "तालुका (Tehsil): खेड (Khed / Rajgurunagar)", fill=(10, 10, 10), font=font_bold)
    draw.text((850, 170), "जिल्हा (District): पुणे (Pune)", fill=(10, 10, 10), font=font_bold)

    draw.text((60, 205), "गट / सर्व्हे क्र. (Gat / Survey No.): 142", fill=(180, 20, 20), font=font_bold)
    draw.text((450, 205), "खाते क्रमांक (Khata No.): 314", fill=(10, 10, 10), font=font_bold)
    draw.text((850, 205), "नोंदणी क्रमांक (Reg No.): MH-PUN-KD-2024-8891", fill=(10, 10, 10), font=font_body)

    draw.line([(50, 240), (width - 50, 240)], fill=(80, 80, 80), width=2)

    # Table 1: Land Description (Form 7 Left Side)
    # Area details
    box_top = 250
    draw.rectangle([(50, box_top), (width - 50, 520)], outline=(80, 80, 80), width=2)
    draw.line([(400, box_top), (400, 520)], fill=(80, 80, 80), width=2)
    draw.line([(800, box_top), (800, 520)], fill=(80, 80, 80), width=2)

    # Table 1 Headers
    draw.text((60, box_top + 10), "१. भूधारणा पद्धती व क्षेत्र (Area Details)", fill=(10, 40, 90), font=font_bold)
    draw.text((410, box_top + 10), "२. खातेदार व मालकी (Ownership Details)", fill=(10, 40, 90), font=font_bold)
    draw.text((810, box_top + 10), "३. फेरफार व इतर हक्क (Mutation & Rights)", fill=(10, 40, 90), font=font_bold)
    
    draw.line([(50, box_top + 40), (width - 50, box_top + 40)], fill=(120, 120, 120), width=1)

    # Column 1 Content: Areas
    col1_y = box_top + 55
    draw.text((60, col1_y), "भूधारणा पद्धती: भोगवटादार वर्ग - १ (Occupant Class 1)", fill=(30, 30, 30), font=font_body)
    col1_y += 30
    draw.text((60, col1_y), "जमिनीचे वर्गीकरण: जिरायत / बागायत", fill=(30, 30, 30), font=font_body)
    col1_y += 30
    draw.text((60, col1_y), "एकूण क्षेत्र (Total Area): 1.00 हेक्टर (Hectare)", fill=(10, 10, 10), font=font_bold)
    col1_y += 28
    draw.text((80, col1_y), "• लागवडीयोग्य क्षेत्र (Cultivated Area): 0.75 हे.", fill=(40, 40, 40), font=font_body)
    col1_y += 26
    draw.text((80, col1_y), "• जिरायत क्षेत्र (Jirayat Area): 0.75 हे.", fill=(40, 40, 40), font=font_body)
    col1_y += 26
    draw.text((80, col1_y), "• पोटखराब क्षेत्र (Pot Kharab Area): 0.20 हे.", fill=(40, 40, 40), font=font_body)
    col1_y += 32
    draw.text((60, col1_y), "आकारणी (Assessment): रु. 4.85", fill=(40, 40, 40), font=font_body)

    # Column 2 Content: Owners
    col2_y = box_top + 55
    draw.text((410, col2_y), "मुख्य खातेदार (Primary Owner):", fill=(60, 60, 60), font=font_small)
    col2_y += 24
    draw.text((410, col2_y), "दत्तात्रय बापूराव जाधव", fill=(10, 10, 10), font=font_bold)
    draw.text((410, col2_y + 24), "(Dattatray Bapurao Jadhav)", fill=(50, 50, 50), font=font_body)
    col2_y += 55
    draw.text((410, col2_y), "इतर सह-हिस्सेदार (Co-owners):", fill=(60, 60, 60), font=font_small)
    col2_y += 24
    draw.text((410, col2_y), "१. मंदाकिनी दत्तात्रय जाधव (Mandakini D. Jadhav)", fill=(40, 40, 40), font=font_body)
    col2_y += 26
    draw.text((410, col2_y), "२. सचिन दत्तात्रय जाधव (Sachin D. Jadhav)", fill=(40, 40, 40), font=font_body)

    # Column 3 Content: Mutation
    col3_y = box_top + 55
    draw.text((810, col3_y), "फेरफार क्रमांक (Mutation No.): 4582", fill=(10, 10, 10), font=font_bold)
    col3_y += 30
    draw.text((810, col3_y), "फेरफार दिनांक: 14/03/2021", fill=(40, 40, 40), font=font_body)
    col3_y += 30
    draw.text((810, col3_y), "कारण: वारस नोंद (Succession/Inheritance)", fill=(40, 40, 40), font=font_body)
    col3_y += 30
    draw.text((810, col3_y), "बोजा / इतर हक्क: बँक ऑफ महाराष्ट्र", fill=(40, 40, 40), font=font_body)
    col3_y += 26
    draw.text((830, col3_y), "पीक कर्ज रु. 1,50,000/- बोजा नोंद", fill=(50, 50, 50), font=font_small)

    # Section 2: Village Form 12 (गाव नमुना बारा - पिकांची नोंदवही)
    draw.line([(50, 540), (width - 50, 540)], fill=(80, 80, 80), width=2)
    draw.text((width // 2, 565), "गाव नमुना बारा (पिकांची पाहणी - Crop Inspection Register)", fill=(10, 30, 80), font=font_sub, anchor="mm")

    crop_top = 590
    draw.rectangle([(50, crop_top), (width - 50, 820)], outline=(80, 80, 80), width=2)
    # Table columns
    col_widths = [50, 150, 320, 500, 680, 880, width - 50]
    for x in col_widths[1:-1]:
        draw.line([(x, crop_top), (x, 820)], fill=(120, 120, 120), width=1)
    draw.line([(50, crop_top + 40), (width - 50, crop_top + 40)], fill=(80, 80, 80), width=2)

    # Headers
    draw.text((60, crop_top + 10), "वर्ष (Year)", fill=(10, 10, 10), font=font_bold)
    draw.text((160, crop_top + 10), "हंगाम (Season)", fill=(10, 10, 10), font=font_bold)
    draw.text((330, crop_top + 10), "पिकाचे नाव (Crop)", fill=(10, 10, 10), font=font_bold)
    draw.text((510, crop_top + 10), "क्षेत्र (Area)", fill=(10, 10, 10), font=font_bold)
    draw.text((690, crop_top + 10), "जलसिंचन (Irrigation)", fill=(10, 10, 10), font=font_bold)
    draw.text((890, crop_top + 10), "शेरा (Remarks)", fill=(10, 10, 10), font=font_bold)

    # Row 1
    r1_y = crop_top + 55
    draw.text((60, r1_y), "2023-24", fill=(30, 30, 30), font=font_body)
    draw.text((160, r1_y), "खरीप (Kharif)", fill=(30, 30, 30), font=font_body)
    draw.text((330, r1_y), "सोयाबीन (Soybean)", fill=(30, 30, 30), font=font_body)
    draw.text((510, r1_y), "0.45 हे.", fill=(30, 30, 30), font=font_body)
    draw.text((690, r1_y), "विहीर (Well)", fill=(30, 30, 30), font=font_body)
    draw.text((890, r1_y), "उत्तम स्थिती", fill=(30, 30, 30), font=font_body)

    # Row 2
    r2_y = crop_top + 110
    draw.line([(50, crop_top + 95), (width - 50, crop_top + 95)], fill=(180, 180, 180), width=1)
    draw.text((60, r2_y), "2023-24", fill=(30, 30, 30), font=font_body)
    draw.text((160, r2_y), "रब्बी (Rabi)", fill=(30, 30, 30), font=font_body)
    draw.text((330, r2_y), "कांदा / ज्वारी (Onion/Jowar)", fill=(30, 30, 30), font=font_body)
    draw.text((510, r2_y), "0.30 हे.", fill=(30, 30, 30), font=font_body)
    draw.text((690, r2_y), "ठिबक सिंचन (Drip)", fill=(30, 30, 30), font=font_body)
    draw.text((890, r2_y), "विहीर पाणी उपलब्ध", fill=(30, 30, 30), font=font_body)

    # Row 3 (Pot kharab explanation)
    r3_y = crop_top + 165
    draw.line([(50, crop_top + 150), (width - 50, crop_top + 150)], fill=(180, 180, 180), width=1)
    draw.text((60, r3_y), "2023-24", fill=(30, 30, 30), font=font_body)
    draw.text((160, r3_y), "पूर्ण वर्ष", fill=(30, 30, 30), font=font_body)
    draw.text((330, r3_y), "पोटखराब (नाला/रस्ता)", fill=(80, 80, 80), font=font_body)
    draw.text((510, r3_y), "0.20 हे.", fill=(80, 80, 80), font=font_body)
    draw.text((690, r3_y), "अकृषक / पडीक", fill=(80, 80, 80), font=font_body)
    draw.text((890, r3_y), "लागवडीस अयोग्य वर्ग (अ)", fill=(80, 80, 80), font=font_body)

    # Verification & Discrepancy Note Area
    note_top = 840
    draw.rectangle([(50, note_top), (width - 50, 1000)], outline=(160, 160, 160), fill=(248, 248, 240), width=1)
    draw.text((65, note_top + 15), "विशेष टीप व पडताळणी शेरा (Special Verification Notes & Survey Details):", fill=(120, 20, 20), font=font_bold)
    draw.text((65, note_top + 45), "• क्षेत्र पडताळणी: एकूण नोंदणीकृत क्षेत्र = 1.00 हेक्टर. जिरायत क्षेत्र = 0.75 हेक्टर, पोटखराब क्षेत्र = 0.20 हेक्टर.", fill=(40, 40, 40), font=font_body)
    draw.text((65, note_top + 75), "• (Discrepancy Note: 0.75 हे. + 0.20 हे. = 0.95 हे. दर्शविलेले आहे; उर्वरित 0.05 हेक्टर सीमा बांध / रस्ता फेरफार अधीन)", fill=(140, 40, 10), font=font_body)
    draw.text((65, note_top + 105), "• अधिकार अभिलेख कायद्यानुसार डिजिटल स्वाक्षरीयुक्त अधिकृत महसूल प्रत.", fill=(60, 60, 60), font=font_small)

    # Government Seals and Signatures
    # Circle Stamp Left
    stamp_x, stamp_y = 200, 1140
    draw.ellipse([(stamp_x - 70, stamp_y - 70), (stamp_x + 70, stamp_y + 70)], outline=(20, 50, 140), width=3)
    draw.ellipse([(stamp_x - 63, stamp_y - 63), (stamp_x + 63, stamp_y + 63)], outline=(20, 50, 140), width=1)
    draw.text((stamp_x, stamp_y - 30), "तलाठी कार्यालय", fill=(20, 50, 140), font=font_small, anchor="mm")
    draw.text((stamp_x, stamp_y), "★ खेड (पुणे) ★", fill=(20, 50, 140), font=font_small, anchor="mm")
    draw.text((stamp_x, stamp_y + 30), "सत्य प्रत / VERIFIED", fill=(20, 50, 140), font=font_small, anchor="mm")

    # QR Code placeholder box
    qr_x, qr_y = 550, 1070
    draw.rectangle([(qr_x, qr_y), (qr_x + 120, qr_y + 120)], outline=(40, 40, 40), fill=(255, 255, 255), width=2)
    draw.text((qr_x + 60, qr_y + 60), "DIGITAL\nPORTAL\nQR CODE", fill=(60, 60, 60), font=font_small, anchor="mm")

    # Signature Right
    sig_x, sig_y = 950, 1120
    draw.line([(sig_x - 120, sig_y + 20), (sig_x + 80, sig_y + 20)], fill=(50, 50, 50), width=1)
    draw.text((sig_x - 20, sig_y - 25), "स. क. कुलकर्णी", fill=(10, 20, 100), font=font_bold, anchor="mm")
    draw.text((sig_x - 20, sig_y + 35), "तलाठी / मंडळ अधिकारी", fill=(40, 40, 40), font=font_body, anchor="mm")
    draw.text((sig_x - 20, sig_y + 60), "सजा खेड, जि. पुणे", fill=(60, 60, 60), font=font_small, anchor="mm")
    draw.text((sig_x - 20, sig_y + 80), "दिनांक: 15/01/2026", fill=(60, 60, 60), font=font_small, anchor="mm")

    # Bottom footer with disclaimer
    draw.line([(50, height - 90), (width - 50, height - 90)], fill=(120, 120, 120), width=1)
    draw.text((width // 2, height - 65), "ही संगणकीकृत प्रत भूमी अभिलेख विभागाच्या राष्ट्रीय ई-फेरफार प्रणालीद्वारे तयार केलेली आहे. अधिकृत महसूल पडताळणीसाठी ग्राह्य.", fill=(100, 100, 100), font=font_small, anchor="mm")
    draw.text((width // 2, height - 45), "SIH 2026 Prototype Evaluation - Problem Statement 26018 - Mahabhulekh Digitization", fill=(120, 120, 120), font=font_small, anchor="mm")

    img.save(output_path, "PNG")
    print(f"Sample 7/12 document saved successfully to: {output_path}")

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "sample_data" / "sample_7_12.png"
    generate_sample_712(out)
