window.AnimaWeatherService = (() => {
  const DALAT = {
    latitude: 11.9404,
    longitude: 108.4583,
    timezone: "Asia/Ho_Chi_Minh",
  };

  const endpoint = "https://api.open-meteo.com/v1/forecast";

  const weatherCodes = {
    0: ["Clear", "☀️"],
    1: ["Mostly clear", "🌤"],
    2: ["Partly cloudy", "⛅"],
    3: ["Cloudy", "☁️"],
    45: ["Fog", "🌫"],
    48: ["Rime fog", "🌫"],
    51: ["Light drizzle", "🌦"],
    53: ["Drizzle", "🌦"],
    55: ["Heavy drizzle", "🌧"],
    61: ["Light rain", "🌧"],
    63: ["Rain", "🌧"],
    65: ["Heavy rain", "🌧"],
    80: ["Rain showers", "🌦"],
    81: ["Rain showers", "🌦"],
    82: ["Heavy showers", "⛈"],
    95: ["Thunderstorm", "⛈"],
  };

  function mapWeatherCodeToCondition(code) {
    return weatherCodes[code]?.[0] || "Weather";
  }

  function mapWeatherCodeToIcon(code) {
    return weatherCodes[code]?.[1] || "🌥";
  }

  async function fetchCurrentWeather() {
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    const url = new URL(endpoint);
    url.searchParams.set("latitude", DALAT.latitude);
    url.searchParams.set("longitude", DALAT.longitude);
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
    url.searchParams.set("timezone", DALAT.timezone);

    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);

    const payload = await response.json();
    const current = payload.current;
    if (!current) throw new Error("Weather response missing current data");

    const result = {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      wind: Math.round(current.wind_speed_10m),
      code: current.weather_code,
      condition: mapWeatherCodeToCondition(current.weather_code),
      icon: mapWeatherCodeToIcon(current.weather_code),
      updatedAt: current.time,
    };
    const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - startedAt;
    console.log(`[perf][weather] fetchCurrentWeather: ${duration.toFixed(1)}ms`);
    return result;
  }

  return {
    fetchCurrentWeather,
    mapWeatherCodeToCondition,
    mapWeatherCodeToIcon,
  };
})();
