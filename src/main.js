const BASE_URL_OWM_ICONS = "https://openweathermap.org/img/wn/";
const API_KEY = "25564df1c8dad9938ea89a52e68a0135";
const BASE_URL_GEO = "https://api.openweathermap.org/geo/1.0/direct";
const BASE_URL_WEATHER = "https://api.openweathermap.org/data/2.5/weather";
const BASE_URL_ONECALL = "https://api.openweathermap.org/data/2.5/forecast";

const weather = document.querySelector(".container");
const form = document.querySelector(".form");
const geoBtn = document.querySelector(".location");

weather.innerHTML = `
<div class="placeholder">
    <h1>Your Weather Companion</h1>
    <p class="descr-placeholder">Want to know the weather? Enter your city or allow geolocation and see the forecast for the next 5 days!</p>
  </div>
`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const cityValue = form.elements.query.value.trim().toLowerCase();

  if (cityValue === "") {
    iziToast.info({
      title: "",
      message: "Enter a city name or enable geolocation",
      position: "topRight",
      backgroundColor: "#ef40acff",
      maxWidth: "432px",
      messageColor: "#fff",
      timeout: 5000,
      icon: "",
      timeout: 5000,
      close: true,
      closeOnEscape: true,
      closeOnClick: true,
    });
    return;
  }
  weather.innerHTML = "";

  try {
    await getWeatherForCity(cityValue);
  } catch (error) {
    console.log(error);
    iziToast.error({
      title: "",
      message: "Something went wrong. Please try again!",
    });
  } finally {
    form.reset();
  }
});

geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    iziToast.error({ title: "", message: "Geolocation not supported!" });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const weatherData = await getWeather({ lat: latitude, lon: longitude });
        renderWeather(weatherData);
      } catch (error) {
        console.log(error);
        iziToast.error({ title: "", message: "Something went wrong!" });
      }
    },
    () => {
      iziToast.error({
        title: "",
        message: "Permission denied or unable to get location",
      });
    }
  );
});

async function getCoordinates(cityValue) {
  try {
    const params = {
      appid: API_KEY,
      q: cityValue,
      limit: 1,
    };
    const respons = await axios.get(BASE_URL_GEO, { params });
    const { lat, lon } = respons.data[0];
    return { lat, lon };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getWeather({ lat, lon }) {
  try {
    const params = {
      lat: lat,
      lon: lon,
      units: "metric",
      appid: API_KEY,
    };
    const respons = await axios.get(BASE_URL_WEATHER, { params });

    const weatherData = respons.data;
    return weatherData;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getWeatherForCity(cityValue) {
  try {
    const coordinates = await getCoordinates(cityValue);
    const weatherCity = await getWeather(coordinates);

    renderWeather(weatherCity);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function renderWeather(weatherData) {
  const { name } = weatherData;
  const { temp, pressure, humidity } = weatherData.main;
  const { speed } = weatherData.wind;
  const { description, icon } = weatherData.weather[0];
  const dateLoc = new Date(weatherData.dt * 1000).toLocaleDateString();

  const iconSrc = `${BASE_URL_OWM_ICONS}${icon}@2x.png`;

  // const iconMap = {
  //   Clear: new URL("../public/icons/sunny.png", import.meta.url).href,
  //   Clouds: new URL("/icons/bit-cloudy.png", import.meta.url).href,
  //   Rain: new URL("/icons/cloudy.png", import.meta.url).href,
  //   Drizzle: new URL("/icons/rain.png", import.meta.url).href,
  //   Thunderstorm: new URL("/icons/thunder.png", import.meta.url).href,
  //   Snow: new URL("/icons/snow.png", import.meta.url).href,
  //   Mist: new URL("/icons/bit-cloudy.png", import.meta.url).href,
  // };
  // const iconSrc = iconMap[main]
  //   ? iconMap[main]
  //   : new URL("/icons/bit-cloudy.png", import.meta.url).href;

  weather.innerHTML = "";
  const markup = `
   
            <div class="city">
                <ul class="items">
                    <li class="city-name">${name}</li>
                    <li class="data">${dateLoc}</li>
                </ul>
            </div>
            <div class="wrapper">
                <div class="description">
                    <img class="temp-img" src="${iconSrc}"
                    
                     alt=${description}>
                    <p class="temperature">${Math.round(
                      temp
                    )}<span>&deg;</span></p>
                    <p class="weather">${description}</p>
                </div>
            <ul class="grid">
                    <li class="grid-name">
                        <img class="grid-img" src="./public/humidity.svg" alt="humidity" width="24" height="24">
                        <p class="value">${humidity}<span>%</span></p>
                        <p class="value-name">Humidity</p>
                    </li>
                    <li class="grid-name">
                        <img class="grid-img" src="./public/pressure.svg" alt="pressure" width="24" height="24">
                        <p class="value">${pressure}<span>h/Pa</span></p>
                        <p class="value-name">Pressure</p>
                    </li>
                    <li class="grid-name">
                        <img class="grid-img" src="./public/wind.svg" alt="pressure" width="24" height="24">
                        <p class="value">${speed}<span>km/h</span></p>
                        <p class="value-name">Wind Speed</p>
                    </li>
                </ul>
            </div>
  <p class="count">5-Day Forecasts</p>
              
  `;
  weather.insertAdjacentHTML("beforeend", markup);
  getForecast(weatherData.coord.lat, weatherData.coord.lon);
}

async function getForecast(lat, lon) {
  try {
    const params = {
      lat: lat,
      lon: lon,
      units: "metric",
      appid: API_KEY,
    };

    const response = await axios.get(BASE_URL_ONECALL, { params });
    const forecastData = response.data;

    renderOneCall(forecastData);
  } catch (error) {
    console.log(error);
  }
}

function renderOneCall(forecastData) {
  const nextFiveDays = [];
  const fiveDayCount = 5;

  const uniqueDays = new Set();

  for (const item of forecastData.list) {
    const date = new Date(item.dt * 1000);
    const day = date.getDate();

    if (!uniqueDays.has(day)) {
      uniqueDays.add(day);
      nextFiveDays.push(item);

      if (nextFiveDays.length === fiveDayCount + 1) {
        break;
      }
    }
  }

  const tomorrowAndBeyond = nextFiveDays.slice(1);

  const forecastMarkup = tomorrowAndBeyond
    .map((day) => {
      const date = new Date(day.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(day.main.temp);
      const weatherMain = day.weather[0].main;

      const iconMap = {
        Clear: "sunny.png",
        Clouds: "bit-cloudy.png",
        Rain: "cloudy.png",
        Drizzle: "rain.png",
        Thunderstorm: "thunder.png",
        Snow: "snow.png",
        Mist: "bit-cloudy.png",
      };
      const iconSrc = iconMap[weatherMain]
        ? `/icons/${iconMap[weatherMain]}`
        : "/icons/sunny.png";
      return `
      <li class="day">
        <p>${dayName}</p>
        <img src="${iconSrc}" alt="${iconSrc}" width="35" height="35">
        <p>${temp}<span>&deg;</span></p>
      </li>
    `;
    })
    .join("");

  const ul = document.createElement("ul");
  ul.className = "week";
  ul.innerHTML = forecastMarkup;

  weather.appendChild(ul);
}
