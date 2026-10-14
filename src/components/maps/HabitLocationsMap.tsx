import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Plus,
  Sparkles,
  X,
  Check,
  Layers,
  Search,
  Compass,
  LocateFixed,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORY_COLORS } from '../common/Icons';

export interface HabitLocation {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  habitName: string;
  distanceKm?: number;
  isUserCreated?: boolean;
}

// Calculate distance in km between two GPS coordinates using Haversine formula
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const HabitLocationsMap: React.FC = () => {
  const { habits, addToast } = useApp();
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDa6fWNx6AXgfI03auWsynQW6svrAIWa0E';

  // Default fallback center (used when geolocation is pending or denied)
  const defaultFallbackCenter = { lat: 37.7749, lng: -122.4194 }; // San Francisco

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(defaultFallbackCenter);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [locationErrorMsg, setLocationErrorMsg] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);

  // Locations state
  const [locations, setLocations] = useState<HabitLocation[]>([
    {
      id: 'loc-1',
      name: 'Equinox Fitness Sanctuary',
      category: 'Fitness',
      address: '757 Market St, Downtown',
      lat: 37.7868,
      lng: -122.4048,
      habitName: 'Daily Workout & Movement',
    },
    {
      id: 'loc-2',
      name: 'Public Library Study Hall',
      category: 'Study',
      address: '100 Larkin St',
      lat: 37.7793,
      lng: -122.416,
      habitName: 'Deep Work & Focus Session',
    },
    {
      id: 'loc-3',
      name: 'Zen Park Meditation Meadow',
      category: 'Mindfulness',
      address: 'Conservatory Botanical Gardens',
      lat: 37.7725,
      lng: -122.4608,
      habitName: 'Morning Meditation & Breathwork',
    },
    {
      id: 'loc-4',
      name: 'Artisan Coffee Roastery',
      category: 'Productivity',
      address: '201 Berry St, Focus Corner',
      lat: 37.7766,
      lng: -122.3942,
      habitName: 'Read Non-Fiction Book',
    },
  ]);

  const [selectedLocation, setSelectedLocation] = useState<HabitLocation | null>(locations[0]);

  // Form states for manual pin
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocHabit, setNewLocHabit] = useState(habits[0]?.name || 'Daily Workout');
  const [newLocCategory, setNewLocCategory] = useState('Fitness');
  const [newLocLat, setNewLocLat] = useState('37.7749');
  const [newLocLng, setNewLocLng] = useState('-122.4194');

  // Request user's live coordinates using Browser Geolocation API
  const handleRequestLiveLocation = useCallback(
    (showSuccessNotification = true) => {
      if (!('geolocation' in navigator)) {
        setLocationStatus('unsupported');
        setLocationErrorMsg('Browser Geolocation API is not supported on this device.');
        addToast({
          type: 'warning',
          title: 'Geolocation Unsupported',
          message: 'Your browser does not support GPS geolocation. Using fallback map.',
        });
        return;
      }

      setIsLocating(true);
      setLocationStatus('locating');
      setLocationErrorMsg('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const userCoords = { lat, lng };

          setUserCoordinates(userCoords);
          setMapCenter(userCoords);
          setMapZoom(14);
          setLocationStatus('granted');
          setIsLocating(false);

          // Update default form lat/lng
          setNewLocLat(lat.toFixed(5));
          setNewLocLng(lng.toFixed(5));

          // Dynamically seed local habit places relative to the user's live position
          const dynamicLocalSpots: HabitLocation[] = [
            {
              id: `user-gym-${Date.now()}`,
              name: 'Local Performance Gym & Fitness',
              category: 'Fitness',
              address: `Nearby Workout Studio (~${(0.8).toFixed(1)} km from your location)`,
              lat: lat + 0.0055,
              lng: lng + 0.0042,
              habitName: 'Daily Workout & Movement',
              distanceKm: 0.8,
            },
            {
              id: `user-park-${Date.now()}`,
              name: 'Community Botanical Park & Trail',
              category: 'Mindfulness',
              address: `Outdoor Green Space (~${(1.2).toFixed(1)} km from your location)`,
              lat: lat - 0.0062,
              lng: lng + 0.0058,
              habitName: 'Morning Meditation & Breathwork',
              distanceKm: 1.2,
            },
            {
              id: `user-study-${Date.now()}`,
              name: 'Co-Working & Study Library',
              category: 'Study',
              address: `Quiet Productivity Space (~${(0.5).toFixed(1)} km from your location)`,
              lat: lat + 0.0035,
              lng: lng - 0.0048,
              habitName: 'Deep Work & Focus Session',
              distanceKm: 0.5,
            },
            {
              id: `user-cafe-${Date.now()}`,
              name: 'Roaster Cafe & Reading Nook',
              category: 'Productivity',
              address: `Mindful Reading Space (~${(1.5).toFixed(1)} km from your location)`,
              lat: lat - 0.0048,
              lng: lng - 0.0072,
              habitName: 'Read Non-Fiction Book',
              distanceKm: 1.5,
            },
          ];

          setLocations((prev) => {
            // Keep user created pins, replace default mock pins with local ones
            const userCustom = prev.filter((p) => p.isUserCreated);
            return [...dynamicLocalSpots, ...userCustom];
          });
          setSelectedLocation(dynamicLocalSpots[0]);

          if (showSuccessNotification) {
            addToast({
              type: 'success',
              title: 'Live Location Detected',
              message: `Centered map on your GPS coordinates (${lat.toFixed(3)}, ${lng.toFixed(3)}).`,
            });
          }
        },
        (error) => {
          setIsLocating(false);
          let reason = 'Failed to retrieve location.';
          if (error.code === error.PERMISSION_DENIED) {
            reason = 'Location permission was denied by the browser.';
            setLocationStatus('denied');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            reason = 'GPS signal or network position unavailable.';
            setLocationStatus('unsupported');
          } else if (error.code === error.TIMEOUT) {
            reason = 'Location request timed out.';
            setLocationStatus('idle');
          }

          setLocationErrorMsg(reason);
          // Graceful fallback to default center
          setMapCenter(defaultFallbackCenter);

          addToast({
            type: 'warning',
            title: 'Location Notice',
            message: `${reason} Showing fallback city map.`,
            duration: 6000,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    },
    [addToast]
  );

  // Auto request location on initial component mount
  useEffect(() => {
    handleRequestLiveLocation(false);
  }, [handleRequestLiveLocation]);

  // Filtered locations by category and search keyword
  const filteredLocations = locations.filter((loc) => {
    const matchesCategory =
      selectedCategoryFilter === 'All' || loc.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      loc.name.toLowerCase().includes(query) ||
      loc.address.toLowerCase().includes(query) ||
      loc.category.toLowerCase().includes(query) ||
      loc.habitName.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName.trim()) return;

    const latVal = parseFloat(newLocLat) || mapCenter.lat;
    const lngVal = parseFloat(newLocLng) || mapCenter.lng;

    const dist = userCoordinates
      ? calculateDistanceKm(userCoordinates.lat, userCoordinates.lng, latVal, lngVal)
      : undefined;

    const newLoc: HabitLocation = {
      id: `loc-${Date.now()}`,
      name: newLocName.trim(),
      address: newLocAddress.trim() || 'Custom Pinned Spot',
      category: newLocCategory,
      habitName: newLocHabit,
      lat: latVal,
      lng: lngVal,
      distanceKm: dist,
      isUserCreated: true,
    };

    setLocations([newLoc, ...locations]);
    setSelectedLocation(newLoc);
    setMapCenter({ lat: latVal, lng: lngVal });
    setIsAddLocationOpen(false);
    setNewLocName('');
    setNewLocAddress('');

    addToast({
      type: 'success',
      title: 'Place Pinned',
      message: `"${newLoc.name}" added to your habit places.`,
    });
  };

  // Generates Google Maps Directions URL from user coordinates to target location
  const getDirectionsUrl = (loc: HabitLocation): string => {
    const dest = `${loc.lat},${loc.lng}`;
    if (userCoordinates) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userCoordinates.lat},${userCoordinates.lng}&destination=${dest}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Habit Places & Activity Map
            </h1>
            {userCoordinates && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live GPS
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pin and explore the real-world environments where your workouts, rituals, and focus sprints happen
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Geolocation Button */}
          <button
            onClick={() => handleRequestLiveLocation(true)}
            disabled={isLocating}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              userCoordinates
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
            title="Detect My Location using Browser Geolocation"
          >
            <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-500' : 'text-emerald-500'}`} />
            <span>{isLocating ? 'Locating...' : userCoordinates ? 'Re-center GPS' : 'Use My Location'}</span>
          </button>

          <button
            onClick={() => setIsAddLocationOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pin Place</span>
          </button>
        </div>
      </div>

      {/* Permission Denied Fallback Banner */}
      {locationStatus === 'denied' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Location permission is denied in browser. Displaying default city map. You can still search places or pin custom coordinates.
            </span>
          </div>
          <button
            onClick={() => handleRequestLiveLocation(true)}
            className="text-2xs font-bold underline shrink-0 hover:opacity-80 cursor-pointer"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* Search Bar & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nearby gyms, parks, cafes, or libraries..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {['All', 'Fitness', 'Study', 'Mindfulness', 'Productivity', 'Health'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategoryFilter === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map + Places List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Google Map (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900 min-h-[480px] h-[520px] relative">
          <APIProvider apiKey={mapsApiKey}>
            <Map
              mapId="DEMO_MAP_ID"
              center={mapCenter}
              zoom={mapZoom}
              onCameraChanged={(e) => {
                setMapCenter(e.detail.center);
                setMapZoom(e.detail.zoom);
              }}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
            >
              {/* User Live GPS Marker */}
              {userCoordinates && (
                <AdvancedMarker position={userCoordinates} title="You Are Here">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping pointer-events-none" />
                    <div className="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </AdvancedMarker>
              )}

              {/* Habit Places Markers */}
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const pinColor = CATEGORY_COLORS[loc.category]?.accent || '#10b981';

                return (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setMapCenter({ lat: loc.lat, lng: loc.lng });
                    }}
                  >
                    <Pin
                      background={pinColor}
                      glyphColor="#ffffff"
                      borderColor="#ffffff"
                      scale={isSelected ? 1.25 : 1.0}
                    />
                  </AdvancedMarker>
                );
              })}

              {selectedLocation && (
                <InfoWindow
                  position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                  onCloseClick={() => setSelectedLocation(null)}
                >
                  <div className="p-1 max-w-xs text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xs uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {selectedLocation.category}
                      </span>
                      {selectedLocation.distanceKm !== undefined && (
                        <span className="text-3xs font-mono text-slate-500">
                          {selectedLocation.distanceKm} km away
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm mt-1">{selectedLocation.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedLocation.address}</p>
                    <p className="text-2xs font-semibold text-emerald-700 mt-1">
                      Habit: {selectedLocation.habitName}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <a
                        href={getDirectionsUrl(selectedLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold transition-colors cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Get Directions</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                      </a>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        </div>

        {/* Places List & Inspector (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Nearby Places ({filteredLocations.length})</span>
              </h3>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No places found for &quot;{searchQuery}&quot;. Try a different category or pin a new location.
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setMapCenter({ lat: loc.lat, lng: loc.lng });
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {loc.name}
                        </span>
                        <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                          {loc.category}
                        </span>
                      </div>
                      <p className="text-2xs text-slate-500 mt-1">{loc.address}</p>
                      <div className="mt-2 flex items-center justify-between text-2xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Linked: {loc.habitName}</span>
                        {loc.distanceKm !== undefined && (
                          <span className="font-mono text-slate-400 text-3xs">
                            {loc.distanceKm} km
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-3xs text-slate-400">Open in Maps</span>
                        <a
                          href={getDirectionsUrl(loc)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-3xs font-bold transition-all cursor-pointer border border-emerald-500/30"
                          title="Get turn-by-turn directions in Google Maps"
                        >
                          <Navigation className="w-2.5 h-2.5" />
                          <span>Get Directions</span>
                          <ExternalLink className="w-2 h-2 opacity-70" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs text-slate-400">
            <span>Browser Geolocation & Google Maps</span>
            <button
              onClick={() => handleRequestLiveLocation(true)}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              Sync GPS
            </button>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {isAddLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Pin Habit Location</h3>
              <button
                onClick={() => setIsAddLocationOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Place Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Gold's Gym or Downtown Library"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Address / Description
                </label>
                <input
                  type="text"
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="e.g. 500 Market St or Central Park"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    <option value="Fitness">Fitness</option>
                    <option value="Study">Study</option>
                    <option value="Mindfulness">Mindfulness</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Health">Health</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked Habit
                  </label>
                  <select
                    value={newLocHabit}
                    onChange={(e) => setNewLocHabit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
                  >
                    {habits.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates Section with GPS Autofill Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Coordinates (Lat / Lng)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (userCoordinates) {
                        setNewLocLat(userCoordinates.lat.toFixed(5));
                        setNewLocLng(userCoordinates.lng.toFixed(5));
                        addToast({
                          type: 'info',
                          title: 'Filled from GPS',
                          message: 'Loaded your live latitude & longitude.',
                        });
                      } else {
                        handleRequestLiveLocation(true);
                      }
                    }}
                    className="text-3xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>Use My GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(e.target.value)}
                    placeholder="Latitude"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(e.target.value)}
                    placeholder="Longitude"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddLocationOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Pin Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
