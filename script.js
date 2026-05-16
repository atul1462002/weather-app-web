const API_KEY = 'a6082051c3f7e5a574cbb0ac50517ed9'; // ⚠️ Replace with your OpenWeatherMap API key

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const themeToggle = document.getElementById('theme-toggle');
const mainContent = document.getElementById('main-content');
const welcomeMessage = document.getElementById('welcome-message');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');

// Weather Elements
const cityNameEl = document.getElementById('city-name');
const dateTimeEl = document.getElementById('date-time');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const sunTimesEl = document.getElementById('sun-times');
const forecastContainer = document.getElementById('forecast-container');

let timeInterval;
let currentTimezoneOffset = 0;

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataByCoords(lat, lon);
            },
            (err) => {
                showError("Unable to retrieve your location. Please allow location access.");
            }
        );
    } else {
        showError("Geolocation is not supported by this browser.");
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

function updateTime() {
    const now = new Date();
    // Calculate time at the specific timezone
    const localTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (currentTimezoneOffset * 1000));

    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const dateStr = localTime.toLocaleDateString('en-US', options);

    let hours = localTime.getHours();
    const minutes = localTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    dateTimeEl.textContent = `${dateStr} | ${hours}:${minutes} ${ampm}`;
}

async function getWeatherData(city) {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError("API Key is missing. Please add your OpenWeather API key in script.js (Line 1)");
        return;
    }

    showLoader();
    try {
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        if (!currentRes.ok) {
            if (currentRes.status === 404) throw new Error('City not found. Please check the spelling.');
            if (currentRes.status === 401) throw new Error('Invalid API Key. Please verify your OpenWeather API Key.');
            throw new Error('Failed to fetch weather data.');
        }
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoader();
    }
}

async function getWeatherDataByCoords(lat, lon) {
    if (API_KEY === 'YOUR_API_KEY_HERE') {
        showError("API Key is missing. Please add your OpenWeather API key in script.js (Line 1)");
        return;
    }

    showLoader();
    try {
        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        if (!currentRes.ok) {
            if (currentRes.status === 401) throw new Error('Invalid API Key.');
            throw new Error('Weather data not found.');
        }
        const currentData = await currentRes.json();

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
        const forecastData = await forecastRes.json();

        updateUI(currentData, forecastData);
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoader();
    }
}

function updateUI(current, forecast) {
    // Hide error and welcome message, show main content
    errorMessage.style.display = 'none';
    welcomeMessage.style.display = 'none';
    mainContent.classList.remove('hidden');

    // Update Time
    currentTimezoneOffset = current.timezone;
    updateTime();
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = setInterval(updateTime, 1000);

    // Update Current Weather
    cityNameEl.textContent = `${current.name}, ${current.sys.country}`;
    temperatureEl.textContent = `${Math.round(current.main.temp)}°C`;
    conditionEl.textContent = current.weather[0].description;
    feelsLikeEl.textContent = `${Math.round(current.main.feels_like)}°C`;
    humidityEl.textContent = `${current.main.humidity}%`;
    windSpeedEl.textContent = `${current.wind.speed} m/s`;
    pressureEl.textContent = `${current.main.pressure} hPa`;
    visibilityEl.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    // Format Sunrise / Sunset
    const getLocalTimeStr = (unixTimestamp, timezoneOffset) => {
        const date = new Date((unixTimestamp + timezoneOffset) * 1000);
        let h = date.getUTCHours();
        let m = date.getUTCMinutes().toString().padStart(2, '0');
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${m} ${ampm}`;
    };

    const sr = getLocalTimeStr(current.sys.sunrise, current.timezone);
    const ss = getLocalTimeStr(current.sys.sunset, current.timezone);
    sunTimesEl.textContent = `${sr} / ${ss}`;

    // Icon mapping
    const iconCode = current.weather[0].icon;
    weatherIconEl.src = getAnimatedIcon(iconCode);

    // Update background based on weather condition
    updateBackground(current.weather[0].id);

    // Update Forecast
    updateForecast(forecast.list, current.timezone);
}

function updateForecast(forecastList, timezoneOffset) {
    forecastContainer.innerHTML = '';

    // Filter to get 1 reading per day (e.g., at 12:00:00)
    const dailyData = forecastList.filter(item => item.dt_txt.includes('12:00:00'));

    // If we don't have exactly 5, just take the first 5 available unique days
    let daysToShow = dailyData.length >= 5 ? dailyData.slice(0, 5) : dailyData;

    if (daysToShow.length < 5) {
        const existingDates = daysToShow.map(item => item.dt_txt.split(' ')[0]);
        for (let item of forecastList) {
            const dateStr = item.dt_txt.split(' ')[0];
            if (!existingDates.includes(dateStr)) {
                daysToShow.push(item);
                existingDates.push(dateStr);
            }
            if (daysToShow.length === 5) break;
        }
    }

    // Sort by date
    daysToShow.sort((a, b) => a.dt - b.dt);

    daysToShow.forEach(day => {
        const date = new Date((day.dt + timezoneOffset) * 1000);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];

        const temp = Math.round(day.main.temp);
        const iconCode = day.weather[0].icon;
        const iconSrc = getAnimatedIcon(iconCode);

        const item = document.createElement('div');
        item.classList.add('forecast-item');
        item.innerHTML = `
            <h4>${dayName}</h4>
            <img src="${iconSrc}" alt="weather">
            <p>${temp}°C</p>
        `;
        forecastContainer.appendChild(item);
    });
}

function getAnimatedIcon(code) {
    // Map OpenWeather codes to animated SVGs
    const iconMap = {
        '01d': 'clear-day.svg',
        '01n': 'clear-night.svg',
        '02d': 'partly-cloudy-day.svg',
        '02n': 'partly-cloudy-night.svg',
        '03d': 'cloudy.svg',
        '03n': 'cloudy.svg',
        '04d': 'overcast.svg',
        '04n': 'overcast.svg',
        '09d': 'rain.svg',
        '09n': 'rain.svg',
        '10d': 'partly-cloudy-day-rain.svg',
        '10n': 'partly-cloudy-night-rain.svg',
        '11d': 'thunderstorms.svg',
        '11n': 'thunderstorms.svg',
        '13d': 'snow.svg',
        '13n': 'snow.svg',
        '50d': 'mist.svg',
        '50n': 'mist.svg'
    };

    const fileName = iconMap[code] || 'clear-day.svg';
    return `https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg/${fileName}`;
}

function updateBackground(weatherId) {
    document.body.className = document.body.className.replace(/weather-\w+/g, '').trim();

    let weatherClass = 'weather-default';

    if (weatherId >= 200 && weatherId < 600) {
        weatherClass = 'weather-rainy'; // Thunderstorm, Drizzle, Rain
    } else if (weatherId >= 600 && weatherId < 700) {
        weatherClass = 'weather-snowy'; // Snow
    } else if (weatherId >= 700 && weatherId < 800) {
        weatherClass = 'weather-cloudy'; // Atmosphere (Mist, Smoke, etc.)
    } else if (weatherId === 800) {
        weatherClass = 'weather-sunny'; // Clear
    } else if (weatherId > 800) {
        weatherClass = 'weather-cloudy'; // Clouds
    }

    document.body.classList.add(weatherClass);
}

function showLoader() {
    loader.classList.add('active');
}

function hideLoader() {
    loader.classList.remove('active');
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = 'block';

    // Clear the error message after 5 seconds automatically
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Check for default city on load
window.addEventListener('load', () => {
    if (API_KEY !== 'YOUR_API_KEY_HERE') {
        getWeatherData('London');
    }
});
