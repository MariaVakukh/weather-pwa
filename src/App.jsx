import { useEffect, useState, useCallback } from "react";
import { MapPin, Download } from "lucide-react";
import { Thermometer, Wind, Droplet, Cloud, SunFill, CloudRain, Snow, CloudFog, CloudDrizzle } from "react-bootstrap-icons";

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
    // WMO Weather interpretation codes
    if (code === 0) {
      setMode("sunny");
      setIcon("☀️");
    } else if (code < 4) {
      setMode("cloudy");
      setIcon("🌤");
    } else if (code < 50) {
      setMode("foggy");
      setIcon("🌫️");
    } else if (code < 70) {
      setMode("rainy");
      setIcon("🌧");
    } else if (code < 80) {
      setMode("rainy");
      setIcon("⛈️");
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
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_max&timezone=auto&forecast_days=5`
        );
        const weatherData = await weatherRes.json();

        const w = weatherData.current_weather;
        const daily = weatherData.daily;

        const weatherWithHumidity = {
          ...w,
          relative_humidity_2m: daily?.relative_humidity_2m_max?.[0] ?? 0
        };

        const nextDays =
          daily?.time?.slice(0, 5).map((date, i) => ({
            date,
            code: daily.weathercode?.[i] ?? 0,
            tempMax: daily.temperature_2m_max?.[i] ?? 0,
            tempMin: daily.temperature_2m_min?.[i] ?? 0,
            precipitation: daily.precipitation_sum?.[i] ?? 0,
            humidity: daily.relative_humidity_2m_max?.[i] ?? 0,
          })) ?? [];

        setWeather(weatherWithHumidity);
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
    // Extract only the main city name from the result
    const cityName = 
      result.address?.city || 
      result.address?.town || 
      result.address?.village || 
      result.display_name.split(',')[0];
    fetchWeatherByCoords(
      parseFloat(result.lat),
      parseFloat(result.lon),
      cityName
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
    foggy: "from-slate-400 via-slate-500 to-slate-600",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-b ${bgConfig[mode]} transition-all duration-1000`}></div>

      {/* Weather Effects - Rainy */}
      {mode === "rainy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(80)].map((_, i) => {
            const delay = Math.random() * 0.5;
            const duration = 0.4 + Math.random() * 0.3;
            const xStart = Math.random() * 100;
            const size = 2 + Math.random() * 3;
            return (
              <div
                key={i}
                className="absolute bg-gradient-to-b from-white to-blue-200 opacity-70 rounded-full"
                style={{
                  width: size + "px",
                  height: size * 2.5 + "px",
                  left: xStart + "%",
                  top: "-10px",
                  animationName: "rainFall",
                  animationDuration: duration + "s",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: delay + "s"
                }}
              ></div>
            );
          })}
        </div>
      )}

      {/* Weather Effects - Snowy */}
      {mode === "snowy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => {
            const delay = Math.random() * 2;
            const duration = 8 + Math.random() * 4;
            const xStart = Math.random() * 100;
            return (
              <div
                key={i}
                className="absolute text-white opacity-80"
                style={{
                  fontSize: "20px",
                  left: xStart + "%",
                  top: "-30px",
                  animationName: "snowFall",
                  animationDuration: duration + "s",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: delay + "s"
                }}
              >
                ❄
              </div>
            );
          })}
        </div>
      )}

      {/* Weather Effects - Cloudy */}
      {mode === "cloudy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/30 blur-3xl"
              style={{
                width: (80 + Math.random() * 120) + "px",
                height: (40 + Math.random() * 60) + "px",
                top: (Math.random() * 60) + "%",
                left: (Math.random() * 100 - 50) + "%",
                animationName: "driftClouds",
                animationDuration: (15 + Math.random() * 10) + "s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: i * 1.5 + "s"
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Weather Effects - Foggy */}
      {mode === "foggy" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/25 blur-3xl"
              style={{
                width: (150 + Math.random() * 200) + "px",
                height: (100 + Math.random() * 150) + "px",
                top: (Math.random() * 80) + "%",
                left: (Math.random() * 100 - 50) + "%",
                animationName: "fogDrift",
                animationDuration: (20 + Math.random() * 10) + "s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: i * 2 + "s"
              }}
            ></div>
          ))}
        </div>
      )}

      <div className="relative z-10 max-w-md w-[90%] pt-4 pb-4">
        <div className="bg-white/35 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-white/40">
          <div className="text-center mb-6">
            <div className="text-7xl mb-3 bounce-icon">{icon}</div>

            <h1 className="text-4xl font-bold text-slate-900 mb-1">{cityName}</h1>

            <p className="text-slate-800 text-sm mt-2 flex items-center justify-center gap-1 font-medium">
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
            <div className="mb-4 p-4 bg-white/40 backdrop-blur-lg rounded-2xl border border-white/50">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  searchCities(e.target.value);
                }}
                placeholder="Enter city or address..."
                className="w-full px-4 py-3 bg-white/60 border border-white/40 rounded-lg text-slate-900 placeholder-slate-600 focus:outline-none focus:bg-white/80 font-medium transition-all text-sm"
              />

              {searchResults.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectCity(result)}
                      className="w-full text-left px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg text-slate-900 text-xs transition font-medium border border-white/40"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-400/50 backdrop-blur border border-red-500/40 rounded-xl">
              <p className="text-red-900 text-xs font-medium">⚠️ {error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <div className="h-16 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-14 bg-white/20 rounded-2xl animate-pulse"></div>
              <div className="h-14 bg-white/20 rounded-2xl animate-pulse"></div>
            </div>
          ) : weather ? (
            <div className="space-y-3">
              {/* Temperature and Condition Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer size={28} className="text-blue-900" />
                    <div>
                      <p className="text-slate-700 text-xs font-semibold">Temp</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {Math.round(weather.temperature)}°C
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    {mode === "sunny" && <SunFill size={28} className="text-blue-900" />}
                    {mode === "cloudy" && <Cloud size={28} className="text-blue-900" />}
                    {mode === "rainy" && <CloudRain size={28} className="text-blue-900" />}
                    {mode === "snowy" && <Snow size={28} className="text-blue-900" />}
                    {mode === "foggy" && <CloudFog size={28} className="text-blue-900" />}
                    <div>
                      <p className="text-slate-700 text-xs font-semibold">Condition</p>
                      <p className="text-2xl font-bold text-slate-900 capitalize">
                        {mode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wind and Humidity Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/50">
                  <div className="flex items-center gap-2">
                    <Wind size={28} className="text-blue-900" />
                    <div>
                      <p className="text-slate-700 text-xs font-semibold">Wind</p>
                      <p className="text-lg font-bold text-slate-900">
                        {Math.round(weather.windspeed)} km/h
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-lg rounded-2xl p-4 border border-white/50">
                  <div className="flex items-center gap-2">
                    <Droplet size={28} className="text-blue-900" />
                    <div>
                      <p className="text-slate-700 text-xs font-semibold">Humidity</p>
                      <p className="text-lg font-bold text-slate-900">
                        {weather.relative_humidity_2m ?? "—"}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="forecast-carousel">
                <div className="forecast-items">
                  {forecast.map((day, i) => (
                    <div key={i} className="forecast-item">
                      <div className="forecast-item-day">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </div>
                      <div className="forecast-item-icon">
                        {day.code < 4
                          ? <Cloud size={28} className="text-blue-900" style={{ margin: "0 auto" }} />
                          : day.code < 50
                          ? <CloudFog size={28} className="text-blue-900" style={{ margin: "0 auto" }} />
                          : day.code < 70
                          ? <CloudRain size={28} className="text-blue-900" style={{ margin: "0 auto" }} />
                          : day.code < 80
                          ? <CloudRain size={28} className="text-blue-900" style={{ margin: "0 auto" }} />
                          : <Snow size={28} className="text-blue-900" style={{ margin: "0 auto" }} />}
                      </div>
                      <div className="forecast-item-temp">
                        {Math.round(day.tempMax)}°
                      </div>
                      <div className="forecast-item-temp" style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {Math.round(day.tempMin)}°
                      </div>
                      <div className="forecast-item-detail-row">
                        <span className="forecast-item-detail" style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center" }}>
                          <Droplet size={14} className="text-blue-900" /> {Math.round(day.humidity)}%
                        </span>
                        <span className="forecast-item-detail" style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center" }}>
                          <CloudDrizzle size={14} className="text-blue-900" /> {day.precipitation.toFixed(1)}mm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-800 font-medium text-sm">
              Loading weather...
            </p>
          )}

          <div className="mt-4 pt-4 border-t border-white/30 text-center flex-shrink-0">
            <p className="text-center text-slate-700 text-xs flex items-center justify-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full"></span>
              Works offline after first visit
            </p>
          </div>
        </div>

        {deferredPrompt && (
          <button
            onClick={installApp}
            className="install-button mt-3"
          >
            <Download size={18} />
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

        @keyframes fogDrift {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateX(100px) translateY(30px);
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
