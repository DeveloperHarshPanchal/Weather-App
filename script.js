const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const searchForm = document.querySelector("[data-searchForm]");
const searchInput = document.querySelector("[data-searchInput]");
const loadingScreen = document.querySelector(".loading-container");
const userInfoContainer = document.querySelector(".user-info-container");
const forecastContainer = document.getElementById("forecast");
const recentCitiesContainer = document.getElementById("recentCitiesContainer");
const recentCities = document.getElementById("recentCities");

const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const description = document.getElementById("description");
const temperature = document.getElementById("temperature");
const humidityVal = document.getElementById("humidityVal");
const windVal = document.getElementById("windVal");

const API_KEY = "d1845658f92b31c64bd94f06f7188c9c";

let currentTab = userTab;

// Remove inactive styles (to avoid class conflict)
currentTab.classList.remove("bg-white", "text-blue-600");

// Add active styles
currentTab.classList.add("bg-blue-600", "text-white");

// Switch Tabs
userTab.addEventListener("click", () => switchTab(userTab));
searchTab.addEventListener("click", () => switchTab(searchTab));

function switchTab(clickedTab) {
  if (clickedTab !== currentTab) {
    // Remove active styles from old tab
    currentTab.classList.remove("bg-blue-600", "text-white");
    currentTab.classList.add("bg-white", "text-blue-600");

    // Add active styles to new tab
    clickedTab.classList.remove("bg-white", "text-blue-600");
    clickedTab.classList.add("bg-blue-600", "text-white");

    // Update current tab
    currentTab = clickedTab;

    if (clickedTab === userTab) {
      searchForm.classList.add("hidden");
      recentCitiesContainer.classList.add("hidden");
      userInfoContainer.classList.add("hidden");
      forecastContainer.classList.add("hidden");
      getLocationWeather();
    } else {
      searchForm.classList.remove("hidden");
      recentCitiesContainer.classList.remove("hidden");
      userInfoContainer.classList.add("hidden");
      forecastContainer.classList.add("hidden");
      renderRecentCities();
    }
  }
}

// Get Weather for Current Location
function getLocationWeather() {
  loadingScreen.classList.remove("hidden");
  loadingScreen.querySelector("p").textContent =
    "📍 Please allow location access...";
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude);
      },
      (error) => {
        loadingScreen.classList.add("hidden");
        alert("❌ Location access denied or unavailable.");
      }
    );
  } else {
    loadingScreen.classList.add("hidden");
    alert("Geolocation is not supported by this browser.");
  }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      ),
    ]);
    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();
    displayWeatherData(weatherData);
    displayForecast(forecastData);
  } catch (error) {
    alert("⚠️ Failed to load weather data.");
  } finally {
    loadingScreen.classList.add("hidden");
  }
}

// Fetch Weather by City Name
async function fetchWeatherByCity(city) {
  loadingScreen.classList.remove("hidden");
  loadingScreen.querySelector("p").textContent = "⏳ Loading weather data...";

  userInfoContainer.classList.add("hidden");
  forecastContainer.classList.add("hidden");

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      ),
    ]);
    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod === "404") {
      alert("City not found!");
    } else {
      displayWeatherData(weatherData);
      displayForecast(forecastData);
    }
  } catch (error) {
    alert("⚠️ Error fetching city weather.");
  } finally {
    loadingScreen.classList.add("hidden");
  }
}

// Display Current Weather
function displayWeatherData(data) {
  if (!data || data.cod !== 200) return;

  cityName.textContent = data.name;
  weatherIcon.src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  description.textContent = data.weather[0].description;
  temperature.textContent = `${data.main.temp.toFixed(1)}°C`;
  humidityVal.textContent = data.main.humidity;
  windVal.textContent = data.wind.speed;

  userInfoContainer.classList.remove("hidden");
}

// Display 5-Day Forecast
function displayForecast(data) {
  if (!data || !data.list) return;

  const days = {};

  data.list.forEach((entry) => {
    const date = entry.dt_txt.split(" ")[0];
    if (!days[date] && entry.dt_txt.includes("12:00:00")) {
      days[date] = entry;
    }
  });

  forecastContainer.innerHTML = "";
  Object.values(days)
    .slice(0, 5)
    .forEach((day) => {
      const card = document.createElement("div");
      card.className = "glass p-4 text-center rounded-lg";

      const date = new Date(day.dt_txt).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      card.innerHTML = `
      <h3 class="font-bold mb-2">${date}</h3>
      <img src="http://openweathermap.org/img/wn/${
        day.weather[0].icon
      }@2x.png" class="w-16 mx-auto mb-1" />
      <p class="capitalize">${day.weather[0].description}</p>
      <p>🌡️ ${day.main.temp.toFixed(1)}°C</p>
      <p>💧 ${day.main.humidity}%</p>
      <p>💨 ${day.wind.speed} km/h</p>
    `;
      forecastContainer.appendChild(card);
    });

  forecastContainer.classList.remove("hidden");
}

// Handle Search Form
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = searchInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
    saveToRecent(city);
    searchInput.value = "";
  }
});

// Save & Render Recent Searches
function saveToRecent(city) {
  let recent = JSON.parse(localStorage.getItem("recentCities")) || [];
  recent = recent.filter((c) => c.toLowerCase() !== city.toLowerCase());
  recent.unshift(city);
  if (recent.length > 5) recent.pop();
  localStorage.setItem("recentCities", JSON.stringify(recent));
  renderRecentCities();
}

function renderRecentCities() {
  const recent = JSON.parse(localStorage.getItem("recentCities")) || [];
  recentCities.innerHTML = "";
  recent.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
}

recentCities.addEventListener("change", (e) => {
  const city = e.target.value;
  if (city) {
    fetchWeatherByCity(city);
  }
});

// Init on load
window.addEventListener("load", () => {
  renderRecentCities();
  getLocationWeather();
});
