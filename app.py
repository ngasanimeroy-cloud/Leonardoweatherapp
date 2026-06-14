from flask import Flask, jsonify, render_template, request
from urllib.parse import quote
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# FIX: Enable frontend visibility (CORS is the main cause of "no display")
CORS(app)

# ----------------------------------------------------------------------------- 
# API KEYS
# -----------------------------------------------------------------------------
OWM_KEY = os.getenv("OWM_KEY")
NEWS_KEY = os.getenv("NEWS_KEY")


# ----------------------------------------------------------------------------- 
# HOME PAGE
# -----------------------------------------------------------------------------
@app.route("/")
def home():
    return render_template("index.html")


# ----------------------------------------------------------------------------- 
# WEATHER API ROUTE
# -----------------------------------------------------------------------------
@app.route("/weather")
def weather():
    city = request.args.get("city")

    if not city:
        return jsonify({"error": "City is required"}), 400

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={quote(city)}&appid={OWM_KEY}&units=metric"
    )

    try:
        response = requests.get(url, timeout=10)
        response_data = response.json()

        if response_data.get("cod") != 200:
            return jsonify({
                "error": response_data.get("message", "Weather API error")
            }), 400

        weather_data = response_data["weather"][0]
        main_data = response_data["main"]

        return jsonify({
            "city": response_data["name"],
            "temp": main_data["temp"],
            "feels_like": main_data["feels_like"],
            "humidity": main_data["humidity"],
            "wind": response_data["wind"]["speed"],
            "visibility": response_data.get("visibility"),
            "description": weather_data["description"],
            "country": response_data["sys"]["country"],
            "icon": weather_data["icon"]
        })

    except Exception as err:
        return jsonify({"error": str(err)}), 500


# ----------------------------------------------------------------------------- 
# NEWS API ROUTE
# -----------------------------------------------------------------------------
@app.route("/news")
def news():
    category = request.args.get("category")
    topic = request.args.get("topic")

    if category:
        url = (
            "https://newsapi.org/v2/top-headlines"
            f"?category={quote(category)}&country=us&language=en"
            f"&apiKey={NEWS_KEY}&pageSize=3"
        )
    else:
        query = quote(topic or "technology")
        url = (
            "https://newsapi.org/v2/everything"
            f"?q={query}&language=en&apiKey={NEWS_KEY}&pageSize=3"
        )

    try:
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return jsonify({"error": "News API error"}), 400

        response_data = response.json()

        if response_data.get("status") != "ok":
            return jsonify({
                "error": response_data.get("message", "News API error")
            }), 400

        articles = response_data.get("articles", [])[:3]

        if not articles:
            return jsonify({"error": "No headlines found"}), 404

        return jsonify([
            {
                "title": article["title"],
                "description": article.get("description", ""),
                "url": article["url"]
            }
            for article in articles
        ])

    except Exception as err:
        return jsonify({"error": str(err)}), 500


# ----------------------------------------------------------------------------- 
# DASHBOARD API ROUTE
# -----------------------------------------------------------------------------
@app.route("/dashboard")
def dashboard():
    city = request.args.get("city", "Tacloban")
    topic = request.args.get("topic", "technology")

    weather_url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?q={quote(city)}&appid={OWM_KEY}&units=metric"
    )

    news_url = (
        "https://newsapi.org/v2/everything"
        f"?q={quote(topic)}&apiKey={NEWS_KEY}&pageSize=3"
    )

    try:
        weather_res = requests.get(weather_url, timeout=10).json()
        news_res = requests.get(news_url, timeout=10).json()

        # FIX: prevent crash if API fails (main visibility breaker)
        weather_safe = {}
        if weather_res.get("cod") == 200:
            weather_safe = {
                "city": weather_res["name"],
                "temp": weather_res["main"]["temp"],
                "feels_like": weather_res["main"]["feels_like"],
                "humidity": weather_res["main"]["humidity"],
                "description": weather_res["weather"][0]["description"],
                "country": weather_res["sys"]["country"]
            }

        news_safe = [
            {
                "title": article["title"],
                "description": article.get("description", ""),
                "url": article["url"]
            }
            for article in news_res.get("articles", [])[:3]
        ]

        return jsonify({
            "weather": weather_safe,
            "news": news_safe
        })

    except Exception as err:
        return jsonify({"error": str(err)}), 500


# ----------------------------------------------------------------------------- 
# RUN SERVER
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)