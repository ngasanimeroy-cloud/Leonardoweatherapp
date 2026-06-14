
(function () {
  'use strict';

  var API = {
    weather: '/weather',
    news: '/news'
  };

  var state = {
    currentTempC: null,
    currentFeelsLikeC: null,
    unit: 'c'
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
        if (els.customTopic) {
          els.customTopic.value = '';
        }
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

  function updateDateTime() {
    if (!els.navDatetime) {
      return;
    }

    var now = new Date();
    var formatted = now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    els.navDatetime.textContent = formatted;
  }

  async function fetchWeather(city) {
    var query = city ? city.trim() : '';

    if (!query) {
      showWeatherError('Enter a city name before searching.');
      return;
    }

    clearWeatherError();
    hideElement(els.weatherResult);
    hideElement(els.weatherEmpty);
    setButtonLoading(els.weatherSearchBtn, els.weatherSpinner, true);

    try {
      var url = API.weather + '?city=' + encodeURIComponent(query);
      var response = await fetch(url);
      var data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data && data.error ? data.error : 'Unable to fetch weather.');
      }

      if (!data || data.error) {
        throw new Error(data && data.error ? data.error : 'Weather response was empty.');
      }

      renderWeather(data);
    } catch (error) {
      showWeatherError(error.message || 'Unable to fetch weather.');
    } finally {
      setButtonLoading(els.weatherSearchBtn, els.weatherSpinner, false);
    }
  }

  async function fetchNews(category, topic) {
    var url = '';

    if (category) {
      url = API.news + '?category=' + encodeURIComponent(category);
    } else {
      var topicValue = topic ? topic.trim() : '';

      if (!topicValue) {
        showNewsError('Enter a custom topic before searching.');
        return;
      }

      url = API.news + '?topic=' + encodeURIComponent(topicValue);
    }

    clearNewsError();
    hideElement(els.newsEmpty);
    els.newsFeed.innerHTML = '';
    setNewsLoading(true);

    try {
      var response = await fetch(url);
      var data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data && data.error ? data.error : 'Unable to fetch headlines.');
      }

      if (!Array.isArray(data)) {
        throw new Error(data && data.error ? data.error : 'News response was not a list.');
      }

      if (data.length === 0) {
        throw new Error('No headlines found.');
      }

      renderNews(data);
    } catch (error) {
      showNewsError(error.message || 'Unable to fetch headlines.');
    } finally {
      setNewsLoading(false);
    }
  }

  async function parseJson(response) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function renderWeather(data) {
    var tempC = Number(data.temp);
    var feelsLikeC = Number(data.feels_like);
    var condition = getWeatherCondition(data.description, data.icon);

    state.currentTempC = Number.isFinite(tempC) ? tempC : null;
    state.currentFeelsLikeC = Number.isFinite(feelsLikeC) ? feelsLikeC : null;

    els.wCity.textContent = data.city || 'Unknown city';
    els.wCountry.textContent = data.country || '';
    els.wDescription.textContent = condition.label + ': ' + (data.description || condition.text);
    els.wIconWrap.setAttribute('title', condition.label);
    els.wIconWrap.setAttribute('aria-label', condition.label);
    els.wEmoji.innerHTML = getWeatherIcon(condition.key);
    els.wTempC.textContent = formatTemperature(state.currentTempC);
    els.wFeels.textContent = formatTemperature(state.currentFeelsLikeC);
    els.wHumidity.textContent = Number.isFinite(Number(data.humidity)) ? data.humidity + '%' : '--';
    els.wWind.textContent = formatWind(data.wind);
    els.wVisibility.textContent = formatVisibility(data.visibility);
    els.wUpdated.textContent = 'Updated ' + formatDateTime(new Date());

    applyWeatherCondition(condition.key);
    showElement(els.weatherResult);
  }

  function renderNews(articles) {
    if (!els.newsFeed) {
      return;
    }

    els.newsFeed.innerHTML = '';

    articles.forEach(function (article) {
      var card = document.createElement('article');
      card.className = 'news-card';

      var source = document.createElement('div');
      source.className = 'news-card-source';
      source.textContent = 'Headline';

      var title = document.createElement('h3');
      title.className = 'news-card-title';

      if (article.url) {
        var link = document.createElement('a');
        link.href = article.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = article.title || 'Untitled headline';
        title.appendChild(link);
      } else {
        title.textContent = article.title || 'Untitled headline';
      }

      var description = document.createElement('p');
      description.className = 'news-card-desc';
      description.textContent = article.description || 'No description available.';

      var meta = document.createElement('div');
      meta.className = 'news-card-meta';
      meta.textContent = 'Open full story';

      card.appendChild(source);
      card.appendChild(title);
      card.appendChild(description);
      card.appendChild(meta);
      els.newsFeed.appendChild(card);
    });

    showElement(els.newsFeed);
  }

  function setTemperatureUnit(unit) {
    state.unit = unit === 'f' ? 'f' : 'c';

    els.btnCelsius.classList.toggle('active', state.unit === 'c');
    els.btnFahrenheit.classList.toggle('active', state.unit === 'f');

    els.wTempC.textContent = formatTemperature(state.currentTempC);
    els.wFeels.textContent = formatTemperature(state.currentFeelsLikeC);
  }

  function setCategoryActive(category) {
    els.tabButtons.forEach(function (button) {
      var isActive = button.getAttribute('data-category') === category;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function applyWeatherCondition(conditionKey) {
    var conditionClasses = [
      'weather-sunny',
      'weather-cloudy',
      'weather-rain',
      'weather-storm',
      'weather-snow',
      'weather-fog',
      'weather-default'
    ];
    var nextClass = 'weather-' + conditionKey;

    conditionClasses.forEach(function (className) {
      if (els.weatherResult) {
        els.weatherResult.classList.remove(className);
      }
    });

    if (els.weatherResult) {
      els.weatherResult.classList.add(nextClass);
    }

    if (els.weatherSplash) {
      els.weatherSplash.className = 'weather-splash ' + nextClass;
    }
  }

  function getWeatherCondition(description, icon) {
    var text = String(description || '').toLowerCase();
    var code = String(icon || '').toLowerCase();

    if (text.indexOf('clear') !== -1 || code.indexOf('01') === 0) {
      return { key: 'sunny', label: 'Sunny', text: 'Sunny' };
    }

    if (text.indexOf('cloud') !== -1 || code.indexOf('02') === 0 || code.indexOf('03') === 0 || code.indexOf('04') === 0) {
      return { key: 'cloudy', label: 'Cloudy', text: 'Cloudy' };
    }

    if (text.indexOf('thunder') !== -1 || text.indexOf('storm') !== -1 || code.indexOf('11') === 0) {
      return { key: 'storm', label: 'Storm', text: 'Storm' };
    }

    if (text.indexOf('rain') !== -1 || text.indexOf('drizzle') !== -1 || code.indexOf('09') === 0 || code.indexOf('10') === 0) {
      return { key: 'rain', label: 'Rain', text: 'Rain' };
    }

    if (text.indexOf('snow') !== -1 || code.indexOf('13') === 0) {
      return { key: 'snow', label: 'Snow', text: 'Snow' };
    }

    if (
      text.indexOf('fog') !== -1 ||
      text.indexOf('mist') !== -1 ||
      text.indexOf('haze') !== -1 ||
      text.indexOf('smoke') !== -1 ||
      text.indexOf('dust') !== -1 ||
      text.indexOf('sand') !== -1 ||
      text.indexOf('ash') !== -1 ||
      text.indexOf('squall') !== -1 ||
      text.indexOf('tornado') !== -1 ||
      code.indexOf('50') === 0
    ) {
      return { key: 'fog', label: 'Fog', text: 'Fog' };
    }

    return { key: 'default', label: 'Weather', text: 'Weather' };
  }

  function getWeatherIcon(conditionKey) {
    var icons = {
      sunny: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="10"/><path d="M32 7v7M32 50v7M7 32h7M50 32h7M14.5 14.5l5 5M44.5 44.5l5 5M49.5 14.5l-5 5M19.5 44.5l-5 5"/></svg>',
      cloudy: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 48h27c7 0 12-5 12-11 0-6-5-11-11-11h-1C42 18 34 12 25 14c-7 1-12 7-13 14-6 1-10 6-10 12 0 5 4 8 16 8z"/></svg>',
      rain: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 35h27c7 0 12-5 12-11 0-6-5-11-11-11h-1C42 5 34 0 25 2c-7 1-12 7-13 14-6 1-10 6-10 12 0 4 3 7 16 7z"/><path d="M20 44l-3 8M32 44l-3 8M44 44l-3 8"/></svg>',
      storm: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 35h27c7 0 12-5 12-11 0-6-5-11-11-11h-1C42 5 34 0 25 2c-7 1-12 7-13 14-6 1-10 6-10 12 0 4 3 7 16 7z"/><path d="M30 38l-8 14h9l-4 10 13-17h-9l5-7z"/></svg>',
      snow: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M32 8v48M12 18l40 28M52 18L12 46"/><path d="M24 13l8 5 8-5M24 51l8-5 8 5M17 24l8 4 4-8M47 40l8 4 4-8M47 24l-8 4-4-8M17 40l-8 4-4-8"/></svg>',
      fog: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 24h40M8 34h48M14 44h36M20 54h24"/></svg>',
      default: '<svg class="weather-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="32" cy="32" r="20"/><path d="M32 16v32M16 32h32"/></svg>'
    };

    return icons[conditionKey] || icons.default;
  }

  function formatTemperature(celsius) {
    if (!Number.isFinite(Number(celsius))) {
      return '--';
    }

    var value = state.unit === 'f' ? Number(celsius) * 9 / 5 + 32 : Number(celsius);
    var unit = state.unit === 'f' ? ' F' : ' C';

    return value.toFixed(1) + unit;
  }

  function formatWind(speed) {
    var value = Number(speed);

    if (!Number.isFinite(value)) {
      return '--';
    }

    return value.toFixed(1) + ' m/s';
  }

  function formatVisibility(meters) {
    var value = Number(meters);

    if (!Number.isFinite(value) || value <= 0) {
      return '--';
    }

    return (value / 1000).toFixed(1) + ' km';
  }

  function formatDateTime(date) {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function showWeatherError(message) {
    els.weatherErrorMsg.textContent = message;
    showElement(els.weatherError);
    hideElement(els.weatherResult);
  }

  function clearWeatherError() {
    hideElement(els.weatherError);
    els.weatherErrorMsg.textContent = '';
  }

  function showNewsError(message) {
    els.newsErrorMsg.textContent = message;
    showElement(els.newsError);
  }

  function clearNewsError() {
    hideElement(els.newsError);
    els.newsErrorMsg.textContent = '';
  }

  function setButtonLoading(button, spinner, isLoading) {
    if (button) {
      button.disabled = isLoading;
    }

    if (spinner) {
      toggleHidden(spinner, !isLoading);
    }
  }

  function setNewsLoading(isLoading) {
    setButtonLoading(els.newsSearchBtn, els.newsSpinner, isLoading);
    toggleHidden(els.newsSkeleton, !isLoading);
  }

  function showElement(element) {
    if (element) {
      element.classList.remove('hidden');
    }
  }

  function hideElement(element) {
    if (element) {
      element.classList.add('hidden');
    }
  }

  function toggleHidden(element, shouldHide) {
    if (!element) {
      return;
    }

    if (shouldHide) {
      element.classList.add('hidden');
    } else {
      element.classList.remove('hidden');
    }
  }
}());
