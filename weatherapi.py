import requests
from telegram import Update
from telegram.ext import Application, MessageHandler, ContextTypes, filters

BOT_TOKEN = "YOUR_BOT_TOKEN"
WEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY"

async def weather(update: Update, context: ContextTypes.DEFAULT_TYPE):
    city = update.message.text.strip()

    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={WEATHER_API_KEY}&units=metric"
    )

    try:
        data = requests.get(url).json()

        if data.get("cod") != 200:
            await update.message.reply_text("❌ City not found!")
            return

        name = data["name"]
        temp = data["main"]["temp"]
        feels = data["main"]["feels_like"]
        humidity = data["main"]["humidity"]
        weather = data["weather"][0]["description"]

        msg = (
            f"🌍 City: {name}\n"
            f"🌡 Temperature: {temp}°C\n"
            f"🤗 Feels Like: {feels}°C\n"
            f"💧 Humidity: {humidity}%\n"
            f"☁ Weather: {weather.title()}"
        )

        await update.message.reply_text(msg)

    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, weather))

    print("Bot Started...")
    app.run_polling()

if __name__ == "__main__":
    main()