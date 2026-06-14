from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from urllib.parse import quote
from dotenv import load_dotenv
import requests
import os
import time
from typing import Any, Dict, List

load_dotenv()

app = Flask(__name__)
CORS(app)

OWM_KEY = os.getenv("OWM_KEY")
NEWS_KEY = os.getenv("NEWS_KEY")

cache: Dict[str, Any] = {}
CACHE_TTL = 60


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/weather")
def weather():
    city = request.args.get("city")
    if not city:
        return jsonify({"error": "City is required"}), 400

    cache_key = f"weather_{city.lower().strip()}"
    now = time.time()

    if cache_key in cache:
        data, ts = cache[cache_key]
        if now - ts < CACHE_TTL:
            return jsonify(data)

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={quote(city)}&appid={OWM_KEY}&units=metric"
    )

    try:
        res = requests.get(url, timeout=10)
        data: Dict[str, Any] = res.json()

        if data.get("cod") != 200:
            return jsonify({"error": data.get("message", "Weather error")}), 400

        w: Dict[str, Any] = data["weather"][0]
        m: Dict[str, Any] = data["main"]

        result: Dict[str, Any] = {
            "city": data.get("name"),
            "temp": m.get("temp"),
            "feels_like": m.get("feels_like"),
            "humidity": m.get("humidity"),
            "wind": data.get("wind", {}).get("speed"),
            "visibility": data.get("visibility"),
            "description": w.get("description"),
            "country": data.get("sys", {}).get("country"),
            "icon": w.get("icon")
        }

        cache[cache_key] = (result, now)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/news")
def news():
    category = request.args.get("category")
    topic = request.args.get("topic", "technology")

    cache_key = f"news_{(category or topic).lower().strip()}"
    now = time.time()

    if cache_key in cache:
        data, ts = cache[cache_key]
        if now - ts < CACHE_TTL:
            return jsonify(data)

    if category:
        url = (
            "https://newsapi.org/v2/top-headlines"
            f"?category={quote(category)}&country=us"
            f"&apiKey={NEWS_KEY}&pageSize=3"
        )
    else:
        url = (
            "https://newsapi.org/v2/everything"
            f"?q={quote(topic)}&language=en"
            f"&apiKey={NEWS_KEY}&pageSize=3"
        )

    try:
        res = requests.get(url, timeout=10)
        data: Dict[str, Any] = res.json()

        if data.get("status") != "ok":
            return jsonify({"error": data.get("message", "News error")}), 400

        articles: List[Dict[str, Any]] = data.get("articles", [])

        result: List[Dict[str, Any]] = []
        for a in articles[:3]:
            article: Dict[str, Any] = {
                "title": a.get("title"),
                "description": a.get("description", ""),
                "url": a.get("url")
            }
            result.append(article)

        cache[cache_key] = (result, now)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/dashboard")
def dashboard():
    city = request.args.get("city", "Tacloban")
    topic = request.args.get("topic", "technology")

    cache_key = f"dashboard_{city}_{topic}".lower().strip()
    now = time.time()

    if cache_key in cache:
        data, ts = cache[cache_key]
        if now - ts < CACHE_TTL:
            return jsonify(data)

    weather_url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={quote(city)}&appid={OWM_KEY}&units=metric"
    )

    news_url = (
        "https://newsapi.org/v2/everything"
        f"?q={quote(topic)}&apiKey={NEWS_KEY}&pageSize=3"
    )

    try:
        w_res = requests.get(weather_url, timeout=10)
        n_res = requests.get(news_url, timeout=10)

        w_data: Dict[str, Any] = {}
        n_data: Dict[str, Any] = {}

        try:
            w_data = w_res.json()
        except:
            pass

        try:
            n_data = n_res.json()
        except:
            pass

        weather: Dict[str, Any] = {}
        if w_res.status_code == 200 and w_data.get("cod") == 200:
            weather = {
                "city": w_data["name"],
                "temp": w_data["main"]["temp"],
                "feels_like": w_data["main"]["feels_like"],
                "humidity": w_data["main"]["humidity"],
                "description": w_data["weather"][0]["description"],
                "country": w_data["sys"]["country"]
            }

        news: List[Dict[str, Any]] = []
        if n_data.get("articles"):
            for a in n_data["articles"][:3]:
                news.append({
                    "title": a.get("title"),
                    "description": a.get("description", ""),
                    "url": a.get("url")
                })

        result: Dict[str, Any] = {
            "weather": weather,
            "news": news
        }

        cache[cache_key] = (result, now)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)