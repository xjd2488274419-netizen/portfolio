# -*- coding: utf-8 -*-
import json, os, html

TMP = r"C:\Users\24882\WorkBuddy\2026-09-13-21-41-24\.tmp"
SITE = r"E:\作品集"
V = "17"

man = json.load(open(os.path.join(TMP, "manifest.json"), encoding="utf-8"))

NAV = [("index.html", "首页"), ("projects.html", "项目"), ("works.html", "作品"),
       ("photos.html", "拾光"), ("contact.html", "联系")]

ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
        "%3Crect width='64' height='64' rx='14' fill='%2315312c'/%3E"
        "%3Ctext x='32' y='43' font-size='34' font-family='Helvetica,Arial' text-anchor='middle' fill='%23daf6e9'%3EX%3C/text%3E%3C/svg%3E")

def head(page, title, desc):
    return (
        '<!doctype html>\n<html lang="zh-CN">\n<head>\n'
        '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">\n'
        f'<meta name="description" content="{desc}">\n'
        f'<title>{title}</title>\n'
        f'<link rel="icon" href="{ICON}">\n'
        f'<link rel="stylesheet" href="styles.css?v={V}">\n'
        f'<script defer src="app.js?v={V}"></script>\n'
        '</head>\n<body><div class="page">\n'
        + nav(page) + '\n<main>\n'
    )

def nav(active):
    items = "".join(
        f'<a class="{"active" if href == active else ""}" href="{href}">{label}</a>'
        for href, label in NAV)
    return f'<header class="top"><nav class="nav">{items}</nav></header>'

def foot(right):
    return (f'\n</main><footer><span>© 2026 小徐 · Xiaoxu Portfolio</span>'
            f'<span>{right}</span></footer>\n</div></body></html>\n')

DESCS = {
    "car": "{cap}。这张画面主要处理车漆在环境光下的反射层次：把车身曲面对应到顶光与地面反射上，控制高光位置与雾气浓度，让车在暗背景里依然读得出体积，最终按客户要求的角度与其他视角一起批量输出。",
    "product": "{cap}。产品渲染的重点是把形体、材质、布光三者对齐：先用干净的背景与收敛的光比把轮廓立住，再处理材质的高光走向、边缘反射与接触阴影，让产品在画面里有真实的重量感。",
    "beauty": "{cap}。这一组反复打磨玻璃与液体：瓶身的折射和内部液体的透光要分开处理，柔光箱的角度决定瓶肩高光形状，靠近植物的部分还要照顾叶片对光线的遮挡与散射。",
    "home": "{cap}。家居与静物最考验材质细节：皮革要做出涂层光泽与褶皱的明暗过渡，织物则靠法线和粗糙度还原绒毛感；构图上刻意留白，让主体在画面里呼吸。",
    "interior": "{cap}。室内场景先搭光线再调材质：以自然进光为主线，用窗帘和家具位置划分明暗，再用局部补光交代陈设关系，让空间有可居住的温度。",
    "scene": "{cap}。场景类练习更关注光影结构与空间层次：从环境搭起，逐层安排主光、环境光与反射，再处理材质在远景里的简化，让画面在远近关系上成立。",
    "concept": "{cap}。概念设计是渲染主线之外的补充练习，用来试光线方向、构图比例与材质组合，不追求商业交付的严格还原，更多是把想法快速变成看得见的画面。",
    "photo": "{cap}。手机随手记录的生活片段，光线来自当时的场景本身，保留原始比例与色彩。",
}


def figure(file, cap, w, h, cat, meta):
    desc = html.escape(DESCS[cat].format(cap=cap))
    return (f'<figure class="gallery-item" data-cat="{cat}">'
            f'<img loading="lazy" decoding="async" fetchpriority="low" width="{w}" height="{h}" '
            f'data-src="{file}" alt="{html.escape(cap)}" data-desc="{desc}">'
            f'<figcaption><b>{html.escape(cap)}</b><small>{meta}</small></figcaption>'
            f'</figure>')

GROUPS = [
    ("car", "汽车渲染", "CAR RENDERING"),
    ("product", "家电与产品", "APPLIANCE & PRODUCT"),
    ("beauty", "美妆与香水", "BEAUTY & FRAGRANCE"),
    ("home", "家居与静物", "FURNITURE & STILL LIFE"),
    ("interior", "室内空间", "INTERIOR SPACE"),
    ("scene", "场景与概念", "SCENE & CONCEPT"),
]

CATMAP = {"A": "car", "B": "product", "C": "beauty", "D": "home", "E": "interior", "F": "scene"}

counts = {}
for it in man["render"]:
    it["cat"] = CATMAP[it["cat"]]
    counts[it["cat"]] = counts.get(it["cat"], 0) + 1

blocks = []
for key, zh, en in GROUPS:
    items = [i for i in man["render"] if i["cat"] == key]
    if not items:
        continue
    figs = "".join(figure(i["file"], i["cap"], i["w"], i["h"], key, en) for i in items)
    blocks.append(
        f'<div class="work-group reveal" data-cat="{key}">'
        f'<div class="group-head"><h3>{zh}</h3><span>{en} / {len(items):02d}</span></div>'
        f'<div class="gallery">{figs}</div></div>')

concept = [{"file": i["file"], "cap": i["cap"], "w": i["w"], "h": i["h"]} for i in man["concept"]]
cfigs = "".join(figure(i["file"], i["cap"], i["w"], i["h"], "concept", "CONCEPT DESIGN") for i in concept)

filters = [("all", "全部"), ("car", "汽车"), ("product", "产品"), ("beauty", "美妆"),
           ("home", "家居"), ("interior", "室内"), ("scene", "场景"), ("concept", "概念设计")]
filter_html = "".join(
    f'<button class="{"active" if k == "all" else ""}" data-filter="{k}">{n}</button>'
    for k, n in filters)

total = len(man["render"]) + len(concept)

works = head("works.html", "作品 · 小徐", "小徐的渲染作品集：汽车、产品、美妆、室内、场景概念与 360° 全景。")
works += (
    '<section class="page-hero"><div class="shell reveal">'
    '<div class="eyebrow">Visual archive</div>'
    '<h1 class="title">画面记录，<br><span>也是工作轨迹。</span></h1>'
    '<p class="lead">汽车渲染、产品与家居、美妆静物、室内空间与场景概念。所有画面保持原始比例，点击或停留 1.5 秒进入完整预览，每张都附有一句画面说明。</p>'
    f'<div class="hero-specs"><b>{total}</b><span>VISUAL WORKS</span><b>06</b><span>CATEGORIES</span><b>360°</b><span>LIVE PANORAMA</span></div>'
    '</div></section>\n'
    '<section class="section interactive-lab"><div class="shell">'
    '<div class="work-head reveal"><div><div class="eyebrow">01 / Interactive lab</div>'
    '<h2 class="title">不只观看，<br><span>也可以进入画面。</span></h2></div>'
    '<p class="lead">全景与实时内容只在点击后加载，不占用首屏资源。全景为本地素材，通过轻量 WebGL 球面查看器拖动浏览；视频、UE 场景与 glTF 模型可沿用同一个无裁切查看器。</p></div>'
    '<div class="experience-grid reveal">'
    '<button class="experience-card panorama-card" type="button" data-pano="assets/pano/interior.webp"'
    ' data-title="360° 车内全景" data-meta="PANORAMA / INTERIOR"'
    ' data-description="模拟驾驶席视角的车内全景。拖动画面环顾四周，滚轮可缩放视角；全景素材在打开预览时才载入，不影响网站第一次进入速度。">'
    '<img loading="lazy" decoding="async" data-src="assets/pano/interior.webp" alt="360度车内全景预览">'
    '<span class="experience-index">LIVE / 01</span><strong>360° 车内全景</strong>'
    '<small>点击进入 · 拖动环顾车厢 ↗</small></button>'
    '<button class="experience-card ue-card" type="button" data-demo-ready'
    ' data-title="UE 实时场景接口" data-meta="PIXEL STREAMING / GLTF"'
    ' data-description="已为 UE Pixel Streaming、网页 glTF 模型和视频作品预留按需加载入口。素材接入后可在窗口中旋转、查看或播放，不会拖慢普通页面。">'
    '<span class="ue-orb">UE</span><span class="experience-index">READY / 02</span>'
    '<strong>实时演示接口</strong><small>视频 · glTF · Pixel Streaming ↗</small></button>'
    '</div></div></section>\n'
    '<section class="section tint"><div class="shell">'
    '<div class="archive-head reveal"><div><div class="eyebrow">02 / Render works</div>'
    f'<h2>渲染作品 · 无裁切展示</h2></div><p>共 {len(man["render"])} 张，按类别分组；停留 1.5 秒自动预览，点击可固定画面。</p></div>'
    f'<div class="filter-bar reveal">{filter_html}</div>'
    + "".join(blocks) +
    '</div></section>\n'
    '<section class="section"><div class="shell">'
    '<div class="archive-head reveal"><div><div class="eyebrow">03 / Concept design</div>'
    '<h2>概念设计 · 场景与氛围</h2></div><p>场景搭建、材质与光线氛围的概念练习，作为渲染主线之外的补充。</p></div>'
    f'<div class="work-group" data-cat="concept"><div class="gallery">{cfigs}</div></div>'
    '</div></section>\n'
) + foot("Works / Render · Product · Concept")
open(os.path.join(SITE, "works.html"), "w", encoding="utf-8").write(works)

photo_figs = "".join(
    figure(i["file"], i["cap"], i["w"], i["h"], "photo", "SNAPSHOT") for i in man["photo"])
photos = head("photos.html", "拾光 · 小徐", "小徐的影像手记：生活里的光线、表情与随手的记录。")
photos += (
    '<section class="page-hero"><div class="shell reveal">'
    '<div class="eyebrow">Light notes</div>'
    '<h1 class="title">拾光，<br><span>镜头之外的日常。</span></h1>'
    '<p class="lead">生活里顺手按下的光、表情和片刻。不追求参数，只留下当时的样子；点击或停留 1.5 秒可放大查看完整画面。</p>'
    f'<div class="hero-specs"><b>{len(man["photo"]):02d}</b><span>SNAPSHOTS</span><b>100%</b><span>ORIGINAL RATIO</span><b>2</b><span>COLUMNS ON PHONE</span></div>'
    '</div></section>\n'
    '<section class="section tint"><div class="shell">'
    '<div class="archive-head reveal"><div><div class="eyebrow">01 / Daily archive</div>'
    '<h2>日常影像 · 全部保留原比例</h2></div><p>手机随拍为主，全部按原始比例展示，不做裁切。</p></div>'
    f'<div class="gallery photo-gallery">{photo_figs}</div>'
    '</div></section>\n'
    '<section class="cta"><div class="shell reveal"><div class="eyebrow">02 / Continue</div>'
    '<h2 class="title">想看看渲染作品，<br><span>往这边走。</span></h2>'
    '<div class="actions" style="justify-content:center"><a class="button" href="works.html">进入作品页　↗</a></div>'
    '</div></section>\n'
) + foot("Photos / Light Notes")
open(os.path.join(SITE, "photos.html"), "w", encoding="utf-8").write(photos)

print("works.html", os.path.getsize(os.path.join(SITE, "works.html")))
print("photos.html", os.path.getsize(os.path.join(SITE, "photos.html")))
