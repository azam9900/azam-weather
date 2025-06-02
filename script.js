const API_KEY = '5bde1ffbee0345c6f1afbc07b255421f'; // Replace with your OpenWeatherMap API key

function kelvinToCelsius(kelvin) {
  return kelvin - 273.15;
}

function degToCompass(num) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
               "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

function formatDate(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const options = { weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false };
  return date.toLocaleString('en-US', options);
}

function formatTime(timestamp, timezoneOffset) {
  const date = new Date((timestamp + timezoneOffset) * 1000);
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return date.toLocaleString('en-US', options);
}

function mapWeatherData(apiData, forecastData) {
  const timezoneOffset = apiData.timezone;
  return {
    current: {
      temp: kelvinToCelsius(apiData.main.temp),
      dateTime: formatDate(apiData.dt, timezoneOffset),
      condition: apiData.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${apiData.weather[0].icon}@4x.png`,
      location: `${apiData.name}, ${apiData.sys.country}`,
      pressure: apiData.main.pressure,
      windSpeed: apiData.wind.speed,
      windDirection: degToCompass(apiData.wind.deg),
      sunrise: formatTime(apiData.sys.sunrise, timezoneOffset),
      sunset: formatTime(apiData.sys.sunset, timezoneOffset),
      humidity: apiData.main.humidity,
      humidityText: apiData.main.humidity < 30 ? 'Low Humidity' : (apiData.main.humidity < 60 ? 'Moderate Humidity' : 'High Humidity'),
      visibility: apiData.visibility / 1000,
      visibilityText: apiData.visibility > 10000 ? 'Excellent' : 'Poor',
      feelsLike: kelvinToCelsius(apiData.main.feels_like),
      feelsLikeText: kelvinToCelsius(apiData.main.feels_like) > 30 ? 'Hot' : 'Comfortable',
    },
    forecast: forecastData.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5).map(item => ({
      date: item.dt_txt.split(' ')[0],
      temp: kelvinToCelsius(item.main.temp).toFixed(1),
      desc: item.weather[0].main,
      icon: item.weather[0].icon ? `https://openweathermap.org/img/wn/${item.weather[0].icon}.png` : '',
    })),
  };
}

const cityImages = {
  'Pune': '../sun6.jpg',
  'Rajkot': '../sun6.jpg',
  'Khusairy': '../sun6.jpg',
};

function updateDashboard(data) {
  // Update current weather
  document.querySelector('.temperature').textContent = `${data.current.temp.toFixed(2)} °C`;
  document.querySelector('.date-time').textContent = data.current.dateTime;

  // Check for clear sky condition and city image
  const cityName = data.current.location.split(',')[0];
  const conditionLower = data.current.condition.toLowerCase();
  if (conditionLower.includes('clear') && cityImages[cityName]) {
    document.querySelector('.weather-icon img').src = cityImages[cityName];
    document.querySelector('.weather-icon img').alt = `Clear sky in ${cityName}`;
  } else {
    document.querySelector('.weather-icon img').src = data.current.icon;
    document.querySelector('.weather-icon img').alt = data.current.condition;
  }

  document.querySelector('.weather-description .condition-text').textContent = data.current.condition;
  document.querySelector('.weather-description .location').textContent = data.current.location;

  // Update highlights
  document.querySelector('.pressure-value').textContent = `${data.current.pressure} hPa`;
  document.querySelector('.wind-speed').innerHTML = `${data.current.windSpeed} <span>m/s</span>`;
  document.querySelector('.wind-direction').textContent = data.current.windDirection + ' →';
  document.querySelector('.sunrise').innerHTML = `<span class="icon">☀️</span> ${data.current.sunrise}`;
  document.querySelector('.sunset').innerHTML = `<span class="icon">🌙</span> ${data.current.sunset}`;
  document.querySelector('.humidity-value').textContent = `${data.current.humidity}%`;
  document.querySelector('.humidity-text').innerHTML = `<strong>${data.current.humidityText}</strong> 🌵`;
  document.querySelector('.visibility-value').textContent = `${data.current.visibility} km`;
  document.querySelector('.visibility-text').textContent = data.current.visibilityText + ' 😎';
  document.querySelector('.feels-value').textContent = `${data.current.feelsLike.toFixed(2)} °C`;
  document.querySelector('.feels-text').innerHTML = `${data.current.feelsLikeText} 🔥`;

  // Update forecast
  const forecastContainer = document.querySelector('.forecast-grid');
  forecastContainer.innerHTML = '';
  data.forecast.forEach(day => {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="date">${day.date}</div>
      <div class="icon"><img src="${day.icon}" alt="${day.desc}" /></div>
      <div class="temp">${day.temp}&deg;C</div>
      <div class="desc">${day.desc}</div>
    `;
    forecastContainer.appendChild(card);
  });
}

async function fetchWeather(city) {
  try {
    const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`);
    if (!currentRes.ok) throw new Error('City not found');
    const currentData = await currentRes.json();

    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}`);
    if (!forecastRes.ok) throw new Error('Forecast not found');
    const forecastData = await forecastRes.json();

    const mappedData = mapWeatherData(currentData, forecastData);
    updateDashboard(mappedData);
  } catch (error) {
    alert(error.message);
  }
}

function handleSearch() {
  const input = document.querySelector('.search-box input');
  const city = input.value.trim();
  if (!city) {
    alert('Please enter a city name');
    return;
  }
  fetchWeather(city);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize with a default city
  fetchWeather('Khusairy');

  const searchBtn = document.querySelector('.search-btn');
  const searchInput = document.querySelector('.search-box input');

  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
});
