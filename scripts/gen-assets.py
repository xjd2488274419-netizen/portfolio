import os, json, shutil
from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None
TMP = r"C:\Users\24882\WorkBuddy\2026-09-13-21-41-24\.tmp"
DECK = os.path.join(TMP, "deck_media")
SITE = r"E:\作品集"
CLIP = r"C:\Users\24882\.workbuddy\clipboard-images"

def deck_path(n):
    for ext in (".png", ".jpeg", ".jpg"):
        p = os.path.join(DECK, f"image{n}{ext}")
        if os.path.exists(p):
            return p
    raise FileNotFoundError(n)

def export(src, dst, max_side, quality):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im).convert("RGB")
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale < 1.0:
        im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)
    im.save(dst, "WEBP", quality=quality, method=6)
    return im.size

RENDERS = [
    ("A", 3,  "夜幕公路 · 车身反射与雾霭"),
    ("A", 4,  "石板街景 · 环境色与车漆"),
    ("A", 39, "雪湖之上 · 冷调环境光"),

    ("B", 11, "复古音浪 · 桌面静物布光"),
    ("B", 14, "铸铁锅 · 匠心质感与油烟"),
    ("B", 15, "电竞椅 · 暗调硬朗产品光"),
    ("B", 16, "腕表 · 草地自然光"),
    ("B", 19, "刮毛器 · 木纹与绒面"),
    ("B", 20, "清洁家电 · 居家陈列"),
    ("B", 35, "音响 · 客厅沉浸场景"),
    ("B", 36, "自行车 · 纯净棚拍"),
    ("B", 37, "头戴耳机 · 木桌静物"),
    ("B", 38, "游戏手柄 · 纯黑高光"),
    ("B", 41, "洗衣机 · 电商主图"),

    ("C", 17, "精华 · 金色流体光泽"),
    ("C", 18, "精华 · 草地绿意"),
    ("C", 21, "玫瑰香水 · 花瓣与玻璃"),
    ("C", 22, "面霜 · 柔光棚拍"),
    ("C", 23, "香水 · 苔藓森林"),
    ("C", 24, "面霜 · 霜石质感"),
    ("C", 25, "香水 · 木质夏至"),
    ("C", 26, "面霜 · 溪石苔痕"),
    ("C", 27, "精华 · 蜜色流动"),
    ("C", 28, "香薰 · 玻璃罩与木柜"),
    ("C", 29, "面霜 · 蓝色水域"),
    ("C", 40, "香水 · 暗调高光"),

    ("D", 1,  "蕾丝 · 织物细节"),
    ("D", 2,  "封面 · 光影秩序"),
    ("D", 8,  "皮革沙发 · 家居海报"),
    ("D", 9,  "皮质特写 · 高光与褶皱"),
    ("D", 10, "扶手特写 · 织物纹理"),
    ("D", 12, "宠物窝 · 温馨生活场景"),
    ("D", 47, "线条 · 抽象构成"),

    ("E", 5,  "客厅 · 沙发与陈列"),
    ("E", 6,  "客厅 · 电视墙与木饰面"),
    ("E", 7,  "客厅 · 午后茶几"),
    ("E", 13, "卧室 · 床垫与日光"),
    ("E", 30, "人像 · 产品与人物"),
    ("E", 31, "椅具 · 人物场景"),
    ("E", 32, "扫地机 · 生活场景"),
    ("E", 44, "室内 · 纱帘与暖光"),

    ("F", 34, "洞穴 · 暗部光照"),
    ("F", 45, "钢琴花海 · 静物概念"),
    ("F", 46, "高原城堡 · 环境搭建"),
]

CONCEPT = [
    ("24.png", "邮筒 · 材质做旧"),
    ("场景.png", "横版关卡 · 场景布局"),
    ("英灵殿.png", "沙漠木塔 · 荒原日光"),
    ("5.png", "香水 · 自然场景合成"),
    ("15.jpg", "客厅 · 午后光线"),
    ("16.jpg", "梳妆台 · 柔和材质"),
    ("23.png", "佛像空间 · 体积光"),
]

PHOTOS = [
    ("925Z-29e0cae7", "室内 · 柔光自拍"),
    ("926Z-e7887dd4", "镜前 · 逆光轮廓"),
    ("928Z-db5b0d8c", "棋盘格 · 镜中双影"),
    ("929Z-cbccb28c", "午后 · 一杯热饮"),
    ("930Z-dab537f2", "镜前 · 粉色细节"),
    ("931Z-c0beda2a", "出街 · 米色渔夫帽"),
    ("933Z-5d2cb711", "红衣 · 室内对镜"),
    ("934Z-3dd42028", "发夹 · 暖光对镜"),
    ("935Z-ff71c007", "透明壳 · 镜中侧影"),
    ("936Z-be5a64d3", "条纹针织 · 亮闪发夹"),
    ("937Z-6ca0f184", "雪后 · 低眉侧脸"),
    ("939Z-582d9a50", "雪山湖 · 长风扑面"),
    ("940Z-a6ea9d74", "大波浪 · 吸管与笑"),
    ("941Z-e8c2163e", "街角 · 一个手势"),
    ("942Z-fc9c9c92", "咖啡座 · 慵懒午后"),
    ("943Z-5af96ec7", "石阶 · 白鸽掠过"),
    ("953Z-146d16e0", "沙滩 · 红毛衣"),
    ("954Z-9916f899", "台阶 · 米色长裙"),
    ("955Z-943a322f", "林间 · 指向白鸽"),
    ("958Z-e9ec10c0", "棋盘 · 手谈一局"),
]

manifest = {"render": [], "concept": [], "photo": []}

for cat, n, cap in RENDERS:
    src = deck_path(n)
    dst = os.path.join(SITE, "assets", "render", f"r{n:02d}.webp")
    size = export(src, dst, 1680, 80)
    manifest["render"].append({"cat": cat, "file": f"assets/render/r{n:02d}.webp", "cap": cap, "w": size[0], "h": size[1]})

for i, (name, cap) in enumerate(CONCEPT, 1):
    src = os.path.join(r"H:\作品集\1图片集合", name)
    dst = os.path.join(SITE, "assets", "concept", f"c{i:02d}.webp")
    size = export(src, dst, 1680, 80)
    manifest["concept"].append({"file": f"assets/concept/c{i:02d}.webp", "cap": cap, "w": size[0], "h": size[1]})

for i, (key, cap) in enumerate(PHOTOS, 1):
    src = None
    for f in os.listdir(CLIP):
        if key in f:
            src = os.path.join(CLIP, f)
            break
    if not src:
        print("MISSING photo", key)
        continue
    dst = os.path.join(SITE, "assets", "photo", f"p{i:02d}.webp")
    size = export(src, dst, 1500, 82)
    manifest["photo"].append({"file": f"assets/photo/p{i:02d}.webp", "cap": cap, "w": size[0], "h": size[1]})

pano_src = r"C:\Users\24882\AppData\Roaming\LarkShell\sdk_storage\9cb9f36505f5a45936cc2360659343c2\resources\images\img_v3_0215g_1eb487c9-80d6-4513-b6d7-11214ed0928g.jpg"
pano_dst = os.path.join(SITE, "assets", "pano", "interior.webp")
size = export(pano_src, pano_dst, 2048, 86)
manifest["pano"] = {"file": "assets/pano/interior.webp", "w": size[0], "h": size[1]}

with open(os.path.join(TMP, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)

print("render:", len(manifest["render"]), "concept:", len(manifest["concept"]), "photo:", len(manifest["photo"]), "pano:", manifest["pano"])
