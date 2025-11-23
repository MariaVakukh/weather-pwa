import { useEffect, useState, useCallback } from "react";
import { Wind, MapPin, Download } from "lucide-react";

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [mode, setMode] = useState("sunny");
  const [icon, setIcon] = useState("☀️");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("");
  const [cityName, setCityName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  const updateVisuals = useCallback((code) => {
    if (code === 0) {
      setMode("sunny");
      setIcon("☀️");
    } else if (code < 4) {
      setMode("cloudy");
      setIcon("🌤");
    } else if (code < 60) {
      setMode("rainy");
      setIcon("🌧");
    } else if (code >= 80) {
      setMode("snowy");
      setIcon("❄️");
    } else {
      setMode("sunny");
      setIcon("☀️");
    }
  }, []);

  const fetchWeatherByCoords = useCallback(
    async (latitude, longitude, cityNameParam = "") => {
      try {
        setLoading(true);
        setError("");

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
        );
        const weatherData = await weatherRes.json();

        const w = weatherData.current_weather;
        const daily = weatherData.daily;

        const nextDays =
          daily?.time?.slice(0, 5).map((date, i) => ({
            date,
            code: daily.weathercode?.[i] ?? 0,
            tempMax: daily.temperature_2m_max?.[i] ?? 0,
            tempMin: daily.temperature_2m_min?.[i] ?? 0,
          })) ?? [];

        setWeather(w);
        setForecast(nextDays);

        setLocation(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        updateVisuals(w.weathercode);

        if (cityNameParam) {
          setCityName(cityNameParam);
        } else {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const geoData = await geoRes.json();
            setCityName(
              geoData.address?.city ||
                geoData.address?.town ||
                geoData.address?.village ||
                "Unknown"
            );
          } catch {
            setCityName("Current Location");
          }
        }

        setShowSearch(false);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch weather");
        setForecast([]);
      } finally {
        setLoading(false);
      }
    },
    [updateVisuals]
  );

  const searchCities = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5`
      );
      setSearchResults(await res.json());
    } catch {
      setSearchResults([]);
    }
  }, []);

  const selectCity = (result) => {
    fetchWeatherByCoords(
      parseFloat(result.lat),
      parseFloat(result.lon),
      result.display_name
    );
  };

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Location access denied");
        setLoading(false);
      }
    );
  }, [fetchWeatherByCoords]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const bgConfig = {
    sunny: "from-yellow-200 via-blue-300 to-blue-500",
    cloudy: "from-gray-300 via-blue-300 to-blue-600",
    rainy: "from-gray-500 via-slate-600 to-slate-800",
    snowy: "from-gray-200 via-cyan-200 to-blue-400",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-b ${bgConfig[mode]} transition-all duration-1000`}></div>

      {mode === "rainy" && <div className="rain-animation"></div>}
      {mode === "snowy" && <div className="snow-animation"></div>}
      {mode === "cloudy" && <div className="clouds-animation"></div>}

      <div className="relative z-10 max-w-md w-[90%]">
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/40">
          <div className="text-center mb-8">
            <div className="text-7xl mb-4 bounce-icon">{icon}</div>

            <h1 className="text-5xl font-bold text-slate-900">{cityName}</h1>

            <p className="text-slate-800 text-sm mt-3 flex items-center justify-center gap-1 font-medium">
              <MapPin size={16} /> {location || "Finding location..."}
            </p>

            <button
              onClick={() => setShowSearch((p) => !p)}
              className="mt-4 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg text-slate-800 text-sm transition font-semibold border border-white/60"
            >
              🔍 Change City
            </button>
          </div>

          {showSearch && (
            <div className="mb-6 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/50">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  searchCities(e.target.value);
                }}
                placeholder="Enter city or address..."
                className="w-full px-4 py-2 bg-white/60 border border-white/40 rounded-lg text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white/80 font-medium"
              />

              {searchResults.length > 0 && (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectCity(result)}
                      className="w-full text-left px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg text-slate-900 text-sm transition font-medium border border-white/40"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-400/50 backdrop-blur border border-red-500/40 rounded-2xl">
              <p className="text-red-900 text-sm font-medium">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
          ) : weather ? (
            <div className="space-y-4">
              <div className="weather-card">
                <span className="text-5xl">🌡️</span>
                <div>
                  <p className="text-slate-700 text-sm font-semibold">Temperature</p>
                  <p className="text-5xl font-bold text-slate-900">
                    {Math.round(weather.temperature)}°C
                  </p>
                </div>
              </div>

              <div className="weather-card">
                <Wind size={40} className="text-slate-800" />
                <div>
                  <p className="text-slate-700 text-sm font-semibold">Wind Speed</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {weather.windspeed} km/h
                  </p>
                </div>
              </div>

              <div className="weather-card">
                <p className="text-slate-700 text-sm font-semibold">Condition</p>
                <p className="text-3xl font-bold text-slate-900 mt-1 capitalize">
                  {mode}
                </p>
              </div>

              <div className="forecast-grid">
                {forecast.map((day, i) => (
                  <div key={i} className="forecast-card">
                    <p className="text-slate-800 text-sm font-semibold">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </p>
                    <p className="text-2xl my-2">
                      {day.code < 4
                        ? "🌤"
                        : day.code < 60
                        ? "🌧"
                        : day.code >= 80
                        ? "❄️"
                        : "☀️"}
                    </p>
                    <p className="text-slate-800 font-bold">
                      {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-800 font-medium">
              Loading weather...
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-center text-slate-700 text-xs flex items-center justify-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
              Works offline after first visit
            </p>
          </div>
        </div>

        {!installed && deferredPrompt && (
          <button
            onClick={installApp}
            className="install-button"
          >
            <Download size={20} />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
