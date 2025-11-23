import { useEffect, useState, useCallback } from "react";
import { Wind, MapPin, Download } from "lucide-react";

function App() {
  const [weather, setWeather] = useState(null);
  const [icon, setIcon] = useState("☀️");
  const [mode, setMode] = useState("sunny");
  const [error, setError] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [location, setLocation] = useState("");
  const [cityName, setCityName] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState([]);

  // Функція для отримання погоди за координатами
  const fetchWeatherByCoords = useCallback(async (latitude, longitude, cityNameParam = "") => {
    try {
      setLoading(true);

      // Отримати погоду
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );
      const weatherData = await weatherRes.json();
      const w = weatherData.current_weather;
      const daily = weatherData.daily;
      const nextDays =
        daily && daily.time
          ? daily.time.slice(0, 5).map((date, index) => ({
            date,
            code: daily.weathercode?.[index] ?? 0,
            tempMax: daily.temperature_2m_max?.[index] ?? 0,
            tempMin: daily.temperature_2m_min?.[index] ?? 0,
          }))
          : [];

      setLocation(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
      setWeather(w);
      setForecast(nextDays);
      updateVisuals(w.weathercode);

      // Якщо передана назва міста, використати її
      if (cityNameParam) {
        setCityName(cityNameParam);
      } else {
        // Інакше спробувати зворотне геокодування
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const geoData = await geoRes.json();
          const name = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown";
          setCityName(name);
        } catch {
          setCityName("Current Location");
        }
      }

      setLoading(false);
      setShowSearch(false);
    } catch {
      setError("Failed to fetch weather");
      setForecast([]);
      setLoading(false);
    }
  }, [updateVisuals]);

  // Пошук міст
  const searchCities = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    }
  };

  // Вибір міста з пошуку
  const selectCity = (result) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const name =
      result.display_name ||
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      "Unknown";

    fetchWeatherByCoords(lat, lon, name);
  };

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
    }
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        () => {
          setError("Location access denied");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation not supported");
      setLoading(false);
    }
  }, [fetchWeatherByCoords]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const bgConfig = {
    sunny: "from-yellow-200 via-blue-300 to-blue-500",
    cloudy: "from-gray-300 via-blue-300 to-blue-600",
    rainy: "from-gray-500 via-slate-600 to-slate-800",
    snowy: "from-gray-200 via-cyan-200 to-blue-400"
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      {/* Main background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgConfig[mode]} transition-all duration-1000`}></div>

      {/* Weather effects */}
      {mode === "rainy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(100)].map((_, i) => {
            const delay = Math.random() * 0.5;
            const duration = 0.4 + Math.random() * 0.3;
            const xStart = Math.random() * 100;
            const size = 2 + Math.random() * 3;
            return (
              <div
                key={i}
                className="absolute bg-gradient-to-b from-white to-blue-200 opacity-70 rounded-full rain-drop"
                style={{
                  width: size + "px",
                  height: size * 2.5 + "px",
                  left: xStart + "%",
                  top: "-10px",
                  "--anim-duration": `${duration}s`,
                  "--anim-delay": `${delay}s`
                }}
              ></div>
            );
          })}
        </div>
      )}

      {mode === "snowy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(60)].map((_, i) => {
            const delay = Math.random() * 2;
            const duration = 8 + Math.random() * 4;
            const xStart = Math.random() * 100;
            return (
              <div
                key={i}
                className="absolute text-white opacity-80 snowflake"
                style={{
                fontSize: "20px",
                left: xStart + "%",
                top: "-30px",
                "--anim-duration": `${duration}s`,
                "--anim-delay": `${delay}s`
              }}
              >
                ❄
              </div>
            );
          })}
        </div>
      )}

      {mode === "cloudy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/30 blur-3xl cloud-float"
              style={{
              width: `${80 + Math.random() * 120}px`,
              height: `${40 + Math.random() * 60}px`,
              top: `${Math.random() * 60}%`,
              left: `${Math.random() * 100 - 50}%`,
              "--anim-duration": `${15 + Math.random() * 10}s`,
              "--anim-delay": `${i * 1.5}s`
            }}
            ></div>
          ))}
        </div>
      )}

      {/* Main content card */}
      <div className="relative z-10 max-w-md w-[90%]">
        {/* Beautiful solid card */}
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-6 border border-white/40">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4" style={{ animation: `bounce 3s infinite` }}>{icon}</div>
            <h1 className="text-5xl font-bold text-slate-900">{cityName || "Weather PWA"}</h1>
            <p className="text-slate-800 text-sm mt-3 flex items-center justify-center gap-1 font-medium">
              <MapPin size={16} /> {location || "Finding location..."}
            </p>

            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="mt-4 px-4 py-2 bg-white/50 hover:bg-white/70 rounded-lg text-slate-800 text-sm transition font-semibold border border-white/60"
            >
              🔍 Change City
            </button>
          </div>

          {/* Search panel */}
          {showSearch && (
            <div className="mb-6 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/50">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  searchCities(e.target.value);
                }}
                placeholder="Enter city name..."
                className="w-full px-4 py-2 bg-white/60 border border-white/40 rounded-lg text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white/80 font-medium"
              />

              {/* Search results */}
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

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-400/50 backdrop-blur border border-red-500/40 rounded-2xl">
              <p className="text-red-900 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Weather data */}
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-20 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
          ) : weather ? (
            <div className="space-y-4">
              {/* Temperature card */}
              <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/50">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">☀️</span>
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">Temperature</p>
                    <p className="text-5xl font-bold text-slate-900">{Math.round(weather.temperature)}°C</p>
                  </div>
                </div>
              </div>

              {/* Wind speed card */}
              <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/50">
                <div className="flex items-center gap-4">
                  <Wind size={40} className="text-slate-800" />
                  <div>
                    <p className="text-slate-700 text-sm font-semibold">Wind Speed</p>
                    <p className="text-3xl font-bold text-slate-900">{weather.windspeed} km/h</p>
                  </div>
                </div>
              </div>

              {/* Condition card */}
              <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-6 border border-white/50">
                <p className="text-slate-700 text-sm font-semibold">Condition</p>
                <p className="text-3xl font-bold text-slate-900 capitalize mt-2">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </p>
              </div>

              {/* 5-day Forecast */}
              {forecast.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {forecast.map((day, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/50 text-center"
                    >
                      <p className="text-slate-800 text-sm font-semibold">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </p>
                      <p className="text-2xl my-2">
                        {day.code < 4 ? "🌤" : day.code < 60 ? "🌧" : day.code >= 80 ? "❄️" : "☀️"}
                      </p>
                      <p className="text-slate-800 font-bold">
                        {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-800 font-medium">Loading weather...</p>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-center text-slate-700 text-xs flex items-center justify-center gap-1 font-medium">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
              Works offline after first visit
            </p>
          </div>
        </div>

        {/* Install button */}
        {!installed && deferredPrompt && (
          <button
            onClick={installApp}
            className="w-full bg-gradient-to-r from-white/60 to-white/40 text-slate-900 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 hover:scale-105 border border-white/50 hover:from-white/80 hover:to-white/60"
          >
            <Download size={20} />
            Install App
          </button>
        )}
      </div>

      <style>{`
        @keyframes rainFall {
          0% {
            transform: translateY(0) translateX(0);
          }
          100% {
            transform: translateY(100vh) translateX(-20px);
            opacity: 0;
          }
        }

        @keyframes snowFall {
          0% {
            transform: translateY(-30px) translateX(0) rotate(0deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes driftClouds {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.4;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(150vw);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
