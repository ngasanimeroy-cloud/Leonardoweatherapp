# Web Services Laboratory Exam

Flask web application integrating OpenWeatherMap and NewsAPI to display current weather alongside technology headlines.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
python app.py
```

Open http://127.0.0.1:5000 in your browser.

## API Keys

Set `OWM_KEY` and `NEWS_KEY` as environment variables. You can create a `.env` file (use `.env.example` as a template) or set them in your deployment platform's configuration.

## Heroku Deployment

- The `Procfile` starts Flask with `flask run --host=0.0.0.0 --port=$PORT`.
- Add your API keys as config vars (OWM_KEY and NEWS_KEY) in Heroku, or create a `.env` file.
- Install dependencies from `requirements.txt`.

## PythonAnywhere Deployment

1. **WSGI Configuration**: In the PythonAnywhere Web tab, copy the content from `pythonanywhere_wsgi.py` to your WSGI configuration file. Update the paths to use your actual username.

2. **Environment Variables**: Create a `.env` file (use `.env.example` as a template) with your API keys, or set them in the PythonAnywhere Web tab's Environment Variables section.

3. **Static Files**: Map the `/static/` URL to your project's `static` directory in the Web tab's Static Files section.

4. **Reload**: After making changes to files or environment variables, click "Reload" in the PythonAnywhere Web tab for changes to take effect.
