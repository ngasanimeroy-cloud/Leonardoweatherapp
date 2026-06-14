(function () {
  'use strict';

  var API = {
    weather: '/weather',
    news: '/news'
  };

  var state = {
    currentTempC: null,
    currentFeelsLikeC: null,
    unit: 'c',
    weatherRequestId: 0,
    newsRequestId: 0
  };

  var els = {};

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    cacheElements();
    bindEvents();
    loadDefaultDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
  }

  function cacheElements() {
    els.navDatetime = document.getElementById('nav-datetime');

    els.cityInput = document.getElementById('city-input');
    els.weatherSearchBtn = document.getElementById('weather-search-btn');
    els.weatherSpinner = document.getElementById('weather-spinner');
    els.weatherError = document.getElementById('weather-error');
    els.weatherErrorMsg = document.getElementById('weather-error-msg');
    els.weatherResult = document.getElementById('weather-result');
    els.weatherSplash = document.getElementById('weather-splash');
    els.weatherEmpty = document.getElementById('weather-empty');

    els.wCity = document.getElementById('w-city');
    els.wCountry = document.getElementById('w-country');
    els.wDescription = document.getElementById('w-description');
    els.wIconWrap = document.getElementById('w-icon-wrap');
    els.wEmoji = document.getElementById('w-emoji');

    els.wTempC = document.getElementById('w-temp-c');
    els.btnCelsius = document.getElementById('btn-celsius');
    els.btnFahrenheit = document.getElementById('btn-fahrenheit');

    els.wFeels = document.getElementById('w-feels');
    els.wHumidity = document.getElementById('w-humidity');
    els.wWind = document.getElementById('w-wind');
    els.wVisibility = document.getElementById('w-visibility');
    els.wUpdated = document.getElementById('w-updated');

    els.tabButtons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
    els.customTopic = document.getElementById('custom-topic');
    els.newsSearchBtn = document.getElementById('news-search-btn');
    els.newsSpinner = document.getElementById('news-spinner');
    els.newsError = document.getElementById('news-error');
    els.newsErrorMsg = document.getElementById('news-error-msg');
    els.newsFeed = document.getElementById('news-feed');
    els.newsSkeleton = document.getElementById('news-skeleton');
    els.newsEmpty = document.getElementById('news-empty');
  }

  function bindEvents() {
    if (els.weatherSearchBtn) {
      els.weatherSearchBtn.addEventListener('click', function () {
        fetchWeather(els.cityInput.value);
      });
    }

    if (els.cityInput) {
      els.cityInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          fetchWeather(els.cityInput.value);
        }
      });
    }

    if (els.btnCelsius) {
      els.btnCelsius.addEventListener('click', function () {
        setTemperatureUnit('c');
      });
    }

    if (els.btnFahrenheit) {
      els.btnFahrenheit.addEventListener('click', function () {
        setTemperatureUnit('f');
      });
    }

    els.tabButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var category = button.getAttribute('data-category');
        setCategoryActive(category);
        if (els.customTopic) els.customTopic.value = '';
        fetchNews(category, null);
      });
    });

    if (els.newsSearchBtn) {
      els.newsSearchBtn.addEventListener('click', function () {
        fetchNews(null, els.customTopic.value);
      });
    }

    if (els.customTopic) {
      els.customTopic.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          fetchNews(null, els.customTopic.value);
        }
      });
    }
  }

  function loadDefaultDashboard() {
    fetchWeather('Tacloban');
    fetchNews('technology', null);
  }

  function updateDateTime() {
    if (!els.navDatetime) return;

    var now = new Date();
    els.navDatetime.textContent = now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // 🌦️ NEW: Weather icon mapper
  function getWeatherEmoji(description) {
    if (!description) return '❓';

    var d = description.toLowerCase();

    if (d.includes('clear')) return '☀️';
    if (d.includes('cloud')) return '☁️';
    if (d.includes('rain')) return '🌧️';
    if (d.includes('drizzle')) return '🌦️';
    if (d.includes('thunder')) return '⛈️';
    if (d.includes('snow')) return '❄️';
    if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return '🌫️';

    return '🌡️';
  }

  async function fetchWeather(city) {
    var query = city ? city.trim() : '';
    if (!query) return showWeatherError('Enter a city name before searching.');

    var requestId = ++state.weatherRequestId;

    clearWeatherError();
    hideElement(els.weatherResult);
    setButtonLoading(els.weatherSearchBtn, els.weatherSpinner, true);

    try {
      var response = await fetch(API.weather + '?city=' + encodeURIComponent(query));
      var data = await parseJson(response);

      if (requestId !== state.weatherRequestId) return;

      if (!response.ok || !data || data.error) {
        throw new Error((data && data.error) || 'Unable to fetch weather.');
      }

      renderWeather(data);
    } catch (err) {
      if (requestId !== state.weatherRequestId) return;
      showWeatherError(err.message);
    } finally {
      setButtonLoading(els.weatherSearchBtn, els.weatherSpinner, false);
    }
  }

  function renderWeather(data) {
    state.currentTempC = Number(data.temp);
    state.currentFeelsLikeC = Number(data.feels_like);

    els.wCity.textContent = data.city || 'Unknown';
    els.wCountry.textContent = data.country || '';
    els.wDescription.textContent = data.description || 'No description';

    // 🌟 FIX: icon now actually renders
    if (els.wEmoji) {
      els.wEmoji.textContent = getWeatherEmoji(data.description);
    }

    els.wTempC.textContent = formatTemperature(state.currentTempC);
    els.wFeels.textContent = formatTemperature(state.currentFeelsLikeC);
    els.wHumidity.textContent = data.humidity != null ? data.humidity + '%' : '--';
    els.wWind.textContent = data.wind != null ? data.wind + ' m/s' : '--';
    els.wVisibility.textContent = data.visibility ? (data.visibility / 1000).toFixed(1) + ' km' : '--';

    els.wUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString();

    showElement(els.weatherResult);
  }

  async function fetchNews(category, topic) {
    var url = category
      ? API.news + '?category=' + encodeURIComponent(category)
      : API.news + '?topic=' + encodeURIComponent((topic || '').trim());

    if (!category && !topic?.trim()) {
      return showNewsError('Enter a custom topic before searching.');
    }

    var requestId = ++state.newsRequestId;

    clearNewsError();
    els.newsFeed.innerHTML = '';
    setNewsLoading(true);

    try {
      var response = await fetch(url);
      var data = await parseJson(response);

      if (requestId !== state.newsRequestId) return;

      if (!response.ok || !data || data.error) {
        throw new Error((data && data.error) || 'Unable to fetch headlines.');
      }

      if (!Array.isArray(data)) {
        throw new Error('News response invalid.');
      }

      renderNews(data);
    } catch (err) {
      if (requestId !== state.newsRequestId) return;
      showNewsError(err.message);
    } finally {
      setNewsLoading(false);
    }
  }

  async function parseJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  function renderNews(list) {
    els.newsFeed.innerHTML = '';

    list.forEach(function (a) {
      var card = document.createElement('article');
      card.className = 'news-card';

      card.innerHTML =
        '<h3 class="news-card-title">' +
        (a.url ? '<a target="_blank" href="' + a.url + '">' + (a.title || '') + '</a>' : (a.title || '')) +
        '</h3>' +
        '<p class="news-card-desc">' + (a.description || '') + '</p>';

      els.newsFeed.appendChild(card);
    });

    showElement(els.newsFeed);
  }

  function setTemperatureUnit(unit) {
    state.unit = unit;

    els.btnCelsius.classList.toggle('active', unit === 'c');
    els.btnFahrenheit.classList.toggle('active', unit === 'f');

    renderWeather({
      temp: state.currentTempC,
      feels_like: state.currentFeelsLikeC
    });
  }

  function formatTemperature(c) {
    if (!Number.isFinite(c)) return '--';
    var v = state.unit === 'f' ? (c * 9) / 5 + 32 : c;
    return v.toFixed(1) + (state.unit === 'f' ? ' F' : ' C');
  }

  function setCategoryActive(cat) {
    els.tabButtons.forEach(function (b) {
      var active = b.getAttribute('data-category') === cat;
      b.classList.toggle('active', active);
    });
  }

  function setButtonLoading(btn, spin, loading) {
    if (btn) btn.disabled = loading;
    if (spin) spin.classList.toggle('hidden', !loading);
  }

  function setNewsLoading(v) {
    setButtonLoading(els.newsSearchBtn, els.newsSpinner, v);
  }

  function showElement(el) {
    if (el) el.classList.remove('hidden');
  }

  function hideElement(el) {
    if (el) el.classList.add('hidden');
  }

  function showWeatherError(msg) {
    if (els.weatherErrorMsg) els.weatherErrorMsg.textContent = msg;
    showElement(els.weatherError);
  }

  function clearWeatherError() {
    hideElement(els.weatherError);
  }

  function showNewsError(msg) {
    if (els.newsErrorMsg) els.newsErrorMsg.textContent = msg;
    showElement(els.newsError);
  }

  function clearNewsError() {
    hideElement(els.newsError);
  }

})();