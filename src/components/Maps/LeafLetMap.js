import React, {useEffect, useRef, useState, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';

const MapComponent = React.forwardRef(
  (
    {
      initialLat = 40.7128,
      initialLng = -74.006,
      initialZoom = 13,
      markers = [],
      onMapPress = null,
      onLocationFound = () => {},
      height = 300,
      style = {},
      initialMarkerTitle = 'My Location',
      showSearch = true,
      searchPlaceholder = 'Search for a location...',
    },
    ref,
  ) => {
    const webViewRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchedData, setSearchedData] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [mapInitialized, setMapInitialized] = useState(false);
    const [webViewKey] = useState(() => Date.now()); // Fixed key - never changes
    const [isLoading, setIsLoading] = useState(true);
    const {t} = useTranslation();

    // Search handlers
    const handleSearch = useCallback(() => {
      if (!searchQuery.trim()) return;
      setIsSearching(true);

      // Use Nominatim API for geocoding
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          setSearchedData(data || []);
          setShowResults(data && data.length > 0);
          setIsSearching(false);
        })
        .catch(error => {
          console.error('Search error:', error);
          setIsSearching(false);
        });
    }, [searchQuery]);

    const clearSearch = useCallback(() => {
      setSearchQuery('');
      setSearchedData([]);
      setShowResults(false);
    }, []);

    const handleSearchItemSelect = useCallback(
      item => {
        if (onLocationFound) {
          onLocationFound({
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            address: item.display_name,
          });
        }
        setShowResults(false);
        setSearchQuery(item.display_name);
      },
      [onLocationFound],
    );

    // Render search item
    const renderSearchItem = useCallback(
      ({item}) => (
        <TouchableOpacity
          style={styles.searchResultItem}
          onPress={() => handleSearchItemSelect(item)}>
          <View style={styles.locationIconContainer}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.mainLocationText} numberOfLines={2}>
              {item.display_name}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      [handleSearchItemSelect],
    );

    // Store markers in ref to avoid re-renders
    const markersRef = useRef(markers);
    markersRef.current = markers;

    // Expose methods to parent via ref
    React.useImperativeHandle(ref, () => ({
      fitBounds: bounds => {
        if (webViewRef.current && mapInitialized) {
          console.log('🗺️ fitBounds called with:', bounds);
          const command = `
          if (typeof map !== 'undefined' && map) {
            try {
              map.fitBounds(${JSON.stringify(bounds)}, {padding: [50, 50]});
              console.log('Map bounds fitted successfully');
            } catch (e) {
              console.error('Error fitting bounds:', e);
            }
          }
        `;
          webViewRef.current.injectJavaScript(command);
        }
      },
      updateMarkers: newMarkers => {
        if (webViewRef.current && mapInitialized) {
          console.log(
            '🗺️ updateMarkers called with',
            newMarkers.length,
            'markers',
          );
          const command = `
          if (typeof map !== 'undefined' && map && typeof allMarkers !== 'undefined') {
            try {
              // Clear existing markers
              allMarkers.forEach(function(marker) {
                map.removeLayer(marker);
              });
              allMarkers = [];

              // Add new markers
              var newMarkersData = ${JSON.stringify(newMarkers)};
              console.log('Adding', newMarkersData.length, 'new markers');
              
              newMarkersData.forEach(function(markerData) {
                try {
                  var marker = L.marker([parseFloat(markerData.lat), parseFloat(markerData.lng)]);
                  
                  // Create custom pin icon with color
                  if (markerData.color) {
                    var iconHtml = '<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">' +
                      '<path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" ' +
                      'fill="' + markerData.color + '"/>' +
                      '<circle cx="16" cy="16" r="5" fill="white"/>' +
                      '</svg>';
                    var customIcon = L.divIcon({
                      html: iconHtml,
                      className: 'custom-pin-marker',
                      iconSize: [32, 40],
                      iconAnchor: [16, 40],
                      popupAnchor: [0, -40]
                    });
                    marker.setIcon(customIcon);
                  }
                  
                  marker.addTo(map);
                  
                  if (markerData.title) marker.bindTooltip(markerData.title);
                  
                  var popupContent = '<div class="custom-popup">' +
                    '<div class="company-name">' + (markerData.title || 'Attendance Punch') + '</div>' +
                    '<div class="company-details"><strong>Type:</strong> ' + (markerData.actionType || 'N/A') + '</div>' +
                    '<div class="company-details"><strong>Time:</strong> ' + (markerData.subtitle || 'N/A') + '</div>' +
                    '<div class="company-details"><strong>Status:</strong> ' + (markerData.status || 'N/A') + '</div>' +
                  '</div>';
                  marker.bindPopup(popupContent);
                  
                  marker.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerClick',
                      data: markerData
                    }));
                  });
                  
                  allMarkers.push(marker);
                } catch (error) {
                  console.error('Error adding marker:', error);
                }
              });

              // Auto-fit bounds to show all markers
              if (allMarkers.length > 0) {
                var group = new L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds(), {padding: [50, 50]});
              }
              
              console.log('Markers updated successfully:', allMarkers.length);
            } catch (e) {
              console.error('Error updating markers:', e);
            }
          }
        `;
          webViewRef.current.injectJavaScript(command);
        }
      },
    }));

    // Initialize WebView only once on mount
    useEffect(() => {
      const timeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 8000);

      return () => clearTimeout(timeout);
    }, []); // Empty dependency array - runs only once

    // Update markers when they change
    useEffect(() => {
      if (mapInitialized && markers && markers.length > 0) {
        setTimeout(() => {
          if (ref && ref.current && ref.current.updateMarkers) {
            ref.current.updateMarkers(markers);
          } else if (webViewRef.current) {
            const command = `
            if (typeof map !== 'undefined' && map && typeof allMarkers !== 'undefined') {
              try {
                allMarkers.forEach(function(marker) {
                  map.removeLayer(marker);
                });
                allMarkers = [];

                var newMarkersData = ${JSON.stringify(markers)};
                console.log('Updating with', newMarkersData.length, 'markers');
                
                newMarkersData.forEach(function(markerData) {
                  try {
                    var marker = L.marker([parseFloat(markerData.lat), parseFloat(markerData.lng)]);
                    
                    if (markerData.color) {
                      var iconHtml = '<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">' +
                        '<path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" ' +
                        'fill="' + markerData.color + '" />' +
                        '<circle cx="16" cy="16" r="5" fill="white"/>' +
                        '</svg>';
                      var customIcon = L.divIcon({
                        html: iconHtml,
                        className: 'custom-pin-marker',
                        iconSize: [32, 40],
                        iconAnchor: [16, 40],
                        popupAnchor: [0, -40]
                      });
                      marker.setIcon(customIcon);
                    }
                    
                    marker.addTo(map);
                    
                    if (markerData.title) marker.bindTooltip(markerData.title);
                    
                    var popupContent = '<div class="custom-popup">' +
                      '<div class="company-name">' + (markerData.title || 'Attendance Punch') + '</div>' +
                      '<div class="company-details"><strong>Type:</strong> ' + (markerData.actionType || 'N/A') + '</div>' +
                      '<div class="company-details"><strong>Time:</strong> ' + (markerData.subtitle || 'N/A') + '</div>' +
                      '<div class="company-details"><strong>Status:</strong> ' + (markerData.status || 'N/A') + '</div>' +
                    '</div>';
                    marker.bindPopup(popupContent);
                    
                    marker.on('click', function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerClick',
                        data: markerData
                      }));
                    });
                    
                    allMarkers.push(marker);
                  } catch (error) {
                    console.error('Error adding marker:', error);
                  }
                });

                if (allMarkers.length > 0) {
                  var group = new L.featureGroup(allMarkers);
                  map.fitBounds(group.getBounds(), {padding: [50, 50]});
                  console.log('Fitted bounds to show all', allMarkers.length, 'markers');
                }
              } catch (e) {
                console.error('Error updating markers:', e);
              }
            }
          `;
            webViewRef.current.injectJavaScript(command);
          }
        }, 500);
      }
    }, [markers, mapInitialized]);

    // Create stable HTML content that doesn't change
    const createHtmlContent = useCallback(() => {
      const currentMarkers = markersRef.current || [];
      let centerLat = initialLat;
      let centerLng = initialLng;
      let zoom = initialZoom;

      if (currentMarkers.length > 0) {
        centerLat = parseFloat(currentMarkers[0].lat);
        centerLng = parseFloat(currentMarkers[0].lng);
        zoom = Math.max(13, zoom);
      }

      return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""></script>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
            overflow: hidden;
            background-color: #f8f9fa;
          }
          #mapid {
            height: 100%;
            width: 100%;
          }
          .custom-popup {
            padding: 10px;
            min-width: 200px;
          }
          .company-name {
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .company-details {
            font-size: 14px;
            margin-bottom: 3px;
          }
          .company-status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 5px;
          }
          .status-active {
            background-color: #d4edda;
            color: #155724;
          }
          .status-inactive {
            background-color: #f8d7da;
            color: #721c24;
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
            color: #666;
          }
          .custom-pin-marker {
            background: transparent;
            border: none;
          }
        </style>
      </head>
      <body>
        <div id="mapid"></div>
        <div id="loading" class="loading">Loading map...</div>
        <script>
          try {
            var markersData = ${JSON.stringify(currentMarkers)};
            console.log('Map initializing with', markersData.length, 'markers');
            
            var map = L.map('mapid').setView([${centerLat}, ${centerLng}], ${zoom});

            var tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors',
              maxZoom: 18,
            });
            
            tileLayer.addTo(map);
            
            // Hide loading and notify ready
            setTimeout(function() {
              document.getElementById('loading').style.display = 'none';
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
              }));
            }, 1500);

            var allMarkers = [];

            function createPopupContent(markerData) {
              var statusClass = markerData.reviewStatus === 'APPROVED' ? 'status-active' : 'status-inactive';
              
              return '<div class="custom-popup">' +
                '<div class="company-name">' + (markerData.title || 'Latest Punch') + '</div>' +
                '<div class="company-details"><strong>Employee:</strong> ' + (markerData.phone || 'N/A') + '</div>' +
                '<div class="company-details"><strong>Type:</strong> ' + (markerData.actionType || 'N/A') + '</div>' +
                '<div class="company-details"><strong>Time:</strong> ' + (markerData.time || 'N/A') + '</div>' +
                '<div class="company-details"><strong>Location:</strong> ' + (markerData.address || 'N/A') + '</div>' +
                '<div class="company-details"><strong>Accuracy:</strong> ' + (markerData.accuracy || 'N/A') + 'm</div>' +
                '<span class="company-status ' + statusClass + '">' + (markerData.reviewStatus || 'Unknown') + '</span>' +
              '</div>';
            }

            // Add markers
            if (markersData && markersData.length > 0) {
              markersData.forEach(function(markerData) {
                try {
                  var marker = L.marker([parseFloat(markerData.lat), parseFloat(markerData.lng)]);
                  
                  // Create custom pin icon if color is specified
                  if (markerData.color) {
                    var iconHtml = '<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">' +
                      '<path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 24 16 24s16-15.163 16-24C32 7.163 24.837 0 16 0z" ' +
                      'fill="' + markerData.color + '" />' +
                      '<circle cx="16" cy="16" r="5" fill="white"/>' +
                      '</svg>';
                    var customIcon = L.divIcon({
                      html: iconHtml,
                      className: 'custom-pin-marker',
                      iconSize: [32, 40],
                      iconAnchor: [16, 40],
                      popupAnchor: [0, -40]
                    });
                    marker.setIcon(customIcon);
                  }
                  
                  marker.addTo(map);
                  
                  if (markerData.title) marker.bindTooltip(markerData.title);
                  
                  var popupContent = createPopupContent(markerData);
                  marker.bindPopup(popupContent);
                  
                  marker.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'markerClick',
                      data: markerData
                    }));
                  });
                  
                  allMarkers.push(marker);
                } catch (error) {
                  console.error('Error adding marker:', error);
                }
              });
              
              // Auto-fit bounds to show all markers
              if (allMarkers.length > 0) {
                console.log('Fitting bounds to show all', allMarkers.length, 'markers');
                var group = new L.featureGroup(allMarkers);
                map.fitBounds(group.getBounds(), {padding: [50, 50], maxZoom: 15});
              }
            }

            // Handle map clicks
            map.on('click', function(e) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapClick',
                data: { lat: e.latlng.lat, lng: e.latlng.lng }
              }));
            });

          } catch (error) {
            console.error('Map initialization error:', error);
            document.getElementById('loading').innerHTML = 'Failed to load map';
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapError',
              error: error.message
            }));
          }
        </script>
      </body>
    </html>
  `;
    }, [initialLat, initialLng, initialZoom]);

    const handleMessage = useCallback(
      event => {
        try {
          const message = JSON.parse(event.nativeEvent.data);

          if (message.type === 'mapClick' && onMapPress) {
            onMapPress(message.data);
          } else if (message.type === 'markerClick') {
            setSelectedMarker(message.data);
          } else if (message.type === 'mapReady') {
            console.log('Map is ready!');
            setMapInitialized(true);
            setIsLoading(false);
            // Invalidate map size after it's ready (fix for hidden/collapsed containers)
            if (webViewRef.current) {
              const invalidateCommand = `
                if (typeof map !== 'undefined' && map) {
                  setTimeout(function() {
                    map.invalidateSize();
                    console.log('Map size invalidated');
                  }, 100);
                }
              `;
              webViewRef.current.injectJavaScript(invalidateCommand);
            }
          } else if (message.type === 'mapError') {
            console.error('Map error:', message.error);
            setIsLoading(false);
          } else if (message.type === 'locationSelected' && onLocationFound) {
            onLocationFound(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebView message:', error);
          setIsLoading(false);
        }
      },
      [onMapPress, onLocationFound],
    );

    // Calculate container style - use explicit height or flex based on prop
    const containerStyle = [
      styles.container,
      height ? {height, minHeight: height, flex: undefined} : {flex: 1, minHeight: 0},
      style,
    ];

    return (
      <View style={containerStyle}>
        {showSearch && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                editable={!isSearching}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearSearch}>
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                (isSearching || !searchQuery.trim()) &&
                  styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}>
              <Text style={styles.searchButtonText}>
                {isSearching ? 'Searching...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {showResults && searchedData.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <ScrollView style={styles.searchResultsList}>
              {searchedData.map((item, index) => (
                <View key={`${item.place_id}-${index}`}>
                  {renderSearchItem({item, index})}
                  {index < searchedData.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.mapContainer}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0969da" />
              <Text style={styles.loadingText}>
                {t('Loading latest punch location...')}
              </Text>
            </View>
          )}
          <WebView
            key={webViewKey}
            ref={webViewRef}
            source={{html: createHtmlContent()}}
            style={[
              styles.webview,
              isLoading && styles.hiddenWebview,
            ]}
            onMessage={handleMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={false}
            scrollEnabled={false}
            bounces={false}
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            onLoadEnd={() => {
              setTimeout(() => {
                if (isLoading) {
                  setIsLoading(false);
                }
              }, 3000);
            }}
            onError={() => setIsLoading(false)}
            onHttpError={() => setIsLoading(false)}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f6f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24292f',
  },
  filterButton: {
    backgroundColor: '#0969da',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchInputContainer: {
    flex: 1,
    position: 'relative',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 40,
    backgroundColor: '#f6f8fa',
    marginRight: 12,
    fontSize: 16,
    color: '#24292f',
  },
  clearButton: {
    position: 'absolute',
    right: 20,
    top: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#656d76',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchButton: {
    backgroundColor: '#0969da',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    backgroundColor: '#8c959f',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  searchResultsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    maxHeight: 300,
  },

  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f6f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  mainLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#24292f',
    marginBottom: 2,
  },
  subLocationText: {
    fontSize: 13,
    color: '#656d76',
    lineHeight: 18,
  },
  selectIndicator: {
    paddingHorizontal: 8,
  },
  selectText: {
    fontSize: 14,
    color: '#0969da',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f3f4',
    marginLeft: 68,
  },
  mapContainer: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    zIndex: 1,
  },
  webview: {
    flex: 1,
    minHeight: 0,
  },
  hiddenWebview: {
    opacity: 0,
    height: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#656d76',
  },
  // Bottom sheet styles
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#24292f',
  },
  sheetContent: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#24292f',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  detailLabel: {
    fontWeight: 'bold',
    width: '30%',
    color: '#24292f',
  },
  detailValue: {
    width: '65%',
    color: '#656d76',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusInactive: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Filter sheet styles
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#24292f',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#0969da',
    borderRadius: 6,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#0969da',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#0969da',
    borderRadius: 6,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default MapComponent;
