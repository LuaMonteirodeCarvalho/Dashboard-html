import os
import json

html_file = "Projeto Dashboard.html"
with open(html_file, "r", encoding="utf-8") as f:
    lines = f.readlines()

style_start = lines.index("    <style>\n")
style_end = lines.index("    </style>\n")
css_content = "".join(lines[style_start+1:style_end])

with open("style.css", "w", encoding="utf-8") as f:
    f.write(css_content)

script_start = lines.index("    <script>\n")
script_end = lines.index("    </script>\n")
js_lines = lines[script_start+1:script_end]

# Extracted data for JSON
dashboard_data = {
    "dailyQuotes": [
        "A energia flui para onde o foco vai. Mantenha seu foco nos seus objetivos.",
        "O otimismo é o otimismo em ação. Nada se pode levar a efeito sem otimismo.",
        "Você é mais forte, inteligente e capaz do que imagina. Acredite no seu poder.",
        "A persistência realiza o impossível. Siga em frente com energia!",
        "Cada novo dia é uma nova chama. Deixe-a brilhar com toda a força.",
        "Faça de hoje um dia incrivelmente produtivo e cheio de energia positiva.",
        "Sua atitude determina sua altitude. Voe alto e com determinação!",
        "O futuro pertence àqueles que acreditam na beleza e na força de seus sonhos.",
        "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
        "Tudo o que você precisa para vencer já está pulsing dentro de você."
    ],
    "moodQuotes": {
        "feliz": [
            "Sua alegria ilumina o mundo! Continue espalhando essa luz maravilhosa.",
            "Aproveite cada segundo dessa felicidade, você merece sorrir sempre!",
            "Um coração alegre é o melhor remédio. Que seu dia fique ainda melhor!"
        ],
        "triste": [
            "Tudo bem não estar bem o tempo todo. Respire fundo, amanhã é um novo dia.",
            "Não há tempestade que dure para sempre. O sol sempre volta a brilhar.",
            "Seja gentil consigo mesma hoje. Você é forte e vai superar isso!"
        ],
        "desanimada": [
            "Mesmo o menor dos passos ainda é um progresso. Vá no seu ritmo, Lua.",
            "Você já superou 100% dos seus dias ruins até agora. Você consegue de novo!",
            "Acredite no seu potencial. As coisas vão melhorar, não desista!"
        ],
        "animada": [
            "Use toda essa energia incrível para conquistar seus maiores sonhos hoje!",
            "O mundo não está pronto para tudo o que você vai realizar agora!",
            "Voe alto! Sua animação é o combustível perfeito para o sucesso."
        ],
        "cansada": [
            "Descansar não é desistir. Recarregue suas baterias para voltar mais forte.",
            "Seu corpo e mente merecem esse descanso. Cuide bem de você hoje.",
            "Não tenha pressa. O descanso de hoje é a força que você precisa para o amanhã."
        ],
        "energizada": [
            "Canalize esse poder todo! Você é capaz de realizar o extraordinário agora.",
            "Nada pode te parar! Transforme essa energia em grandes ações.",
            "Siga esse fluxo poderoso e não deixe nada atrapalhar seu foco e determinação."
        ]
    },
    "backgroundImages": [
        "assets/bg1.png",
        "assets/bg2.png",
        "assets/bg3.png"
    ],
    "moodTracks": {
        "feliz":      { "id": "1B8RSIxmwcjad7XUJjeCK2", "name": "You Make Me Feel So Young – Michael Bublé" },
        "triste":     { "id": "4kflIGfjdZJW4ot2ioixTB", "name": "Someone Like You – Adele" },
        "desanimada": { "id": "1HNkqx9Ahdgi1Ixy2xkKkL", "name": "Photograph – Ed Sheeran" },
        "animada":    { "id": "1CkvWZme3pRgbzaxZnTl5X", "name": "Rolling in the Deep – Adele" },
        "cansada":    { "id": "1HbcclMpw0q2WDWpdGCKdS", "name": "Tenerife Sea – Ed Sheeran" },
        "energizada": { "id": "2uAF91abD69EEYylY2SKzG", "name": "It's My Life – Bon Jovi" }
    }
}

os.makedirs("data", exist_ok=True)
with open("data/dashboard.json", "w", encoding="utf-8") as f:
    json.dump(dashboard_data, f, indent=4, ensure_ascii=False)

# Remove the hardcoded data from the JS
# We know it spans from line 772 to 835 (inclusive), which means the first 64 lines of the JS
# Let's write a dynamic JS payload that fetches the data.
js_prefix = """let dailyQuotes = [];
let moodQuotes = {};
let backgroundImages = [];
let moodTracks = {};

async function loadDashboardData() {
    try {
        const response = await fetch('data/dashboard.json');
        const data = await response.json();
        dailyQuotes = data.dailyQuotes;
        moodQuotes = data.moodQuotes;
        backgroundImages = data.backgroundImages;
        moodTracks = data.moodTracks;
        
        updateBackgroundAndDefaultQuote();
    } catch (err) {
        console.error("Erro ao carregar os dados do dashboard:", err);
    }
}
"""

# Let's find the line index in js_lines where "let currentTrackId = null;" starts
for i, line in enumerate(js_lines):
    if "let currentTrackId = null;" in line:
        data_end_idx = i
        break

js_rest = "".join(js_lines[data_end_idx:])

# Now we need to remove the call to `updateBackgroundAndDefaultQuote();` at the bottom, 
# because it will be called from loadDashboardData() instead
js_rest = js_rest.replace("updateBackgroundAndDefaultQuote();", "// updateBackgroundAndDefaultQuote() called after fetch")

# We should add loadDashboardData() call at the bottom
js_rest += "\nloadDashboardData();\n"

with open("script.js", "w", encoding="utf-8") as f:
    f.write(js_prefix + "\n" + js_rest)

# Now construct the index.html
html_head = lines[:style_start]
html_head.append('    <link rel="stylesheet" href="style.css">\n')
html_body_top = lines[style_end+1:script_start]
html_body_bottom = lines[script_end+1:]

with open("index.html", "w", encoding="utf-8") as f:
    f.writelines(html_head)
    f.writelines(html_body_top)
    f.writelines(html_body_bottom)
    
# Add script.js tag before body end
with open("index.html", "r", encoding="utf-8") as f:
    idx_html = f.read()
idx_html = idx_html.replace('</body>', '    <script src="script.js"></script>\n</body>')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(idx_html)

print("Refatoração concluída com sucesso!")
